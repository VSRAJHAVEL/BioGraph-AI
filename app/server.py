"""
BioGraph AI: Enterprise Drug Discovery REST API Server.
High-performance FastAPI backend serving Deep GNN models (MPNN, GIN, GAT, GCN),
In Silico ADMET, 3D Molecular Energetics, Pharmacophore Attribution, and Batch Screening.
"""
import os
import sys
import base64
from typing import List, Dict, Any, Optional, Tuple

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import torch
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pydantic import BaseModel, Field

from rdkit import Chem, RDLogger
from rdkit.Chem import Draw, Descriptors
from rdkit.Chem.Draw import rdMolDraw2D

from src.data import smiles_to_graph, DATASET_CONFIGS
from src.evaluate import load_trained_model
from src.explain import explain_molecule
from src.admet import compute_admet_profile
from src.conformers import generate_3d_conformer
from src.ensemble import predict_ensemble, predict_all_endpoints, MODEL_NAMES
from src.chemical_space import get_chemical_space_explorer
from src.analogs import evaluate_lead_optimization
from src.batch_screen import screen_batch_molecules

# Silence RDKit deprecation noise
RDLogger.DisableLog('rdApp.*')

app = FastAPI(
    title="BioGraph AI Drug Discovery API",
    description="High-Throughput Deep Molecular Graph Neural Network Screening Platform",
    version="2.0.0"
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cached Models Dictionary in memory
_MODEL_CACHE: Dict[str, Dict[str, Any]] = {}


def get_cached_model_instance(model_name: str, dataset_name: str):
    """Retrieve or load cached model instance."""
    ds = dataset_name.lower()
    m = model_name.lower()
    if ds not in _MODEL_CACHE:
        _MODEL_CACHE[ds] = {}
    if m not in _MODEL_CACHE[ds]:
        mod, payload = load_trained_model(model_name=m, dataset_name=ds)
        _MODEL_CACHE[ds][m] = mod
    return _MODEL_CACHE[ds][m]


# Molecular Presets
PRESET_DRUGS = [
    {
        "name": "Aspirin",
        "category": "Analgesic / Anti-inflammatory",
        "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
        "indication": "COX-1/COX-2 inhibitor for pain, fever, and thrombosis prevention."
    },
    {
        "name": "Ibuprofen",
        "category": "NSAID Pain Reliever",
        "smiles": "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O",
        "indication": "Nonsteroidal anti-inflammatory for arthritis and pain."
    },
    {
        "name": "Paracetamol",
        "category": "Antipyretic / Analgesic",
        "smiles": "CC(=O)NC1=CC=C(O)C=C1",
        "indication": "Centrally acting analgesic for fever and mild-to-moderate pain."
    },
    {
        "name": "Caffeine",
        "category": "CNS Stimulant",
        "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
        "indication": "Adenosine A1/A2A receptor antagonist promoting alertness."
    },
    {
        "name": "Atorvastatin (Lipitor)",
        "category": "Statin / Cardiovascular",
        "smiles": "CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O",
        "indication": "HMG-CoA reductase inhibitor for hypercholesterolemia."
    },
    {
        "name": "Remdesivir",
        "category": "Antiviral",
        "smiles": "CCC(CC)COC(=O)C(C)NP(=O)(OCC1C(C(C(O1)(C#N)c2ccc3n2ncnc3N)O)O)Oc4ccccc4",
        "indication": "Viral RNA-dependent RNA polymerase nucleotide prodrug inhibitor."
    },
    {
        "name": "Imatinib (Gleevec)",
        "category": "Oncology / Kinase Inhibitor",
        "smiles": "Cc1ccc(NC(=O)c2ccc(CN3CCN(C)CC3)cc2)cc1Nc4nccc(-c5cccnc5)n4",
        "indication": "BCR-ABL tyrosine kinase inhibitor for chronic myelogenous leukemia."
    },
    {
        "name": "Sildenafil (Viagra)",
        "category": "PDE5 Inhibitor",
        "smiles": "CCCC1=NN(C)C2=C1N=C(NC2=O)c3cc(S(=O)(=O)N4CCN(C)CC4)ccc3OCC",
        "indication": "Phosphodiesterase type 5 inhibitor for erectile dysfunction."
    },
    {
        "name": "Penicillin V",
        "category": "Beta-Lactam Antibiotic",
        "smiles": "CC1(C)SC2C(NC(=O)COc3ccccc3)C(=O)N2C1C(=O)O",
        "indication": "Bacterial cell wall synthesis inhibitor for streptococcal infections."
    },
    {
        "name": "Diazepam (Valium)",
        "category": "Benzodiazepine / Anxiolytic",
        "smiles": "CN1C(=O)CN=C(c2ccccc2)c3cc(Cl)ccc13",
        "indication": "GABA-A receptor positive allosteric modulator for anxiety."
    },
    {
        "name": "Nicotine",
        "category": "Cholinergic Agonist",
        "smiles": "CN1CCCC1c2cccnc2",
        "indication": "Nicotinic acetylcholine receptor agonist."
    },
    {
        "name": "Metformin",
        "category": "Antidiabetic",
        "smiles": "CN(C)C(=N)NC(=N)N",
        "indication": "AMPK activator decreasing hepatic glucose production."
    },
    {
        "name": "Warfarin",
        "category": "Anticoagulant",
        "smiles": "CC(=O)CC(c1ccccc1)c2c(O)c3ccccc3oc2=O",
        "indication": "Vitamin K epoxide reductase complex subunit 1 inhibitor."
    },
    {
        "name": "Ciprofloxacin",
        "category": "Fluoroquinolone Antibiotic",
        "smiles": "O=C(O)c1cn(C2CC2)c3cc(N4CCNCC4)c(F)cc3c1=O",
        "indication": "Bacterial DNA topoisomerase IV and DNA gyrase inhibitor."
    }
]


def generate_molecule_svg(
    mol: Chem.Mol,
    width: int = 400,
    height: int = 300,
    highlight_atoms: Optional[List[int]] = None,
    highlight_colors: Optional[Dict[int, Tuple[float, float, float]]] = None
) -> str:
    """Generate high-resolution 2D vector SVG drawing of the molecule."""
    drawer = rdMolDraw2D.MolDraw2DSVG(width, height)
    opts = drawer.drawOptions()
    opts.clearBackground = True
    opts.bondLineWidth = 2.0
    opts.addAtomIndices = False

    if highlight_atoms:
        drawer.DrawMolecule(mol, highlightAtoms=highlight_atoms, highlightAtomColors=highlight_colors or {})
    else:
        drawer.DrawMolecule(mol)
    drawer.FinishDrawing()
    return drawer.GetDrawingText()


# --- Pydantic Request & Response Models ---

class ValidateRequest(BaseModel):
    smiles: str = Field(..., description="SMILES string to validate")

class ValidateResponse(BaseModel):
    valid: bool
    error: Optional[str] = None
    canonical_smiles: Optional[str] = None
    formula: Optional[str] = None
    svg_2d: Optional[str] = None
    heavy_atoms: Optional[int] = None
    mw: Optional[float] = None

class AnalyzeRequest(BaseModel):
    smiles: str = Field(..., description="Canonical SMILES string")

class ExplainRequest(BaseModel):
    smiles: str = Field(...)
    model: str = Field("mpnn", description="One of: mpnn, gin, gat, gcn")
    dataset: str = Field("esol", description="One of: esol, bbbp, tox21")
    task_idx: int = Field(0, description="Task index (0 for ESOL/BBBP, 0-11 for Tox21)")
    epochs: int = Field(35, description="Optimization epochs for GNNExplainer")

class ConformerRequest(BaseModel):
    smiles: str = Field(...)
    seed: int = Field(42)

class ChemicalSpaceRequest(BaseModel):
    smiles: str = Field(...)
    dataset: str = Field("esol")

class AnalogsRequest(BaseModel):
    smiles: str = Field(...)
    dataset: str = Field("esol")
    max_analogs: int = Field(8)

class BatchScreenRequest(BaseModel):
    smiles_list: List[str] = Field(...)
    compound_names: Optional[List[str]] = None
    prefer_cns: bool = Field(False)

class SketcherAtom(BaseModel):
    id: int
    element: str = "C"
    x: float = 0.0
    y: float = 0.0

class SketcherBond(BaseModel):
    source: int
    target: int
    order: float = 1.0

class GraphToSmilesRequest(BaseModel):
    atoms: List[SketcherAtom]
    bonds: List[SketcherBond]

class SmilesToGraphRequest(BaseModel):
    smiles: str



# --- REST Endpoints ---

@app.get("/api/health")
def health_check():
    """Verify backend status and PyTorch/PyG/RDKit runtime health."""
    return {
        "status": "healthy",
        "framework": "PyTorch Geometric 2.8 & RDKit",
        "architectures": ["MPNN", "GIN", "GAT", "GCN", "Random Forest"],
        "datasets": ["ESOL", "BBBP", "Tox21"],
        "checkpoints_loaded": len(_MODEL_CACHE)
    }


@app.get("/api/presets")
def get_presets():
    """Return curated library of pharmaceutical drug presets."""
    return PRESET_DRUGS


@app.post("/api/validate", response_model=ValidateResponse)
def validate_smiles(req: ValidateRequest):
    """
    Rapid, non-blocking SMILES validation endpoint for real-time frontend typing feedback.
    """
    smi = req.smiles.strip()
    if not smi:
        return ValidateResponse(
            valid=False,
            error="SMILES string is empty. Please enter a valid molecular structure."
        )

    mol = Chem.MolFromSmiles(smi)
    if mol is None:
        # Provide helpful hint for common syntax issues
        if ('(' in smi or ')' in smi) and smi.count('(') != smi.count(')'):
            err_msg = f"Invalid structure: Unmatched parentheses in '{smi}'."
        elif any(c.isdigit() for c in smi) and sum(smi.count(str(d)) % 2 != 0 for d in range(1, 10)) > 0:
            err_msg = f"Invalid structure: Unclosed ring closure number in '{smi}'."
        else:
            err_msg = f"Invalid chemical structure: '{smi}'. Check for valence violations or unrecognized atom symbols."

        return ValidateResponse(
            valid=False,
            error=err_msg
        )

    try:
        can_smi = Chem.MolToSmiles(mol)
        formula = Chem.rdMolDescriptors.CalcMolFormula(mol)
        svg = generate_molecule_svg(mol, width=280, height=180)
        mw = round(float(Descriptors.MolWt(mol)), 2)
        heavy = int(mol.GetNumHeavyAtoms())

        return ValidateResponse(
            valid=True,
            error=None,
            canonical_smiles=can_smi,
            formula=formula,
            svg_2d=svg,
            heavy_atoms=heavy,
            mw=mw
        )
    except Exception as e:
        return ValidateResponse(
            valid=False,
            error=f"Error featurizing molecule: {str(e)}"
        )


@app.post("/api/sketcher/graph-to-smiles")
def sketcher_graph_to_smiles(req: GraphToSmilesRequest):
    """Convert drawn 2D atom/bond graph into validated canonical SMILES."""
    if not req.atoms:
        return {
            "valid": True,
            "smiles": "",
            "formula": "",
            "mw": 0.0,
            "heavy_atoms": 0,
            "svg_2d": ""
        }

    mol = Chem.RWMol()
    id_to_idx = {}
    for a in req.atoms:
        elem = a.element.strip().capitalize()
        if not elem:
            elem = "C"
        try:
            idx = mol.AddAtom(Chem.Atom(elem))
            id_to_idx[a.id] = idx
        except Exception:
            idx = mol.AddAtom(Chem.Atom("C"))
            id_to_idx[a.id] = idx

    for b in req.bonds:
        src = id_to_idx.get(b.source)
        dst = id_to_idx.get(b.target)
        if src is not None and dst is not None and src != dst:
            if not mol.GetBondBetweenAtoms(src, dst):
                order = Chem.BondType.SINGLE
                if b.order == 2:
                    order = Chem.BondType.DOUBLE
                elif b.order == 3:
                    order = Chem.BondType.TRIPLE
                elif b.order == 1.5:
                    order = Chem.BondType.AROMATIC
                mol.AddBond(src, dst, order)

    try:
        Chem.SanitizeMol(mol)
        smi = Chem.MolToSmiles(mol)
        formula = Chem.rdMolDescriptors.CalcMolFormula(mol)
        mw = round(float(Descriptors.MolWt(mol)), 2)
        svg = generate_molecule_svg(mol, width=280, height=180)
        return {
            "valid": True,
            "smiles": smi,
            "formula": formula,
            "mw": mw,
            "heavy_atoms": int(mol.GetNumHeavyAtoms()),
            "svg_2d": svg
        }
    except Exception:
        # Generate non-sanitized SMILES if valence is temporarily incomplete during drawing
        try:
            smi = Chem.MolToSmiles(mol, kekuleSmiles=True)
            return {
                "valid": True,
                "smiles": smi,
                "formula": "",
                "mw": 0.0,
                "heavy_atoms": int(mol.GetNumHeavyAtoms()),
                "svg_2d": ""
            }
        except Exception as e2:
            return {
                "valid": False,
                "error": str(e2),
                "smiles": "",
                "formula": "",
                "mw": 0.0,
                "heavy_atoms": 0,
                "svg_2d": ""
            }


@app.post("/api/sketcher/smiles-to-graph")
def sketcher_smiles_to_graph(req: SmilesToGraphRequest):
    """Convert any canonical SMILES into 2D canvas coordinates and graph structure."""
    smi = req.smiles.strip()
    if not smi:
        return {"atoms": [], "bonds": [], "smiles": ""}
    mol = Chem.MolFromSmiles(smi)
    if not mol:
        raise HTTPException(status_code=400, detail="Invalid SMILES structure")

    AllChem.Compute2DCoords(mol)
    conf = mol.GetConformer()

    xs = [conf.GetAtomPosition(i).x for i in range(mol.GetNumAtoms())]
    ys = [conf.GetAtomPosition(i).y for i in range(mol.GetNumAtoms())]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0

    span = max(max_x - min_x, max_y - min_y, 1.0)
    scale = min(220.0 / span, 45.0)

    atoms = []
    for i, a in enumerate(mol.GetAtoms()):
        pos = conf.GetAtomPosition(i)
        px = 300.0 + (pos.x - center_x) * scale
        py = 200.0 - (pos.y - center_y) * scale
        atoms.append({
            "id": i,
            "element": a.GetSymbol(),
            "x": round(px, 1),
            "y": round(py, 1)
        })

    bonds = []
    for b in mol.GetBonds():
        order = 1.0
        if b.GetBondType() == Chem.BondType.DOUBLE:
            order = 2.0
        elif b.GetBondType() == Chem.BondType.TRIPLE:
            order = 3.0
        elif b.GetBondType() == Chem.BondType.AROMATIC:
            order = 1.5
        bonds.append({
            "source": b.GetBeginAtomIdx(),
            "target": b.GetEndAtomIdx(),
            "order": order
        })

    return {
        "atoms": atoms,
        "bonds": bonds,
        "smiles": Chem.MolToSmiles(mol)
    }



@app.get("/api/benchmarks")
def get_benchmarks():
    """
    Return local benchmark results reproduced across Bemis-Murcko scaffold splits.
    """
    return {
        "split_method": "Bemis-Murcko Scaffold Split (80% Train, 10% Val, 10% Test)",
        "datasets": {
            "esol": {
                "name": "ESOL (Delaney Solubility)",
                "task": "Regression",
                "metric": "RMSE (mol/L) ↓",
                "models": [
                    {"model": "MPNN", "rmse": 1.010, "mae": 0.777, "r2": 0.784, "rank": 1},
                    {"model": "GIN", "rmse": 1.054, "mae": 0.812, "r2": 0.764, "rank": 2},
                    {"model": "GCN", "rmse": 1.080, "mae": 0.811, "r2": 0.753, "rank": 3},
                    {"model": "Baseline (RF)", "rmse": 1.109, "mae": 0.859, "r2": 0.739, "rank": 4},
                    {"model": "GAT", "rmse": 1.208, "mae": 0.938, "r2": 0.691, "rank": 5}
                ]
            },
            "bbbp": {
                "name": "BBBP (Blood-Brain Barrier Penetration)",
                "task": "Binary Classification",
                "metric": "ROC-AUC ↑",
                "models": [
                    {"model": "Baseline (RF)", "roc_auc": 0.853, "pr_auc": 0.978, "rank": 1},
                    {"model": "GIN", "roc_auc": 0.723, "pr_auc": 0.936, "rank": 2},
                    {"model": "GCN", "roc_auc": 0.719, "pr_auc": 0.951, "rank": 3},
                    {"model": "MPNN", "roc_auc": 0.665, "pr_auc": 0.944, "rank": 4},
                    {"model": "GAT", "roc_auc": 0.624, "pr_auc": 0.928, "rank": 5}
                ]
            },
            "tox21": {
                "name": "Tox21 (12 Bioassay Panels)",
                "task": "Multi-Task Classification",
                "metric": "Macro ROC-AUC ↑",
                "models": [
                    {"model": "MPNN", "roc_auc": 0.757, "pr_auc": 0.304, "rank": 1},
                    {"model": "GCN", "roc_auc": 0.754, "pr_auc": 0.310, "rank": 2},
                    {"model": "GIN", "roc_auc": 0.747, "pr_auc": 0.306, "rank": 3},
                    {"model": "Baseline (RF)", "roc_auc": 0.730, "pr_auc": 0.349, "rank": 4},
                    {"model": "GAT", "roc_auc": 0.711, "pr_auc": 0.264, "rank": 5}
                ]
            }
        }
    }


@app.post("/api/analyze")
def analyze_molecule(req: AnalyzeRequest):
    """
    Complete Preclinical Analysis: 2D structure, ADMET, 3D conformer, and Multi-Model predictions.
    """
    smi = req.smiles.strip()
    if not smi:
        raise HTTPException(status_code=400, detail="SMILES string is empty. Please enter a valid structure.")

    mol = Chem.MolFromSmiles(smi)
    if mol is None:
        raise HTTPException(status_code=400, detail=f"Invalid SMILES chemical structure: '{smi}'")

    can_smi = Chem.MolToSmiles(mol)
    formula = Chem.rdMolDescriptors.CalcMolFormula(mol)
    inchikey = Chem.MolToInchiKey(mol)
    svg_2d = generate_molecule_svg(mol, width=420, height=320)

    # 1. ADMET Profile
    admet_profile = compute_admet_profile(mol)

    # 2. 3D Conformer & Strain Energy
    mol_3d, mol_block, energy, conf_status = generate_3d_conformer(mol)

    # 3. Multi-Model Predictions
    graph = smiles_to_graph(can_smi)

    # ESOL
    esol_ens = predict_ensemble(graph, "esol")
    esol_mean = float(esol_ens["mean"][0])
    esol_std = float(esol_ens["std"][0])
    esol_models = {m: round(float(v[0]), 3) for m, v in esol_ens["individual"].items()}
    if "baseline" in esol_models:
        esol_models["rf"] = esol_models["baseline"]

    esol_data = {
        "mean": round(esol_mean, 3),
        "std": round(esol_std, 3),
        "ci_lower": round(float(esol_ens["ci_lower"][0]), 3),
        "ci_upper": round(float(esol_ens["ci_upper"][0]), 3),
        "agreement": esol_ens["agreement"],
        "interpretation": "High Solubility (logS > -2)" if esol_mean > -2 else ("Moderate Solubility (-4 to -2)" if esol_mean >= -4 else "Poor / Insoluble (logS < -4)"),
        "models": esol_models
    }

    # BBBP
    bbbp_ens = predict_ensemble(graph, "bbbp")
    bbbp_prob = float(bbbp_ens["mean"][0])
    bbbp_std = float(bbbp_ens["std"][0])
    bbbp_models = {m: round(float(v[0]), 4) for m, v in bbbp_ens["individual"].items()}
    if "baseline" in bbbp_models:
        bbbp_models["rf"] = bbbp_models["baseline"]

    bbbp_data = {
        "probability": round(bbbp_prob, 4),
        "probability_pct": f"{bbbp_prob * 100:.1f}%",
        "std": round(bbbp_std, 4),
        "ci_lower": round(float(bbbp_ens["ci_lower"][0]), 4),
        "ci_upper": round(float(bbbp_ens["ci_upper"][0]), 4),
        "penetrates": bbbp_prob >= 0.5,
        "classification": "PENETRATES (P+)" if bbbp_prob >= 0.5 else "DOES NOT PENETRATE (P-)",
        "models": bbbp_models
    }

    # Tox21
    tox_ens = predict_ensemble(graph, "tox21")
    tox_tasks = tox_ens["task_names"]
    tox_mean = [round(float(p), 4) for p in tox_ens["mean"]]
    tox_std = [round(float(s), 4) for s in tox_ens["std"]]
    high_risk_count = sum(1 for p in tox_mean if p >= 0.5)

    tox_models_mean = {m: round(float(np.mean(v)), 4) for m, v in tox_ens["individual"].items()}
    if "baseline" in tox_models_mean:
        tox_models_mean["rf"] = tox_models_mean["baseline"]

    tox_models_high_risk = {m: int(np.sum(v >= 0.5)) for m, v in tox_ens["individual"].items()}
    if "baseline" in tox_models_high_risk:
        tox_models_high_risk["rf"] = tox_models_high_risk["baseline"]

    tox_pathways = []
    for i, t in enumerate(tox_tasks):
        pathway_models = {m: round(float(v[i]), 4) for m, v in tox_ens["individual"].items()}
        if "baseline" in pathway_models:
            pathway_models["rf"] = pathway_models["baseline"]
        tox_pathways.append({
            "assay": t,
            "probability": tox_mean[i],
            "probability_pct": f"{tox_mean[i] * 100:.1f}%",
            "std": tox_std[i],
            "risk": "HIGH RISK" if tox_mean[i] >= 0.5 else ("Moderate Risk" if tox_mean[i] >= 0.25 else "LOW RISK"),
            "models": pathway_models
        })

    tox_data = {
        "pathways": tox_pathways,
        "high_risk_count": high_risk_count,
        "mean_risk": round(float(np.mean(tox_mean)), 4),
        "max_risk": round(float(np.max(tox_mean)), 4),
        "aggregate_status": "CLEAN / LOW RISK" if high_risk_count == 0 else f"{high_risk_count} ELEVATED RISK PATHWAYS",
        "models": tox_models_mean,
        "models_high_risk": tox_models_high_risk
    }

    return {
        "smiles": can_smi,
        "formula": formula,
        "inchikey": inchikey,
        "heavy_atoms": mol.GetNumHeavyAtoms(),
        "graph_stats": {
            "num_nodes": int(graph.num_nodes),
            "num_edges": int(graph.num_edges),
            "node_dim": int(graph.x.size(1)),
            "edge_dim": int(graph.edge_attr.size(1)) if graph.edge_attr is not None else 0,
            "engine": "PyTorch Geometric 2.8 (Live Graph Inference)"
        },
        "svg_2d": svg_2d,
        "descriptors": admet_profile["descriptors"],
        "filters": admet_profile["filters"],
        "alerts": admet_profile["alerts"],
        "radar": admet_profile["radar"],
        "conformer": {
            "mol_block": mol_block,
            "energy_kcal": round(energy, 2) if energy is not None else None,
            "status": conf_status
        },
        "predictions": {
            "esol": esol_data,
            "bbbp": bbbp_data,
            "tox21": tox_data
        }
    }


@app.post("/api/conformer")
def get_conformer(req: ConformerRequest):
    """Generate 3D conformer coordinates and force-field strain energy."""
    smi = req.smiles.strip()
    mol = Chem.MolFromSmiles(smi)
    if mol is None:
        raise HTTPException(status_code=400, detail=f"Invalid SMILES chemical structure: '{smi}'")
    mol_3d, mol_block, energy, status = generate_3d_conformer(mol, seed=req.seed)
    return {
        "mol_block": mol_block,
        "energy_kcal": round(energy, 2) if energy is not None else None,
        "status": status
    }


@app.post("/api/explain")
def run_gnn_explainer(req: ExplainRequest):
    """
    Run GNNExplainer mutual information optimization to attribute pharmacophores.
    """
    smi = req.smiles.strip()
    mol = Chem.MolFromSmiles(smi)
    if mol is None:
        raise HTTPException(status_code=400, detail=f"Invalid SMILES chemical structure: '{smi}'")

    model = get_cached_model_instance(req.model, req.dataset)
    task_type = "regression" if req.dataset == "esol" else ("multitask_classification" if req.dataset == "tox21" else "classification")
    num_tasks = 12 if req.dataset == "tox21" else 1

    atom_imp, edge_imp, raw_pred = explain_molecule(
        model=model,
        smiles=smi,
        task_type=task_type,
        task_idx=req.task_idx,
        num_tasks=num_tasks,
        num_epochs=req.epochs
    )

    # Highlight top atom centers in red/salmon in SVG
    norm_imp = (atom_imp - np.min(atom_imp)) / (np.max(atom_imp) - np.min(atom_imp) + 1e-8)
    highlight_colors = {}
    top_indices = []

    for idx, w in enumerate(norm_imp):
        if w > 0.35:
            top_indices.append(idx)
            # Interpolate from salmon to crimson
            highlight_colors[idx] = (1.0, float(1.0 - w * 0.7), float(1.0 - w * 0.7))

    svg_highlighted = generate_molecule_svg(mol, width=480, height=360, highlight_atoms=top_indices, highlight_colors=highlight_colors)

    atom_details = []
    for idx, imp in enumerate(atom_imp):
        atom_obj = mol.GetAtomWithIdx(idx)
        atom_details.append({
            "atom_idx": idx,
            "element": atom_obj.GetSymbol(),
            "importance": round(float(imp), 4),
            "normalized_saliency": round(float(norm_imp[idx]), 3),
            "aromatic": atom_obj.GetIsAromatic(),
            "hybridization": str(atom_obj.GetHybridization())
        })

    atom_details = sorted(atom_details, key=lambda x: x["importance"], reverse=True)

    return {
        "svg_highlighted": svg_highlighted,
        "prediction": round(float(raw_pred), 4),
        "atom_details": atom_details[:8],
        "all_atoms": atom_details
    }


@app.post("/api/chemical-space")
def get_chemical_space(req: ChemicalSpaceRequest):
    """
    Project query molecule into 2D chemical landscape and find top nearest neighbors.
    """
    smi = req.smiles.strip()
    if not Chem.MolFromSmiles(smi):
        raise HTTPException(status_code=400, detail=f"Invalid SMILES chemical structure: '{smi}'")

    explorer = get_chemical_space_explorer(req.dataset)
    query_coords = explorer.project_molecule(smi)
    nearest = explorer.find_nearest_neighbors(smi, top_k=5)

    # Sample reference library points for background scatter
    ref_df = explorer.df
    if len(ref_df) > 300:
        sample_df = ref_df.sample(300, random_state=42)
    else:
        sample_df = ref_df

    ref_points = []
    for _, row in sample_df.iterrows():
        ref_points.append({
            "id": str(row["Compound ID"]),
            "x": round(float(row["PC1"]), 3),
            "y": round(float(row["PC2"]), 3),
            "target": round(float(row["Target Value"]), 2)
        })

    return {
        "query_coords": {"x": round(query_coords[0], 3), "y": round(query_coords[1], 3)} if query_coords else None,
        "reference_points": ref_points,
        "nearest_neighbors": nearest
    }


@app.post("/api/analogs")
def lead_optimization(req: AnalogsRequest):
    """
    Generate bioisosteres and R-group substituted derivatives with delta property shifts.
    """
    smi = req.smiles.strip()
    if not Chem.MolFromSmiles(smi):
        raise HTTPException(status_code=400, detail=f"Invalid SMILES chemical structure: '{smi}'")

    res = evaluate_lead_optimization(smi, target_dataset=req.dataset, max_analogs=req.max_analogs)
    formatted = []
    for item in res["analogs"]:
        formatted.append({
            "smiles": item["SMILES"],
            "transformation": item["Transformation"],
            "rationale": item["Rationale"],
            "predicted_value": round(float(item["Predicted Value"]), 3),
            "delta": round(float(item["Delta"]), 3),
            "qed": round(float(item["QED"]), 3),
            "mw": round(float(item["MW"]), 1),
            "logp": round(float(item["LogP"]), 2),
            "tpsa": round(float(item["TPSA"]), 1),
            "lipinski_pass": item["Lipinski Pass"]
        })
    return {
        "parent_val": round(res["parent_val"], 3),
        "parent_qed": round(res["parent_qed"], 3),
        "analogs": formatted
    }


@app.post("/api/batch-screen")
def batch_screen(req: BatchScreenRequest):
    """
    High-throughput virtual screening of candidate SMILES library.
    """
    if not req.smiles_list:
        raise HTTPException(status_code=400, detail="Empty candidate batch list provided.")

    df = screen_batch_molecules(
        smiles_list=req.smiles_list,
        compound_names=req.compound_names,
        prefer_bbb=req.prefer_cns
    )
    return df.to_dict(orient="records")


# Static file serving: Serve modern React production frontend (frontend/dist)
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))

if os.path.exists(os.path.join(FRONTEND_DIST, 'index.html')):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    def serve_react_app(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/", response_class=HTMLResponse)
    def serve_build_placeholder():
        return "<h1>BioGraph AI: Run 'cd frontend && npm run build' to compile React UI.</h1>"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)
