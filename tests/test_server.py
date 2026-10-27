"""
Milestone 9 Unit Tests: BioGraph AI FastAPI Web Server Integration.
"""
import pytest
from fastapi.testclient import TestClient
from app.server import app

client = TestClient(app)


def test_api_health():
    """Verify health endpoint."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "MPNN" in data["architectures"]


def test_api_presets():
    """Verify presets endpoint returns curated drug library."""
    res = client.get("/api/presets")
    assert res.status_code == 200
    drugs = res.json()
    assert len(drugs) >= 10
    aspirin = next((d for d in drugs if d["name"] == "Aspirin"), None)
    assert aspirin is not None


def test_api_validate():
    """Verify fast typing validation endpoint with valid and invalid inputs."""
    # Valid SMILES
    res = client.post("/api/validate", json={"smiles": "CC(=O)OC1=CC=CC=C1C(=O)O"})
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["formula"] == "C9H8O4"
    assert data["heavy_atoms"] == 13

    # Invalid SMILES
    res_inv = client.post("/api/validate", json={"smiles": "c1ccccc"})  # Unclosed ring
    assert res_inv.status_code == 200
    data_inv = res_inv.json()
    assert data_inv["valid"] is False
    assert data_inv["error"] is not None

    # Empty SMILES
    res_empty = client.post("/api/validate", json={"smiles": ""})
    assert res_empty.status_code == 200
    assert res_empty.json()["valid"] is False


def test_api_benchmarks():
    """Verify benchmarks endpoint returns verified reproduced metrics."""
    res = client.get("/api/benchmarks")
    assert res.status_code == 200
    data = res.json()
    assert "esol" in data["datasets"]
    assert "bbbp" in data["datasets"]
    assert "tox21" in data["datasets"]


def test_api_analyze():
    """Verify complete analysis endpoint."""
    res = client.post("/api/analyze", json={"smiles": "CC(=O)OC1=CC=CC=C1C(=O)O"})
    assert res.status_code == 200
    data = res.json()
    assert data["formula"] == "C9H8O4"
    assert "<svg" in data["svg_2d"]
    assert "descriptors" in data
    assert "filters" in data
    assert "predictions" in data
    assert "esol" in data["predictions"]
    assert "bbbp" in data["predictions"]
    assert "tox21" in data["predictions"]
    for m in ["mpnn", "gin", "gat", "gcn", "rf", "baseline"]:
        assert m in data["predictions"]["esol"]["models"]
        assert m in data["predictions"]["bbbp"]["models"]
        assert m in data["predictions"]["tox21"]["models"]
    assert "models_high_risk" in data["predictions"]["tox21"]


def test_api_conformer():
    """Verify 3D conformer generation endpoint."""
    res = client.post("/api/conformer", json={"smiles": "CC(=O)O", "seed": 42})
    assert res.status_code == 200
    data = res.json()
    assert data["mol_block"] is not None
    assert data["energy_kcal"] is not None


def test_api_chemical_space():
    """Verify chemical space endpoint."""
    res = client.post("/api/chemical-space", json={"smiles": "CC(=O)OC1=CC=CC=C1C(=O)O", "dataset": "esol"})
    assert res.status_code == 200
    data = res.json()
    assert data["query_coords"] is not None
    assert len(data["nearest_neighbors"]) > 0


def test_api_analogs():
    """Verify lead optimization analogs endpoint."""
    res = client.post("/api/analogs", json={"smiles": "CC(=O)OC1=CC=CC=C1C(=O)O", "dataset": "esol", "max_analogs": 3})
    assert res.status_code == 200
    data = res.json()
    assert len(data["analogs"]) > 0


def test_api_batch_screen():
    """Verify batch virtual screening endpoint."""
    res = client.post("/api/batch-screen", json={
        "smiles_list": ["CC(=O)O", "c1ccccc1"],
        "compound_names": ["Acetic Acid", "Benzene"],
        "prefer_cns": False
    })
    assert res.status_code == 200
    rows = res.json()
    assert len(rows) == 2
    assert "Desirability Score" in rows[0]


def test_web_frontend_index():
    """Verify web frontend index.html is served."""
    res = client.get("/")
    assert res.status_code == 200
    assert "BioGraph AI" in res.text
