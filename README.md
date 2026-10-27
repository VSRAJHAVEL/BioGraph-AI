# Graph Neural Network-Based Molecular Property Prediction for Drug Discovery

A modular, CPU-optimized deep learning library for predicting chemical properties and bioactivity profiles directly from molecular graph structures, featuring Bemis-Murcko scaffold splitting, multiple GNN architectures (GCN, GAT, GIN, MPNN), classical Random Forest baselines, GNNExplainer pharmacophore attribution, and an interactive Streamlit web dashboard.

---

## 🔬 Key Capabilities

- **Atom & Bond Graph Featurization**: Converts raw SMILES strings into PyTorch Geometric (PyG) graphs using 48-dimensional atom vectors and 10-dimensional edge vectors via RDKit.
- **Robust Molecule Validation**: Automatically identifies and filters unparseable valence violations (e.g. 11 invalid SMILES in BBBP, 8 in Tox21) and caches preprocessed graphs on disk.
- **Deterministic Bemis-Murcko Scaffold Splitting**: Clustered by molecular scaffold and sorted deterministically by cluster size (descending) and scaffold string to strictly eliminate train/val/test scaffold leakage.
- **5 Architectures**:
  - **Classical Baseline**: 2048-bit Morgan Fingerprints (ECFP4) + physicochemical descriptors with Random Forest / Gradient Boosting.
  - **GCN** (Graph Convolutional Network): Normalized spectral neighborhood aggregation.
  - **GAT** (Graph Attention Network): Multi-head self-attention over bonded atomic neighbors.
  - **GIN** (Graph Isomorphism Network): Multi-layer perceptron (MLP) mapping maximizing expressiveness up to 1-WL graph isomorphism.
  - **MPNN** (Message Passing Neural Network): Edge-conditioned neural message passing (`NNConv`) with bond feature integration.
- **Dual Global Pooling**: Concatenation of Global Mean Pooling and Global Sum Pooling (`[mean_pool || add_pool]`) preserving both intensive and extensive molecular property information.
- **Interpretable Attribution (GNNExplainer)**: Identifies key pharmacophores and functional groups with 2D substructure heatmaps rendered directly by RDKit. Supports single-task regression/classification and multi-task bioassay panels (Tox21).
- **Multi-Model Consensus & Epistemic Uncertainty Quantification**: Aggregates predictions across GIN, MPNN, GAT, GCN, and Random Forest baselines, computing mean, standard deviation ($\sigma$), and 95% confidence intervals.
- **In Silico ADMET & Bioavailability Radar**: Evaluates Lipinski Rule of 5, Veber, Ghose, and Egan filter compliance alongside an interactive 6-axis bioavailability polygon radar chart (Plotly) and RDKit FilterCatalog alerts (PAINS & Brenk).
- **Interactive 3D Molecular Conformer Modeling**: Generates energy-minimized 3D conformations (MMFF94 / UFF force fields via ETKDG) rendered inside Streamlit via py3Dmol with interactive rotatable, zoomable stick, ball & stick, sphere, and solvent-accessible surface overlays.
- **Chemical Space & Tanimoto Structural Search**: Projects query molecules into 2D chemical space (PCA over 512-bit Morgan fingerprints) and identifies the top-K closest benchmark neighbors.
- **In Silico Lead Optimization**: Generates bioisosteres and R-group substituted derivatives (-F, -CF3, -Cl, -CH3, -OH, -OCH3, -NH2, -CN, tetrazoles) and ranks candidate analogs along an optimization Pareto frontier.
- **High-Throughput Virtual Screening**: Batch screening engine ranking compound libraries using a multi-objective Drug Desirability Score (0-100) with one-click CSV export.
- **Interactive Enterprise Streamlit Studio**: Executive dark biotech dashboard featuring JSME chemical structure sketcher, preset FDA drug libraries, and candidate report export.

---

## 📊 Benchmark Results (Bemis-Murcko Scaffold Test Split)

Evaluated on the held-out Bemis-Murcko scaffold test split (80/10/10) with verified zero scaffold leakage:

### 1. Aqueous Solubility (ESOL — Delaney Regression, logS in mol/L)
| Model Architecture | Test RMSE ↓ | Test MAE ↓ | Test R² ↑ | Train Time (s) |
| :--- | :--- | :--- | :--- | :--- |
| **MPNN** | **1.010** | **0.777** | **0.784** | 43.1s |
| **GIN** | 1.054 | 0.812 | 0.764 | 15.2s |
| **GCN** | 1.080 | 0.811 | 0.753 | 13.6s |
| **Baseline (RF)** | 1.109 | 0.859 | 0.739 | 1.6s |
| **GAT** | 1.208 | 0.938 | 0.691 | 20.5s |

### 2. Blood-Brain Barrier Penetration (BBBP — Binary Classification)
| Model Architecture | Test ROC-AUC ↑ | Test PR-AUC ↑ | Train Time (s) |
| :--- | :--- | :--- | :--- |
| **Baseline (RF)** | **0.853** | **0.978** | 2.2s |
| **GIN** | 0.723 | 0.936 | 36.7s |
| **GCN** | 0.719 | 0.951 | 20.5s |
| **MPNN** | 0.665 | 0.944 | 121.9s |
| **GAT** | 0.624 | 0.928 | 43.9s |

### 3. Toxicity Profiling (Tox21 — 12 Multi-Task Classification with Missing Label Masking)
| Model Architecture | Test ROC-AUC ↑ | Test PR-AUC ↑ | Train Time (s) |
| :--- | :--- | :--- | :--- |
| **MPNN** | **0.757** | 0.304 | 743.9s |
| **GCN** | 0.754 | 0.310 | 68.0s |
| **GIN** | 0.747 | 0.306 | 57.2s |
| **Baseline (RF)** | 0.730 | **0.349** | 19.9s |
| **GAT** | 0.711 | 0.264 | 68.4s |

---

## 🧮 Mathematical Formulations

### Molecular Graph Representation
A molecule is modeled as an attributed graph $\mathcal{G} = (\mathcal{V}, \mathcal{E})$ where:
- $\mathbf{X} \in \mathbb{R}^{|\mathcal{V}| \times 48}$ represents node features (atom symbol, hybridization, formal charge, degree, total hydrogens, aromaticity).
- $\mathbf{E} \in \mathbb{R}^{|\mathcal{E}| \times 10}$ represents edge features (bond type one-hot, conjugation flag, ring membership, stereochemistry).

### Message Passing Layers
1. **GCN Layer**:
   $$\mathbf{h}_i^{(l+1)} = \sigma\left(\mathbf{W}^{(l)} \sum_{j \in \mathcal{N}(i) \cup \{i\}} \frac{1}{\sqrt{\tilde{d}_i \tilde{d}_j}} \mathbf{h}_j^{(l)}\right)$$

2. **GAT Layer (Multi-Head)**:
   $$\mathbf{h}_i^{(l+1)} = \Vert_{k=1}^K \sigma\left(\sum_{j \in \mathcal{N}(i)} \alpha_{ij}^k \mathbf{W}^k \mathbf{h}_j^{(l)}\right), \quad \alpha_{ij} = \text{Softmax}_j\left(\text{LeakyReLU}\left(\mathbf{a}^\top [\mathbf{W}\mathbf{h}_i \,\|\, \mathbf{W}\mathbf{h}_j]\right)\right)$$

3. **GIN Layer**:
   $$\mathbf{h}_i^{(l+1)} = \text{MLP}^{(l)}\left(\left(1 + \epsilon^{(l)}\right)\mathbf{h}_i^{(l)} + \sum_{j \in \mathcal{N}(i)} \mathbf{h}_j^{(l)}\right)$$

4. **MPNN / NNConv Layer (Edge-Conditioned)**:
   $$\mathbf{h}_i^{(l+1)} = \mathbf{\Theta} \mathbf{h}_i^{(l)} + \sum_{j \in \mathcal{N}(i)} \mathbf{h}_j^{(l)} \cdot h_{\mathbf{\Theta}'}\left(\mathbf{e}_{ji}\right)$$
   where $h_{\mathbf{\Theta}'}(\cdot)$ is a 2-layer MLP generating edge-specific transformation matrices from bond feature vectors $\mathbf{e}_{ji}$.

### Dual Global Pooling
$$\mathbf{h}_{\mathcal{G}} = \left[\frac{1}{|\mathcal{V}|}\sum_{i \in \mathcal{V}} \mathbf{h}_i^{(L)} \;\Bigg\|\; \sum_{i \in \mathcal{V}} \mathbf{h}_i^{(L)}\right] \in \mathbb{R}^{2 \cdot d_{\text{hidden}}}$$

---

## 🚀 Quickstart Guide

### 1. Environment Installation
```bash
# Clone and enter workspace
cd /home/vsrajhavel/Desktop/Graph

# Run automated CPU setup
bash setup.sh
source .venv/bin/activate
```

### 2. Run Test Suite
```bash
pytest tests/
```
Output: `33 passed in 9.89s`

### 3. Model Training
```bash
# Quick smoke test (2 epochs on trimmed subset)
python src/train.py --dataset esol --model gcn --quick

# Full multi-seed benchmark on ESOL
python src/train.py --dataset esol --model all

# Full benchmark on BBBP or Tox21
python src/train.py --dataset bbbp --model all
python src/train.py --dataset tox21 --model all --seeds 42
```

### 4. Evaluation & Diagnostic Plots
```bash
python src/evaluate.py
```
Generated artifacts in `results/plots/`:
- `esol_loss_curves.png`, `bbbp_loss_curves.png`, `tox21_loss_curves.png`
- `esol_parity_gin.png`, `esol_parity_mpnn.png`
- `bbbp_roc_pr.png`, `tox21_roc_pr.png`
- `esol_tsne_mpnn.png`, `bbbp_tsne_gin.png`, `tox21_tsne_mpnn.png`
- `results/REPORT.md`

### 5. GNNExplainer Substructure Attribution
```bash
# Explain Aspirin solubility using MPNN
python src/explain.py --model mpnn --dataset esol --smiles "CC(=O)OC1=CC=CC=C1C(=O)O" --output results/plots/aspirin_esol_mpnn.png

# Explain Aspirin toxicity pathway 2 on Tox21
python src/explain.py --model mpnn --dataset tox21 --task_idx 2 --smiles "CC(=O)OC1=CC=CC=C1C(=O)O" --output results/plots/aspirin_tox21_mpnn.png
```

### 6. Launch Standalone Modern Web Studio (No Streamlit Needed)
```bash
python app/server.py
# Or using Uvicorn directly:
uvicorn app.server:app --host 0.0.0.0 --port 8000 --reload
```
Access the modern web dashboard directly in your browser at `http://localhost:8000` (and OpenAPI documentation at `http://localhost:8000/docs`).

---

## 📂 Repository Structure

```
Graph/
├── configs/
│   ├── esol.yaml              # Hyperparameters for ESOL regression
│   ├── bbbp.yaml              # Hyperparameters for BBBP classification
│   └── tox21.yaml             # Hyperparameters for Tox21 multi-task classification
├── data/
│   ├── raw/                   # Raw downloaded MoleculeNet CSVs
│   └── processed/             # Cached PyG graph dataset bundles (.pt)
├── src/
│   ├── data.py                # SMILES featurizer, RDKit parser, scaffold splitter
│   ├── train.py               # CPU training loop, loss masking, early stopping
│   ├── evaluate.py            # Diagnostic plotting & report generation
│   ├── explain.py             # GNNExplainer attribution & RDKit 2D drawer
│   ├── admet.py               # ADMET descriptors, Lipinski/Veber rules, PAINS/Brenk alerts
│   ├── conformers.py          # 3D ETKDG embedding, MMFF94 optimization, py3Dmol visualizer
│   ├── ensemble.py            # Multi-model consensus & epistemic uncertainty quantification
│   ├── chemical_space.py      # 2D PCA chemical space projection & Tanimoto neighbor retrieval
│   ├── analogs.py             # In silico lead optimization & bioisosteric analog generation
│   ├── batch_screen.py        # High-throughput screening & drug candidate desirability scoring
│   └── models/
│       ├── baseline.py        # Morgan fingerprint (ECFP4) Random Forest
│       └── gnn.py             # GCN, GAT, GIN, and MPNN (NNConv) architectures
├── app/
│   ├── server.py              # High-performance FastAPI REST server & OpenAPI documentation
│   └── static/
│       └── index.html         # Modern SPA Web Studio (Tailwind, 3Dmol.js, Chart.js, JSME)
├── results/
│   ├── checkpoints/           # Saved PyG and Scikit-learn model weights (.pt, .pkl)
│   ├── plots/                 # Parity, ROC/PR, loss trajectories, and t-SNE figures
│   └── REPORT.md              # Markdown benchmark summary
├── tests/
│   ├── test_env.py            # Milestone 1: Environment & Pure PyG ops
│   ├── test_data.py           # Milestone 2: Featurization & Scaffold isolation
│   ├── test_baseline.py       # Milestone 3: Classical ML baselines
│   ├── test_models.py         # Milestone 4: GNN forward & backward passes
│   ├── test_train.py          # Milestone 5: Masked loss & training pipeline
│   ├── test_explain.py        # Milestone 7: GNNExplainer & 2D rendering
│   ├── test_advanced.py       # Advanced Suite: ADMET, 3D, Ensemble, Space, Analogs, Batch
│   └── test_server.py         # Milestone 9: FastAPI & Web Studio integration tests
├── pytest.ini                 # Pytest configuration ignoring ROS entrypoints
├── requirements.txt           # Pinned CPU dependencies (FastAPI, Uvicorn, PyG, RDKit)
├── setup.sh                   # Environment setup script
└── README.md                  # Comprehensive project documentation
```

---

## 👨‍💻 Author & Engineering Credits

**Handcrafted by RAJHAVEL V S**

- 🌐 **Portfolio**: [vsrajhavel.github.io](https://vsrajhavel.github.io)
- 💼 **LinkedIn**: [in/rajhavelvs](https://in.linkedin.com/in/rajhavelvs)
- 🐙 **GitHub**: [github.com/VSRAJHAVEL](https://github.com/VSRAJHAVEL)

---

