"""
Unit tests for Advanced Cheminformatics and AI modules:
ADMET, 3D conformers, Ensemble Uncertainty, Chemical Space, Analogs, and Batch Screening.
"""
import pytest
import numpy as np
import pandas as pd

from src.admet import compute_admet_profile
from src.conformers import generate_3d_conformer, render_3dmol_html
from src.ensemble import predict_ensemble, predict_all_endpoints
from src.chemical_space import get_chemical_space_explorer
from src.analogs import generate_analogs, evaluate_lead_optimization
from src.batch_screen import calculate_desirability_score, screen_batch_molecules


def test_admet_profile():
    """Verify ADMET descriptor and rule evaluation."""
    profile = compute_admet_profile("CC(=O)OC1=CC=CC=C1C(=O)O")  # Aspirin
    desc = profile["descriptors"]
    assert 179.0 < desc["Molecular Weight"] < 181.0
    assert 0.0 < desc["QED"] < 1.0
    assert profile["filters"]["Lipinski"]["passed"] is True
    assert profile["alerts"]["PAINS"]["has_alerts"] is False
    assert len(profile["radar"]) == 6


def test_conformers_and_3dmol():
    """Verify 3D embedding, force-field optimization, and HTML generation."""
    mol_3d, mol_block, energy, status = generate_3d_conformer("CC(=O)O")
    assert mol_3d is not None
    assert mol_block is not None
    assert energy is not None
    assert isinstance(energy, float)

    html = render_3dmol_html(mol_block, style="ball_and_stick", spin=True)
    assert "<div" in html
    assert "3Dmol" in html or "viewer" in html


def test_ensemble_predictions():
    """Verify multi-model ensemble consensus and uncertainty metrics."""
    res = predict_ensemble("CC(=O)OC1=CC=CC=C1C(=O)O", "esol")
    assert "mean" in res
    assert "std" in res
    assert "ci_lower" in res
    assert "agreement" in res
    assert res["num_models"] >= 4


def test_chemical_space_and_similarity():
    """Verify 2D projection and nearest neighbor retrieval."""
    exp = get_chemical_space_explorer("esol")
    coords = exp.project_molecule("CC(=O)OC1=CC=CC=C1C(=O)O")
    assert coords is not None
    assert len(coords) == 2

    nn = exp.find_nearest_neighbors("CC(=O)OC1=CC=CC=C1C(=O)O", top_k=3)
    assert len(nn) == 3
    assert nn[0]["Tanimoto Similarity"] > 0.0


def test_analogs_and_lead_optimization():
    """Verify in silico medchem analog generation."""
    analogs = generate_analogs("CC(=O)OC1=CC=CC=C1C(=O)O", max_analogs=3)
    assert len(analogs) > 0
    assert "smiles" in analogs[0]


def test_batch_screening_and_desirability():
    """Verify batch virtual screening and multi-objective desirability ranking."""
    score = calculate_desirability_score(
        qed=0.8,
        lipinski_pass=True,
        log_s=-2.5,
        max_tox_prob=0.1,
        has_pains=False
    )
    assert 0.0 <= score <= 100.0

    df = screen_batch_molecules(["CC(=O)O", "c1ccccc1"], ["Acetic Acid", "Benzene"])
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 2
    assert "Desirability Score" in df.columns
