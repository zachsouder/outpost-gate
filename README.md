# Outpost Gate Demo

A trade show demo app that displays an animated gate opening when a driver is authorized to enter a facility.

## What It Does

- Displays a neubrutalism-styled pixel art gate with the Outpost logo
- When the API is called, the gate opens with a 4-second animation
- Shows a personalized welcome message and dock door assignment
- Auto-closes after 12 seconds and resets for the next driver

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python 3.12 + FastAPI |
| **Frontend** | Vanilla HTML/CSS/JavaScript |
| **Real-time Updates** | Polling (1-second interval) |
| **Styling** | Neubrutalism design with CSS animations |
| **Deployment** | Docker + Coolify |

## API

### Open Gate

```bash
curl -X POST https://gate.zachsouder.com/api/gate/open \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "John", "dock": 7}'
```

**Response:**
```json
{"success": true, "message": "Gate opened for John", "name": "John"}
```

### Close Gate (Manual)

```bash
curl -X POST https://gate.zachsouder.com/api/gate/close \
  -H "X-API-Key: your-api-key"
```

### Check Status

```bash
curl https://gate.zachsouder.com/api/gate/status
```

## Authentication

Simple API key authentication via `X-API-Key` header. Set the key in the `GATE_API_KEY` environment variable.

## Local Development

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set API key
export GATE_API_KEY=your-secret-key

# Run server
python main.py
```

Open http://localhost:8000

## Docker

```bash
docker build -t outpost-gate .
docker run -p 8000:8000 -e GATE_API_KEY=your-secret-key outpost-gate
```

## Architecture

```
┌─────────────┐     POST /api/gate/open      ┌─────────────┐
│  Your Tool  │ ───────────────────────────▶ │   FastAPI   │
└─────────────┘                              │   Server    │
                                             └──────┬──────┘
                                                    │
                                             updates state
                                                    │
                                                    ▼
┌─────────────┐     GET /api/gate/status     ┌─────────────┐
│   Browser   │ ◀─────────────────────────── │    State    │
│  (polling)  │        every 1 second        │    Store    │
└─────────────┘                              └─────────────┘
```

## Why Polling Instead of WebSockets/SSE?

Server-Sent Events (SSE) was the original implementation, but Coolify's Traefik reverse proxy buffers SSE responses, preventing real-time updates from reaching the browser. Polling every 1 second is simple, reliable through any proxy, and feels instant for this use case where gates are triggered manually.
