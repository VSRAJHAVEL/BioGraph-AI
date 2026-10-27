# BioGraph AI — Frontend Design Specification & Google Stitch AI Design System Guide

> **Document Purpose:** This document provides the complete structural, visual, functional, and component specification for the **BioGraph AI** platform. It is formatted specifically as an authoritative prompt and reference input for **Google Stitch AI** (and AI UI design tools like Galileo AI, Figma AI, and v0) to synthesize high-fidelity UI/UX layouts, component trees, and interactive prototypes.

---

## 1. Product Identity, Brand Persona & Design Philosophy

### 1.1 Product Definition
**BioGraph AI** is a state-of-the-art **Biotech & Computer-Aided Drug Discovery (CADD)** platform powered by Deep Graph Neural Networks (MPNN, GIN, GAT, GCN) and RDKit cheminformatics. It enables medicinal chemists, pharmacologists, and computational researchers to:
1. Predict physicochemical and biochemical properties (Aqueous Solubility / ESOL, Blood-Brain Barrier Permeability / BBBP, and Tox21 multi-task toxicity).
2. Quantify epistemic uncertainty ($\pm \sigma$) via deep model ensembling.
3. Inspect atomic feature attributions using GNNExplainer graph mutual information subgraphs.
4. Profile ADMET drug-likeness (6-axis bioavailability radar, Lipinski Rule of 5, Veber, PAINS, Brenk).
5. Minimize 3D molecular conformations using MMFF94 force-field physics in WebGL.
6. Screen combinatorial libraries with multi-parameter desirability ranking.
7. Interactively sketch molecular graphs using a native vector chemical canvas.

### 1.2 Visual Persona & Aesthetic Target
- **Industry Category:** Enterprise Biotech SaaS / Scientific Deep-Tech AI.
- **Visual Vibe:** Futuristic, hyper-clean, laboratory-grade precision, dark-first glassmorphism with vivid bioluminescent accents (emerald, cyan, violet).
- **Not This:** Academic toy project, generic Bootstrap dashboard, low-contrast flat minimalism.
- **Reference Benchmarks:** Linear app, Stripe Dashboard, Insitro, Relay Therapeutics, Benchling, Vercel design systems.
- **Accessibility Target:** WCAG 2.1 AA compliant, visible keyboard focus rings, high-contrast text, full support for `prefers-reduced-motion`.

---

## 2. Design Tokens & Design System Specification

### 2.1 Color Palette & Theme Tokens

```css
/* Base Canvas & Background Surfaces */
--bg-canvas: #070b14;          /* Deep cosmic midnight - main app backdrop */
--bg-surface-1: #0d1527;        /* Elevated card background (opacity 80% with backdrop-blur) */
--bg-surface-2: #131f38;        /* Hovered card / secondary elevated surface */
--bg-surface-3: #1c2b4c;        /* Active pill / selected state surface */
--border-subtle: #1e293b;       /* Subtle slate border for cards */
--border-focused: #38bdf8;      /* Electric sky blue for active inputs */

/* Primary Brand Accents (Bio-luminescent Energy) */
--brand-primary: #10b981;       /* Emerald Green - represents bioavailability, safety, success */
--brand-secondary: #06b6d4;     /* Cyan Neon - represents graph neural connections, data flows */
--brand-glow: rgba(16, 185, 129, 0.15); /* Soft outer glow on active metrics */

/* Semantic Data Visualization Accents */
--status-success: #10b981;      /* High solubility, non-toxic, passed filters */
--status-warning: #f59e0b;      /* Moderate solubility, borderline drug-likeness */
--status-danger: #ef4444;       /* High toxicity, PAINS alert, insoluble */
--status-info: #3b82f6;         /* Informational popover, neutral metrics */
--model-mpnn: #8b5cf6;          /* Purple for Message Passing Neural Network */
--model-gin: #ec4899;           /* Pink for Graph Isomorphism Network */
--model-gat: #f97316;           /* Orange for Graph Attention Network */
--model-gcn: #3b82f6;           /* Blue for Graph Convolutional Network */
--model-rf: #14b8a6;            /* Teal for Random Forest Baseline */

/* Typography Colors */
--text-primary: #f8fafc;        /* Crisp white for headlines and key values */
--text-secondary: #94a3b8;      /* Muted slate for labels, descriptions */
--text-tertiary: #64748b;       /* Dim slate for tooltips, placeholders, legends */
--text-code: #38bdf8;           /* High-contrast cyan for SMILES, formulas, code */
```

### 2.2 Typography Scale
- **Primary Font Family:** `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Monospace Font Family:** `JetBrains Mono`, `Fira Code`, "SF Mono", Menlo, monospace (mandatory for SMILES, InChI, PDB coordinates, atom indices).
- **Scale Hierarchy:**
  - **Hero Display:** 32px / 2rem, Weight: 700 (Bold), Letter-spacing: -0.025em.
  - **Page Title (H1):** 24px / 1.5rem, Weight: 700 (Bold), Letter-spacing: -0.02em.
  - **Section Heading (H2):** 18px / 1.125rem, Weight: 600 (Semi-bold).
  - **Card Header (H3):** 15px / 0.9375rem, Weight: 600 (Semi-bold), uppercase tracking-wider.
  - **Body (Default):** 14px / 0.875rem, Weight: 400 (Regular), Line-height: 1.5.
  - **Metric Value (Hero):** 28px - 36px, Weight: 800 (Extra-bold), tabular numbers.
  - **Caption / Meta:** 12px / 0.75rem, Weight: 500 (Medium).
  - **Chemical Code:** 13px / 0.8125rem, Weight: 500 (Medium), monospace.

### 2.3 Elevation, Borders & Glassmorphism
- **Glassmorphic Surface Class:** `bg-[#0d1527]/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl shadow-black/40 rounded-2xl`
- **Subtle Glow Filter:** `drop-shadow(0 0 15px rgba(16, 185, 129, 0.2))`
- **Radius Scale:**
  - Badges/Pills: `rounded-full` (9999px)
  - Inputs/Buttons: `rounded-xl` (12px)
  - Cards/Containers: `rounded-2xl` (16px)
  - Modals/Drawers: `rounded-3xl` (24px)

---

## 3. High-Level Layout Blueprint & Navigation

```
+----------------------------------------------------------------------------------------------------+
|  TOP NAVIGATION BAR                                                                                |
|  [Logo: BioGraph AI]  [Search / Cmd+K Palette]   [Presets Menu]  [API: Healthy]  [Theme] [Help (?)]|
+-------------------+--------------------------------------------------------------------------------+
| SIDEBAR (Expand/  | MAIN APP WORKSPACE (Dynamic Page Outlet)                                      |
| Collapse)         |                                                                                |
|                   | +----------------------------------------------------------------------------+ |
| [x] Predict       | | "How to use this page" Guidance Card (Collapsible, numbered steps)        | |
| [ ] 3D Viewer     | +----------------------------------------------------------------------------+ |
| [ ] ADMET Radar   |                                                                                |
| [ ] GNNExplainer  | +----------------------------------------------------------------------------+ |
| [ ] Chem Space    | | GLOBAL INPUT HERO:                                                         | |
| [ ] Lead Opt      | | [ SMILES Input: CC(=O)Oc1ccccc1C(=O)O ] [Draw 2D] [Model Selector] [RUN] | |
| [ ] Batch Screen  | +----------------------------------------------------------------------------+ |
| [ ] Benchmarks    |                                                                                |
| [ ] Help Guide    | +------------------------------+ +-------------------------------------------+ |
|                   | | Primary Prediction Card      | | Model Consensus Multi-Bar Chart           | |
| ----------------- | | - Value: -2.14 logS          | | - MPNN: -2.05 | GIN: -2.18                | |
| [System Specs]    | | - Confidence: ±0.32          | | - GAT: -2.25  | GCN: -2.14                | |
| PyG 2.8 | RDKit   | | - Badge: Moderately Soluble  | | - RF:  -2.09  | Spread: 0.20              | |
| 0 Scaffold Leak   | +------------------------------+ +-------------------------------------------+ |
+-------------------+--------------------------------------------------------------------------------+
```

### 3.1 Persistent Global Components
1. **Collapsible Left Navigation Sidebar (Width: 260px expanded, 72px collapsed):**
   - Logo with glowing atom icon + "BioGraph AI" typography + "v2.0 PROD" badge.
   - Navigation links with Lucide icons:
     - `Predict`: FlaskConical icon
     - `3D Viewer`: Box / Cuboid icon
     - `ADMET`: ShieldCheck icon
     - `Explain`: Network / GitFork icon
     - `Chemical Space`: Orbit / ScatterPlot icon
     - `Analog Optimizer`: Sparkles / Split icon
     - `Batch Screening`: Layers / Table icon
     - `Benchmarks`: Trophy / BarChart3 icon
     - `Help Center`: BookOpen / HelpCircle icon
   - Bottom status card: PyTorch Geometric 2.8 engine badge, 0% scaffold leakage guarantee indicator.

2. **Top Bar (Height: 64px):**
   - Quick command palette search trigger: `Search molecules or press Cmd+K`.
   - Preset molecule pills: `[Aspirin]`, `[Caffeine]`, `[Ibuprofen]`, `[Paracetamol]`, `[Atorvastatin]`.
   - Backend health status badge: Pulsing green dot with `FastAPI :8000 Online`.
   - Help / Tour trigger: `(?) Quick Tour` button to replay the step-by-step spotlight onboarding.

3. **Contextual Guidance Card (Top of every screen):**
   - Framer Motion collapsible card with an emerald lightbulb icon.
   - Title: "How to use this page" + "What am I looking at?" explanation.
   - Action: "Try an Example" button that automatically fills a relevant molecule and executes the workflow.

---

## 4. Screen-by-Screen Detailed Specifications & UI Prompts

---

### SCREEN 1: Molecular Property Prediction Studio (`/predict`)

#### Purpose & User Workflow
Allows users to enter any chemical SMILES or draw a structure, choose one or more Graph Neural Network architectures, and receive real-time regression (solubility) or classification (BBB penetration, Tox21 toxicity) predictions with quantified epistemic uncertainty.

#### Component Breakdown & Layout
1. **Hero SMILES Input Bar:**
   - Text input with real-time debounced syntax validation (green checkmark or clear red chemistry error message).
   - "Draw Structure" button with PenTool icon that launches the full-screen Native Vector Chemical Canvas modal.
   - Quick preset selector chips.
   - Target property tabs:
     - `Aqueous Solubility (ESOL)` (Regression, log mol/L)
     - `Blood-Brain Barrier (BBBP)` (Binary Classification)
     - `Tox21 Toxicity Panel` (12-Task Multi-label Classification)
   - Model architecture selector chips: `[x] All Ensemble`, `[x] MPNN`, `[x] GIN`, `[x] GAT`, `[x] GCN`, `[x] Random Forest`.
   - Primary "Predict Properties" action button with pulsing gradient on hover and animated spinner during execution.

2. **2D Structure Preview Card:**
   - RDKit vector SVG rendering of the entered SMILES with dark-mode inverted atom colors (carbons white, nitrogens blue, oxygens red, halogens green).
   - Chemical summary badges: Formula ($C_9H_8O_4$), Exact Molecular Weight (180.16 g/mol), Rotatable Bonds, H-Bond Donors/Acceptors.

3. **Consensus Prediction Card:**
   - Large hero metric display with animated counter: e.g., `-2.14 logS`.
   - Epistemic uncertainty range badge: `± 0.32 logS (95% CI)`.
   - Qualitative interpretation pill:
     - Green badge: "Soluble (> -2.0)"
     - Amber badge: "Moderately Soluble (-4.0 to -2.0)"
     - Red badge: "Poorly Soluble (< -4.0)"
   - Info icon (`i`) opening the popover explaining what aqueous solubility means for oral absorption.

4. **Multi-Model Consensus Bar Chart:**
   - Horizontal bar comparison chart (Recharts) showing predictions from MPNN, GIN, GAT, GCN, and Random Forest.
   - Dotted vertical line indicating the weighted ensemble mean.
   - Shaded band indicating the inter-model variance $\sigma$.

5. **Next Step Action Card:**
   - Banner: "Molecule predicted successfully. Want to inspect which functional groups drove this prediction?"
   - Button: `Explain Prediction with GNNExplainer ->` (pre-fills molecule into `/explain`).

---

### SCREEN 2: 3D Conformation & Force-Field Studio (`/viewer3d`)

#### Purpose & User Workflow
Converts 2D chemical topology into a realistic, low-energy 3D stereochemical conformation using RDKit's ETKDGv3 distance-geometry algorithm and relaxes it via MMFF94 force-field physics.

#### Component Breakdown & Layout
1. **Left Control Panel (Width: 340px):**
   - Active SMILES indicator and formula.
   - Calculated Conformation Energy card: `Total MMFF94 Energy: 24.32 kcal/mol`.
   - Force field selector: `[MMFF94 (Merck)]` vs `[UFF (Universal)]`.
   - Conformer generation parameters: Maximum iterations slider (100–1000), random seed.
   - Display Representation radio buttons:
     - `Ball & Stick` (Standard CPK colors)
     - `Sticks / Licorice`
     - `Space-filling Spheres (van der Waals)`
     - `Wireframe`
   - Surface overlay toggle: `None` | `Solvent Accessible Surface (SAS)` | `Electrostatic Potential (ESP)`.
   - Export actions: `Download PDB`, `Download SDF (3D)`.

2. **Right WebGL Canvas (3Dmol.js):**
   - Full dark-mode 3D viewport with subtle Cartesian grid floor.
   - Interactive mouse controls: Click & drag to rotate, right-click to pan, scroll to zoom.
   - Viewport HUD overlay:
     - Quick orientation reset buttons: `[X]`, `[Y]`, `[Z]`, `[Reset View]`.
     - Fullscreen toggle button.
     - Auto-spin toggle button.

---

### SCREEN 3: In Silico ADMET & Bioavailability Profiler (`/admet`)

#### Purpose & User Workflow
Profiles drug absorption, distribution, metabolism, excretion, and toxicity constraints to evaluate whether a molecule possesses oral bioavailability and passes medicinal chemistry filters.

#### Component Breakdown & Layout
1. **Six-Axis Bioavailability Radar Chart (Plotly or Recharts):**
   - Radial polygon chart evaluating the 6 physicochemical criteria for human oral bioavailability:
     1. **LIPO (Lipophilicity):** XLogP between $-0.7$ and $+5.0$.
     2. **SIZE (Molecular Weight):** MW between $150$ and $500\text{ g/mol}$.
     3. **POLAR (Polarity):** TPSA between $20$ and $130\text{ \AA}^2$.
     4. **INSOLU (Insolubility):** LogS between $-6$ and $0$.
     5. **FLEX (Flexibility):** Rotatable bonds $\le 9$.
     6. **UNSAT (Unsaturation):** Fraction of $sp^3$ carbons ($Fsp^3 \ge 0.25$).
   - Visual Styling: Semi-transparent green shaded polygon representing the "Golden Bioavailability Envelope", overlaid with the target molecule's magenta polygon. If the molecule exceeds boundaries, the polygon extends into the red zone.

2. **Medicinal Chemistry Filter Cards (Grid of 4 Cards):**
   - **Lipinski's Rule of Five:** Pass/Fail badge with criteria checklist (MW $\le 500$, LogP $\le 5$, HBD $\le 5$, HBA $\le 10$).
   - **Veber Oral Bioavailability Rule:** Pass/Fail badge (Rotatable Bonds $\le 10$, TPSA $\le 140\text{ \AA}^2$).
   - **PAINS Structural Alerts (Pan-Assay Interference):** Zero alerts detected or list of reactive quinone/rhodanine substructure matches.
   - **Brenk Toxicological Filters:** Flags unwanted moieties (heavy metals, nitroso groups, reactive halides).

3. **Quantitative Physicochemical Property Grid:**
   - 8-metric telemetry cards: MW, LogP, TPSA, H-Bond Donors, H-Bond Acceptors, Rotatable Bonds, Heavy Atom Count, Aromatic Ring Count.

---

### SCREEN 4: Explainable AI: GNNExplainer Subgraph Studio (`/explain`)

#### Purpose & User Workflow
Applies GNNExplainer to identify the minimal, most informative subgraphs and chemical bonds that maximize mutual information $I(Y; G_S)$ with the GNN's prediction, rendering explainable heatmaps directly onto the 2D molecule.

#### Component Breakdown & Layout
1. **Interactive Subgraph Visualization Panel:**
   - 2D molecular graph rendered via SVG with **atom and bond importance heatmaps**:
     - High importance ($0.8 - 1.0$): Bright glowing emerald/yellow highlight.
     - Moderate importance ($0.4 - 0.7$): Soft cyan highlight.
     - Low importance ($< 0.4$): Dim translucent slate outline.
   - Interactive hovering: Hovering an atom highlights its atomic index, element symbol, hybridization ($sp^2, sp^3$), and exact mathematical importance weight.

2. **Top Contributing Chemical Motifs (Pharmacophore Substructures):**
   - Ranked list of functional groups identified by the explainer (e.g., `#1 Carboxylic Acid moiety: +42% solubility contribution`, `#2 Phenyl ring: -28% solubility contribution`).
   - Plain-English interpretation card: "The model focused 68% of its attention on the polar carboxylic acid group, which explains the high aqueous solubility prediction."

3. **Optimization Hyperparameter Drawer (For Advanced Users):**
   - Slider for GNNExplainer epochs (100–300), edge mask learning rate, and mutual information threshold slider to filter insignificant bonds.

---

### SCREEN 5: Chemical Space & Tanimoto Neighborhood (`/chemical-space`)

#### Purpose & User Workflow
Projects the user's molecule into the broader multi-thousand molecule training set (Delaney ESOL, BBBP, Tox21) using 2D Principal Component Analysis (PCA) or t-SNE over 2048-bit Morgan Fingerprints, demonstrating whether the molecule lies in-distribution or out-of-distribution.

#### Component Breakdown & Layout
1. **2D Chemical Space Scatter Plot:**
   - Interactive zoomable scatter plot with thousands of subtle background dots representing training set molecules, color-coded by their property (solubility or toxicity).
   - Large, glowing pulsating star icon indicating the user's query molecule.
   - Convex hull indicating the domain of applicability (applicability envelope).

2. **Nearest Neighbors by Tanimoto Similarity:**
   - Table of top 5 most structurally similar molecules in the benchmark training dataset:
     - Columns: 2D Depiction, Molecule Name / SMILES, Tanimoto Similarity Score ($0.0 - 1.0$), Experimental Value, Predicted Value, Prediction Error ($\Delta$).

---

### SCREEN 6: Bioisosteric Analog & Lead Optimizer (`/analogs`)

#### Purpose & User Workflow
Performs Matched Molecular Pair (MMP) analysis to generate bioisosteric functional group replacements (e.g., replacing $-OH$ with $-F$, or $-COOH$ with Tetrazole), predicting the delta property shifts in solubility and permeability.

#### Component Breakdown & Layout
1. **Analog Generator Configuration Bar:**
   - Target property optimization goal: `[Maximize Solubility]` | `[Enhance BBB Permeability]` | `[Reduce Toxicity]`.
   - Max structural modifications slider (1 to 3 substitutions).

2. **Lead Optimization Candidates Table:**
   - Card grid or sortable table of generated analogs:
     - Chemical 2D Structure.
     - Substitution rule applied (e.g., `Carboxyl -> 1,2,4-Oxadiazole`).
     - New predicted property value.
     - Delta shift ($\Delta = +1.4\text{ logS}$).
     - Drug-likeness score change.
     - "Send to Studio" button to instantly analyze this analog.

---

### SCREEN 7: High-Throughput Batch Virtual Screening (`/batch`)

#### Purpose & User Workflow
Enables researchers to upload a CSV or SDF file containing up to 10,000 compound SMILES, execute parallel GNN inference, and filter candidates using Multi-Parameter Optimization (MPO) Desirability scoring.

#### Component Breakdown & Layout
1. **Library Ingestion Area:**
   - Drag-and-drop file upload zone supporting `.csv`, `.txt`, `.sdf`, or direct multi-line text input.
   - Example dataset quick-load: `Load 50 FDA-Approved Drugs Sample`.

2. **Multi-Parameter Optimization (MPO) Filters:**
   - Multi-slider control panel:
     - Solubility target range: `[-4.0 to -1.0 logS]`
     - BBB Permeability target: `[Permeable only (P > 0.70)]`
     - Maximum Toxicity Threshold: `[Tox21 Probability < 0.20]`
     - Lipinski Rule of 5: `[Must pass with 0 violations]`

3. **High-Performance Results Data Table (TanStack Table):**
   - Virtualized, sortable, paginated table showing 2D structure thumbnails, SMILES, MW, LogS, BBBP, Tox21, and Overall Desirability Score ($0.0 - 1.0$).
   - Export toolbar: `[Export Filtered Candidates to CSV]`, `[Export to SDF]`, `[Copy SMILES List]`.

---

### SCREEN 8: Benchmarks, Leaderboard & Scaffold Transparency (`/benchmarks`)

#### Purpose & User Workflow
Presents the verified empirical scientific metrics reproduced directly from trained model checkpoints on strict Bemis-Murcko zero-leakage scaffold splits, proving transparency without fake or inflated numbers.

#### Component Breakdown & Layout
1. **Scaffold Partitioning Architecture Diagram:**
   - Flow visual showing Bemis-Murcko core scaffold extraction, grouping molecules by Murcko ring assembly, and partitioning into strictly disjoint 80% Train, 10% Validation, 10% Test sets (0% scaffold overlap).

2. **Interactive Benchmark Leaderboard:**
   - Tab switchers: `ESOL Delaney`, `BBBP`, `Tox21 12-Task`.
   - Table columns: Architecture, Model Type, Test Metric 1 (RMSE / ROC-AUC), Test Metric 2 (MAE / PR-AUC), $R^2$ Score, Number of Parameters, Inference Latency per Molecule.
   - Verified highlighted winners: MPNN on Tox21 (0.7513 ROC-AUC), GIN on BBBP (0.7188 ROC-AUC), GCN on ESOL (1.0795 RMSE).

---

## 5. The Native Vector 2D Chemical Canvas Studio (Modal Specification)

> **Critical UI Component:** Replaces outdated third-party Java/GWT applets with a clean, high-performance, dark-themed SVG vector chemical sketcher.

```
+----------------------------------------------------------------------------------------------------+
|  MOLECULAR CANVAS STUDIO                                                         [X Close Modal]   |
+-------------------+--------------------------------------------------------------------------------+
| TOOL PALETTE      | DRAWING CANVAS (Dark Blueprint Dot-Grid: #070b14)                              |
|                   |                                                                                |
| Modes:            |                 O                                                              |
| [Select / Move]   |                //                                                              |
| [Erase Atom/Bond] |          C1 -- C2                                                              |
|                   |         /        \                                                             |
| Bond Tools:       |        N3        C4 = O                                                        |
| [Single Bond -]   |         \        /                                                             |
| [Double Bond =]   |          C5 -- C6                                                              |
| [Triple Bond #]   |                                                                                |
|                   | (Interactive: Click to drop atom, Drag to connect bond, Click bond to cycle)   |
| Atom Palette:     |                                                                                |
| [C] [N] [O] [S]   |                                                                                |
| [P] [F] [Cl] [Br] |                                                                                |
|                   |                                                                                |
| Ring Stampers:    |                                                                                |
| [Benzene]         |                                                                                |
| [Cyclohexane]     |                                                                                |
| [Pyridine]        |                                                                                |
| [Cyclopentane]    |                                                                                |
+-------------------+--------------------------------------------------------------------------------+
| FOOTER TELEMETRY & ACTIONS:                                                                        |
| Live SMILES: c1cncc(c1)C(=O)O  | Formula: C6H5NO2 | MW: 123.11 g/mol                                |
| [Undo]  [Redo]  [Clear Canvas]  | [Import SMILES...]             [TRANSFER TO STUDIO & PREDICT ->] |
+----------------------------------------------------------------------------------------------------+
```

### 5.1 Canvas Interaction Rules
1. **Atoms & Drawing:**
   - Click empty canvas with an atom selected: Places an atom at grid coordinate.
   - Click and drag from Atom A to empty space: Extends a single bond to a new atom.
   - Click and drag from Atom A to existing Atom B: Connects Atom A and Atom B with a bond.
   - Click on an existing bond: Cycles bond order (Single $\rightarrow$ Double $\rightarrow$ Triple $\rightarrow$ Single).
   - Click on an existing atom with a different element selected: Transmutes the atom (e.g., changes Carbon to Nitrogen).
2. **One-Click Ring Stampers:**
   - Clicking `Benzene` stamps a 6-membered aromatic ring with alternating conjugated double bonds.
   - Clicking `Pyridine` stamps a 6-membered ring containing 1 nitrogen atom.
3. **Canvas Controls:**
   - Guaranteed working `Clear Canvas` button that purges all atoms and bonds with 0 latency.
   - Full Undo/Redo stack (records up to 50 previous graph states).
4. **Live RDKit Validation HUD:**
   - Every graph edit automatically calls the backend endpoint `POST /api/sketcher/graph-to-smiles` (debounced at 120ms) to compute canonical SMILES, molecular formula, and molecular weight in real time.
   - "Transfer to Studio" button transfers the generated SMILES into the global app store and closes the modal.

---

## 6. Interactive User Guidance System (Driver.js & Tour Specs)

The frontend features built-in guided onboarding so any student or non-computational researcher can use the application intuitively.

### 6.1 Multi-Step Spotlight Tour Steps (Configured for Driver.js)
- **Step 1: Welcome & Mission** (Modal overlay): "Welcome to BioGraph AI. Predict drug properties, explore 3D conformations, and understand GNN predictions in seconds."
- **Step 2: Navigation Sidebar** (`#sidebar-nav`): "Switch between Property Prediction, 3D Conformation, ADMET Bioavailability, and GNN Explanations here."
- **Step 3: Molecule Input** (`#smiles-input`): "Enter any IUPAC SMILES string here. The engine validates chemical syntax live as you type."
- **Step 4: Preset Library** (`#preset-chips`): "New to chemistry? Click any sample preset like Aspirin or Caffeine to instantly populate a valid molecule."
- **Step 5: Chemical Sketcher** (`#draw-button`): "Don't know the SMILES string? Click 'Draw Structure' to sketch your molecule on a modern 2D vector canvas."
- **Step 6: Model Architecture Selector** (`#model-selector`): "Select individual GNN models (MPNN, GIN, GAT, GCN) or leave 'All Ensemble' checked to quantify prediction uncertainty."
- **Step 7: Run Execution** (`#predict-button`): "Click Predict Properties to run PyTorch Geometric inference and generate consensus metrics."
- **Step 8: Epistemic Uncertainty & Consensus** (`#prediction-result-card`): "View the predicted value along with the $\pm\sigma$ confidence interval calculated from inter-model disagreement."

### 6.2 Contextual Help & Plain-Language Terminology
Every scientific metric has an info icon (`i`) with an interactive popover:
- **Aqueous Solubility (logS):** Logarithm of molar solubility in water. Higher than $-2.0$ is highly soluble; below $-4.0$ indicates poor oral absorption.
- **Blood-Brain Barrier (BBBP):** Probability of penetrating the blood-brain barrier for central nervous system (CNS) active drug candidates.
- **Tox21 Assays:** 12 biological pathway toxicity endpoints evaluating nuclear receptor activation and cellular stress response pathways.
- **GNNExplainer:** Information-theoretic mutual information optimization identifying the critical pharmacophore subgraphs responsible for predictions.

---

## 7. Ready-to-Use Master Prompts for Google Stitch AI

Copy and paste the prompt blocks below directly into **Google Stitch AI**, **v0.dev**, **Galileo AI**, or **Figma AI** to generate screens matching this design specification.

### 7.1 Master Prompt for System Layout & Predict Studio
```text
Design a hyper-modern, biotech-grade SaaS web application called "BioGraph AI" for molecular property prediction in drug discovery using Graph Neural Networks.

Theme & Aesthetics:
- Deep cosmic dark mode canvas (#070b14) with layered glassmorphic cards (#0d1527/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl).
- Bioluminescent emerald (#10b981) and cyan (#06b6d4) glowing accents with crisp white Inter typography.
- WCAG AA compliant contrast, polished micro-interactions, subtle borders, and smooth shadows.

Layout Architecture:
- Left collapsible navigation sidebar (260px) with glowing brand logo, nav links (Predict, 3D Viewer, ADMET Radar, GNNExplainer, Chemical Space, Analog Optimizer, Batch Screen, Benchmarks, Help), and backend status footer (PyG 2.8 Online).
- Top bar with Cmd+K command search, preset molecule chips (Aspirin, Caffeine, Ibuprofen, Paracetamol), and a "?" Help button.
- Main Workspace:
  1. Top collapsible "How to use this page" guidance card with emerald lightbulb and "Try Example" CTA.
  2. Hero Molecule Input Section: Wide SMILES text input with live green validation check, "Draw Structure" button with pen icon, property selection tabs (Aqueous Solubility ESOL, BBB Penetration, Tox21), model architecture chips (MPNN, GIN, GAT, GCN, Random Forest), and a glowing emerald "Predict Properties" action button.
  3. Results Grid:
     - 2D Molecular Vector SVG preview card with formula, MW, and rotatable bonds.
     - Hero Consensus Metric Card displaying "-2.14 logS", confidence interval "± 0.32", qualitative badge "Moderately Soluble", and info popover trigger.
     - Recharts horizontal consensus bar chart comparing MPNN, GIN, GAT, GCN, and Random Forest predictions against the ensemble mean.
     - "Next Step" suggestion banner linking to GNNExplainer.
```

### 7.2 Master Prompt for 3D Conformer Studio
```text
Design a 3D Molecular Conformation & Force-Field Studio screen for the "BioGraph AI" platform.

Theme: Deep space dark theme (#070b14) with glassmorphic panels and cyan neon highlights.
Layout: Split-pane workspace.
- Left Panel (340px width):
  - Card showing active molecule SMILES, Formula, and Total Conformation Energy: "24.32 kcal/mol (MMFF94 force field)".
  - Radio group for Force Field Selection: MMFF94 (Merck) vs UFF.
  - Radio pills for 3D Representation: Ball & Stick, Sticks, Space-filling van der Waals spheres, Wireframe.
  - Surface toggle: None, Solvent Accessible Surface (SAS), Electrostatic Potential (ESP).
  - Export buttons: "Download PDB" and "Download SDF".
- Right Main Area:
  - 3D WebGL chemical viewport with subtle Cartesian perspective grid, showing a beautifully rendered 3D ligand conformer with CPK atomic color spheres.
  - Floating viewport controls: Axis orientation gizmo, Auto-spin toggle, Reset Camera, and Fullscreen toggle.
```

### 7.3 Master Prompt for In Silico ADMET & Bioavailability Radar
```text
Design an In Silico ADMET & Oral Bioavailability Profiler dashboard screen for "BioGraph AI".

Theme: High-tech biotech laboratory dark theme (#070b14) with layered glass cards.
Layout:
- Top guidance banner explaining oral bioavailability criteria.
- Center-Left Card:
  - Six-Axis Bioavailability Radar Chart with axes: LIPO (Lipophilicity), SIZE (MW), POLAR (TPSA), INSOLU (Solubility), FLEX (Rotatable Bonds), and UNSAT (Fsp3).
  - Visuals: Semi-transparent green shaded polygon representing optimal drug-like space, overlaid with the candidate molecule's bright cyan polygon.
- Center-Right Grid:
  - 4 Medicinal Chemistry Filter Cards with Pass/Fail badges:
    1. Lipinski Rule of Five (MW, LogP, HBD, HBA) -> PASS.
    2. Veber Oral Bioavailability Rule -> PASS.
    3. PAINS Structural Alerts -> 0 Alerts Detected (Safe).
    4. Brenk Toxic Moieties -> 0 Alerts Detected.
- Bottom Row:
  - 8-metric telemetry stat cards showing MW (180.16 g/mol), LogP (1.31), TPSA (63.60 A^2), HBD (1), HBA (4), Rotatable Bonds (3), Heavy Atoms (13), Rings (1).
```

### 7.4 Master Prompt for Native 2D Chemical Vector Sketcher Modal
```text
Design a full-screen or modal 2D Vector Chemical Sketcher studio for drawing molecular structures in a dark-mode biotech app.

Visuals & Canvas:
- Canvas background: Dark blueprint dot-grid (#070b14).
- Left Vertical Toolbar (floating dark pill container):
  - Mode tools: Select/Move, Erase.
  - Bond tools: Single Bond (-), Double Bond (=), Triple Bond (#).
  - Atom Palette: C, N, O, S, P, F, Cl, Br, I, H.
  - Quick Ring Stampers: Benzene (6-ring aromatic), Cyclohexane, Pyridine, Cyclopentane.
- Top Action Bar:
  - Undo, Redo, Clear Canvas (with trash icon), Import SMILES string button.
- Bottom Real-Time Telemetry Bar:
  - Monospace live SMILES display: "c1cncc(c1)C(=O)O".
  - Live chemical formula: "C6H5NO2".
  - Calculated molecular weight: "123.11 g/mol".
  - Primary Action Button: Glowing emerald "Transfer to Studio & Predict".
```

---

## 8. Summary of API Endpoints Backing the UI

Every component generated by Google Stitch AI connects directly to the production FastAPI backend at `http://localhost:8000`:

| Endpoint | Method | Input Payload | Output Response | UI Consumer |
| :--- | :--- | :--- | :--- | :--- |
| `/api/predict` | `POST` | `{"smiles": str, "target": str, "models": list[str]}` | Ensemble prediction, $\pm\sigma$ CI, individual model values | Predict Studio |
| `/api/validate` | `POST` | `{"smiles": str}` | `{"valid": bool, "error": str, "formula": str, "mw": float}` | Live SMILES Input |
| `/api/explain` | `POST` | `{"smiles": str, "target": str, "model": str}` | Atom importance array, bond importance array, SVG heatmap | GNNExplainer Studio |
| `/api/admet` | `POST` | `{"smiles": str}` | 6 radar axes, Lipinski, Veber, PAINS, Brenk filter results | ADMET Profiler |
| `/api/conformer-3d` | `POST` | `{"smiles": str, "optimize": bool}` | PDB text, MMFF94 energy in kcal/mol, rotatable bond count | 3Dmol.js Viewer |
| `/api/sketcher/graph-to-smiles` | `POST` | `{"atoms": list, "bonds": list}` | Canonical SMILES, formula, MW, 2D SVG | 2D Vector Canvas |
| `/api/sketcher/smiles-to-graph` | `POST` | `{"smiles": str}` | 2D atom coordinates, elements, bond connections | Canvas Import |
| `/api/benchmarks` | `GET` | *None* | Reproduced test metrics across ESOL, BBBP, Tox21 | Benchmarks Page |
