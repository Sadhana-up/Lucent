from __future__ import annotations

import base64
import json
import logging
import warnings
from typing import AsyncIterator, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from google.adk.agents.llm_agent import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.adk.runners import InMemoryRunner
from google.genai import types

load_dotenv()
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

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
MODEL_NAME = "gemini-flash-latest"
APP_NAME = "web_chat"
USER_ID = "web-client"  # single-tenant demo; swap for a real user id if you add auth

root_agent = Agent(
    model=MODEL_NAME,
    name="root_agent",
    description="Ai agent that can answer questions and perform tasks.",
    instruction="You are a helpful assistant.",
    before_model_callback=before_model_callback,
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            include_thoughts=True,
            thinking_budget=-1,
        ),
    ),
)

# One runner for the process. ADK sessions live inside runner.session_service,
# keyed by (app_name, user_id, session_id) — this is what gives each browser
# tab its own persistent conversation without us having to resend history on
# every request the way the naive "resend full messages[]" approach would.
runner = InMemoryRunner(agent=root_agent, app_name=APP_NAME)

app = FastAPI(title="Chat Backend")

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
    message: str
    images: Optional[list[ImageData]] = None  # up to 3 images


def sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


async def stream_reply(session_id: str, message: str, images: Optional[list[ImageData]] = None) -> AsyncIterator[str]:
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
                user_id=USER_ID,
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
            user_id=USER_ID,
            session_id=session_id,
            new_message=content,
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
async def chat_stream(req: ChatRequest):
    print(f"[chat_stream] Request: session_id={req.session_id}, message={req.message[:80]}, images={len(req.images) if req.images else 0}")
    session_id = req.session_id
    if not session_id:
        session = await runner.session_service.create_session(
            app_name=APP_NAME, user_id=USER_ID
        )
        session_id = session.id
        print(f"[chat_stream] Created new session: {session_id}")

    return StreamingResponse(
        stream_reply(session_id, req.message, req.images),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",  # disable nginx buffering if you sit behind one
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
