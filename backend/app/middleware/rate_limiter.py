import time
from typing import Dict, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.config import settings

class InMemoryRateLimiter:
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        # Map client_ip -> list of timestamps
        self.client_records: Dict[str, List[float]] = {}

    def is_allowed(self, client_ip: str) -> tuple[bool, int, int]:
        now = time.time()
        cutoff = now - self.window_seconds

        if client_ip not in self.client_records:
            self.client_records[client_ip] = []

        # Filter out timestamps older than the window
        valid_timestamps = [t for t in self.client_records[client_ip] if t > cutoff]
        self.client_records[client_ip] = valid_timestamps

        remaining = max(0, self.requests_per_minute - len(valid_timestamps))
        reset_time = int(valid_timestamps[0] + self.window_seconds - now) if valid_timestamps else 0

        if len(valid_timestamps) >= self.requests_per_minute:
            return False, 0, max(1, reset_time)

        self.client_records[client_ip].append(now)
        return True, remaining - 1, self.window_seconds

rate_limiter = InMemoryRateLimiter(settings.RATE_LIMIT_PER_MINUTE)

class SecurityAndRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Check content-length limit (10 KB)
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.MAX_REQUEST_SIZE_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request payload exceeds size limit (maximum 10 KB)."}
            )

        # 2. Check rate limit for API endpoints
        if request.url.path.startswith("/api/chat") or request.url.path.startswith("/api/relevance"):
            client_ip = request.client.host if request.client else "unknown"
            allowed, remaining, reset_secs = rate_limiter.is_allowed(client_ip)

            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. Please wait a moment before sending another message."
                    },
                    headers={
                        "X-RateLimit-Limit": str(settings.RATE_LIMIT_PER_MINUTE),
                        "X-RateLimit-Remaining": "0",
                        "Retry-After": str(reset_secs)
                    }
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_PER_MINUTE)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response

        return await call_next(request)
