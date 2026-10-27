/**
 * BioGraph AI Central Guidance Content
 * Structured reference for tours, per-page instructions, metric explainers,
 * glossary, FAQs, and keyboard shortcuts.
 */

export interface TourStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'left' | 'right' | 'top' | 'bottom';
  };
}

export interface PageGuidance {
  id: string;
  title: string;
  steps: string[];
  whatAmILookingAt: string;
  exampleSmiles: string;
  exampleName: string;
}

export interface MetricExplainer {
  title: string;
  short: string;
  description: string;
  interpretation: string;
  optimalRange: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    element: '#sidebar-nav',
    popover: {
      title: 'Navigation Sidebar',
      description: 'Access all specialized drug discovery modules: Predict, 3D Conformation, ADMET Radar, GNNExplainer, Chemical Space, Lead Optimization, and Batch Screening.',
      side: 'right',
    },
  },
  {
    element: '#smiles-input-container',
    popover: {
      title: 'SMILES Chemical Input',
      description: 'Enter a SMILES chemical representation (e.g. Aspirin). The system validates syntax live as you type.',
      side: 'bottom',
    },
  },
  {
    element: '#preset-selector',
    popover: {
      title: 'Curated Drug Presets',
      description: 'Quickly select from 14 FDA-approved and clinical candidates (Aspirin, Remdesivir, Imatinib, Atorvastatin, etc.).',
      side: 'bottom',
    },
  },
  {
    element: '#sketcher-button',
    popover: {
      title: 'JSME Chemical Sketcher',
      description: 'Click to draw chemical structures visually using your mouse or touchscreen and transfer the SMILES directly.',
      side: 'bottom',
    },
  },
  {
    element: '#analyze-action-btn',
    popover: {
      title: 'Run Deep GNN Analysis',
      description: 'Executes parallel inference across all 5 architectures (MPNN, GIN, GAT, GCN, Baseline) and calculates ADMET and 3D geometry.',
      side: 'bottom',
    },
  },
  {
    element: '#kpi-cards-bar',
    popover: {
      title: 'Key Physicochemical Metrics',
      description: 'Quick glance at Molecular Weight, Lipophilicity (LogP), Polar Surface Area (TPSA), QED score, and Lipinski status.',
      side: 'bottom',
    },
  },
  {
    element: '#cmd-palette-btn',
    popover: {
      title: 'Command Palette (Ctrl+K)',
      description: 'Press Ctrl+K or Cmd+K anytime to quickly jump between pages, search drugs, or toggle settings.',
      side: 'left',
    },
  },
];

export const PAGE_GUIDANCE: Record<string, PageGuidance> = {
  predict: {
    id: 'predict-guide',
    title: 'How to Predict Molecular Properties',
    steps: [
      'Enter a canonical SMILES string or choose an FDA preset.',
      'Click "Analyze Molecule" (or press Ctrl+Enter).',
      'Examine the consensus predictions across all 5 deep GNN architectures alongside epistemic uncertainty bounds.',
      'Review qualitative interpretations for solubility (ESOL), blood-brain barrier permeation (BBBP), and 12 toxicity pathways (Tox21).',
    ],
    whatAmILookingAt:
      'Consensus deep learning predictions aggregated from 5 model architectures. The standard deviation (±σ) quantifies model agreement (epistemic uncertainty). Lower σ indicates higher confidence.',
    exampleSmiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O',
    exampleName: 'Ibuprofen (Anti-inflammatory)',
  },
  viewer3d: {
    id: 'viewer3d-guide',
    title: 'How to Explore 3D Conformations',
    steps: [
      'View the energy-minimized 3D conformer generated via Distance Geometry (ETKDG) and optimized with the MMFF94 force field.',
      'Click and drag to rotate, scroll to zoom, and right-click to pan the molecule.',
      'Toggle rendering representations (Ball & Stick, Stick, Spacefill CPK, Wireframe) and solvent-accessible surface overlays.',
      'Observe the calculated conformational strain energy (kcal/mol).',
    ],
    whatAmILookingAt:
      'A true 3D energetic conformation reflecting lowest-energy steric interactions. Force-field strain energy indicates conformational stability.',
    exampleSmiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    exampleName: 'Caffeine (CNS Stimulant)',
  },
  admet: {
    id: 'admet-guide',
    title: 'How to Evaluate ADMET & Bioavailability',
    steps: [
      'Review the 6-axis Bioavailability Radar polygon against the optimal drug-likeness boundary.',
      'Inspect compliance across Lipinski Rule of 5, Veber (oral absorption), Ghose, and Egan filters.',
      'Check for PAINS (Pan-Assay Interference) and Brenk toxicophore alerts to eliminate false-positive assay artifacts.',
    ],
    whatAmILookingAt:
      'A multi-dimensional drug-likeness profile. The blue radar polygon should ideally fit inside the dashed purple boundary for high oral bioavailability.',
    exampleSmiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O',
    exampleName: 'Atorvastatin (Lipitor)',
  },
  explain: {
    id: 'explain-guide',
    title: 'How to Interpret Pharmacophore Saliency',
    steps: [
      'Select a GNN architecture (MPNN, GIN, GAT, or GCN) and target endpoint to explain.',
      'Click "Compute GNNExplainer Saliency".',
      'Inspect the red/salmon highlights on the 2D chemical structure identifying functional groups driving the neural prediction.',
      'Review the atom importance table ranking each atomic center by mutual information weight.',
    ],
    whatAmILookingAt:
      'Substructure saliency heatmap computed by maximizing mutual information between graph representations and target outputs. Darker red highlights indicate stronger contribution to the predicted property.',
    exampleSmiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    exampleName: 'Aspirin (Carboxylic acid driving solubility)',
  },
  chemicalSpace: {
    id: 'chemical-space-guide',
    title: 'How to Navigate Chemical Space',
    steps: [
      'Explore the 2D PCA projection of the benchmark chemical library (ESOL or BBBP).',
      'Locate your candidate molecule marked as the glowing star.',
      'Examine the top-5 nearest structural neighbors found via Tanimoto similarity over 512-bit Morgan fingerprints.',
      'Compare your predicted properties against the nearest neighbors\' actual measured experimental values.',
    ],
    whatAmILookingAt:
      'A 2D dimensionality-reduced landscape of chemical space. Molecules clustered near each other share similar structural fragments and physicochemical characteristics.',
    exampleSmiles: 'CN1CCCC1c2cccnc2',
    exampleName: 'Nicotine',
  },
  analogs: {
    id: 'analogs-guide',
    title: 'How to Run In Silico Lead Optimization',
    steps: [
      'Generate systematic bioisosteres and medicinal chemistry R-group substitutions (-F, -CF3, -Cl, -CH3, -OH, -OCH3, -NH2, -CN, tetrazoles).',
      'Observe real-time delta re-scoring (ΔlogS, ΔBBBP, ΔQED) for each derivative.',
      'Identify analog candidates that improve solubility or drug-likeness without increasing toxicity risk.',
    ],
    whatAmILookingAt:
      'In silico medicinal chemistry derivatives evaluated in parallel. The delta (Δ) shows the exact shift in property values relative to the parent lead molecule.',
    exampleSmiles: 'CC(=O)NC1=CC=C(O)C=C1',
    exampleName: 'Paracetamol',
  },
  batch: {
    id: 'batch-guide',
    title: 'How to Perform Batch Virtual Screening',
    steps: [
      'Paste a collection of candidate SMILES strings (one per line) or load sample screening libraries.',
      'Toggle CNS penetration prioritization if targeting neurological receptors.',
      'Click "Run Virtual Screening" to screen all compounds across ESOL, BBBP, Tox21, and ADMET filters.',
      'Sort candidates by the composite Multi-Objective Desirability Score (0-100) and export as CSV.',
    ],
    whatAmILookingAt:
      'High-throughput ranking table combining solubility, drug-likeness (QED), Lipinski compliance, and toxicity safety into a composite Desirability Score.',
    exampleSmiles: 'CC(=O)OC1=CC=CC=C1C(=O)O\nCC(C)CC1=CC=C(C=C1)C(C)C(=O)O\nCN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    exampleName: 'Analgesic Library',
  },
  benchmarks: {
    id: 'benchmarks-guide',
    title: 'Verified Benchmark Results',
    steps: [
      'Review verified empirical metrics reproduced on local held-out Bemis-Murcko scaffold test splits.',
      'Compare test RMSE, MAE, R², ROC-AUC, and PR-AUC across GIN, MPNN, GAT, GCN, and Random Forest baselines.',
      'Verify that zero scaffold leakage was preserved between training and test sets.',
    ],
    whatAmILookingAt:
      'Reproduced benchmark metrics on held-out test splits with strictly isolated Bemis-Murcko scaffolds.',
    exampleSmiles: '',
    exampleName: '',
  },
};

export const METRIC_EXPLAINERS: Record<string, MetricExplainer> = {
  mw: {
    title: 'Molecular Weight (MW)',
    short: 'Molecular Mass in Daltons (Da)',
    description: 'The sum of atomic weights of all atoms in the molecule.',
    interpretation: 'Molecules with MW ≤ 500 Da generally diffuse across biological membranes more readily.',
    optimalRange: '160 - 500 Da',
  },
  logp: {
    title: 'Lipophilicity (Crippen CLogP)',
    short: 'Octanol-Water Partition Coefficient',
    description: 'Measures how hydrophobic (fat-loving) vs hydrophilic (water-loving) a molecule is.',
    interpretation: 'Moderate LogP (1 to 3) is ideal for balancing aqueous solubility and cell membrane permeation.',
    optimalRange: '0.0 - 3.0 (Lipinski: ≤ 5.0)',
  },
  tpsa: {
    title: 'Topological Polar Surface Area (TPSA)',
    short: 'Surface Area of Polar Atoms in Å²',
    description: 'Sum of surfaces of polar atoms (primarily oxygens, nitrogens, and attached hydrogens).',
    interpretation: 'TPSA ≤ 140 Å² correlates with high intestinal oral bioavailability. TPSA ≤ 90 Å² is required for blood-brain barrier penetration.',
    optimalRange: '20 - 140 Å²',
  },
  qed: {
    title: 'Quantitative Estimate of Drug-Likeness (QED)',
    short: 'Composite Drug-Likeness Metric (0 to 1)',
    description: 'Heuristic integration of 8 chemical descriptors weighted against FDA-approved oral therapeutics.',
    interpretation: 'QED > 0.67 is considered highly attractive; 0.49 - 0.67 is moderate; < 0.49 indicates poor drug-likeness.',
    optimalRange: '0.67 - 1.00',
  },
  hbd: {
    title: 'Hydrogen Bond Donors (HBD)',
    short: 'Number of -OH and -NH Groups',
    description: 'Count of hydrogen atoms attached to electronegative atoms capable of donating H-bonds.',
    interpretation: 'Excessive H-bond donors hinder passive cell membrane diffusion.',
    optimalRange: '0 - 5 donors',
  },
  hba: {
    title: 'Hydrogen Bond Acceptors (HBA)',
    short: 'Number of Oxygen & Nitrogen Atoms',
    description: 'Count of electronegative atoms with lone pairs capable of accepting H-bonds.',
    interpretation: 'Acceptors increase aqueous solvation; too many decrease cell permeability.',
    optimalRange: '0 - 10 acceptors',
  },
  rotBonds: {
    title: 'Rotatable Bonds',
    short: 'Count of Flexible Single Bonds',
    description: 'Non-ring single bonds not bonded to hydrogens or terminal atoms.',
    interpretation: 'Flexibility ≤ 10 is necessary for oral bioavailability (Veber rule).',
    optimalRange: '0 - 10 bonds',
  },
  lipinski: {
    title: 'Lipinski\'s Rule of 5',
    short: 'Oral Bioavailability Filter',
    description: 'Four criteria: MW ≤ 500, LogP ≤ 5, HBD ≤ 5, HBA ≤ 10.',
    interpretation: 'Passing (≤ 1 violation) indicates a higher likelihood of oral drug absorption.',
    optimalRange: '0 violations',
  },
  pains: {
    title: 'PAINS Structural Filter',
    short: 'Pan-Assay Interference Compounds',
    description: 'Screens for promiscuous, covalent, or fluorescent substructures causing false positive bioassay hits.',
    interpretation: 'A clean screen ensures bioactivity is specific rather than colloidal or non-specific.',
    optimalRange: 'Clean (0 alerts)',
  },
  brenk: {
    title: 'Brenk Structural Filter',
    short: 'Toxicophore & Reactive Group Filter',
    description: 'Identifies reactive, mutagenic, or metabolically unstable chemical moieties.',
    interpretation: 'Clean candidates exhibit lower likelihood of in vivo toxicity and idiosyncratic hepatotoxicity.',
    optimalRange: 'Clean (0 alerts)',
  },
  desirability: {
    title: 'Composite Desirability Score',
    short: 'Multi-Objective Rank (0 to 100)',
    description: 'Combines QED drug-likeness, Lipinski compliance, high aqueous solubility, low toxicity, and clean PAINS status.',
    interpretation: 'Scores > 75 denote prime preclinical drug candidates.',
    optimalRange: '75 - 100',
  },
};

export const GLOSSARY: { term: string; definition: string }[] = [
  {
    term: 'SMILES',
    definition: 'Simplified Molecular Input Line Entry System: a text notation using ASCII characters to describe chemical graph structures (e.g., CCO for ethanol).',
  },
  {
    term: 'Bemis-Murcko Scaffold',
    definition: 'The core molecular framework obtained by stripping all side chains and preserving rings and linking linkers. Used for rigorous train/test splitting to prevent structural leakage.',
  },
  {
    term: 'GCN (Graph Convolutional Network)',
    definition: 'A graph neural network architecture that computes normalized spectral neighborhood aggregations across bonded atoms.',
  },
  {
    term: 'GAT (Graph Attention Network)',
    definition: 'A graph neural network incorporating multi-head self-attention mechanisms over neighboring atoms to dynamically weight bonding importance.',
  },
  {
    term: 'GIN (Graph Isomorphism Network)',
    definition: 'A graph neural network architecture mathematically proven to achieve the maximum discriminative power of the 1-Weisfeiler-Lehman (1-WL) graph isomorphism test.',
  },
  {
    term: 'MPNN (Message Passing Neural Network)',
    definition: 'An edge-conditioned graph architecture where neural messages passing between atoms are parameterized by edge bond attributes (bond order, aromaticity, ring membership).',
  },
  {
    term: 'GNNExplainer',
    definition: 'An explainable AI algorithm that identifies compact substructures and features maximizing mutual information with neural model predictions.',
  },
  {
    term: 'Tanimoto Similarity',
    definition: 'A metric comparing two binary molecular fingerprints: J(A, B) = |A ∩ B| / |A ∪ B|. Values above 0.85 typically denote strong structural similarity.',
  },
  {
    term: 'ESOL (Delaney)',
    definition: 'A benchmark dataset containing measured aqueous solubility (logS in mol/L) for 1,128 diverse organic molecules.',
  },
  {
    term: 'BBBP (Blood-Brain Barrier Penetration)',
    definition: 'A binary classification dataset of 2,050 compounds annotated for central nervous system permeability.',
  },
  {
    term: 'Tox21',
    definition: 'A panel of 12 biological assays screening nuclear receptor signaling and stress response pathways to assess human toxicology.',
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'How does BioGraph AI predict molecular properties?',
    a: 'Molecules are converted into attributed graphs (48-dimensional atom vectors, 10-dimensional bond vectors) and passed through 5 independent models: GIN, MPNN, GAT, GCN, and Random Forest baselines. The ensemble average yields the consensus prediction.',
  },
  {
    q: 'Why use Bemis-Murcko scaffold splitting instead of random splitting?',
    a: 'Random splitting leaks structurally similar analogs between train and test sets, artificially inflating test scores. Scaffold splitting guarantees that the model is tested on unseen chemical scaffolds, mimicking real drug discovery lead finding.',
  },
  {
    q: 'What is epistemic uncertainty in the consensus prediction?',
    a: 'It is the standard deviation (±σ) across predictions of diverse neural architectures. High agreement indicates the molecule falls within the models\' domain of applicability.',
  },
  {
    q: 'Can I draw a molecule instead of typing a SMILES string?',
    a: 'Yes! Click the "Sketch Molecule" button in the top bar or sidebar to open the embedded JSME molecular editor, draw your chemical structure, and click "Transfer to Studio".',
  },
];

export const KEYBOARD_SHORTCUTS: { key: string; description: string }[] = [
  { key: 'Ctrl + Enter', description: 'Run analysis on current SMILES' },
  { key: 'Ctrl + K / ⌘ + K', description: 'Open Command Palette' },
  { key: 'Shift + ?', description: 'Open Help & Glossary' },
  { key: 'Esc', description: 'Close active modal / popover' },
];

export const SHORTCUTS = KEYBOARD_SHORTCUTS;

export const WORKFLOWS = [
  {
    title: 'Lead Optimization Workflow',
    description: 'Optimize a hit compound into a potent, bioavailable drug candidate with minimal off-target toxicity.',
    steps: [
      'Enter your initial lead compound in Predict to check baseline properties.',
      'Check GNNExplainer to see which moieties are driving solubility or toxicity.',
      'Use Lead Optimization to generate bioisosteric substitutions and fluorination analogs.',
      'Check ADMET radar and PAINS alerts for the top analogs.',
    ],
  },
  {
    title: 'Virtual Library Screening Workflow',
    description: 'High-throughput in-silico screening of candidate chemical libraries for CNS penetration.',
    steps: [
      'Navigate to Batch Screening.',
      'Paste your multiline SMILES library (or load sample presets).',
      'Select "Prefer CNS profile" if targeting neurotherapeutic indications.',
      'Sort by Desirability Score and export top hits to CSV.',
    ],
  },
  {
    title: 'Mechanism & Chemical Space Exploration',
    description: 'Assess domain of applicability and nearest reference training compounds.',
    steps: [
      'Enter your molecule in Chemical Space.',
      'Inspect where your molecule lies relative to reference clusters on the 2D PCA manifold.',
      'Examine the top-5 structural nearest neighbors and their empirical bioactivities.',
    ],
  },
];

