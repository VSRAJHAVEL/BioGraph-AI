"""
Milestone 7 Unit Tests: Model Explainability with GNNExplainer and Substructure Rendering.
"""
import pytest
import numpy as np
import torch
from src.data import NODE_DIM, EDGE_DIM
from src.models.gnn import build_gnn_model
from src.explain import explain_molecule, render_molecule_explanation


def test_explain_molecule_without_edge_features():
    """Verify GNNExplainer works for models without edge features (GCN)."""
    model = build_gnn_model('gcn', in_channels=NODE_DIM, edge_dim=EDGE_DIM, num_tasks=1, hidden_dim=32, num_layers=2)
    smiles = "CC(=O)OC1=CC=CC=C1C(=O)O"  # Aspirin (13 atoms)

    atom_imp, edge_imp, pred = explain_molecule(
        model=model,
        smiles=smiles,
        task_type='regression',
        num_epochs=15
    )

    assert len(atom_imp) == 13
    assert isinstance(pred, float)
    assert not np.isnan(atom_imp).any()


def test_explain_molecule_with_edge_features():
    """Verify GNNExplainer works for edge-aware models (MPNN)."""
    model = build_gnn_model('mpnn', in_channels=NODE_DIM, edge_dim=EDGE_DIM, num_tasks=1, hidden_dim=32, num_layers=2)
    smiles = "c1ccccc1"  # Benzene (6 atoms)

    atom_imp, edge_imp, pred = explain_molecule(
        model=model,
        smiles=smiles,
        task_type='classification',
        num_epochs=15
    )

    assert len(atom_imp) == 6
    assert isinstance(pred, float)
    assert 0.0 <= pred <= 1.0


def test_explain_multitask_tox21():
    """Verify GNNExplainer works for multi-task Tox21 models selecting specific tasks."""
    model = build_gnn_model('gat', in_channels=NODE_DIM, edge_dim=EDGE_DIM, num_tasks=12, hidden_dim=32, num_layers=2)
    smiles = "CCO"  # Ethanol (3 atoms)

    # Explain task index 5
    atom_imp, edge_imp, pred = explain_molecule(
        model=model,
        smiles=smiles,
        task_type='multitask_classification',
        task_idx=5,
        num_tasks=12,
        num_epochs=15
    )

    assert len(atom_imp) == 3
    assert isinstance(pred, float)
    assert 0.0 <= pred <= 1.0


def test_render_molecule_explanation():
    """Verify RDKit 2D explanation renderer returns valid PNG bytes."""
    smiles = "c1ccccc1O"  # Phenol (7 atoms)
    atom_scores = np.array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.9])
    png_bytes = render_molecule_explanation(smiles, atom_scores, width=300, height=300)

    assert isinstance(png_bytes, bytes)
    assert len(png_bytes) > 1000
    # PNG signature check: \x89PNG\r\n\x1a\n
    assert png_bytes[:4] == b'\x89PNG'
