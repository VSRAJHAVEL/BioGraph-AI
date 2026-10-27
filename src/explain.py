"""
Model Explainability Suite using GNNExplainer and RDKit 2D Substructure Rendering.
Supports both single-task and multi-task models, with edge-aware and non-edge GNNs.
"""
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import logging
import argparse
from typing import Dict, List, Optional, Tuple, Any, Union

import numpy as np
import torch
import torch.nn as nn
from torch_geometric.explain import Explainer, GNNExplainer, ModelConfig
from rdkit import Chem
from rdkit.Chem.Draw import rdMolDraw2D
import matplotlib.pyplot as plt

from src.data import smiles_to_graph
from src.models.gnn import build_gnn_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class TaskSpecificWrapper(nn.Module):
    """Wraps a multi-task GNN to isolate a single task output for GNNExplainer."""
    def __init__(self, base_model: nn.Module, task_idx: int = 0):
        super().__init__()
        self.base_model = base_model
        self.task_idx = task_idx

    def forward(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: Optional[torch.Tensor] = None,
        batch: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        out = self.base_model(x, edge_index, edge_attr=edge_attr, batch=batch)
        if out.ndim == 1:
            return out.view(-1, 1)
        return out[:, self.task_idx:self.task_idx + 1]


def explain_molecule(
    model: nn.Module,
    smiles: str,
    task_type: str = 'regression',
    task_idx: int = 0,
    num_tasks: int = 1,
    num_epochs: int = 50,
    device: str = 'cpu'
) -> Tuple[np.ndarray, np.ndarray, float]:
    """
    Explain a molecular graph prediction using GNNExplainer.
    Returns:
        atom_importances: np.ndarray of shape (num_atoms,)
        edge_importances: np.ndarray of shape (num_edges,)
        pred_value: float scalar prediction
    """
    model.eval()
    graph = smiles_to_graph(smiles)
    if graph is None:
        raise ValueError(f"Invalid SMILES string: '{smiles}'")

    graph = graph.to(device)

    # Determine prediction
    with torch.no_grad():
        raw_pred = model(graph.x, graph.edge_index, edge_attr=graph.edge_attr)
        if task_type != 'regression':
            raw_pred = torch.sigmoid(raw_pred)
        pred_scalar = float(raw_pred[0, task_idx].item()) if raw_pred.ndim > 1 else float(raw_pred[0].item())

    # Wrap model if multi-task
    if num_tasks > 1:
        wrapped_model = TaskSpecificWrapper(model, task_idx=task_idx)
    else:
        wrapped_model = model

    mode = 'regression' if task_type == 'regression' else 'binary_classification'
    explainer = Explainer(
        model=wrapped_model,
        algorithm=GNNExplainer(epochs=num_epochs),
        explanation_type='model',
        node_mask_type='attributes',
        edge_mask_type='object' if graph.edge_index.size(1) > 0 else None,
        model_config=ModelConfig(
            mode=mode,
            task_level='graph',
            return_type='raw'
        )
    )

    explanation = explainer(
        x=graph.x,
        edge_index=graph.edge_index,
        edge_attr=graph.edge_attr
    )

    # Atom importance: sum across feature attributes
    if explanation.node_mask is not None:
        atom_scores = explanation.node_mask.sum(dim=-1).detach().cpu().numpy()
    else:
        atom_scores = np.ones(graph.num_nodes, dtype=np.float32)

    # Edge importance
    if explanation.edge_mask is not None and graph.edge_index.size(1) > 0:
        edge_scores = explanation.edge_mask.detach().cpu().numpy()
    else:
        edge_scores = np.zeros(graph.edge_index.size(1), dtype=np.float32)

    return atom_scores, edge_scores, pred_scalar


def render_molecule_explanation(
    smiles: str,
    atom_importances: np.ndarray,
    width: int = 500,
    height: int = 400,
    colormap_name: str = 'Reds',
    output_path: Optional[str] = None
) -> bytes:
    """
    Render 2D molecular structure with atom-level importance heatmaps.
    Outputs high-resolution PNG bytes and optionally saves to disk.
    """
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid SMILES string '{smiles}'")

    num_atoms = mol.GetNumAtoms()
    if len(atom_importances) != num_atoms:
        atom_scores = np.resize(atom_importances, num_atoms)
    else:
        atom_scores = np.array(atom_importances, dtype=np.float32)

    # Normalize scores between 0.15 and 0.95 for clear visual contrast
    min_s = float(atom_scores.min())
    max_s = float(atom_scores.max())
    range_s = max_s - min_s if max_s > min_s else 1.0
    norm_scores = 0.15 + 0.8 * ((atom_scores - min_s) / range_s)

    cmap = plt.colormaps[colormap_name]
    atom_colors = {}
    radii = {}

    for i in range(num_atoms):
        rgba = cmap(float(norm_scores[i]))
        atom_colors[i] = (float(rgba[0]), float(rgba[1]), float(rgba[2]))
        radii[i] = 0.35 + 0.25 * float(norm_scores[i])

    drawer = rdMolDraw2D.MolDraw2DCairo(width, height)
    draw_options = drawer.drawOptions()
    draw_options.useBWAtomPalette()
    draw_options.scaleBondWidth = True
    draw_options.bondLineWidth = 2

    drawer.DrawMolecule(
        mol,
        highlightAtoms=list(atom_colors.keys()),
        highlightAtomColors=atom_colors,
        highlightAtomRadii=radii
    )
    drawer.FinishDrawing()
    png_bytes = drawer.GetDrawingText()

    if output_path is not None:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(png_bytes)
        logger.info(f"Saved explanation rendering -> {output_path}")

    return png_bytes


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Explain GNN molecular property prediction")
    parser.add_argument("--smiles", type=str, default="CC(=O)OC1=CC=CC=C1C(=O)O", help="SMILES to explain")
    parser.add_argument("--model", type=str, default="gcn", help="Model name (gcn, gat, gin, mpnn)")
    parser.add_argument("--dataset", type=str, default="esol", help="Dataset name (esol, bbbp, tox21)")
    parser.add_argument("--task_idx", type=int, default=0, help="Task index to explain (0-11 for Tox21)")
    parser.add_argument("--output", type=str, default="results/plots/explanation_demo.png", help="Output PNG path")
    args = parser.parse_args()

    from src.evaluate import load_trained_model
    model, payload = load_trained_model(args.model, args.dataset)
    num_tasks = payload['num_tasks'] if payload else 1
    task_type = 'regression' if args.dataset == 'esol' else ('multitask_classification' if args.dataset == 'tox21' else 'classification')

    atom_imp, edge_imp, pred = explain_molecule(
        model=model,
        smiles=args.smiles,
        task_type=task_type,
        task_idx=args.task_idx,
        num_tasks=num_tasks,
        num_epochs=30
    )

    print(f"Prediction for {args.smiles}: {pred:.4f}")
    print(f"Top 3 important atom indices: {np.argsort(atom_imp)[-3:][::-1]}")
    render_molecule_explanation(args.smiles, atom_imp, output_path=args.output)
