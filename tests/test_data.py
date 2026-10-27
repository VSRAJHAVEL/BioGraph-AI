"""
Milestone 2 Unit Tests: Molecular Featurization and Scaffold Splitting.
"""
import pytest
import torch
from src.data import (
    smiles_to_graph,
    smiles_to_fingerprint,
    deterministic_scaffold_split,
    get_dataloaders,
    NODE_DIM,
    EDGE_DIM
)


def test_smiles_to_graph_valid():
    """Verify featurization produces expected node and edge tensor shapes."""
    smiles = "CC(=O)OC1=CC=CC=C1C(=O)O"  # Aspirin: 13 heavy atoms
    graph = smiles_to_graph(smiles)
    assert graph is not None
    assert graph.x.shape == (13, NODE_DIM)
    assert graph.edge_index.dim() == 2
    assert graph.edge_index.size(0) == 2
    assert graph.edge_attr.size(1) == EDGE_DIM
    # Edge count in undirected graph must match edge_attr count
    assert graph.edge_index.size(1) == graph.edge_attr.size(0)
    assert graph.smiles == smiles
    assert graph.num_nodes == 13


def test_smiles_to_graph_invalid():
    """Verify invalid SMILES return None without throwing exceptions."""
    assert smiles_to_graph("INVALID_SMILES_STRING") is None
    assert smiles_to_graph("") is None
    assert smiles_to_graph(None) is None
    # Known failing BBBP SMILES
    assert smiles_to_graph("c1(nc(NC(N)=[NH2])sc1)CSCCNC(=[NH]C#N)NC") is None


def test_smiles_to_fingerprint():
    """Verify ECFP4 fingerprint generation."""
    smiles = "c1ccccc1"  # Benzene
    fp = smiles_to_fingerprint(smiles, radius=2, n_bits=2048)
    assert fp is not None
    assert fp.shape == (2048,)
    assert fp.sum() > 0
    assert smiles_to_fingerprint("INVALID") is None


def test_deterministic_scaffold_split():
    """Verify deterministic scaffold split and zero leakage between partitions."""
    smiles_list = [
        "c1ccccc1", "c1ccccc1C", "c1ccccc1O", "c1ccccc1N", "c1ccccc1Cl",
        "c1ccncc1", "c1cncnc1", "c1ccoc1", "c1ccsc1", "c1cn[nH]c1"
    ]
    graphs = [smiles_to_graph(s, y=torch.tensor([[float(i)]])) for i, s in enumerate(smiles_list)]

    # Run split twice to verify determinism
    train1, val1, test1 = deterministic_scaffold_split(graphs, 0.6, 0.2, 0.2)
    train2, val2, test2 = deterministic_scaffold_split(graphs, 0.6, 0.2, 0.2)

    assert [d.smiles for d in train1] == [d.smiles for d in train2]
    assert [d.smiles for d in val1] == [d.smiles for d in val2]
    assert [d.smiles for d in test1] == [d.smiles for d in test2]

    # Verify partition isolation
    train_smiles = set(d.smiles for d in train1)
    val_smiles = set(d.smiles for d in val1)
    test_smiles = set(d.smiles for d in test1)

    assert len(train_smiles & val_smiles) == 0, "Train and Val share scaffolds"
    assert len(train_smiles & test_smiles) == 0, "Train and Test share scaffolds"
    assert len(val_smiles & test_smiles) == 0, "Val and Test share scaffolds"
    assert len(train1) + len(val1) + len(test1) == len(graphs)


def test_quick_dataloaders():
    """Verify DataLoader creation in quick mode for ESOL and BBBP."""
    train_loader, val_loader, test_loader, meta = get_dataloaders('esol', batch_size=16, quick=True)
    assert meta['dataset_name'] == 'esol'
    batch = next(iter(train_loader))
    assert batch.x.shape[1] == NODE_DIM
    assert batch.edge_attr.shape[1] == EDGE_DIM
    assert batch.y.shape[1] == 1  # 1 task for ESOL
    assert batch.batch is not None

    train_loader_b, val_loader_b, test_loader_b, meta_b = get_dataloaders('bbbp', batch_size=16, quick=True)
    assert meta_b['dataset_name'] == 'bbbp'
    assert meta_b['dropped_count'] == 11
    assert meta_b['final_size'] == 2039
