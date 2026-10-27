# ==============================================================================
# BioGraph AI — Multi-Stage Production Dockerfile
# ==============================================================================

# Stage 1: Build React Production Bundle
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: CPU-Optimized Python Backend Runtime
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (OpenMP libgomp1 for PyTorch / RDKit)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code, configs, and pre-trained weights
COPY configs/ ./configs/
COPY data/raw/ ./data/raw/
COPY results/checkpoints/ ./results/checkpoints/
COPY src/ ./src/
COPY app/ ./app/

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Configure port and container environment
ENV PORT=8000 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start unified production server
CMD ["sh", "-c", "uvicorn app.server:app --host 0.0.0.0 --port ${PORT}"]
