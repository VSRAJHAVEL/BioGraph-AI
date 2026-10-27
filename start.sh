#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "    BioGraph AI: GNN Molecular Property Prediction Platform"
echo "=========================================================="

# Check virtual environment
if [ ! -d ".venv" ]; then
    echo "Virtual environment .venv not found. Running setup.sh first..."
    ./setup.sh
fi

source .venv/bin/activate

# Check if production frontend is built
if [ ! -f "frontend/dist/index.html" ]; then
    echo "Frontend build not detected. Building React frontend..."
    cd frontend && npm install && npm run build && cd ..
fi

PORT="${PORT:-8000}"

if [ "$1" = "--dev" ]; then
    echo "Starting Development Mode (Vite on :5173 + FastAPI on :$PORT)..."
    python -m uvicorn app.server:app --host 0.0.0.0 --port "$PORT" --reload &
    BACKEND_PID=$!
    cd frontend && npm run dev &
    FRONTEND_PID=$!

    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait
else
    echo "Starting Unified Production Server..."
    echo "URL: http://localhost:$PORT"
    echo "API Docs: http://localhost:$PORT/docs"
    echo "Press Ctrl+C to terminate."
    python -m uvicorn app.server:app --host 0.0.0.0 --port "$PORT"
fi
