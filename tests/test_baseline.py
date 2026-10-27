"""
Milestone 3 Unit Tests: Classical Morgan Fingerprint Baselines.
"""
import os
import pytest
import numpy as np
from src.data import get_dataloaders
from src.models.baseline import ClassicalFingerprintBaseline, extract_features


def test_extract_features():
    """Verify feature extraction shape from PyG Data list."""
    _, _, _, meta = get_dataloaders('esol', batch_size=16, quick=True)
    train_data = meta['train'][:25]
    X, y = extract_features(train_data, n_bits=2048, use_descriptors=True)
    assert X.shape == (25, 2048 + 6)
    assert y.shape == (25, 1)


def test_baseline_regression_esol():
    """Test training, prediction, and evaluation for ESOL regression."""
    _, _, _, meta = get_dataloaders('esol', batch_size=16, quick=True)
    train_data = meta['train'][:50]
    test_data = meta['test'][:20]

    rf = ClassicalFingerprintBaseline(task_type='regression', num_tasks=1, n_estimators=20, random_state=42)
    rf.fit(train_data)
    preds = rf.predict(test_data)
    assert preds.shape == (len(test_data), 1)

    metrics = rf.evaluate(test_data)
    assert 'rmse' in metrics and 'mae' in metrics and 'r2' in metrics
    assert metrics['rmse'] > 0.0


def test_baseline_classification_bbbp():
    """Test training and evaluation for BBBP binary classification."""
    _, _, _, meta = get_dataloaders('bbbp', batch_size=16, quick=True)
    train_data = meta['train'][:60]
    test_data = meta['test'][:20]

    rf = ClassicalFingerprintBaseline(task_type='classification', num_tasks=1, n_estimators=20, random_state=42)
    rf.fit(train_data)
    preds = rf.predict(test_data)
    assert preds.shape == (len(test_data), 1)
    assert np.all((preds >= 0.0) & (preds <= 1.0))

    metrics = rf.evaluate(test_data)
    assert 'roc_auc' in metrics and 'pr_auc' in metrics


def test_baseline_multitask_tox21():
    """Test masked multi-task classification for Tox21."""
    _, _, _, meta = get_dataloaders('tox21', batch_size=16, quick=True)
    train_data = meta['train'][:60]
    test_data = meta['test'][:20]

    rf = ClassicalFingerprintBaseline(task_type='multitask_classification', num_tasks=12, n_estimators=10, random_state=42)
    rf.fit(train_data)
    preds = rf.predict(test_data)
    assert preds.shape == (len(test_data), 12)
    assert np.all((preds >= 0.0) & (preds <= 1.0))

    # Test serialization
    test_ckpt = "results/checkpoints/test_rf.pkl"
    rf.save(test_ckpt)
    assert os.path.exists(test_ckpt)
    loaded_rf = ClassicalFingerprintBaseline.load(test_ckpt)
    loaded_preds = loaded_rf.predict(test_data)
    np.testing.assert_allclose(preds, loaded_preds)
    os.remove(test_ckpt)
