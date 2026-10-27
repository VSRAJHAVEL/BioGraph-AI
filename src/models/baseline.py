"""
Classical Machine Learning Baselines for Molecular Property Prediction.
Uses 2048-bit Morgan Fingerprints (ECFP4) with Random Forest and Gradient Boosting.
"""
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import pickle
import logging
from typing import Dict, List, Optional, Tuple, Any, Union

import numpy as np
import torch
from torch_geometric.data import Data
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, roc_auc_score, average_precision_score
from rdkit import Chem
from rdkit.Chem import Descriptors, AllChem

from src.data import smiles_to_fingerprint

logger = logging.getLogger(__name__)


def extract_features(data_list: List[Data], n_bits: int = 2048, use_descriptors: bool = True) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extract Morgan fingerprints (ECFP4) and optional physicochemical descriptors for a list of PyG Data objects.
    Returns:
        X: np.ndarray of shape (num_samples, num_features)
        y: np.ndarray of shape (num_samples, num_tasks)
    """
    X_list = []
    y_list = []

    for data in data_list:
        smiles = data.smiles
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            continue

        # 2048-bit Morgan fingerprint
        fp = smiles_to_fingerprint(smiles, radius=2, n_bits=n_bits)
        if fp is None:
            continue

        if use_descriptors:
            # Add MolWt, LogP, TPSA, NumRotatableBonds, HBD, HBA
            desc = np.array([
                Descriptors.MolWt(mol),
                Descriptors.MolLogP(mol),
                Descriptors.TPSA(mol),
                Descriptors.NumRotatableBonds(mol),
                Descriptors.NumHDonors(mol),
                Descriptors.NumHAcceptors(mol)
            ], dtype=np.float32)
            feat = np.concatenate([fp, desc])
        else:
            feat = fp

        X_list.append(feat)

        if hasattr(data, 'y') and data.y is not None:
            y_val = data.y.cpu().numpy()
            if y_val.ndim == 1:
                y_val = y_val.reshape(1, -1)
            y_list.append(y_val.reshape(-1))

    X = np.stack(X_list, axis=0) if len(X_list) > 0 else np.empty((0, n_bits))
    y = np.stack(y_list, axis=0) if len(y_list) > 0 else np.empty((0, 1))

    return X, y


class ClassicalFingerprintBaseline:
    """
    Classical Machine Learning Baseline supporting Regression, Binary Classification,
    and Multi-task Masked Classification.
    """
    def __init__(
        self,
        task_type: str = 'regression',
        num_tasks: int = 1,
        model_type: str = 'random_forest',
        n_estimators: int = 100,
        random_state: int = 42,
        n_bits: int = 2048,
        use_descriptors: bool = True
    ):
        self.task_type = task_type
        self.num_tasks = num_tasks
        self.model_type = model_type
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.n_bits = n_bits
        self.use_descriptors = use_descriptors
        self.models: List[Any] = []
        self.is_fitted = False

    def _create_single_model(self):
        if self.task_type == 'regression':
            if self.model_type == 'gradient_boosting':
                return GradientBoostingRegressor(n_estimators=self.n_estimators, random_state=self.random_state)
            return RandomForestRegressor(n_estimators=self.n_estimators, random_state=self.random_state, n_jobs=-1)
        else:
            # Classification
            return RandomForestClassifier(n_estimators=self.n_estimators, random_state=self.random_state, n_jobs=-1)

    def fit(self, train_data: List[Data]) -> 'ClassicalFingerprintBaseline':
        """Train baseline model(s) on PyG data list."""
        X, y = extract_features(train_data, n_bits=self.n_bits, use_descriptors=self.use_descriptors)
        self.models = []

        if self.task_type == 'regression':
            for t in range(self.num_tasks):
                y_t = y[:, t]
                valid_mask = ~np.isnan(y_t)
                model = self._create_single_model()
                model.fit(X[valid_mask], y_t[valid_mask])
                self.models.append(model)
        else:
            # Classification: Fit per task to seamlessly handle missing/NaN targets (e.g. Tox21)
            for t in range(self.num_tasks):
                y_t = y[:, t]
                valid_mask = ~np.isnan(y_t)
                model = self._create_single_model()
                # Check if both classes are present
                unique_classes = np.unique(y_t[valid_mask])
                if len(unique_classes) > 1:
                    model.fit(X[valid_mask], y_t[valid_mask].astype(int))
                else:
                    # Trivial case: single class in split
                    model = None
                self.models.append(model)

        self.is_fitted = True
        return self

    def predict(self, test_data: List[Data]) -> np.ndarray:
        """
        Generate predictions for PyG Data objects.
        Returns:
            preds: np.ndarray of shape (num_samples, num_tasks)
        """
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted yet.")

        X, _ = extract_features(test_data, n_bits=self.n_bits, use_descriptors=self.use_descriptors)
        preds = np.zeros((len(X), self.num_tasks), dtype=np.float32)

        for t in range(self.num_tasks):
            model = self.models[t]
            if model is None:
                preds[:, t] = 0.5
            elif self.task_type == 'regression':
                preds[:, t] = model.predict(X)
            else:
                # Return probability of positive class
                prob = model.predict_proba(X)
                if prob.shape[1] > 1:
                    preds[:, t] = prob[:, 1]
                else:
                    preds[:, t] = prob[:, 0]

        return preds

    def evaluate(self, test_data: List[Data]) -> Dict[str, float]:
        """Evaluate fitted model on test dataset and return metric dictionary."""
        preds = self.predict(test_data)
        _, y_true = extract_features(test_data, n_bits=self.n_bits, use_descriptors=self.use_descriptors)

        metrics = {}
        if self.task_type == 'regression':
            rmse_list, mae_list, r2_list = [], [], []
            for t in range(self.num_tasks):
                yt = y_true[:, t]
                yp = preds[:, t]
                mask = ~np.isnan(yt)
                if np.sum(mask) > 1:
                    rmse_list.append(np.sqrt(mean_squared_error(yt[mask], yp[mask])))
                    mae_list.append(mean_absolute_error(yt[mask], yp[mask]))
                    r2_list.append(r2_score(yt[mask], yp[mask]))

            metrics['rmse'] = float(np.mean(rmse_list))
            metrics['mae'] = float(np.mean(mae_list))
            metrics['r2'] = float(np.mean(r2_list))
        else:
            roc_list, pr_list = [], []
            for t in range(self.num_tasks):
                yt = y_true[:, t]
                yp = preds[:, t]
                mask = ~np.isnan(yt)
                # Check that both classes exist
                if len(np.unique(yt[mask])) > 1:
                    roc_list.append(roc_auc_score(yt[mask], yp[mask]))
                    pr_list.append(average_precision_score(yt[mask], yp[mask]))

            metrics['roc_auc'] = float(np.mean(roc_list)) if roc_list else 0.5
            metrics['pr_auc'] = float(np.mean(pr_list)) if pr_list else 0.0

        return metrics

    def save(self, filepath: str):
        """Save fitted model to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, filepath: str) -> 'ClassicalFingerprintBaseline':
        """Load fitted model from disk."""
        with open(filepath, 'rb') as f:
            return pickle.load(f)
