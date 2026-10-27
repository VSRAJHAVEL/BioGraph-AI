"""
Multi-Model Ensemble & Uncertainty Quantification Engine.
Executes consensus predictions across GCN, GAT, GIN, MPNN, and Baseline models
and quantifies epistemic uncertainty via standard deviation and confidence intervals.
"""
from typing import Dict, List, Any, Tuple, Optional
import os
import numpy as np
import torch

from src.data import smiles_to_graph, DATASET_CONFIGS
from src.evaluate import load_trained_model

MODEL_NAMES = ['gin', 'mpnn', 'gcn', 'gat', 'baseline']


def predict_single_model(model: Any, model_name: str, graph: Any, dataset_name: str) -> np.ndarray:
    """Run inference for a single model and return output array (shape: [num_tasks])."""
    if model_name == 'baseline':
        pred = model.predict([graph])[0]
        if np.ndim(pred) == 0:
            pred = np.array([float(pred)])
        return np.asarray(pred, dtype=np.float32)

    model.eval()
    with torch.no_grad():
        out = model(graph.x, graph.edge_index, edge_attr=graph.edge_attr)
        if dataset_name == 'esol':
            val = out[0].cpu().numpy()
        else:
            # Classification or multi-task: convert logits to probabilities
            val = torch.sigmoid(out)[0].cpu().numpy()
    return np.asarray(val, dtype=np.float32)


def predict_ensemble(
    smiles_or_graph: Any,
    dataset_name: str,
    loaded_models: Optional[Dict[str, Any]] = None,
    checkpoint_dir: str = 'results/checkpoints'
) -> Dict[str, Any]:
    """
    Run multi-model ensemble prediction for a specific dataset endpoint.
    
    Args:
        smiles_or_graph: SMILES string or PyG Data graph.
        dataset_name: One of 'esol', 'bbbp', 'tox21'.
        loaded_models: Optional preloaded dict of {model_name: model}.
        checkpoint_dir: Directory containing saved checkpoints.
        
    Returns:
        Dictionary containing individual predictions, ensemble mean, std, CI, and agreement.
    """
    ds = dataset_name.lower()
    if isinstance(smiles_or_graph, str):
        graph = smiles_to_graph(smiles_or_graph)
    else:
        graph = smiles_or_graph

    if loaded_models is None:
        loaded_models = {}
        for m in MODEL_NAMES:
            try:
                mod, _ = load_trained_model(m, ds, checkpoint_dir=checkpoint_dir)
                loaded_models[m] = mod
            except Exception:
                pass

    if not loaded_models:
        raise RuntimeError(f"No trained checkpoints found for dataset '{ds}'.")

    predictions = {}
    vals_list = []

    for m_name, model in loaded_models.items():
        try:
            val = predict_single_model(model, m_name, graph, ds)
            predictions[m_name] = val
            vals_list.append(val)
        except Exception as e:
            continue

    if not vals_list:
        raise RuntimeError(f"Failed to obtain predictions for '{ds}'.")

    stacked = np.stack(vals_list, axis=0)  # Shape: (num_models, num_tasks)
    mean_pred = np.mean(stacked, axis=0)
    std_pred = np.std(stacked, axis=0)

    # 95% Confidence bounds
    ci_lower = mean_pred - 1.96 * std_pred
    ci_upper = mean_pred + 1.96 * std_pred

    # Assess model agreement
    avg_std = float(np.mean(std_pred))
    if ds == 'esol':
        # logS standard deviation threshold
        if avg_std < 0.25:
            agreement = "High Consensus (Low Uncertainty)"
        elif avg_std < 0.50:
            agreement = "Moderate Consensus"
        else:
            agreement = "Divergent Predictions (High Uncertainty)"
    else:
        # Probability standard deviation threshold
        if avg_std < 0.10:
            agreement = "High Consensus (Low Uncertainty)"
        elif avg_std < 0.20:
            agreement = "Moderate Consensus"
        else:
            agreement = "Divergent Predictions (High Uncertainty)"

    return {
        "dataset": ds,
        "task_names": DATASET_CONFIGS[ds]['target_cols'],
        "individual": predictions,
        "mean": mean_pred,
        "std": std_pred,
        "ci_lower": ci_lower,
        "ci_upper": ci_upper,
        "num_models": len(vals_list),
        "agreement": agreement,
        "uncertainty_score": avg_std
    }


def predict_all_endpoints(
    smiles_or_graph: Any,
    models_cache: Optional[Dict[str, Dict[str, Any]]] = None,
    checkpoint_dir: str = 'results/checkpoints'
) -> Dict[str, Any]:
    """
    Run full multi-endpoint prediction suite across ESOL, BBBP, and Tox21.
    """
    results = {}
    for ds in ['esol', 'bbbp', 'tox21']:
        cache_ds = models_cache.get(ds) if models_cache else None
        try:
            res = predict_ensemble(
                smiles_or_graph=smiles_or_graph,
                dataset_name=ds,
                loaded_models=cache_ds,
                checkpoint_dir=checkpoint_dir
            )
            results[ds] = res
        except Exception as e:
            results[ds] = {"error": str(e)}

    return results
