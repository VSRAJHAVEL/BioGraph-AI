"""
Upload BioGraph AI Pretrained Weights, Plots, and Model Card to Hugging Face Model Hub.
Repo: VSRAJHAVEL/BioGraph-AI-Models
"""
import os
import sys
from pathlib import Path
from huggingface_hub import HfApi

HF_TOKEN = os.environ.get("HF_TOKEN")
if not HF_TOKEN:
    print("Error: HF_TOKEN environment variable not set. Export HF_TOKEN='your_token'")
    sys.exit(1)
REPO_ID = "VSRAJHAVEL/BioGraph-AI-Models"

api = HfApi(token=HF_TOKEN)

print(f"Connecting to Hugging Face Hub as {api.whoami()['name']}...")
print(f"Target repository: {REPO_ID}")

# Model Card README
MODEL_CARD = """---
language:
- en
license: mit
library_name: pytorch
tags:
- chemistry
- graph-neural-networks
- drug-discovery
- rdkit
- pytorch-geometric
- moleculenet
- cheminformatics
- toxicology
- admet
- mpnn
- gin
- gcn
- gat
datasets:
- esol
- bbbp
- tox21
metrics:
- rmse
- roc_auc
model-index:
- name: BioGraph-AI-MPNN-ESOL
  results:
  - task:
      type: tabular-regression
      name: Aqueous Solubility Prediction
    dataset:
      name: ESOL Delaney
      type: esol
    metrics:
    - type: rmse
      value: 1.010
      name: Test RMSE
- name: BioGraph-AI-MPNN-Tox21
  results:
  - task:
      type: tabular-classification
      name: Multi-Task Nuclear Receptor & Stress Pathway Toxicity
    dataset:
      name: Tox21
      type: tox21
    metrics:
    - type: roc_auc
      value: 0.757
      name: Test ROC-AUC
- name: BioGraph-AI-RF-BBBP
  results:
  - task:
      type: tabular-classification
      name: Blood-Brain Barrier Penetration
    dataset:
      name: BBBP
      type: bbbp
    metrics:
    - type: roc_auc
      value: 0.853
      name: Test ROC-AUC
---

# BioGraph AI: Deep Graph Neural Networks for Molecular Property Prediction & ADMET Profiling

[![GitHub Stars](https://img.shields.io/badge/GitHub-BioGraph--AI-10b981?logo=github)](https://github.com/VSRAJHAVEL/BioGraph-AI)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c?logo=pytorch)](https://pytorch.org/)
[![PyG](https://img.shields.io/badge/PyG-PyTorch_Geometric-3b82f6)](https://pyg.org/)
[![RDKit](https://img.shields.io/badge/Cheminformatics-RDKit-green)](https://www.rdkit.org/)

**BioGraph AI** is an enterprise-grade Computer-Aided Drug Design (CADD) and Molecular Machine Learning platform. This repository hosts pre-trained model weights for **15 state-of-the-art graph architectures and classical baselines** evaluated under strict Bemis-Murcko scaffold splitting across three canonical MoleculeNet benchmarks (**ESOL, BBBP, Tox21**).

> **Handcrafted by [RAJHAVEL V S](https://vsrajhavel.github.io)**  
> **Portfolio:** [vsrajhavel.github.io](https://vsrajhavel.github.io) | **LinkedIn:** [in/rajhavelvs](https://in.linkedin.com/in/rajhavelvs) | **GitHub:** [@VSRAJHAVEL](https://github.com/VSRAJHAVEL)

---

## 🔬 Benchmark Performance (Bemis-Murcko Scaffold Split 80/10/10)

All models were trained, validated, and evaluated on local Intel CPU physical threads. Zero scaffold leakage was mathematically confirmed across all training and test partitions.

### 1. Aqueous Solubility (ESOL — Delaney Regression, $\\log S$ in $\\text{mol/L}$)
| Model Architecture | Test RMSE ↓ | Test MAE ↓ | Test $R^2$ ↑ | Checkpoint File |
| :--- | :---: | :---: | :---: | :--- |
| **MPNN (Edge-Aware)** | **1.010** | **0.777** | **0.784** | `checkpoints/esol_mpnn_best.pt` |
| **GIN (Weisfeiler-Lehman)** | 1.054 | 0.812 | 0.764 | `checkpoints/esol_gin_best.pt` |
| **GCN (Kipf-Welling)** | 1.080 | 0.811 | 0.753 | `checkpoints/esol_gcn_best.pt` |
| **Baseline (RF + Morgan)** | 1.109 | 0.859 | 0.739 | `checkpoints/esol_baseline_best.pkl` |
| **GAT (Multi-Head)** | 1.208 | 0.938 | 0.691 | `checkpoints/esol_gat_best.pt` |

### 2. Blood-Brain Barrier Penetration (BBBP — Binary Classification)
| Model Architecture | Test ROC-AUC ↑ | Test PR-AUC ↑ | Checkpoint File |
| :--- | :---: | :---: | :--- |
| **Baseline (RF + Morgan)** | **0.853** | **0.978** | `checkpoints/bbbp_baseline_best.pkl` |
| **GIN** | 0.723 | 0.936 | `checkpoints/bbbp_gin_best.pt` |
| **GCN** | 0.719 | 0.951 | `checkpoints/bbbp_gcn_best.pt` |
| **MPNN** | 0.665 | 0.944 | `checkpoints/bbbp_mpnn_best.pt` |
| **GAT** | 0.624 | 0.928 | `checkpoints/bbbp_gat_best.pt` |

### 3. Toxicity Profiling (Tox21 — 12 Multi-Task Toxicity Pathways)
*Evaluated across 12 nuclear receptor (NR) and stress response (SR) pathways with missing label masking.*
| Model Architecture | Test ROC-AUC ↑ | Test PR-AUC ↑ | Checkpoint File |
| :--- | :---: | :---: | :--- |
| **MPNN (Edge-Aware)** | **0.757** | 0.304 | `checkpoints/tox21_mpnn_best.pt` |
| **GCN** | 0.754 | 0.310 | `checkpoints/tox21_gcn_best.pt` |
| **GIN** | 0.747 | 0.306 | `checkpoints/tox21_gin_best.pt` |
| **Baseline (RF)** | 0.730 | **0.349** | `checkpoints/tox21_baseline_best.pkl` |
| **GAT** | 0.711 | 0.264 | `checkpoints/tox21_gat_best.pt` |

---

## 🚀 Quickstart: Loading Checkpoints in Python

### Installation
```bash
pip install torch torch-geometric rdkit huggingface_hub
```

### Download Pretrained Weights
```python
from huggingface_hub import hf_hub_download
import torch

# Download best ESOL MPNN checkpoint
checkpoint_path = hf_hub_download(
    repo_id="VSRAJHAVEL/BioGraph-AI-Models",
    filename="checkpoints/esol_mpnn_best.pt"
)

state_dict = torch.load(checkpoint_path, map_location="cpu")
print("Successfully loaded BioGraph AI MPNN checkpoint:", len(state_dict), "weight tensors")
```

---

## 🧬 Architectural Overview

1. **Message Passing Neural Networks (MPNN)**: Formulated with edge-network conditioned message functions $M(h_v, h_w, e_{vw})$ incorporating bond stereo, conjugation, and aromaticity. Top performer for steric-dependent thermodynamic properties.
2. **Graph Isomorphism Network (GIN)**: Employs sum-aggregation with multi-layer perceptrons approximating the 1-Weisfeiler-Lehman topological graph isomorphism test.
3. **Graph Convolutional Networks (GCN)**: First-order localized spectral convolutions with symmetric normalized Laplacian aggregations.
4. **Graph Attention Networks (GAT)**: LeakyReLU-parameterized multi-head attention over bonded neighborhoods.
5. **Random Forest Baselines**: 500-estimator ensembles trained on 2048-bit ECFP4 (Morgan radius 2) fingerprints.

---

## 🔗 Project Resources

- **Full Application Repository**: [https://github.com/VSRAJHAVEL/BioGraph-AI](https://github.com/VSRAJHAVEL/BioGraph-AI)
- **Interactive Web App**: Includes 3D Mol* Conformer Studio, ADMET Spider Radar, MMP Bioisosteric Optimization, PCA Chemical Space Explorer, and GNNExplainer Attribution.
- **License**: MIT License (Copyright 2026 RAJHAVEL V S)
"""

# Upload README
print("Uploading Model Card README.md...")
api.upload_file(
    path_or_fileobj=MODEL_CARD.encode("utf-8"),
    path_in_repo="README.md",
    repo_id=REPO_ID,
    repo_type="model"
)
print("✓ Model Card uploaded successfully.")

# Upload Checkpoints
checkpoints_dir = Path("results/checkpoints")
for ckpt_file in sorted(checkpoints_dir.glob("*")):
    if ckpt_file.is_file():
        rel_path = f"checkpoints/{ckpt_file.name}"
        print(f"Uploading {ckpt_file.name} ({ckpt_file.stat().st_size / 1024 / 1024:.2f} MB)...")
        api.upload_file(
            path_or_fileobj=str(ckpt_file),
            path_in_repo=rel_path,
            repo_id=REPO_ID,
            repo_type="model"
        )
        print(f"✓ Uploaded {rel_path}")

# Upload Plots
plots_dir = Path("results/plots")
for plot_file in sorted(plots_dir.glob("*.png")):
    if plot_file.is_file():
        rel_path = f"plots/{plot_file.name}"
        print(f"Uploading {plot_file.name}...")
        api.upload_file(
            path_or_fileobj=str(plot_file),
            path_in_repo=rel_path,
            repo_id=REPO_ID,
            repo_type="model"
        )
        print(f"✓ Uploaded {rel_path}")

print("\n🎉 ALL CHECKPOINTS, PLOTS, AND MODEL CARD SUCCESSFULLY UPLOADED TO HUGGING FACE!")
print(f"View live repository: https://huggingface.co/{REPO_ID}")
