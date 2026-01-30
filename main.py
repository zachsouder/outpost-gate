import os
import time
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GATE_API_KEY", "demo-key-change-me")

# Simple state store for polling
gate_state = {
    "is_open": False,
    "name": "",
    "timestamp": 0,
}


class GateOpenRequest(BaseModel):
    name: str


class GateOpenResponse(BaseModel):
    success: bool
    message: str
    name: str


app = FastAPI(
    title="Rila Gate Demo",
    description="Trade show demo for Outpost gate access",
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

    gate_state["is_open"] = True
    gate_state["name"] = request.name
    gate_state["timestamp"] = time.time()

    print(f"[Gate] Opening for {request.name}")

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

    gate_state["is_open"] = False
    gate_state["name"] = ""

    return {"success": True, "message": "Gate closed"}


@app.get("/api/gate/status")
async def gate_status():
    """
    Poll endpoint for gate state.
    """
    return gate_state


@app.get("/")
async def root():
    return FileResponse("static/index.html")


# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
