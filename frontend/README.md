# BioGraph AI — Frontend Discovery Studio

The frontend for **BioGraph AI** is an enterprise-grade Computer-Aided Drug Discovery (CADD) studio built with React 18, TypeScript, Tailwind CSS, Lucide icons, Framer Motion, and WebGL (3Dmol.js).

---

## 🔬 Core Studio Features

- **Molecular Property Predictor (`/predict`)**: Live single-model and 5-model consensus property prediction with epistemic uncertainty intervals across ESOL, BBBP, and Tox21.
- **3D Molecular Conformation & Force-Field Studio (`/viewer3d`)**: High-performance interactive 3D WebGL viewer using ETKDGv3 distance-geometry physics and MMFF94 force field relaxation with fullscreen mode and camera reset.
- **ADMET Bioavailability Radar (`/admet`)**: Interactive 6-axis physicochemical radar polygon alongside Lipinski Rule of 5, Veber, Ghose, Egan, and PAINS/Brenk structural alert catalogs.
- **GNNExplainer Pharmacophore Attribution (`/explain`)**: Atomic node feature attributions and sub-graph mutual information masks visualized with RDKit 2D vector highlights.
- **Chemical Space & Tanimoto Neighborhood (`/space`)**: 2D PCA topological projection of 2048-bit Morgan circular fingerprints with nearest-neighbor structural retrieval.
- **In Silico Lead Optimization (`/analogs`)**: Matched Molecular Pair (MMP) transforms evaluating bioisosteric substitutions, fluorinations, and polar surface tuning.
- **High-Throughput Virtual Screening (`/batch`)**: Batch screening engine ranking compound libraries using a multi-objective Drug Desirability Score (0–100) with CSV export.
- **Interactive JSME Molecule Sketcher**: Full chemical drawing canvas enabling on-the-fly IUPAC/SMILES generation and live tensor featurization.

---

## 🛠 Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) with Dark/Light palette
- **3D Visualization**: [3Dmol.js](https://3dmol.csb.pitt.edu/) (WebGL stereochemical conformers)
- **Chemical Drawing**: [JSME](https://peter-ertl.com/jsme/) (Java-to-JavaScript Molecular Editor)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with persistence
- **Data Fetching**: [@tanstack/react-query](https://tanstack.com/query)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

---

## 🚀 Development Scripts

```bash
# Install dependencies
npm install

# Start Vite development server (:5173 with proxy to :8000)
npm run dev

# Typecheck and build for production (outputs to dist/)
npm run build

# Run unit tests
npm test

# Run End-to-End tests (Playwright)
npm run test:e2e
```

---

## 📁 Architecture

```
frontend/
├── public/
│   ├── favicon.svg             # Platform favicon
│   ├── jsme/                   # JSME chemical sketcher engine
│   └── jsme_modal.html         # Isolated sketcher iframe
├── src/
│   ├── components/             # Reusable UI components & modals
│   ├── guide/                  # Documentation & scientific glossary
│   ├── lib/api/                # Strongly-typed API client & endpoints
│   ├── pages/                  # Route view components
│   ├── store/                  # Zustand global application state
│   ├── App.tsx                 # Application router & layout shell
│   └── main.tsx                # React root mount
├── package.json
└── vite.config.ts
```
