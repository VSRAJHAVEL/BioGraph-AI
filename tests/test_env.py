"""
Milestone 1 Smoke Test: Environment and Library Compatibility Verification.
Tests CPU-only PyTorch, PyG pure operations, RDKit, and Scikit-learn.
"""
import pytest
import torch
import torch_geometric
from torch_geometric.data import Data, Batch
from torch_geometric.nn import GCNConv, GATConv, GINConv, NNConv, global_mean_pool, global_add_pool
import rdkit
from rdkit import Chem
from rdkit.Chem import AllChem
import sklearn
from sklearn.ensemble import RandomForestRegressor


def test_pytorch_cpu():
    """Verify PyTorch runs in CPU mode with appropriate thread limits."""
    assert not torch.cuda.is_available(), "Expected CPU-only environment"
    torch.set_num_threads(4)
    assert torch.get_num_threads() <= 4
    x = torch.randn(10, 10)
    y = x @ x.t()
    assert y.shape == (10, 10)


def test_pyg_pure_ops():
    """Verify PyTorch Geometric executes pure ops without torch-scatter/torch-sparse."""
    # Create a small graph with 4 nodes and 4 edges
    x = torch.randn(4, 16)
    edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 0]], dtype=torch.long)
    edge_attr = torch.randn(4, 8)
    batch = torch.tensor([0, 0, 1, 1], dtype=torch.long)

    # 1. GCNConv
    gcn = GCNConv(16, 32)
    out_gcn = gcn(x, edge_index)
    assert out_gcn.shape == (4, 32)

    # 2. GATConv
    gat = GATConv(16, 16, heads=2)
    out_gat = gat(x, edge_index)
    assert out_gat.shape == (4, 32)

    # 3. GINConv
    mlp = torch.nn.Sequential(torch.nn.Linear(16, 32), torch.nn.ReLU(), torch.nn.Linear(32, 32))
    gin = GINConv(mlp)
    out_gin = gin(x, edge_index)
    assert out_gin.shape == (4, 32)

    # 4. NNConv (used in MPNN with edge attributes)
    edge_nn = torch.nn.Sequential(torch.nn.Linear(8, 16 * 32))
    nn_conv = NNConv(16, 32, edge_nn, aggr='mean')
    out_nn = nn_conv(x, edge_index, edge_attr)
    assert out_nn.shape == (4, 32)

    # 5. Pooling
    mean_pooled = global_mean_pool(out_gcn, batch)
    assert mean_pooled.shape == (2, 32)
    sum_pooled = global_add_pool(out_gcn, batch)
    assert sum_pooled.shape == (2, 32)


def test_rdkit_sanity():
    """Verify RDKit molecule parsing and fingerprinting."""
    smiles = "CC(=O)OC1=CC=CC=C1C(=O)O"  # Aspirin
    mol = Chem.MolFromSmiles(smiles)
    assert mol is not None
    assert mol.GetNumAtoms() == 13

    # Generate Morgan fingerprint
    fp = AllChem.GetMorganFingerprintAsBitVect(mol, 2, nBits=2048)
    assert len(fp) == 2048
    assert sum(fp) > 0


def test_sklearn_baseline():
    """Verify scikit-learn model instantiation and fit."""
    rf = RandomForestRegressor(n_estimators=5, random_state=42)
    X = [[1.0, 2.0], [2.0, 3.0], [3.0, 4.0]]
    y = [1.0, 2.0, 3.0]
    rf.fit(X, y)
    preds = rf.predict([[1.5, 2.5]])
    assert len(preds) == 1


if __name__ == "__main__":
    test_pytorch_cpu()
    test_pyg_pure_ops()
    test_rdkit_sanity()
    test_sklearn_baseline()
    print("✓ All Milestone 1 environment smoke tests passed!")
