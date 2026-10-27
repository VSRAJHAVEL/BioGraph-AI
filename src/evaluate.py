"""
Evaluation and Diagnostics Suite for GNNs and Classical Baselines.
Generates parity plots, ROC/PR curves, loss trajectories, t-SNE latent embeddings,
and compiles results/REPORT.md.
"""
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import json
import logging
from typing import Dict, List, Any, Optional, Tuple

import yaml
import numpy as np
import torch
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.manifold import TSNE
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    roc_curve, precision_recall_curve, roc_auc_score, average_precision_score
)

from src.data import get_dataloaders, NODE_DIM, EDGE_DIM
from src.models.gnn import build_gnn_model
from src.models.baseline import ClassicalFingerprintBaseline, extract_features

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Matplotlib styling for publication quality
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#cccccc'
plt.rcParams['axes.linewidth'] = 0.8


def load_trained_model(
    model_name: str,
    dataset_name: str,
    checkpoint_dir: str = 'results/checkpoints'
) -> Tuple[Any, Optional[Dict[str, Any]]]:
    """Load trained model checkpoint from disk."""
    model_name = model_name.lower()
    dataset_name = dataset_name.lower()

    if model_name == 'baseline':
        ckpt_path = os.path.join(checkpoint_dir, f"{dataset_name}_baseline_best.pkl")
        if not os.path.exists(ckpt_path):
            raise FileNotFoundError(f"Baseline checkpoint not found at {ckpt_path}")
        return ClassicalFingerprintBaseline.load(ckpt_path), None
    else:
        ckpt_path = os.path.join(checkpoint_dir, f"{dataset_name}_{model_name}_best.pt")
        if not os.path.exists(ckpt_path):
            raise FileNotFoundError(f"GNN checkpoint not found at {ckpt_path}")
        payload = torch.load(ckpt_path, weights_only=False)
        kwargs = payload['model_kwargs']
        model = build_gnn_model(model_name=model_name, **kwargs)
        model.load_state_dict(payload['model_state_dict'])
        model.eval()
        return model, payload


def plot_loss_trajectories(dataset_name: str, history_dir: str = 'results/history', save_dir: str = 'results/plots'):
    """Plot training loss curves across GNN architectures."""
    os.makedirs(save_dir, exist_ok=True)
    models = ['gcn', 'gat', 'gin', 'mpnn']
    colors = {'gcn': '#1f77b4', 'gat': '#ff7f0e', 'gin': '#2ca02c', 'mpnn': '#d62728'}

    plt.figure(figsize=(8, 5))
    has_data = False

    for m in models:
        hist_path = os.path.join(history_dir, f"{dataset_name}_{m}_history.json")
        if os.path.exists(hist_path):
            with open(hist_path, 'r') as f:
                hist = json.load(f)
            losses = hist.get('train_loss', [])
            if losses:
                plt.plot(range(1, len(losses) + 1), losses, label=m.upper(), color=colors.get(m, '#333333'), lw=2.0)
                has_data = True

    if has_data:
        plt.xlabel("Epoch", fontsize=11, fontweight='bold')
        plt.ylabel("Training Loss", fontsize=11, fontweight='bold')
        plt.title(f"Training Loss Trajectory on {dataset_name.upper()} (CPU-Optimized)", fontsize=12, fontweight='bold')
        plt.legend(frameon=True)
        plt.tight_layout()
        plot_path = os.path.join(save_dir, f"{dataset_name}_loss_curves.png")
        plt.savefig(plot_path, dpi=300)
        plt.close()
        logger.info(f"Saved loss trajectory plot -> {plot_path}")


def plot_parity(
    dataset_name: str,
    model_name: str = 'mpnn',
    checkpoint_dir: str = 'results/checkpoints',
    save_dir: str = 'results/plots'
):
    """Generate Parity Plot (Predicted vs Actual) for ESOL Regression."""
    os.makedirs(save_dir, exist_ok=True)
    _, _, test_loader, meta = get_dataloaders(dataset_name, batch_size=32)
    test_data = meta['test']

    model, _ = load_trained_model(model_name, dataset_name, checkpoint_dir)

    if model_name == 'baseline':
        preds = model.predict(test_data).flatten()
        _, y_true = extract_features(test_data)
        y_true = y_true.flatten()
    else:
        preds_list, targets_list = [], []
        with torch.no_grad():
            for batch in test_loader:
                out = model(batch.x, batch.edge_index, edge_attr=batch.edge_attr, batch=batch.batch)
                preds_list.append(out.view(-1).numpy())
                targets_list.append(batch.y.view(-1).numpy())
        preds = np.concatenate(preds_list)
        y_true = np.concatenate(targets_list)

    rmse = np.sqrt(mean_squared_error(y_true, preds))
    r2 = r2_score(y_true, preds)

    plt.figure(figsize=(6.5, 6))
    plt.scatter(y_true, preds, alpha=0.7, color='#2b5c8f', edgecolors='k', linewidth=0.5, s=45, label='Test Compounds')

    min_val = min(y_true.min(), preds.min()) - 0.5
    max_val = max(y_true.max(), preds.max()) + 0.5
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', lw=1.8, label='Ideal 1:1 Parity')

    plt.xlim(min_val, max_val)
    plt.ylim(min_val, max_val)
    plt.xlabel("Measured Aqueous Solubility logS (mol/L)", fontsize=11, fontweight='bold')
    plt.ylabel(f"Predicted logS by {model_name.upper()} (mol/L)", fontsize=11, fontweight='bold')
    plt.title(f"ESOL Parity Plot ({model_name.upper()} on Scaffold Test Split)\nRMSE: {rmse:.3f} | R²: {r2:.3f}", fontsize=12, fontweight='bold')
    plt.legend(frameon=True)
    plt.tight_layout()

    plot_path = os.path.join(save_dir, f"{dataset_name}_parity_{model_name}.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    logger.info(f"Saved parity plot -> {plot_path}")


def plot_roc_pr_curves(
    dataset_name: str,
    checkpoint_dir: str = 'results/checkpoints',
    save_dir: str = 'results/plots'
):
    """Generate ROC and PR Curves for BBBP or Tox21 classification."""
    os.makedirs(save_dir, exist_ok=True)
    models = ['baseline', 'gcn', 'gat', 'gin', 'mpnn']
    colors = {'baseline': '#7f7f7f', 'gcn': '#1f77b4', 'gat': '#ff7f0e', 'gin': '#2ca02c', 'mpnn': '#d62728'}

    _, _, test_loader, meta = get_dataloaders(dataset_name, batch_size=32)
    test_data = meta['test']

    fig, (ax_roc, ax_pr) = plt.subplots(1, 2, figsize=(13, 5.5))

    for m in models:
        try:
            model, _ = load_trained_model(m, dataset_name, checkpoint_dir)
        except Exception:
            continue

        if m == 'baseline':
            preds = model.predict(test_data)[:, 0]
            _, y_true = extract_features(test_data)
            y_true = y_true[:, 0]
        else:
            preds_list, targets_list = [], []
            with torch.no_grad():
                for batch in test_loader:
                    out = torch.sigmoid(model(batch.x, batch.edge_index, edge_attr=batch.edge_attr, batch=batch.batch))
                    preds_list.append(out[:, 0].numpy())
                    targets_list.append(batch.y[:, 0].numpy())
            preds = np.concatenate(preds_list)
            y_true = np.concatenate(targets_list)

        mask = ~np.isnan(y_true)
        y_eval = y_true[mask]
        p_eval = preds[mask]

        if len(np.unique(y_eval)) > 1:
            fpr, tpr, _ = roc_curve(y_eval, p_eval)
            roc_auc = roc_auc_score(y_eval, p_eval)
            prec, rec, _ = precision_recall_curve(y_eval, p_eval)
            pr_auc = average_precision_score(y_eval, p_eval)

            c = colors.get(m, '#333333')
            ax_roc.plot(fpr, tpr, label=f"{m.upper()} (AUC = {roc_auc:.3f})", color=c, lw=2.0)
            ax_pr.plot(rec, prec, label=f"{m.upper()} (AUC = {pr_auc:.3f})", color=c, lw=2.0)

    ax_roc.plot([0, 1], [0, 1], 'k--', lw=1.2, label='Random Chance')
    ax_roc.set_xlabel("False Positive Rate", fontsize=11, fontweight='bold')
    ax_roc.set_ylabel("True Positive Rate", fontsize=11, fontweight='bold')
    ax_roc.set_title(f"ROC Curves on {dataset_name.upper()} Test Split", fontsize=12, fontweight='bold')
    ax_roc.legend(loc='lower right', frameon=True)

    ax_pr.set_xlabel("Recall", fontsize=11, fontweight='bold')
    ax_pr.set_ylabel("Precision", fontsize=11, fontweight='bold')
    ax_pr.set_title(f"Precision-Recall Curves on {dataset_name.upper()} Test Split", fontsize=12, fontweight='bold')
    ax_pr.legend(loc='lower left', frameon=True)

    plt.tight_layout()
    plot_path = os.path.join(save_dir, f"{dataset_name}_roc_pr.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    logger.info(f"Saved ROC/PR curves -> {plot_path}")


def plot_tsne_embeddings(
    dataset_name: str,
    model_name: str = 'mpnn',
    checkpoint_dir: str = 'results/checkpoints',
    save_dir: str = 'results/plots'
):
    """Extract latent embeddings and project into 2D with t-SNE."""
    os.makedirs(save_dir, exist_ok=True)
    _, _, test_loader, meta = get_dataloaders(dataset_name, batch_size=32)

    try:
        model, _ = load_trained_model(model_name, dataset_name, checkpoint_dir)
    except Exception as e:
        logger.warning(f"Could not load {model_name} for t-SNE: {e}")
        return

    embeddings_list, targets_list = [], []
    with torch.no_grad():
        for batch in test_loader:
            emb = model.get_embedding(batch.x, batch.edge_index, edge_attr=batch.edge_attr, batch=batch.batch)
            embeddings_list.append(emb.numpy())
            targets_list.append(batch.y[:, 0].numpy())

    embeddings = np.concatenate(embeddings_list, axis=0)
    targets = np.concatenate(targets_list, axis=0)

    # Filter out NaNs if any
    mask = ~np.isnan(targets)
    embeddings = embeddings[mask]
    targets = targets[mask]

    # Run t-SNE
    perplexity = min(30, max(5, len(embeddings) // 4))
    tsne = TSNE(n_components=2, perplexity=perplexity, random_state=42)
    embeddings_2d = tsne.fit_transform(embeddings)

    plt.figure(figsize=(7, 6))
    if dataset_name.lower() == 'esol':
        sc = plt.scatter(embeddings_2d[:, 0], embeddings_2d[:, 1], c=targets, cmap='viridis', s=50, alpha=0.85, edgecolors='k', linewidth=0.3)
        cbar = plt.colorbar(sc)
        cbar.set_label("Solubility logS (mol/L)", fontsize=10, fontweight='bold')
    else:
        # Binary classification
        scatter_0 = plt.scatter(embeddings_2d[targets == 0, 0], embeddings_2d[targets == 0, 1], c='#3b82f6', s=50, alpha=0.8, edgecolors='k', linewidth=0.3, label='Negative (0)')
        scatter_1 = plt.scatter(embeddings_2d[targets == 1, 0], embeddings_2d[targets == 1, 1], c='#ef4444', s=50, alpha=0.8, edgecolors='k', linewidth=0.3, label='Positive (1)')
        plt.legend(frameon=True)

    plt.title(f"t-SNE Latent Space ({model_name.upper()} on {dataset_name.upper()} Test Split)", fontsize=12, fontweight='bold')
    plt.xlabel("t-SNE Dimension 1", fontsize=11, fontweight='bold')
    plt.ylabel("t-SNE Dimension 2", fontsize=11, fontweight='bold')
    plt.tight_layout()

    plot_path = os.path.join(save_dir, f"{dataset_name}_tsne_{model_name}.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    logger.info(f"Saved t-SNE visualization -> {plot_path}")


def generate_benchmark_report(
    benchmark_results: Dict[str, Dict[str, Any]],
    output_path: str = 'results/REPORT.md'
):
    """Compile comprehensive benchmark report across datasets and models."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    lines = [
        "# Benchmark Report: Graph Neural Networks for Molecular Property Prediction",
        "",
        "## Executive Summary",
        "This benchmark evaluates 5 distinct molecular property prediction architectures across 3 canonical MoleculeNet benchmarks using **strict Bemis-Murcko scaffold splitting (80/10/10)**.",
        "All models were trained and benchmarked locally on an Intel CPU with 4 physical threads.",
        "",
        "---",
        "",
        "## Benchmark Results",
        ""
    ]

    for dataset_name, models_dict in benchmark_results.items():
        lines.append(f"### Dataset: `{dataset_name.upper()}`")
        if dataset_name.lower() == 'esol':
            lines.append("| Model Architecture | Test RMSE (mol/L) ↓ | Test MAE (mol/L) ↓ | Test R² ↑ | Train Time (s) |")
            lines.append("| :--- | :--- | :--- | :--- | :--- |")
            for m, data in models_dict.items():
                agg = data['aggregated_test_metrics']
                rmse_str = f"{agg['rmse']['mean']:.3f} ± {agg['rmse']['std']:.3f}"
                mae_str = f"{agg['mae']['mean']:.3f} ± {agg['mae']['std']:.3f}"
                r2_str = f"{agg['r2']['mean']:.3f} ± {agg['r2']['std']:.3f}"
                time_str = f"{data['mean_train_time_sec']:.1f}s"
                lines.append(f"| **{m.upper()}** | {rmse_str} | {mae_str} | {r2_str} | {time_str} |")
        else:
            lines.append("| Model Architecture | Test ROC-AUC ↑ | Test PR-AUC ↑ | Train Time (s) |")
            lines.append("| :--- | :--- | :--- | :--- |")
            for m, data in models_dict.items():
                agg = data['aggregated_test_metrics']
                roc_str = f"{agg['roc_auc']['mean']:.3f} ± {agg['roc_auc']['std']:.3f}"
                pr_str = f"{agg['pr_auc']['mean']:.3f} ± {agg['pr_auc']['std']:.3f}"
                time_str = f"{data['mean_train_time_sec']:.1f}s"
                lines.append(f"| **{m.upper()}** | {roc_str} | {pr_str} | {time_str} |")
        lines.append("")

    lines.extend([
        "---",
        "",
        "## Inductive Biases & Architectural Insights",
        "",
        "1. **Message Passing (MPNN)**: Leverages edge attributes (bond conjugation, ring membership, stereochemistry). Performs exceptionally well on solubility where ring strain and bond conjugation directly dictate crystal lattice energy and water solvation.",
        "2. **Attention Mechanism (GAT)**: Dynamically re-weights atomic neighbor interactions through multi-head self-attention. Especially effective for recognizing functional pharmacophores without rigid topology assumptions.",
        "3. **Graph Isomorphism (GIN)**: Maximally expressive for distinguishing graph topologies via multi-layer perceptron aggregations.",
        "4. **Classical Fingerprint Baseline (Random Forest + ECFP4)**: Strong competitive baseline that serves as a sanity check. While fast, it ignores global 3D topology and continuous atom-bond interactions.",
        "",
        "---",
        "",
        "## Diagnostic Plots",
        "- **Training Trajectories**: `results/plots/{dataset}_loss_curves.png`",
        "- **Parity Plots**: `results/plots/esol_parity_{model}.png`",
        "- **ROC & PR Curves**: `results/plots/{dataset}_roc_pr.png`",
        "- **t-SNE Embeddings**: `results/plots/{dataset}_tsne_{model}.png`"
    ])

    with open(output_path, 'w') as f:
        f.write("\n".join(lines))

    logger.info(f"Report compiled successfully -> {output_path}")
