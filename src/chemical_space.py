"""
Chemical Space Explorer & Structural Similarity Search Engine.
Projects molecules into 2D chemical space (PCA over Morgan fingerprints & descriptors)
and searches for nearest reference neighbors via Tanimoto structural similarity.
"""
from typing import Dict, List, Tuple, Any, Optional
import os
import numpy as np
import pandas as pd
from rdkit import Chem, DataStructs, RDLogger
from rdkit.Chem import AllChem, Descriptors

# Silence RDKit deprecation noise
RDLogger.DisableLog('rdApp.*')


class ChemicalSpaceExplorer:
    """Manages chemical space projections and nearest neighbor retrieval."""
    def __init__(self, dataset_csv: str = "data/raw/delaney-processed.csv", max_compounds: int = 1200):
        self.dataset_csv = dataset_csv
        self.df = None
        self.fps = []
        self.valid_indices = []
        self.pca_mean = None
        self.pca_components = None
        self._load_and_index(max_compounds)

    def _load_and_index(self, max_compounds: int):
        if not os.path.exists(self.dataset_csv):
            # Fallback if file missing
            return

        raw_df = pd.read_csv(self.dataset_csv)
        if len(raw_df) > max_compounds:
            raw_df = raw_df.sample(max_compounds, random_state=42).reset_index(drop=True)

        smiles_col = 'smiles' if 'smiles' in raw_df.columns else raw_df.columns[-1]
        name_col = 'Compound ID' if 'Compound ID' in raw_df.columns else ('name' if 'name' in raw_df.columns else None)
        target_col = [c for c in raw_df.columns if 'solubility' in c.lower() or 'p_np' in c.lower()]
        target_name = target_col[0] if target_col else None

        valid_mols = []
        valid_rows = []
        fp_matrix = []

        for idx, row in raw_df.iterrows():
            smi = str(row[smiles_col]).strip()
            mol = Chem.MolFromSmiles(smi)
            if mol is not None:
                # ECFP4 fingerprint (2048-bit)
                fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=512)
                arr = np.zeros((512,), dtype=np.float32)
                DataStructs.ConvertToNumpyArray(fp, arr)
                
                # Add basic descriptors for richer projection
                mw = Descriptors.MolWt(mol) / 500.0
                logp = Descriptors.MolLogP(mol) / 5.0
                tpsa = Descriptors.TPSA(mol) / 150.0
                feats = np.concatenate([arr, [mw, logp, tpsa]])

                fp_matrix.append(feats)
                self.fps.append(fp)
                valid_mols.append(mol)
                valid_rows.append({
                    "Compound ID": str(row[name_col]) if name_col and pd.notna(row[name_col]) else f"CMPD_{idx}",
                    "SMILES": smi,
                    "Target Value": float(row[target_name]) if target_name and pd.notna(row[target_name]) else 0.0
                })

        if not fp_matrix:
            return

        self.df = pd.DataFrame(valid_rows)
        X = np.stack(fp_matrix, axis=0)

        # Compute deterministic 2D PCA for projection
        self.pca_mean = np.mean(X, axis=0)
        X_centered = X - self.pca_mean
        cov = np.cov(X_centered, rowvar=False)
        eigenvalues, eigenvectors = np.linalg.eigh(cov)
        idx = np.argsort(eigenvalues)[::-1]
        self.pca_components = eigenvectors[:, idx[:2]]

        coords = np.dot(X_centered, self.pca_components)
        self.df["PC1"] = coords[:, 0]
        self.df["PC2"] = coords[:, 1]

    def project_molecule(self, smiles: str) -> Optional[Tuple[float, float]]:
        """Project a single SMILES query into the chemical space PC1-PC2 coordinates."""
        if self.pca_components is None:
            return None

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return None

        fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=512)
        arr = np.zeros((512,), dtype=np.float32)
        DataStructs.ConvertToNumpyArray(fp, arr)
        mw = Descriptors.MolWt(mol) / 500.0
        logp = Descriptors.MolLogP(mol) / 5.0
        tpsa = Descriptors.TPSA(mol) / 150.0
        feats = np.concatenate([arr, [mw, logp, tpsa]])

        centered = feats - self.pca_mean
        coords = np.dot(centered, self.pca_components)
        return float(coords[0]), float(coords[1])

    def find_nearest_neighbors(self, smiles: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search reference compounds by Tanimoto similarity over Morgan fingerprints."""
        mol = Chem.MolFromSmiles(smiles)
        if mol is None or not self.fps:
            return []

        query_fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=512)
        sims = DataStructs.BulkTanimotoSimilarity(query_fp, self.fps)
        top_indices = np.argsort(sims)[::-1][:top_k]

        results = []
        for rank, i in enumerate(top_indices):
            row = self.df.iloc[i]
            results.append({
                "Rank": rank + 1,
                "Compound ID": row["Compound ID"],
                "SMILES": row["SMILES"],
                "Tanimoto Similarity": float(sims[i]),
                "Target Value": row["Target Value"]
            })
        return results


# Global singleton cache
_explorer_instances = {}


def get_chemical_space_explorer(dataset_name: str = "esol") -> ChemicalSpaceExplorer:
    """Get or instantiate cached chemical space explorer."""
    name = dataset_name.lower()
    if name not in _explorer_instances:
        if name == "esol":
            path = "data/raw/delaney-processed.csv"
        elif name == "bbbp":
            path = "data/raw/BBBP.csv"
        else:
            path = "data/raw/delaney-processed.csv"

        _explorer_instances[name] = ChemicalSpaceExplorer(dataset_csv=path)
    return _explorer_instances[name]
