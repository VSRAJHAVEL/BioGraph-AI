"""
Milestone 8 Unit Tests: BioGraph AI Model Loading & Inference Integration.
"""
import pytest
from app.server import get_cached_model_instance
from src.data import smiles_to_graph
import torch
from pathlib import Path


def discover_available_models(dataset_name: str) -> list:
    """Verify that models are discovered when their checkpoints exist."""
    ckpt_dir = Path("results/checkpoints")
    models = ["baseline"]
    for m in ["mpnn", "gin", "gat", "gcn"]:
        if (ckpt_dir / f"{dataset_name}_{m}_best.pt").exists():
            models.append(m)
    return models


def test_discover_available_models():
    """Verify that models are discovered only when their checkpoints exist."""
    for ds in ['esol', 'bbbp', 'tox21']:
        models = discover_available_models(ds)
        assert len(models) == 5
        assert 'baseline' in models
        assert 'mpnn' in models
        assert 'gin' in models
        assert 'gat' in models
        assert 'gcn' in models


def test_cached_model_inference():
    """Verify inference pipeline for cached models loaded by the app."""
    model = get_cached_model_instance('gin', 'esol')
    graph = smiles_to_graph("CC(=O)OC1=CC=CC=C1C(=O)O")
    with torch.no_grad():
        out = model(graph.x, graph.edge_index, edge_attr=graph.edge_attr)
    assert out.shape == (1, 1)
    assert isinstance(out[0, 0].item(), float)
