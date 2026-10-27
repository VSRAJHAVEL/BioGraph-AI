"""
Molecular Graph Featurization, Dataset Loading, and Scaffold Splitting.
Supports ESOL, BBBP, and Tox21 datasets with deterministic Bemis-Murcko splitting
and RDKit SMILES validation.
"""
import os
import gzip
import logging
import urllib.request
from collections import defaultdict
from typing import Dict, List, Optional, Tuple, Any

import pandas as pd
import numpy as np
import torch
from torch_geometric.data import Data
from torch_geometric.loader import DataLoader
import rdkit
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.Chem.Scaffolds import MurckoScaffold

# Setup logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Allowed categorical sets for one-hot encodings
ALLOWED_ATOMS = [
    'H', 'B', 'C', 'N', 'O', 'F', 'Na', 'Mg', 'Al', 'Si', 'P', 'S',
    'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Br', 'I', 'other'
]
ALLOWED_DEGREES = [0, 1, 2, 3, 4, 5, 6, 'other']
ALLOWED_CHARGES = [-2, -1, 0, 1, 2, 'other']
ALLOWED_HYBRIDIZATIONS = [
    Chem.rdchem.HybridizationType.SP,
    Chem.rdchem.HybridizationType.SP2,
    Chem.rdchem.HybridizationType.SP3,
    Chem.rdchem.HybridizationType.SP3D,
    Chem.rdchem.HybridizationType.SP3D2,
    'other'
]
ALLOWED_TOTAL_HS = [0, 1, 2, 3, 4, 'other']

ALLOWED_BONDS = [
    Chem.rdchem.BondType.SINGLE,
    Chem.rdchem.BondType.DOUBLE,
    Chem.rdchem.BondType.TRIPLE,
    Chem.rdchem.BondType.AROMATIC
]
ALLOWED_STEREO = [
    Chem.rdchem.BondStereo.STEREONONE,
    Chem.rdchem.BondStereo.STEREOANY,
    Chem.rdchem.BondStereo.STEREOZ,
    Chem.rdchem.BondStereo.STEREOE
]

# MoleculeNet dataset configs
DATASET_CONFIGS = {
    'esol': {
        'url': 'https://deepchemdata.s3-us-west-1.amazonaws.com/datasets/delaney-processed.csv',
        'raw_filename': 'delaney-processed.csv',
        'smiles_col': 'smiles',
        'target_cols': ['measured log solubility in mols per litre'],
        'task_type': 'regression',
        'num_tasks': 1,
        'metric': 'rmse'
    },
    'bbbp': {
        'url': 'https://deepchemdata.s3-us-west-1.amazonaws.com/datasets/BBBP.csv',
        'raw_filename': 'BBBP.csv',
        'smiles_col': 'smiles',
        'target_cols': ['p_np'],
        'task_type': 'classification',
        'num_tasks': 1,
        'metric': 'roc_auc'
    },
    'tox21': {
        'url': 'https://deepchemdata.s3-us-west-1.amazonaws.com/datasets/tox21.csv.gz',
        'raw_filename': 'tox21.csv.gz',
        'smiles_col': 'smiles',
        'target_cols': [
            'NR-AR', 'NR-AR-LBD', 'NR-AhR', 'NR-Aromatase', 'NR-ER', 'NR-ER-LBD',
            'NR-PPAR-gamma', 'SR-ARE', 'SR-ATAD5', 'SR-HSE', 'SR-MMP', 'SR-p53'
        ],
        'task_type': 'multitask_classification',
        'num_tasks': 12,
        'metric': 'roc_auc'
    }
}


def one_hot_encode(val: Any, allowed: List[Any]) -> List[float]:
    """Helper to one-hot encode a value given allowed categories with fallback to 'other'."""
    vec = [0.0] * len(allowed)
    if val in allowed:
        vec[allowed.index(val)] = 1.0
    else:
        vec[-1] = 1.0
    return vec


def get_atom_features(atom: Chem.Atom) -> List[float]:
    """Extract node features for an RDKit Atom."""
    return (
        one_hot_encode(atom.GetSymbol(), ALLOWED_ATOMS) +
        one_hot_encode(atom.GetTotalDegree(), ALLOWED_DEGREES) +
        one_hot_encode(atom.GetFormalCharge(), ALLOWED_CHARGES) +
        one_hot_encode(atom.GetHybridization(), ALLOWED_HYBRIDIZATIONS) +
        [1.0 if atom.GetIsAromatic() else 0.0] +
        one_hot_encode(atom.GetTotalNumHs(), ALLOWED_TOTAL_HS)
    )


def get_bond_features(bond: Chem.Bond) -> List[float]:
    """Extract edge features for an RDKit Bond."""
    return (
        one_hot_encode(bond.GetBondType(), ALLOWED_BONDS) +
        [1.0 if bond.GetIsConjugated() else 0.0] +
        [1.0 if bond.IsInRing() else 0.0] +
        one_hot_encode(bond.GetStereo(), ALLOWED_STEREO)
    )


# Calculate and expose dimensions
NODE_DIM = len(ALLOWED_ATOMS) + len(ALLOWED_DEGREES) + len(ALLOWED_CHARGES) + \
           len(ALLOWED_HYBRIDIZATIONS) + 1 + len(ALLOWED_TOTAL_HS)
EDGE_DIM = len(ALLOWED_BONDS) + 1 + 1 + len(ALLOWED_STEREO)


def smiles_to_graph(smiles: str, y: Optional[torch.Tensor] = None) -> Optional[Data]:
    """
    Convert a SMILES string to a PyG Data object.
    Returns None if SMILES is invalid or cannot be parsed by RDKit.
    """
    if not isinstance(smiles, str) or len(smiles.strip()) == 0:
        return None

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None

    # Compute node features
    atom_feats = [get_atom_features(atom) for atom in mol.GetAtoms()]
    x = torch.tensor(atom_feats, dtype=torch.float)

    # Compute edges and edge features (undirected)
    edge_indices = []
    edge_attrs = []
    for bond in mol.GetBonds():
        i = bond.GetBeginAtomIdx()
        j = bond.GetEndAtomIdx()
        bond_feats = get_bond_features(bond)

        # Both directions (i -> j) and (j -> i)
        edge_indices.append([i, j])
        edge_attrs.append(bond_feats)
        edge_indices.append([j, i])
        edge_attrs.append(bond_feats)

    if len(edge_indices) > 0:
        edge_index = torch.tensor(edge_indices, dtype=torch.long).t().contiguous()
        edge_attr = torch.tensor(edge_attrs, dtype=torch.float)
    else:
        # Isolated atoms (no bonds)
        edge_index = torch.empty((2, 0), dtype=torch.long)
        edge_attr = torch.empty((0, EDGE_DIM), dtype=torch.float)

    data = Data(
        x=x,
        edge_index=edge_index,
        edge_attr=edge_attr,
        smiles=smiles,
        num_nodes=mol.GetNumAtoms()
    )
    if y is not None:
        data.y = y

    return data


def smiles_to_fingerprint(smiles: str, radius: int = 2, n_bits: int = 2048) -> Optional[np.ndarray]:
    """Generate Morgan fingerprint (ECFP4) bit vector from SMILES."""
    if not isinstance(smiles, str) or len(smiles.strip()) == 0:
        return None
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=radius, nBits=n_bits)
    arr = np.zeros((n_bits,), dtype=np.float32)
    for bit in fp.GetOnBits():
        arr[bit] = 1.0
    return arr


def generate_scaffold(smiles: str, include_chirality: bool = False) -> str:
    """Compute Bemis-Murcko scaffold string for a SMILES."""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return ""
    scaffold = MurckoScaffold.MurckoScaffoldSmiles(smiles=smiles, includeChirality=include_chirality)
    return scaffold


def deterministic_scaffold_split(
    data_list: List[Data],
    train_frac: float = 0.8,
    val_frac: float = 0.1,
    test_frac: float = 0.1
) -> Tuple[List[Data], List[Data], List[Data]]:
    """
    Split molecular dataset into train, val, test using deterministic Bemis-Murcko scaffold split.
    Sorts scaffold groups by size (descending), then alphabetically by scaffold string.
    """
    assert abs(train_frac + val_frac + test_frac - 1.0) < 1e-5, "Fractions must sum to 1.0"

    # Group sample indices by scaffold
    scaffold_to_indices = defaultdict(list)
    for idx, data in enumerate(data_list):
        scaffold = generate_scaffold(data.smiles)
        scaffold_to_indices[scaffold].append(idx)

    # Sort scaffold groups: primary key = -len(indices) (largest groups first), secondary = scaffold string
    sorted_scaffold_groups = sorted(
        scaffold_to_indices.items(),
        key=lambda item: (-len(item[1]), item[0])
    )

    n_total = len(data_list)
    train_cutoff = train_frac * n_total
    val_cutoff = (train_frac + val_frac) * n_total

    train_indices, val_indices, test_indices = [], [], []

    for _, indices in sorted_scaffold_groups:
        if len(train_indices) + len(indices) <= train_cutoff:
            train_indices.extend(indices)
        elif len(train_indices) + len(val_indices) + len(indices) <= val_cutoff:
            val_indices.extend(indices)
        else:
            test_indices.extend(indices)

    train_data = [data_list[i] for i in train_indices]
    val_data = [data_list[i] for i in val_indices]
    test_data = [data_list[i] for i in test_indices]

    return train_data, val_data, test_data


def download_raw_dataset(dataset_name: str, raw_dir: str) -> str:
    """Download raw dataset if not already present."""
    config = DATASET_CONFIGS[dataset_name.lower()]
    os.makedirs(raw_dir, exist_ok=True)
    raw_path = os.path.join(raw_dir, config['raw_filename'])

    if not os.path.exists(raw_path):
        logger.info(f"Downloading {dataset_name} from {config['url']} -> {raw_path}")
        urllib.request.urlretrieve(config['url'], raw_path)
        logger.info(f"Successfully downloaded {dataset_name}.")
    else:
        logger.info(f"Found existing raw data file at {raw_path}")

    return raw_path


def load_and_preprocess_dataset(
    dataset_name: str,
    data_dir: str = 'data',
    reload: bool = False
) -> Dict[str, Any]:
    """
    Load, parse, validate, and featurize a MoleculeNet dataset.
    Saves processed splits on disk for fast reload.
    """
    dataset_name = dataset_name.lower()
    if dataset_name not in DATASET_CONFIGS:
        raise ValueError(f"Unknown dataset '{dataset_name}'. Allowed: {list(DATASET_CONFIGS.keys())}")

    processed_dir = os.path.join(data_dir, 'processed')
    raw_dir = os.path.join(data_dir, 'raw')
    os.makedirs(processed_dir, exist_ok=True)
    cache_path = os.path.join(processed_dir, f"{dataset_name}_processed.pt")

    if os.path.exists(cache_path) and not reload:
        logger.info(f"Loading cached dataset from {cache_path}")
        return torch.load(cache_path, weights_only=False)

    config = DATASET_CONFIGS[dataset_name]
    raw_path = download_raw_dataset(dataset_name, raw_dir)

    # Read dataframe (plain CSV or gzip)
    if raw_path.endswith('.gz'):
        with gzip.open(raw_path, 'rt') as f:
            df = pd.read_csv(f)
    else:
        df = pd.read_csv(raw_path)

    smiles_col = config['smiles_col']
    target_cols = config['target_cols']
    initial_rows = len(df)

    valid_graphs: List[Data] = []
    dropped_count = 0

    for idx, row in df.iterrows():
        smi = row[smiles_col]
        # Target values
        targets = [float(row[col]) if pd.notna(row[col]) else float('nan') for col in target_cols]
        y_tensor = torch.tensor([targets], dtype=torch.float)

        graph = smiles_to_graph(smi, y=y_tensor)
        if graph is None:
            dropped_count += 1
            logger.debug(f"Row {idx}: Failed to parse SMILES '{smi}'. Dropped.")
        else:
            valid_graphs.append(graph)

    final_size = len(valid_graphs)
    logger.info(f"[{dataset_name.upper()}] Initial rows: {initial_rows} | Dropped invalid SMILES: {dropped_count} | Final valid size: {final_size}")
    print(f"[{dataset_name.upper()}] Dataset processing complete: {initial_rows} rows -> {dropped_count} dropped -> {final_size} valid molecules.")

    # Deterministic Bemis-Murcko scaffold split
    train_data, val_data, test_data = deterministic_scaffold_split(valid_graphs, 0.8, 0.1, 0.1)

    print(f"[{dataset_name.upper()}] Split sizes -> Train: {len(train_data)} ({len(train_data)/final_size*100:.1f}%), "
          f"Val: {len(val_data)} ({len(val_data)/final_size*100:.1f}%), "
          f"Test: {len(test_data)} ({len(test_data)/final_size*100:.1f}%)")

    dataset_dict = {
        'dataset_name': dataset_name,
        'config': config,
        'train': train_data,
        'val': val_data,
        'test': test_data,
        'initial_size': initial_rows,
        'dropped_count': dropped_count,
        'final_size': final_size,
        'node_dim': NODE_DIM,
        'edge_dim': EDGE_DIM
    }

    # Save to disk cache
    torch.save(dataset_dict, cache_path)
    logger.info(f"Saved processed dataset to {cache_path}")

    return dataset_dict


def get_dataloaders(
    dataset_name: str,
    batch_size: int = 32,
    data_dir: str = 'data',
    reload: bool = False,
    quick: bool = False,
    num_workers: int = 0
) -> Tuple[DataLoader, DataLoader, DataLoader, Dict[str, Any]]:
    """
    Get PyG DataLoaders for train, val, test splits.
    If quick=True, trims dataset sizes for fast smoke testing.
    """
    data_bundle = load_and_preprocess_dataset(dataset_name, data_dir=data_dir, reload=reload)

    train_data = data_bundle['train']
    val_data = data_bundle['val']
    test_data = data_bundle['test']

    if quick:
        train_data = train_data[:min(len(train_data), 100)]
        val_data = val_data[:min(len(val_data), 20)]
        test_data = test_data[:min(len(test_data), 20)]
        logger.info(f"[QUICK MODE] Trimmed to: Train={len(train_data)}, Val={len(val_data)}, Test={len(test_data)}")

    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_data, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_data, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    return train_loader, val_loader, test_loader, data_bundle
