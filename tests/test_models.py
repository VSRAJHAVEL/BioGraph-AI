"""
Milestone 4 Unit Tests: GNN Architectures (GCN, GAT, GIN, MPNN).
"""
import pytest
import torch
from src.data import NODE_DIM, EDGE_DIM, smiles_to_graph
from src.models.gnn import build_gnn_model


@pytest.mark.parametrize("model_name", ["gcn", "gat", "gin", "mpnn"])
def test_single_graph_forward(model_name):
    """Test forward pass on a single unbatched molecule graph (GNNExplainer style)."""
    model = build_gnn_model(model_name, in_channels=NODE_DIM, edge_dim=EDGE_DIM, num_tasks=1, hidden_dim=64, num_layers=2)
    model.eval()

    graph = smiles_to_graph("CC(=O)OC1=CC=CC=C1C(=O)O")
    with torch.no_grad():
        out = model(graph.x, graph.edge_index, edge_attr=graph.edge_attr, batch=None)

    assert out.shape == (1, 1)


@pytest.mark.parametrize("model_name", ["gcn", "gat", "gin", "mpnn"])
def test_batched_forward_and_backward(model_name):
    """Test batched forward and backward gradients across all architectures."""
    model = build_gnn_model(model_name, in_channels=NODE_DIM, edge_dim=EDGE_DIM, num_tasks=1, hidden_dim=64, num_layers=3)
    model.train()

    # Create dummy batch of 2 graphs
    g1 = smiles_to_graph("c1ccccc1")
    g2 = smiles_to_graph("CC(=O)O")

    from torch_geometric.data import Batch
    batch = Batch.from_data_list([g1, g2])

    out = model(batch.x, batch.edge_index, edge_attr=batch.edge_attr, batch=batch.batch)
    assert out.shape == (2, 1)

    loss = out.sum()
    loss.backward()

    # Check that parameters have gradients
    for name, p in model.named_parameters():
        if p.requires_grad:
            assert p.grad is not None, f"Gradient missing for parameter {name}"


@pytest.mark.parametrize("model_name", ["gcn", "gat", "gin", "mpnn"])
def test_multitask_and_embeddings(model_name):
    """Test 12-task multi-output head and latent embedding extraction."""
    model = build_gnn_model(model_name, in_channels=NODE_DIM, edge_dim=EDGE_DIM, num_tasks=12, hidden_dim=64, num_layers=2)
    model.eval()

    graph = smiles_to_graph("CCO")
    with torch.no_grad():
        out = model(graph.x, graph.edge_index, edge_attr=graph.edge_attr)
        emb = model.get_embedding(graph.x, graph.edge_index, edge_attr=graph.edge_attr)

    assert out.shape == (1, 12)
    # Dual pooling gives 2 * hidden_dim
    assert emb.shape == (1, 128)
