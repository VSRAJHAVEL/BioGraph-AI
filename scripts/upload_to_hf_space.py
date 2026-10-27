"""
Upload compiled BioGraph AI static web application to Hugging Face Spaces:
Repo: Rajhavelvssince/BioGraph-AI
"""
import os
import sys
from pathlib import Path
from huggingface_hub import HfApi

HF_TOKEN = os.environ.get("HF_SPACE_TOKEN")
if not HF_TOKEN:
    print("Error: HF_SPACE_TOKEN environment variable not set. Export HF_SPACE_TOKEN='your_token'")
    sys.exit(1)
SPACE_ID = "Rajhavelvssince/BioGraph-AI"

api = HfApi(token=HF_TOKEN)
print(f"Connecting to Hugging Face Hub as {api.whoami()['name']}...")
print(f"Deploying to Space: {SPACE_ID}")

# 1. Upload Space README with static SDK metadata
SPACE_README = """---
title: BioGraph AI - Deep Graph Neural Networks for Molecular Discovery
emoji: 🧬
colorFrom: yellow
colorTo: indigo
sdk: static
pinned: false
license: mit
---

# BioGraph AI: In Silico Drug Discovery & Molecular Property Prediction

[![Hugging Face Models](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Pretrained%20Weights-yellow.svg)](https://huggingface.co/VSRAJHAVEL/BioGraph-AI-Models)
[![GitHub](https://img.shields.io/badge/GitHub-BioGraph--AI-10b981?logo=github)](https://github.com/VSRAJHAVEL/BioGraph-AI)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, CPU-optimized Computer-Aided Drug Discovery (CADD) studio providing real-time in silico ADMET profiling, 3D WebGL stereochemical conformations, and consensus Graph Neural Network inference (MPNN, GIN, GAT, GCN) across ESOL, BBBP, and Tox21 benchmarks.

> **Handcrafted by [RAJHAVEL V S](https://vsrajhavel.github.io)**  
> **Portfolio:** [vsrajhavel.github.io](https://vsrajhavel.github.io) | **LinkedIn:** [in/rajhavelvs](https://in.linkedin.com/in/rajhavelvs) | **GitHub:** [@VSRAJHAVEL](https://github.com/VSRAJHAVEL)

---

## 🔬 Pretrained Model Hub
Pre-trained model checkpoints are available at:  
👉 **[huggingface.co/VSRAJHAVEL/BioGraph-AI-Models](https://huggingface.co/VSRAJHAVEL/BioGraph-AI-Models)**
"""

print("Uploading Space README.md...")
api.upload_file(
    path_or_fileobj=SPACE_README.encode("utf-8"),
    path_in_repo="README.md",
    repo_id=SPACE_ID,
    repo_type="space"
)
print("✓ Space README.md uploaded.")

# 2. Upload frontend/dist folder
dist_dir = Path("frontend/dist")
print(f"Uploading files from {dist_dir} to {SPACE_ID}...")

api.upload_folder(
    folder_path=str(dist_dir),
    repo_id=SPACE_ID,
    repo_type="space"
)

print(f"\n🎉 BioGraph AI IS OFFICIALLY LIVE ON HUGGING FACE SPACES!")
print(f"URL: https://huggingface.co/spaces/{SPACE_ID}")
