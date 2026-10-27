"""
Milestone 5 Unit Tests: Training Pipeline.
"""
import pytest
import torch
import yaml
from src.train import compute_loss, train_single_seed, set_seed


def test_loss_masking():
    """Verify loss computation handles NaNs in multi-task labels correctly."""
    preds = torch.tensor([[0.5, 1.2, -0.8], [0.1, -0.4, 0.9]], requires_grad=True)
    # Target contains NaN in position (0, 1) and (1, 0)
    targets = torch.tensor([[1.0, float('nan'), 0.0], [float('nan'), 0.0, 1.0]])

    loss = compute_loss(preds, targets, task_type='multitask_classification')
    assert not torch.isnan(loss)
    assert loss.item() > 0.0

    loss.backward()
    assert preds.grad is not None
    # Check that NaN target positions had 0 gradient
    assert preds.grad[0, 1] == 0.0
    assert preds.grad[1, 0] == 0.0


def test_quick_train_single_seed():
    """Verify train_single_seed runs end-to-end on quick subset for GCN."""
    with open("configs/esol.yaml", "r") as f:
        config = yaml.safe_load(f)

    res = train_single_seed(
        model_name="gcn",
        config=config,
        seed=42,
        quick=True,
        override_epochs=2,
        save_dir="results/checkpoints"
    )
    assert res['model_name'] == 'gcn'
    assert 'rmse' in res['test_metrics']
    assert res['test_metrics']['rmse'] > 0.0
