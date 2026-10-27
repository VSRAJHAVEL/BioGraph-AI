"""
Deploy Full-Stack BioGraph AI (FastAPI + React + PyTorch GNNs) to Hugging Face Docker Space:
Target: VSRAJHAVEL/BioGraph-AI
"""
import os
import sys
from pathlib import Path
from huggingface_hub import HfApi

HF_TOKEN = os.environ.get("HF_TOKEN")
if not HF_TOKEN:
    print("Error: HF_TOKEN environment variable not set. Export HF_TOKEN='your_token'")
    sys.exit(1)
SPACE_ID = "VSRAJHAVEL/BioGraph-AI"

api = HfApi(token=HF_TOKEN)
print(f"Connecting to Hugging Face as {api.whoami()['name']}...")
print(f"Deploying Docker Space to: {SPACE_ID}")

# 1. README with Docker SDK
README_CONTENT = """---
title: BioGraph AI - Deep Graph Neural Networks for Molecular Discovery
emoji: 🧬
colorFrom: yellow
colorTo: indigo
sdk: docker
app_port: 8000
pinned: false
license: mit
---

# BioGraph AI: Deep Graph Neural Networks for Molecular Discovery

[![GitHub](https://img.shields.io/badge/GitHub-BioGraph--AI-10b981?logo=github)](https://github.com/VSRAJHAVEL/BioGraph-AI)
[![Model Hub](https://img.shields.io/badge/%F0%9F%A4%97%20Model%20Hub-Pretrained%20Weights-orange?logo=huggingface)](https://huggingface.co/VSRAJHAVEL/BioGraph-AI-Models)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, CPU-optimized Computer-Aided Drug Discovery (CADD) studio providing real-time in silico ADMET profiling, 3D WebGL stereochemical conformations, and consensus Graph Neural Network inference (MPNN, GIN, GAT, GCN) across ESOL, BBBP, and Tox21 benchmarks.

> **Handcrafted by [RAJHAVEL V S](https://vsrajhavel.github.io)**  
> **Portfolio:** [vsrajhavel.github.io](https://vsrajhavel.github.io) | **LinkedIn:** [in/rajhavelvs](https://in.linkedin.com/in/rajhavelvs) | **GitHub:** [@VSRAJHAVEL](https://github.com/VSRAJHAVEL)
"""

api.upload_file(
    path_or_fileobj=README_CONTENT.encode("utf-8"),
    path_in_repo="README.md",
    repo_id=SPACE_ID,
    repo_type="space"
)
print("✓ Uploaded README.md")

# 2. Gitattributes for LFS
GITATTRIBUTES = """*.pt filter=lfs diff=lfs merge=lfs -text
*.pkl filter=lfs diff=lfs merge=lfs -text
"""
api.upload_file(
    path_or_fileobj=GITATTRIBUTES.encode("utf-8"),
    path_in_repo=".gitattributes",
    repo_id=SPACE_ID,
    repo_type="space"
)
print("✓ Uploaded .gitattributes")

# 3. Dockerfile
DOCKERFILE = """FROM python:3.10-slim

# Create user with UID 1000 for Hugging Face Spaces non-root security
RUN useradd -m -u 1000 user
WORKDIR /app

# Install system dependencies (OpenMP libgomp1 for PyTorch / RDKit)
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    curl \\
    libgomp1 \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \\
    pip install --no-cache-dir -r requirements.txt

# Copy application code, configs, raw data, and checkpoints
COPY configs/ ./configs/
COPY data/raw/ ./data/raw/
COPY results/checkpoints/ ./results/checkpoints/
COPY src/ ./src/
COPY app/ ./app/
COPY frontend/dist/ ./frontend/dist/

RUN chown -R user:user /app
USER user

ENV PORT=8000 \\
    LOW_MEMORY_MODE=1 \\
    PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \\
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["sh", "-c", "uvicorn app.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
"""
api.upload_file(
    path_or_fileobj=DOCKERFILE.encode("utf-8"),
    path_in_repo="Dockerfile",
    repo_id=SPACE_ID,
    repo_type="space"
)
print("✓ Uploaded Dockerfile")

# 4. Upload requirements.txt
api.upload_file(
    path_or_fileobj="requirements.txt",
    path_in_repo="requirements.txt",
    repo_id=SPACE_ID,
    repo_type="space"
)
print("✓ Uploaded requirements.txt")

# 5. Upload directories
for folder in ["configs", "data/raw", "src", "app", "frontend/dist"]:
    print(f"Uploading {folder}...")
    api.upload_folder(
        folder_path=folder,
        path_in_repo=folder,
        repo_id=SPACE_ID,
        repo_type="space"
    )
    print(f"✓ Uploaded {folder}")

# 6. Upload checkpoints
ckpt_dir = Path("results/checkpoints")
for ckpt in sorted(ckpt_dir.glob("*")):
    if ckpt.is_file():
        print(f"Uploading checkpoint {ckpt.name} ({ckpt.stat().st_size / 1024 / 1024:.2f} MB)...")
        api.upload_file(
            path_or_fileobj=str(ckpt),
            path_in_repo=f"results/checkpoints/{ckpt.name}",
            repo_id=SPACE_ID,
            repo_type="space"
        )
        print(f"✓ Uploaded {ckpt.name}")

print("\n🚀 All files successfully uploaded to Hugging Face Docker Space!")
print(f"Build logs and live URL: https://huggingface.co/spaces/{SPACE_ID}")
