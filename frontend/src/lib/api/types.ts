/**
 * BioGraph AI TypeScript API Types
 * Mirrors FastAPI backend schemas exactly.
 */

export interface PresetDrug {
  name: string;
  category: string;
  smiles: string;
  indication: string;
}

export interface HealthResponse {
  status: string;
  framework: string;
  architectures: string[];
  datasets: string[];
  checkpoints_loaded: number;
}

export interface ValidateResponse {
  valid: boolean;
  error?: string | null;
  canonical_smiles?: string | null;
  formula?: string | null;
  svg_2d?: string | null;
  heavy_atoms?: number | null;
  mw?: number | null;
}

export interface SketcherAtom {
  id: number;
  element: string;
  x: number;
  y: number;
}

export interface SketcherBond {
  source: number;
  target: number;
  order: number;
}

export interface GraphToSmilesResponse {
  valid: boolean;
  smiles: string;
  formula: string;
  mw: number;
  heavy_atoms: number;
  svg_2d: string;
  error?: string;
}

export interface SmilesToGraphResponse {
  atoms: SketcherAtom[];
  bonds: SketcherBond[];
  smiles: string;
}


export interface Descriptors {
  'Molecular Weight': number;
  LogP: number;
  TPSA: number;
  'H-Bond Donors': number;
  'H-Bond Acceptors': number;
  'Rotatable Bonds': number;
  'Heavy Atoms': number;
  'Aromatic Rings': number;
  'Fraction Csp3': number;
  'Molar Refractivity': number;
  QED: number;
  'SA Score (est)': number;
}

export interface RuleFilterResult {
  passed: boolean;
  num_violations: number;
  violations: string[];
}

export interface Filters {
  Lipinski: RuleFilterResult;
  Veber: RuleFilterResult;
  Ghose: RuleFilterResult;
  Egan: RuleFilterResult;
}

export interface StructuralAlertGroup {
  has_alerts: boolean;
  count: number;
  descriptions: string[];
}

export interface Alerts {
  PAINS: StructuralAlertGroup;
  Brenk: StructuralAlertGroup;
}

export interface RadarCoordinates {
  LIPO: number;
  SIZE: number;
  POLAR: number;
  INSOLU: number;
  INSATU: number;
  FLEX: number;
}

export interface ConformerData {
  mol_block: string | null;
  energy_kcal: number | null;
  status: string;
}

export interface EsolPrediction {
  mean: number;
  std: number;
  ci_lower: number;
  ci_upper: number;
  agreement: string;
  interpretation: string;
  models: Record<string, number>;
}

export interface BbbpPrediction {
  probability: number;
  probability_pct: string;
  std: number;
  ci_lower: number;
  ci_upper: number;
  penetrates: boolean;
  classification: string;
  models: Record<string, number>;
}

export interface ToxPathway {
  assay: string;
  probability: number;
  probability_pct: string;
  std: number;
  risk: 'HIGH RISK' | 'Moderate Risk' | 'LOW RISK';
  models?: Record<string, number>;
}

export interface Tox21Prediction {
  pathways: ToxPathway[];
  high_risk_count: number;
  mean_risk: number;
  max_risk: number;
  aggregate_status: string;
  models?: Record<string, number>;
  models_high_risk?: Record<string, number>;
}

export interface GraphStats {
  num_nodes: number;
  num_edges: number;
  node_dim: number;
  edge_dim: number;
  engine: string;
}

export interface AnalyzeResponse {
  smiles: string;
  formula: string;
  inchikey?: string;
  heavy_atoms: number;
  graph_stats?: GraphStats;
  svg_2d: string;
  descriptors: Descriptors;
  filters: Filters;
  alerts: Alerts;
  radar: RadarCoordinates;
  conformer: ConformerData;
  predictions: {
    esol: EsolPrediction;
    bbbp: BbbpPrediction;
    tox21: Tox21Prediction;
  };
}

export interface AtomDetail {
  atom_idx: number;
  element: string;
  importance: number;
  normalized_saliency: number;
  aromatic: boolean;
  hybridization: string;
}

export interface ExplainResponse {
  svg_highlighted: string;
  prediction: number;
  atom_details: AtomDetail[];
  all_atoms: AtomDetail[];
}

export interface Point2D {
  id: string;
  x: number;
  y: number;
  target: number;
}

export interface NearestNeighbor {
  Rank: number;
  'Compound ID': string;
  SMILES: string;
  'Tanimoto Similarity': number;
  'Target Value': number;
}

export interface ChemicalSpaceResponse {
  query_coords: { x: number; y: number } | null;
  reference_points: Point2D[];
  nearest_neighbors: NearestNeighbor[];
}

export interface AnalogResult {
  smiles: string;
  transformation: string;
  rationale: string;
  predicted_value: number;
  delta: number;
  qed: number;
  mw: number;
  logp: number;
  tpsa: number;
  lipinski_pass: boolean;
}

export interface AnalogsResponse {
  parent_val: number;
  parent_qed: number;
  analogs: AnalogResult[];
}

export interface BatchMoleculeRecord {
  'Compound ID': string;
  SMILES: string;
  'Desirability Score': number;
  QED: number;
  'Solubility logS': number;
  'BBB Probability': string;
  'Max Tox Risk': string;
  'High Risk Assays': number;
  'MW (Da)': number;
  LogP: number;
  'TPSA (Å²)': number;
  Lipinski: string;
  'PAINS Alert': string;
}

export interface BenchmarkModel {
  model: string;
  rmse?: number;
  mae?: number;
  r2?: number;
  roc_auc?: number;
  pr_auc?: number;
  rank: number;
}

export interface BenchmarkDataset {
  name: string;
  task: string;
  metric: string;
  models: BenchmarkModel[];
}

export interface BenchmarksResponse {
  split_method: string;
  datasets: {
    esol: BenchmarkDataset;
    bbbp: BenchmarkDataset;
    tox21: BenchmarkDataset;
  };
}
