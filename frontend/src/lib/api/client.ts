import {
  HealthResponse,
  PresetDrug,
  ValidateResponse,
  AnalyzeResponse,
  ConformerData,
  ExplainResponse,
  ChemicalSpaceResponse,
  AnalogsResponse,
  BatchMoleculeRecord,
  BenchmarksResponse,
  SketcherAtom,
  SketcherBond,
  GraphToSmilesResponse,
  SmilesToGraphResponse,
} from './types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getHealth: () => fetchJson<HealthResponse>('/health'),

  getPresets: () => fetchJson<PresetDrug[]>('/presets'),

  validateSmiles: (smiles: string) =>
    fetchJson<ValidateResponse>('/validate', {
      method: 'POST',
      body: JSON.stringify({ smiles }),
    }),

  sketcherGraphToSmiles: (atoms: SketcherAtom[], bonds: SketcherBond[]) =>
    fetchJson<GraphToSmilesResponse>('/sketcher/graph-to-smiles', {
      method: 'POST',
      body: JSON.stringify({ atoms, bonds }),
    }),

  sketcherSmilesToGraph: (smiles: string) =>
    fetchJson<SmilesToGraphResponse>('/sketcher/smiles-to-graph', {
      method: 'POST',
      body: JSON.stringify({ smiles }),
    }),

  analyze: (smiles: string) =>
    fetchJson<AnalyzeResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify({ smiles }),
    }),

  getConformer: (smiles: string, seed: number = 42) =>
    fetchJson<ConformerData>('/conformer', {
      method: 'POST',
      body: JSON.stringify({ smiles, seed }),
    }),

  explain: (
    smiles: string,
    model: string = 'mpnn',
    dataset: string = 'esol',
    taskIdx: number = 0,
    epochs: number = 35
  ) =>
    fetchJson<ExplainResponse>('/explain', {
      method: 'POST',
      body: JSON.stringify({
        smiles,
        model,
        dataset,
        task_idx: taskIdx,
        epochs,
      }),
    }),

  getChemicalSpace: (smiles: string, dataset: string = 'esol') =>
    fetchJson<ChemicalSpaceResponse>('/chemical-space', {
      method: 'POST',
      body: JSON.stringify({ smiles, dataset }),
    }),

  getAnalogs: (
    smiles: string,
    dataset: string = 'esol',
    maxAnalogs: number = 8
  ) =>
    fetchJson<AnalogsResponse>('/analogs', {
      method: 'POST',
      body: JSON.stringify({ smiles, dataset, max_analogs: maxAnalogs }),
    }),

  screenBatch: (
    smilesList: string[],
    compoundNames?: string[],
    preferCns: boolean = false
  ) =>
    fetchJson<BatchMoleculeRecord[]>('/batch-screen', {
      method: 'POST',
      body: JSON.stringify({
        smiles_list: smilesList,
        compound_names: compoundNames,
        prefer_cns: preferCns,
      }),
    }),

  getBenchmarks: () => fetchJson<BenchmarksResponse>('/benchmarks'),
};
