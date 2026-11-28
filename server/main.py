from __future__ import annotations
from system_instruction import INSTRUCTION
import base64
import json
import logging
import os
import pathlib
import time
import warnings
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import AsyncIterator, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from google.adk.agents.llm_agent import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.artifacts import FileArtifactService
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.adk.runners import Runner
from google.adk.sessions.database_session_service import DatabaseSessionService
from google.adk.skills import load_skill_from_dir
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.skill_toolset import SkillToolset
from google.genai import types

# Import the product search tool
from tools import search_products

load_dotenv()

warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

# ---------------------------------------------------------------------------
# Rate Limiter (in-memory, sliding window – no Redis required)
# ---------------------------------------------------------------------------
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", "30"))        # requests per window
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

class InMemoryRateLimiter:
    """Simple sliding-window rate limiter backed by a dict."""

    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, window: int, max_requests: int) -> bool:
        now = time.time()
        cutoff = now - window
        self._hits[key] = [t for t in self._hits[key] if t > cutoff]
        if len(self._hits[key]) >= max_requests:
            return False
        self._hits[key].append(now)
        return True

    def remaining(self, key: str, window: int, max_requests: int) -> int:
        now = time.time()
        cutoff = now - window
        self._hits[key] = [t for t in self._hits[key] if t > cutoff]
        return max(0, max_requests - len(self._hits[key]))

    def retry_after(self, key: str, window: int) -> float:
        if self._hits[key]:
            return max(0, window - (time.time() - self._hits[key][0]))
        return 0

_limiter = InMemoryRateLimiter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _verify_api_key(request: Request) -> None:
    """Reject requests without a valid INTERNAL_API_KEY header."""
    if not INTERNAL_API_KEY:
        return  # key auth disabled when env var is unset
    provided = request.headers.get("x-api-key", "")
    if provided != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

# ---------------------------------------------------------------------------
# Logging (same debug-log-to-file setup as the CLI version)
# ---------------------------------------------------------------------------
adk_log_handler = logging.FileHandler("adk_debug.log", encoding="utf-8")
adk_log_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(name)s -\n%(message)s")
)
_adk_log = logging.getLogger("google_adk")
_adk_log.setLevel(logging.DEBUG)
_adk_log.addHandler(adk_log_handler)
_adk_log.propagate = False


class _LLMBlockOnly(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        return msg.startswith("LLM Request") or msg.startswith("LLM Response")


_adk_log.addFilter(_LLMBlockOnly())
logging.basicConfig(level=logging.WARNING)

# Track which sessions have pending images (in-memory for this demo)
_pending_images: dict[str, list[str]] = {}

# ---------------------------------------------------------------------------
# Before-model callback: injects artifacts (images) into the LLM request
# ---------------------------------------------------------------------------
async def before_model_callback(
    callback_context: CallbackContext,
    llm_request: LlmRequest,
) -> Optional[LlmResponse]:
    """Loads image artifacts from the session and injects them into the LLM request.

    This callback runs before every model call. It checks if there are any
    pending image artifacts for this session. If found, it loads them from
    the artifact service and appends them as inline_data parts to the last
    user message in the request.
    """
    print("[before_model_callback] Triggered")

    session_id = callback_context.session.id if callback_context.session else None
    if not session_id:
        print("[before_model_callback] No session ID found")
        return None

    # Check if there are pending images for this session
    pending = _pending_images.get(session_id, [])
    if not pending:
        print(f"[before_model_callback] No pending images for session {session_id}")
        return None

    print(f"[before_model_callback] Found {len(pending)} pending image(s): {pending}")

    # Load each artifact and collect the Parts
    image_parts: list[types.Part] = []
    for filename in pending:
        print(f"[before_model_callback] Loading artifact: {filename}")
        artifact = await callback_context.load_artifact(filename)
        if artifact is not None:
            image_parts.append(artifact)
            print(f"[before_model_callback] Loaded artifact: {filename} (mime={artifact.inline_data.mime_type if artifact.inline_data else 'unknown'})")
        else:
            print(f"[before_model_callback] Artifact not found: {filename}")

    # Clear the pending images after loading
    _pending_images.pop(session_id, None)

    if not image_parts:
        print("[before_model_callback] No artifacts could be loaded")
        return None

    # Inject image parts into the last user message
    if llm_request.contents and len(llm_request.contents) > 0:
        last_content = llm_request.contents[-1]
        if last_content.role == "user":
            # Append image parts to the existing user message
            last_content.parts.extend(image_parts)
            print(f"[before_model_callback] Injected {len(image_parts)} image(s) into last user message")
        else:
            # Create a new user message with images
            llm_request.contents.append(
                types.Content(role="user", parts=image_parts)
            )
            print(f"[before_model_callback] Appended new user message with {len(image_parts)} image(s)")
    else:
        # No contents yet, create a user message with images
        llm_request.contents = [types.Content(role="user", parts=image_parts)]
        print(f"[before_model_callback] Created new user message with {len(image_parts)} image(s)")

    return None  # Allow the LLM call to proceed


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------
MODEL_NAME = "gemini-3-flash-preview"
APP_NAME = "web_chat"
DEFAULT_USER_ID = "web-client"  # fallback when a client doesn't supply a user id

# ---------------------------------------------------------------------------
# Skills — loaded from the skills/ directory next to this file.
# Each sub-directory must contain a SKILL.md whose `name` field matches the
# directory name (kebab-case, per ADK spec).
# ---------------------------------------------------------------------------
_SKILLS_DIR = pathlib.Path(__file__).parent / "skills"

def _load_all_skills():
    """Load every valid skill directory found under server/skills/."""
    skills = []
    if _SKILLS_DIR.is_dir():
        for skill_dir in sorted(_SKILLS_DIR.iterdir()):
            if skill_dir.is_dir():
                try:
                    skill = load_skill_from_dir(skill_dir)
                    skills.append(skill)
                    logging.getLogger("google_adk").info(
                        "Loaded skill: %s", skill.name
                    )
                except Exception as exc:
                    logging.getLogger("google_adk").warning(
                        "Skipping skill directory '%s': %s", skill_dir.name, exc
                    )
    return skills

skill_toolset = SkillToolset(skills=_load_all_skills())

root_agent = Agent(
    model=MODEL_NAME,
    name="root_agent",
    description="Ai agent that can answer questions and perform tasks.",
    instruction=INSTRUCTION,
    tools=[skill_toolset, FunctionTool(func=search_products)],
    before_model_callback=before_model_callback,
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            include_thoughts=True,
            thinking_budget=-1,
        ),
    ),
)

# ---------------------------------------------------------------------------
# Persistent session + artifact storage
# ---------------------------------------------------------------------------
# ADK stores conversation history in a "session service". We swap the default
# in-memory service for a database-backed one so conversations survive API
# restarts (InMemoryRunner drops everything when the process exits). We reuse
# the same Postgres instance as the rest of the app, converting the sync
# `postgresql://` DSN into the psycopg3 async dialect SQLAlchemy needs
# (`postgresql+psycopg://`). Set ADK_DB_URL to override (e.g. point it at
# `sqlite+aiosqlite:///./adk_sessions.db` for a zero-dependency dev setup).
#
# Images are also persisted to disk (FileArtifactService) instead of memory so
# an upload referenced by a past turn is still resolvable after a restart.
ARTIFACTS_DIR = os.getenv(
    "ARTIFACTS_DIR", str(pathlib.Path(__file__).parent / "artifacts")
)


def _build_session_db_url() -> str:
    url = os.getenv("ADK_DB_URL", "").strip()
    if url:
        return url
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        return "sqlite+aiosqlite:///./adk_sessions.db"
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


pathlib.Path(ARTIFACTS_DIR).mkdir(parents=True, exist_ok=True)

session_service = DatabaseSessionService(_build_session_db_url())
artifact_service = FileArtifactService(ARTIFACTS_DIR)

# One runner for the process. Sessions (and their full event history) are
# persisted by session_service and keyed by (app_name, user_id, session_id).
runner = Runner(
    agent=root_agent,
    app_name=APP_NAME,
    session_service=session_service,
    artifact_service=artifact_service,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Dispose the async DB engine on shutdown so pooled connections close
    # cleanly instead of being torn down by the process.
    await session_service.close()


app = FastAPI(title="Chat Backend", lifespan=lifespan)

# CORS is wide open here because this service is only ever called
# server-to-server by the Next.js route.ts proxy, never directly from the
# browser. Tighten allow_origins if you ever expose it publicly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ImageData(BaseModel):
    mime_type: str
    data: str  # base64 encoded


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    message: str
    images: Optional[list[ImageData]] = None  # up to 3 images


def sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


def _derive_title(message: str) -> str:
    cleaned = " ".join(message.split())
    if not cleaned:
        return "New conversation"
    return cleaned[:80] + ("..." if len(cleaned) > 80 else "")


def _derive_preview(message: str) -> str:
    cleaned = " ".join(message.split())
    if not cleaned:
        return ""
    return cleaned[:140] + ("..." if len(cleaned) > 140 else "")


async def stream_reply(
    user_id: str,
    session_id: str,
    message: str,
    images: Optional[list[ImageData]] = None,
) -> AsyncIterator[str]:
    # First frame tells the client which session it's now attached to, so it
    # can reuse it on the next turn instead of starting a fresh conversation.
    yield sse({"type": "session", "session_id": session_id})

    # If there are images, save them as artifacts before building the message.
    # The before_model_callback will load them and inject into the LLM request.
    if images:
        print(f"[stream_reply] Received {len(images)} image(s), saving as artifacts")
        filenames = []
        for idx, img in enumerate(images):
            filename = f"session_{session_id}_image_{idx}.png"
            image_bytes = base64.b64decode(img.data)
            artifact = types.Part.from_bytes(data=image_bytes, mime_type=img.mime_type)
            version = await runner.artifact_service.save_artifact(
                app_name=APP_NAME,
                user_id=user_id,
                filename=filename,
                artifact=artifact,
                session_id=session_id,
            )
            print(f"[stream_reply] Saved artifact: {filename} (version={version})")
            filenames.append(filename)

        # Store filenames in pending images dict for the callback
        _pending_images[session_id] = filenames
        print(f"[stream_reply] Updated pending images for session {session_id}: {filenames}")
    else:
        print("[stream_reply] No images in request")

    content = types.Content(role="user", parts=[types.Part.from_text(text=message)])

    # ADK streams "partial" chunks as they arrive, then re-emits one final
    # non-partial chunk per channel (thought / answer) containing the full
    # consolidated text. If we forwarded both we'd duplicate everything, so
    # once a channel has streamed partials we drop its non-partial replay —
    # same dedup the CLI version does with saw_partial_thought/answer.
    saw_partial_thought = False
    saw_partial_answer = False

    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=content,
            state_delta={"preview": _derive_preview(message)},
            run_config=RunConfig(streaming_mode=StreamingMode.SSE),
        ):
            if not event.content or not event.content.parts:
                continue

            for part in event.content.parts:
                if not part.text:
                    continue
                is_thought = bool(getattr(part, "thought", False))

                if event.partial:
                    if is_thought:
                        saw_partial_thought = True
                    else:
                        saw_partial_answer = True
                else:
                    if is_thought and saw_partial_thought:
                        continue
                    if not is_thought and saw_partial_answer:
                        continue

                yield sse({
                    "type": "reasoning" if is_thought else "answer",
                    "text": part.text,
                })
    except Exception as exc:  # surfaced as an inline error bubble in the UI
        print(f"[stream_reply] Error: {exc}")
        yield sse({"type": "error", "text": str(exc)})
    finally:
        yield sse({"type": "done"})


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    # 1. Verify internal API key
    _verify_api_key(request)

    # 2. Rate limit per client IP
    ip = _client_ip(request)
    if not _limiter.is_allowed(ip, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX):
        retry = _limiter.retry_after(ip, RATE_LIMIT_WINDOW)
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded. Try again later."},
            headers={
                "Retry-After": str(int(retry) + 1),
                "X-RateLimit-Limit": str(RATE_LIMIT_MAX),
                "X-RateLimit-Remaining": "0",
            },
        )

    print(f"[chat_stream] Request: user_id={req.user_id}, session_id={req.session_id}, message={req.message[:80]}, images={len(req.images) if req.images else 0}")
    user_id = req.user_id or DEFAULT_USER_ID
    session_id = req.session_id
    if not session_id:
        session = await runner.session_service.create_session(
            app_name=APP_NAME, user_id=user_id, state={"title": _derive_title(req.message)}
        )
        session_id = session.id
        print(f"[chat_stream] Created new session: {session_id}")

    remaining = _limiter.remaining(ip, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX)
    return StreamingResponse(
        stream_reply(user_id, session_id, req.message, req.images),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "X-RateLimit-Limit": str(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": str(remaining),
        },
    )


# ---------------------------------------------------------------------------
# Session history endpoints
# ---------------------------------------------------------------------------
def _session_to_messages(session) -> list[dict]:
    """Flatten a persisted ADK session into a UI-friendly message list.

    A single agent turn may be split across several events (thoughts, tool
    calls, final answer). We merge consecutive agent events into one assistant
    message, separating ``thought`` parts into reasoning and the rest into the
    visible answer text.
    """
    messages: list[dict] = []
    reasoning: list[str] = []
    answer: list[str] = []
    timestamp: Optional[float] = None

    def flush_assistant() -> None:
        nonlocal reasoning, answer, timestamp
        if reasoning or answer:
            messages.append({
                "role": "assistant",
                "content": "".join(answer),
                "reasoning": "".join(reasoning),
                "timestamp": timestamp,
            })
        reasoning = []
        answer = []
        timestamp = None

    for event in session.events:
        if not event.content or not event.content.parts:
            continue

        if event.author == "user":
            flush_assistant()
            text = "".join(
                part.text
                for part in event.content.parts
                if part.text and not getattr(part, "thought", False)
            )
            if text:
                messages.append({
                    "role": "user",
                    "content": text,
                    "reasoning": "",
                    "timestamp": event.timestamp,
                })
        else:
            if timestamp is None:
                timestamp = event.timestamp
            for part in event.content.parts:
                if not part.text:
                    continue
                if getattr(part, "thought", False):
                    reasoning.append(part.text)
                else:
                    answer.append(part.text)

    flush_assistant()
    return messages


@app.get("/sessions")
async def list_sessions(request: Request, user_id: str = Query(default=DEFAULT_USER_ID)):
    _verify_api_key(request)
    response = await session_service.list_sessions(
        app_name=APP_NAME, user_id=user_id
    )
    sessions = []
    for session in response.sessions:
        state = session.state or {}
        sessions.append({
            "id": session.id,
            "title": state.get("title") or "New conversation",
            "preview": state.get("preview") or "",
            "last_update_time": session.last_update_time,
        })
    sessions.sort(key=lambda s: s["last_update_time"], reverse=True)
    return {"sessions": sessions}


@app.get("/sessions/{session_id}")
async def get_session_history(
    session_id: str,
    request: Request,
    user_id: str = Query(default=DEFAULT_USER_ID),
):
    _verify_api_key(request)
    session = await session_service.get_session(
        app_name=APP_NAME, user_id=user_id, session_id=session_id
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    state = session.state or {}
    return {
        "id": session.id,
        "title": state.get("title") or "New conversation",
        "messages": _session_to_messages(session),
    }


@app.delete("/sessions/{session_id}")
async def delete_session_history(
    session_id: str,
    request: Request,
    user_id: str = Query(default=DEFAULT_USER_ID),
):
    _verify_api_key(request)
    await session_service.delete_session(
        app_name=APP_NAME, user_id=user_id, session_id=session_id
    )
    return {"ok": True}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
