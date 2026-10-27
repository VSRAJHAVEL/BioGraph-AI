"""
Training and Validation Pipeline for GNNs and Classical Baselines.
Includes CPU thread limits, masked loss, early stopping, LR scheduling,
metrics computation, and multi-seed benchmarking.
"""
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
import json
import random
import logging
import argparse
from typing import Dict, List, Tuple, Any, Optional

import yaml
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torch_geometric.loader import DataLoader
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, roc_auc_score, average_precision_score

from src.data import get_dataloaders, NODE_DIM, EDGE_DIM
from src.models.gnn import build_gnn_model, BaseGNN
from src.models.baseline import ClassicalFingerprintBaseline

# Enforce 4 CPU threads matching hardware physical cores
torch.set_num_threads(4)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def set_seed(seed: int = 42):
    """Set random seed for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def compute_loss(preds: torch.Tensor, targets: torch.Tensor, task_type: str) -> torch.Tensor:
    """Compute task loss with NaN masking for missing multi-task targets."""
    mask = ~torch.isnan(targets)
    if mask.sum() == 0:
        return torch.tensor(0.0, requires_grad=True, device=preds.device)

    if task_type == 'regression':
        return F.mse_loss(preds[mask], targets[mask])
    else:
        # Binary or multi-task classification
        return F.binary_cross_entropy_with_logits(preds[mask], targets[mask])


def evaluate_gnn(
    model: nn.Module,
    loader: DataLoader,
    task_type: str,
    device: torch.device
) -> Tuple[Dict[str, float], np.ndarray, np.ndarray]:
    """
    Evaluate GNN model on a DataLoader.
    Returns:
        metrics: dictionary of evaluation metrics
        all_preds: numpy array of predictions
        all_targets: numpy array of targets
    """
    model.eval()
    preds_list = []
    targets_list = []

    with torch.no_grad():
        for batch in loader:
            batch = batch.to(device)
            out = model(batch.x, batch.edge_index, edge_attr=batch.edge_attr, batch=batch.batch)
            if task_type != 'regression':
                out = torch.sigmoid(out)
            preds_list.append(out.cpu().numpy())
            targets_list.append(batch.y.cpu().numpy())

    preds = np.concatenate(preds_list, axis=0) if preds_list else np.empty((0, 1))
    targets = np.concatenate(targets_list, axis=0) if targets_list else np.empty((0, 1))

    num_tasks = targets.shape[1] if targets.ndim > 1 else 1
    metrics: Dict[str, float] = {}

    if task_type == 'regression':
        rmse_list, mae_list, r2_list = [], [], []
        for t in range(num_tasks):
            yt = targets[:, t]
            yp = preds[:, t]
            mask = ~np.isnan(yt)
            if np.sum(mask) > 1:
                rmse_list.append(np.sqrt(mean_squared_error(yt[mask], yp[mask])))
                mae_list.append(mean_absolute_error(yt[mask], yp[mask]))
                r2_list.append(r2_score(yt[mask], yp[mask]))

        metrics['rmse'] = float(np.mean(rmse_list)) if rmse_list else 0.0
        metrics['mae'] = float(np.mean(mae_list)) if mae_list else 0.0
        metrics['r2'] = float(np.mean(r2_list)) if r2_list else 0.0
    else:
        roc_list, pr_list = [], []
        for t in range(num_tasks):
            yt = targets[:, t]
            yp = preds[:, t]
            mask = ~np.isnan(yt)
            if len(np.unique(yt[mask])) > 1:
                roc_list.append(roc_auc_score(yt[mask], yp[mask]))
                pr_list.append(average_precision_score(yt[mask], yp[mask]))

        metrics['roc_auc'] = float(np.mean(roc_list)) if roc_list else 0.5
        metrics['pr_auc'] = float(np.mean(pr_list)) if pr_list else 0.0

    return metrics, preds, targets


def train_single_seed(
    model_name: str,
    config: Dict[str, Any],
    seed: int = 42,
    quick: bool = False,
    override_epochs: Optional[int] = None,
    save_dir: str = 'results/checkpoints'
) -> Dict[str, Any]:
    """Train a single model architecture on a specific random seed."""
    set_seed(seed)
    device = torch.device('cpu')
    os.makedirs(save_dir, exist_ok=True)
    os.makedirs('results/history', exist_ok=True)

    dataset_name = config['dataset']
    task_type = config['task_type']
    num_tasks = config['num_tasks']
    primary_metric = config['metric']
    higher_is_better = config.get('higher_is_better', False)

    train_cfg = config.get('training', {})
    model_cfg = config.get('model', {})

    batch_size = train_cfg.get('batch_size', 32)
    max_epochs = override_epochs or (2 if quick else train_cfg.get('epochs', 50))
    lr = train_cfg.get('lr', 0.001)
    weight_decay = train_cfg.get('weight_decay', 1e-4)
    patience = train_cfg.get('patience', 15)
    grad_clip = train_cfg.get('grad_clip', 1.0)

    # 1. Classical Baseline Branch
    if model_name.lower() == 'baseline':
        logger.info(f"Training Classical Baseline (Random Forest) on {dataset_name.upper()} (Seed={seed})...")
        _, _, _, meta = get_dataloaders(dataset_name, batch_size=batch_size, quick=quick)
        baseline = ClassicalFingerprintBaseline(
            task_type=task_type,
            num_tasks=num_tasks,
            n_estimators=20 if quick else 100,
            random_state=seed
        )
        t0 = time.time()
        baseline.fit(meta['train'])
        train_time = time.time() - t0

        val_metrics = baseline.evaluate(meta['val'])
        test_metrics = baseline.evaluate(meta['test'])

        ckpt_path = os.path.join(save_dir, f"{dataset_name}_baseline_best.pkl")
        baseline.save(ckpt_path)

        result = {
            'model_name': 'baseline',
            'dataset_name': dataset_name,
            'seed': seed,
            'train_time': train_time,
            'val_metrics': val_metrics,
            'test_metrics': test_metrics,
            'checkpoint_path': ckpt_path
        }
        return result

    # 2. GNN Training Branch
    train_loader, val_loader, test_loader, meta = get_dataloaders(dataset_name, batch_size=batch_size, quick=quick)

    model = build_gnn_model(
        model_name=model_name,
        in_channels=NODE_DIM,
        edge_dim=EDGE_DIM,
        num_tasks=num_tasks,
        hidden_dim=model_cfg.get('hidden_dim', 64),
        num_layers=model_cfg.get('num_layers', 3),
        dropout=model_cfg.get('dropout', 0.2),
        residual=model_cfg.get('residual', True)
    ).to(device)

    optimizer = Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = ReduceLROnPlateau(
        optimizer,
        mode='max' if higher_is_better else 'min',
        factor=train_cfg.get('lr_factor', 0.5),
        patience=train_cfg.get('lr_patience', 5),
        min_lr=1e-5
    )

    best_val_score = -float('inf') if higher_is_better else float('inf')
    best_epoch = 0
    patience_counter = 0
    best_model_state = None
    history = {'train_loss': [], 'val_metric': [], 'epoch_times': []}

    t0 = time.time()
    for epoch in range(1, max_epochs + 1):
        ep_t0 = time.time()
        model.train()
        total_loss = 0.0
        num_batches = 0

        for batch in train_loader:
            batch = batch.to(device)
            optimizer.zero_grad()
            out = model(batch.x, batch.edge_index, edge_attr=batch.edge_attr, batch=batch.batch)
            loss = compute_loss(out, batch.y, task_type)
            loss.backward()

            if grad_clip > 0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=grad_clip)

            optimizer.step()
            total_loss += loss.item()
            num_batches += 1

        avg_loss = total_loss / max(num_batches, 1)
        val_metrics, _, _ = evaluate_gnn(model, val_loader, task_type, device)
        val_score = val_metrics[primary_metric]

        scheduler.step(val_score)
        ep_time = time.time() - ep_t0

        history['train_loss'].append(avg_loss)
        history['val_metric'].append(val_score)
        history['epoch_times'].append(ep_time)

        # Check improvement
        is_improved = (val_score > best_val_score) if higher_is_better else (val_score < best_val_score)
        if is_improved:
            best_val_score = val_score
            best_epoch = epoch
            patience_counter = 0
            best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
        else:
            patience_counter += 1

        if epoch % 5 == 0 or epoch == 1 or epoch == max_epochs:
            logger.info(f"[{model_name.upper()}|Epoch {epoch:02d}/{max_epochs:02d}] Loss: {avg_loss:.4f} | Val {primary_metric.upper()}: {val_score:.4f} (Best: {best_val_score:.4f}) | Time: {ep_time:.2f}s")

        if patience_counter >= patience and not quick:
            logger.info(f"Early stopping triggered at epoch {epoch}. Best epoch was {best_epoch}.")
            break

    total_train_time = time.time() - t0

    # Load best model for test evaluation
    if best_model_state is not None:
        model.load_state_dict(best_model_state)

    val_metrics, _, _ = evaluate_gnn(model, val_loader, task_type, device)
    test_metrics, _, _ = evaluate_gnn(model, test_loader, task_type, device)

    # Save checkpoint
    best_ckpt_path = os.path.join(save_dir, f"{dataset_name}_{model_name.lower()}_best.pt")
    ckpt_payload = {
        'model_name': model_name.lower(),
        'dataset_name': dataset_name,
        'model_state_dict': model.state_dict(),
        'config': config,
        'val_metrics': val_metrics,
        'test_metrics': test_metrics,
        'node_dim': NODE_DIM,
        'edge_dim': EDGE_DIM,
        'num_tasks': num_tasks,
        'model_kwargs': {
            'in_channels': NODE_DIM,
            'edge_dim': EDGE_DIM,
            'num_tasks': num_tasks,
            'hidden_dim': model_cfg.get('hidden_dim', 64),
            'num_layers': model_cfg.get('num_layers', 3),
            'dropout': model_cfg.get('dropout', 0.2),
            'residual': model_cfg.get('residual', True)
        }
    }
    torch.save(ckpt_payload, best_ckpt_path)
    logger.info(f"Saved best checkpoint to {best_ckpt_path} (Test {primary_metric.upper()}: {test_metrics[primary_metric]:.4f})")

    # Save history
    history_path = f"results/history/{dataset_name}_{model_name.lower()}_history.json"
    with open(history_path, 'w') as f:
        json.dump(history, f)

    return {
        'model_name': model_name.lower(),
        'dataset_name': dataset_name,
        'seed': seed,
        'train_time': total_train_time,
        'best_epoch': best_epoch,
        'val_metrics': val_metrics,
        'test_metrics': test_metrics,
        'checkpoint_path': best_ckpt_path
    }


def train_dataset(
    dataset_name: str,
    models: List[str],
    config_path: Optional[str] = None,
    seeds: Optional[List[int]] = None,
    quick: bool = False,
    override_epochs: Optional[int] = None
) -> Dict[str, Any]:
    """Train multiple models on a given dataset across seeds, aggregating mean and std."""
    if config_path is None:
        config_path = f"configs/{dataset_name.lower()}.yaml"

    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    active_seeds = seeds or ([42] if quick else config.get('training', {}).get('seeds', [42, 123, 999]))
    results_summary: Dict[str, Any] = {}

    for model_name in models:
        seed_results = []
        for seed in active_seeds:
            logger.info(f"\n==================================================")
            logger.info(f"Training {model_name.upper()} on {dataset_name.upper()} | Seed {seed}")
            logger.info(f"==================================================")
            res = train_single_seed(
                model_name=model_name,
                config=config,
                seed=seed,
                quick=quick,
                override_epochs=override_epochs
            )
            seed_results.append(res)

        # Aggregate metrics across seeds
        metric_keys = seed_results[0]['test_metrics'].keys()
        agg_metrics = {}
        for k in metric_keys:
            vals = [r['test_metrics'][k] for r in seed_results]
            agg_metrics[k] = {
                'mean': float(np.mean(vals)),
                'std': float(np.std(vals)),
                'values': vals
            }

        avg_time = float(np.mean([r['train_time'] for r in seed_results]))

        results_summary[model_name] = {
            'aggregated_test_metrics': agg_metrics,
            'mean_train_time_sec': avg_time,
            'runs': seed_results
        }

    return results_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train GNNs and Baselines for Molecular Property Prediction")
    parser.add_argument("--config", type=str, default=None, help="Path to YAML configuration")
    parser.add_argument("--dataset", type=str, default="esol", help="Dataset name: esol, bbbp, tox21")
    parser.add_argument("--model", type=str, default="all", help="Model name: baseline, gcn, gat, gin, mpnn, or all")
    parser.add_argument("--quick", action="store_true", help="Run rapid smoke test (trimmed dataset, 2 epochs)")
    parser.add_argument("--epochs", type=int, default=None, help="Override number of training epochs")
    parser.add_argument("--seeds", type=int, nargs="+", default=None, help="Override seeds, e.g., --seeds 42")

    args = parser.parse_args()

    cfg_path = args.config if args.config is not None else f"configs/{args.dataset.lower()}.yaml"
    all_models = ['baseline', 'gcn', 'gat', 'gin', 'mpnn']
    models_to_train = all_models if args.model.lower() == 'all' else [args.model.lower()]

    summary = train_dataset(
        dataset_name=args.dataset,
        models=models_to_train,
        config_path=cfg_path,
        seeds=args.seeds,
        quick=args.quick,
        override_epochs=args.epochs
    )

    print("\n" + "="*50)
    print(f"BENCHMARK SUMMARY FOR {args.dataset.upper()}")
    print("="*50)
    for m, d in summary.items():
        metrics_str = ", ".join([f"{k.upper()}: {v['mean']:.4f} ± {v['std']:.4f}" for k, v in d['aggregated_test_metrics'].items()])
        print(f"{m.upper():<10} | {metrics_str} | Avg Time: {d['mean_train_time_sec']:.1f}s")
