"""
Modular Graph Neural Network (GNN) Architectures for Molecular Property Prediction.
Includes GCN, GAT, GIN, and MPNN (NNConv) with dual global pooling and residual connections.
"""
from typing import Optional, List, Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import (
    GCNConv,
    GATConv,
    GINConv,
    NNConv,
    global_mean_pool,
    global_add_pool
)


class BaseGNN(nn.Module):
    """
    Base class for molecular GNNs.
    Implements multi-layer messaging, batch norm, residual connections,
    dual pooling ([mean_pool || add_pool]), and task prediction head.
    """
    def __init__(
        self,
        in_channels: int,
        hidden_dim: int = 64,
        num_layers: int = 3,
        num_tasks: int = 1,
        dropout: float = 0.2,
        residual: bool = True
    ):
        super().__init__()
        self.in_channels = in_channels
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.num_tasks = num_tasks
        self.dropout_rate = dropout
        self.residual = residual

        self.convs = nn.ModuleList()
        self.bns = nn.ModuleList()

        # Dual pooling produces 2 * hidden_dim features
        self.head = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, num_tasks)
        )

    def forward(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: Optional[torch.Tensor] = None,
        batch: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """Forward pass through GNN backbone, dual pooling, and task head."""
        h = self.get_node_representations(x, edge_index, edge_attr)

        if batch is None:
            batch = torch.zeros(h.size(0), dtype=torch.long, device=h.device)

        # Dual pooling: concatenation of mean and sum pooling
        mean_p = global_mean_pool(h, batch)
        sum_p = global_add_pool(h, batch)
        pooled = torch.cat([mean_p, sum_p], dim=1)

        return self.head(pooled)

    def get_embedding(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: Optional[torch.Tensor] = None,
        batch: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """Extract graph-level latent representations (used for t-SNE / analysis)."""
        h = self.get_node_representations(x, edge_index, edge_attr)
        if batch is None:
            batch = torch.zeros(h.size(0), dtype=torch.long, device=h.device)

        mean_p = global_mean_pool(h, batch)
        sum_p = global_add_pool(h, batch)
        return torch.cat([mean_p, sum_p], dim=1)

    def get_node_representations(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """Subclasses implement convolution message passing over nodes."""
        raise NotImplementedError


class GCN(BaseGNN):
    """Graph Convolutional Network (Kipf & Welling)."""
    def __init__(
        self,
        in_channels: int,
        hidden_dim: int = 64,
        num_layers: int = 3,
        num_tasks: int = 1,
        dropout: float = 0.2,
        residual: bool = True,
        **kwargs
    ):
        super().__init__(in_channels, hidden_dim, num_layers, num_tasks, dropout, residual)
        for i in range(num_layers):
            dim_in = in_channels if i == 0 else hidden_dim
            self.convs.append(GCNConv(dim_in, hidden_dim))
            self.bns.append(nn.BatchNorm1d(hidden_dim))

    def get_node_representations(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        h = x
        for i in range(self.num_layers):
            h_new = self.convs[i](h, edge_index)
            h_new = self.bns[i](h_new)
            h_new = F.relu(h_new)
            h_new = F.dropout(h_new, p=self.dropout_rate, training=self.training)
            if self.residual and h.shape == h_new.shape:
                h = h + h_new
            else:
                h = h_new
        return h


class GAT(BaseGNN):
    """Graph Attention Network with Multi-Head Attention (Veličković et al.)."""
    def __init__(
        self,
        in_channels: int,
        hidden_dim: int = 64,
        num_layers: int = 3,
        num_tasks: int = 1,
        dropout: float = 0.2,
        residual: bool = True,
        heads: int = 4,
        **kwargs
    ):
        super().__init__(in_channels, hidden_dim, num_layers, num_tasks, dropout, residual)
        self.heads = heads
        assert hidden_dim % heads == 0, f"hidden_dim ({hidden_dim}) must be divisible by heads ({heads})"
        head_dim = hidden_dim // heads

        for i in range(num_layers):
            dim_in = in_channels if i == 0 else hidden_dim
            self.convs.append(GATConv(dim_in, head_dim, heads=heads, concat=True, dropout=dropout))
            self.bns.append(nn.BatchNorm1d(hidden_dim))

    def get_node_representations(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        h = x
        for i in range(self.num_layers):
            h_new = self.convs[i](h, edge_index)
            h_new = self.bns[i](h_new)
            h_new = F.elu(h_new)
            h_new = F.dropout(h_new, p=self.dropout_rate, training=self.training)
            if self.residual and h.shape == h_new.shape:
                h = h + h_new
            else:
                h = h_new
        return h


class GIN(BaseGNN):
    """Graph Isomorphism Network with MLP aggregators (Xu et al.)."""
    def __init__(
        self,
        in_channels: int,
        hidden_dim: int = 64,
        num_layers: int = 3,
        num_tasks: int = 1,
        dropout: float = 0.2,
        residual: bool = True,
        train_eps: bool = True,
        **kwargs
    ):
        super().__init__(in_channels, hidden_dim, num_layers, num_tasks, dropout, residual)
        for i in range(num_layers):
            dim_in = in_channels if i == 0 else hidden_dim
            mlp = nn.Sequential(
                nn.Linear(dim_in, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Linear(hidden_dim, hidden_dim)
            )
            self.convs.append(GINConv(mlp, train_eps=train_eps))
            self.bns.append(nn.BatchNorm1d(hidden_dim))

    def get_node_representations(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        h = x
        for i in range(self.num_layers):
            h_new = self.convs[i](h, edge_index)
            h_new = self.bns[i](h_new)
            h_new = F.relu(h_new)
            h_new = F.dropout(h_new, p=self.dropout_rate, training=self.training)
            if self.residual and h.shape == h_new.shape:
                h = h + h_new
            else:
                h = h_new
        return h


class MPNN(BaseGNN):
    """
    Message Passing Neural Network using Edge Attributes (Gilmer et al.).
    Utilizes NNConv where message passing weights are conditioned on edge features.
    """
    def __init__(
        self,
        in_channels: int,
        edge_dim: int,
        hidden_dim: int = 64,
        num_layers: int = 3,
        num_tasks: int = 1,
        dropout: float = 0.2,
        residual: bool = True,
        **kwargs
    ):
        super().__init__(in_channels, hidden_dim, num_layers, num_tasks, dropout, residual)
        self.edge_dim = edge_dim
        self.edge_nns = nn.ModuleList()

        for i in range(num_layers):
            dim_in = in_channels if i == 0 else hidden_dim
            edge_nn = nn.Sequential(
                nn.Linear(edge_dim, 32),
                nn.ReLU(),
                nn.Linear(32, dim_in * hidden_dim)
            )
            self.edge_nns.append(edge_nn)
            self.convs.append(NNConv(dim_in, hidden_dim, edge_nn, aggr='mean'))
            self.bns.append(nn.BatchNorm1d(hidden_dim))

    def get_node_representations(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        # Fallback for empty edges or missing edge attributes
        if edge_attr is None or edge_attr.size(0) == 0:
            edge_attr = torch.zeros((edge_index.size(1), self.edge_dim), dtype=torch.float, device=x.device)

        h = x
        for i in range(self.num_layers):
            h_new = self.convs[i](h, edge_index, edge_attr)
            h_new = self.bns[i](h_new)
            h_new = F.relu(h_new)
            h_new = F.dropout(h_new, p=self.dropout_rate, training=self.training)
            if self.residual and h.shape == h_new.shape:
                h = h + h_new
            else:
                h = h_new
        return h


def build_gnn_model(
    model_name: str,
    in_channels: int,
    edge_dim: int = 10,
    num_tasks: int = 1,
    hidden_dim: int = 64,
    num_layers: int = 3,
    dropout: float = 0.2,
    residual: bool = True,
    **kwargs
) -> BaseGNN:
    """Factory function for creating GNN models."""
    name = model_name.lower()
    if name == 'gcn':
        return GCN(in_channels, hidden_dim, num_layers, num_tasks, dropout, residual, **kwargs)
    elif name == 'gat':
        return GAT(in_channels, hidden_dim, num_layers, num_tasks, dropout, residual, **kwargs)
    elif name == 'gin':
        return GIN(in_channels, hidden_dim, num_layers, num_tasks, dropout, residual, **kwargs)
    elif name == 'mpnn':
        return MPNN(in_channels, edge_dim, hidden_dim, num_layers, num_tasks, dropout, residual, **kwargs)
    else:
        raise ValueError(f"Unknown GNN architecture '{model_name}'. Choose from: gcn, gat, gin, mpnn")
