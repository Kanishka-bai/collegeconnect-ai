from typing import List, Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="The user query or prompt")
    session_id: Optional[str] = Field(None, description="Optional conversation session ID")

class RelevanceCheckRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Message to classify")

class Citation(BaseModel):
    source_title: str
    document_code: str
    department: str
    last_updated: str

class RelevanceResult(BaseModel):
    status: str = Field(..., description="ACCEPTED, REJECTED, or CLARIFY")
    reason: str
    category: Optional[str] = None
    is_jailbreak_attempt: bool = False
    clarification_prompt: Optional[str] = None

class ChatResponse(BaseModel):
    id: str
    session_id: str
    message: str
    status: str  # "ACCEPTED", "REJECTED", "CLARIFY"
    warning_message: Optional[str] = None
    citations: List[Citation] = []
    category: Optional[str] = None
    timestamp: str

class MessageRecord(BaseModel):
    id: str
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    status: str
    warning_message: Optional[str] = None
    citations: List[Citation] = []
    created_at: str

class SessionDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[MessageRecord] = []

class SessionSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0

class HealthCheckResponse(BaseModel):
    status: str
    version: str
    ai_provider: str
    knowledge_sections_count: int
    environment: str
