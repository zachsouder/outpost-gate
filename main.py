import os
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GATE_API_KEY", "demo-key-change-me")

# Event queue for SSE connections
event_queues: list[asyncio.Queue] = []


class GateOpenRequest(BaseModel):
    name: str


class GateOpenResponse(BaseModel):
    success: bool
    message: str
    name: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Cleanup: close all event queues
    for queue in event_queues:
        await queue.put(None)


app = FastAPI(
    title="Rila Gate Demo",
    description="Trade show demo for Outpost gate access",
    lifespan=lifespan,
)


@app.post("/api/gate/open", response_model=GateOpenResponse)
async def open_gate(
    request: GateOpenRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """
    Open the gate and display welcome message.

    Requires X-API-Key header for authentication.
    """
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Broadcast gate open event to all connected clients
    event_data = {"type": "gate_open", "name": request.name}
    print(f"[Gate] Broadcasting to {len(event_queues)} connected clients: {event_data}")
    for queue in event_queues:
        await queue.put(event_data)

    return GateOpenResponse(
        success=True,
        message=f"Gate opened for {request.name}",
        name=request.name,
    )


@app.post("/api/gate/close")
async def close_gate(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """
    Close the gate (reset for next demo).
    """
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Broadcast gate close event
    event_data = {"type": "gate_close"}
    for queue in event_queues:
        await queue.put(event_data)

    return {"success": True, "message": "Gate closed"}


@app.get("/api/gate/events")
async def gate_events(request: Request):
    """
    Server-Sent Events endpoint for real-time gate updates.
    """
    queue: asyncio.Queue = asyncio.Queue()
    event_queues.append(queue)
    print(f"[Gate] New SSE client connected. Total clients: {len(event_queues)}")

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break

                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    if event is None:
                        break
                    yield {
                        "event": event["type"],
                        "data": event.get("name", ""),
                    }
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {"event": "keepalive", "data": ""}
        finally:
            event_queues.remove(queue)
            print(f"[Gate] SSE client disconnected. Remaining clients: {len(event_queues)}")

    return EventSourceResponse(event_generator())


@app.get("/")
async def root():
    return FileResponse("static/index.html")


# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
