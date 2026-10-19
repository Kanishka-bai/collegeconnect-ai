import logging
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    RelevanceCheckRequest,
    RelevanceResult,
    SessionDetail,
    SessionSummary,
    HealthCheckResponse,
)
from app.services.relevance_filter import (
    evaluate_relevance,
    STANDARD_REJECTION_WARNING
)
from app.services.ai_service import get_ai_service
from app.services.database import init_db, DatabaseManager
from app.knowledge.knowledge_loader import get_knowledge_base
from app.middleware.rate_limiter import SecurityAndRateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("collegeconnect")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and load knowledge base
    logger.info("Initializing CollegeConnect AI backend...")
    init_db()
    kb = get_knowledge_base()
    logger.info("Knowledge base ready with %d sections.", len(kb.sections))
    yield
    # Shutdown logic
    logger.info("Shutting down CollegeConnect AI backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart College Assistance Chatbot with Strict Server-Side Relevance Filtering",
    lifespan=lifespan
)

# Security Middleware (Rate limiting & payload size)
app.add_middleware(SecurityAndRateLimitMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Health & Info Endpoints -----------------

@app.get("/api/health", response_model=HealthCheckResponse, tags=["Health"])
async def health_check():
    kb = get_knowledge_base()
    return HealthCheckResponse(
        status="healthy",
        version=settings.VERSION,
        ai_provider=settings.AI_PROVIDER,
        knowledge_sections_count=len(kb.sections),
        environment=settings.ENVIRONMENT
    )

@app.get("/api/knowledge/overview", tags=["Knowledge"])
async def get_college_overview():
    kb = get_knowledge_base()
    return {
        "meta": kb.meta,
        "categories": kb.get_all_categories(),
        "sections_count": len(kb.sections),
        "faq_count": len(kb.faqs),
        "sections": [
            {
                "id": s["id"],
                "category": s["category"],
                "title": s["title"],
                "document_code": s["document_code"],
                "department": s["department"],
                "last_updated": s["last_updated"],
                "key_points": s.get("key_points", [])
            }
            for s in kb.sections
        ]
    }

# ----------------- Relevance Check Endpoint -----------------

@app.post("/api/relevance/check", response_model=RelevanceResult, tags=["Relevance Filter"])
async def check_relevance(request: RelevanceCheckRequest):
    """
    Evaluates the relevance of a query before generating answers.
    Can be used by tests and pre-flight checks.
    """
    result = evaluate_relevance(request.message)
    return result

# ----------------- Chat Endpoint (Strict Enforcement) -----------------

@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Core Chat Endpoint.
    Processing flow:
    1. Relevance classifier inspects the message.
    2. If REJECTED -> Fixed server-side warning returned. Main model NEVER called.
    3. If ACCEPTED -> Forward to knowledge retriever & AI service.
    """
    user_msg = request.message.strip()
    session_id = request.session_id or str(uuid.uuid4())
    now_str = datetime.now(timezone.utc).isoformat()

    # Step 1: Run Relevance & Security Classification Layer
    relevance = evaluate_relevance(user_msg)

    # Step 2: Handle Rejections (Out of scope / Jailbreak attempts)
    if relevance.status == "REJECTED":
        # Save user message to database
        DatabaseManager.add_message(
            session_id=session_id,
            role="user",
            content=user_msg,
            status="REJECTED"
        )

        # Save assistant warning message to database
        bot_record = DatabaseManager.add_message(
            session_id=session_id,
            role="assistant",
            content=STANDARD_REJECTION_WARNING,
            status="REJECTED",
            warning_message=STANDARD_REJECTION_WARNING,
            citations=[]
        )

        # Strictly return the fixed rejection warning without invoking the AI generation model
        return ChatResponse(
            id=bot_record.id,
            session_id=session_id,
            message=STANDARD_REJECTION_WARNING,
            status="REJECTED",
            warning_message=STANDARD_REJECTION_WARNING,
            citations=[],
            category=relevance.category or "rejected",
            timestamp=now_str
        )

    # Step 3: Question is ACCEPTED or CLARIFY
    # Record user message in DB
    DatabaseManager.add_message(
        session_id=session_id,
        role="user",
        content=user_msg,
        status=relevance.status
    )

    # Generate answer from Knowledge System / AI Provider
    ai_service = get_ai_service()
    gen_result = await ai_service.generate_response(
        query=user_msg,
        category=relevance.category,
        clarification_prompt=relevance.clarification_prompt
    )

    # Save assistant message to database
    bot_record = DatabaseManager.add_message(
        session_id=session_id,
        role="assistant",
        content=gen_result["message"],
        status=gen_result["status"],
        warning_message=None,
        citations=gen_result.get("citations", [])
    )

    return ChatResponse(
        id=bot_record.id,
        session_id=session_id,
        message=gen_result["message"],
        status=gen_result["status"],
        warning_message=None,
        citations=gen_result.get("citations", []),
        category=relevance.category or "college_general",
        timestamp=now_str
    )

# ----------------- Session & History Endpoints -----------------

@app.get("/api/sessions", response_model=List[SessionSummary], tags=["Sessions"])
async def list_sessions():
    return DatabaseManager.get_sessions()

@app.post("/api/sessions", response_model=SessionDetail, tags=["Sessions"])
async def create_new_session(title: str = "New Conversation"):
    return DatabaseManager.create_session(title)

@app.get("/api/sessions/{session_id}", response_model=SessionDetail, tags=["Sessions"])
async def get_session_history(session_id: str):
    session = DatabaseManager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    return session

@app.delete("/api/sessions/{session_id}", tags=["Sessions"])
async def delete_session(session_id: str):
    DatabaseManager.delete_session(session_id)
    return {"success": True, "message": f"Session {session_id} deleted."}

@app.delete("/api/sessions", tags=["Sessions"])
async def clear_all_history():
    DatabaseManager.clear_all_sessions()
    return {"success": True, "message": "All chat history cleared."}
