import sqlite3
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.config import settings
from app.models.schemas import SessionDetail, SessionSummary, MessageRecord, Citation

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    # Create sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    # Create messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL,
            warning_message TEXT,
            citations_json TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

# Auto-initialize database tables on module import
init_db()

class DatabaseManager:
    @staticmethod
    def create_session(title: str = "New Conversation") -> SessionDetail:
        now = datetime.now(timezone.utc).isoformat()
        session_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (session_id, title, now, now)
        )
        conn.commit()
        conn.close()
        return SessionDetail(id=session_id, title=title, created_at=now, updated_at=now, messages=[])

    @staticmethod
    def get_sessions() -> List[SessionSummary]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.id, s.title, s.created_at, s.updated_at, COUNT(m.id) as message_count
            FROM sessions s
            LEFT JOIN messages m ON s.id = m.session_id
            GROUP BY s.id
            ORDER BY s.updated_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SessionSummary(
                id=row["id"],
                title=row["title"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                message_count=row["message_count"]
            )
            for row in rows
        ]

    @staticmethod
    def get_session(session_id: str) -> Optional[SessionDetail]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, created_at, updated_at FROM sessions WHERE id = ?", (session_id,))
        s_row = cursor.fetchone()
        if not s_row:
            conn.close()
            return None

        cursor.execute(
            "SELECT id, session_id, role, content, status, warning_message, citations_json, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        )
        m_rows = cursor.fetchall()
        conn.close()

        messages = []
        for m in m_rows:
            citations_data = json.loads(m["citations_json"]) if m["citations_json"] else []
            citations = [Citation(**c) for c in citations_data]
            messages.append(MessageRecord(
                id=m["id"],
                session_id=m["session_id"],
                role=m["role"],
                content=m["content"],
                status=m["status"],
                warning_message=m["warning_message"],
                citations=citations,
                created_at=m["created_at"]
            ))

        return SessionDetail(
            id=s_row["id"],
            title=s_row["title"],
            created_at=s_row["created_at"],
            updated_at=s_row["updated_at"],
            messages=messages
        )

    @staticmethod
    def add_message(
        session_id: str,
        role: str,
        content: str,
        status: str,
        warning_message: Optional[str] = None,
        citations: Optional[List[Citation]] = None
    ) -> MessageRecord:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        msg_id = str(uuid.uuid4())
        citations_json = json.dumps([c.model_dump() for c in citations]) if citations else "[]"

        # Ensure session exists or create it
        cursor.execute("SELECT id, title FROM sessions WHERE id = ?", (session_id,))
        s_row = cursor.fetchone()
        if not s_row:
            auto_title = content[:30] + ("..." if len(content) > 30 else "")
            cursor.execute(
                "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (session_id, auto_title, now, now)
            )
        else:
            # Update title if it's default
            if s_row["title"] == "New Conversation" and role == "user":
                auto_title = content[:30] + ("..." if len(content) > 30 else "")
                cursor.execute("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?", (auto_title, now, session_id))
            else:
                cursor.execute("UPDATE sessions SET updated_at = ? WHERE id = ?", (now, session_id))

        cursor.execute(
            """INSERT INTO messages (id, session_id, role, content, status, warning_message, citations_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (msg_id, session_id, role, content, status, warning_message, citations_json, now)
        )
        conn.commit()
        conn.close()

        return MessageRecord(
            id=msg_id,
            session_id=session_id,
            role=role,
            content=content,
            status=status,
            warning_message=warning_message,
            citations=citations or [],
            created_at=now
        )

    @staticmethod
    def delete_session(session_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def clear_all_sessions() -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages")
        cursor.execute("DELETE FROM sessions")
        conn.commit()
        conn.close()
        return True
