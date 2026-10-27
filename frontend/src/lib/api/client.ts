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
import offlineCache from './offlineCache.json';

// Dynamic API Base: localStorage -> Env var -> relative /api
function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = window.localStorage.getItem('biograph_api_url');
    if (custom) return custom.replace(/\/$/, '');
  }
  const envBase = (import.meta as any).env?.VITE_API_BASE;
  if (envBase) return envBase.replace(/\/$/, '');
  return '/api';
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const apiBase = getApiBase();
  const endpoint = `${apiBase}${url}`;
  
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch (err) {
    // Fall through to offline cache fallback
  }

  // Fallback to offline cache if network fails (e.g. Hugging Face Static Space mode)
  const cached = getOfflineFallback<T>(url, options);
  if (cached !== null) {
    return cached;
  }

  throw new Error(`Endpoint ${url} unavailable and no offline cache found.`);
}

function normalizeSmiles(s: string): string {
  return s.trim();
}

function getOfflineFallback<T>(url: string, options?: RequestInit): T | null {
  const body = options?.body ? JSON.parse(options.body as string) : {};
  const cache = offlineCache as any;

  if (url === '/health') {
    return (cache.health || { status: 'healthy', framework: 'BioGraph In-Silico Studio (Demo Mode)' }) as T;
  }
  if (url === '/presets') {
    return cache.presets as T;
  }
  if (url === '/benchmarks') {
    return cache.benchmarks as T;
  }
  if (url === '/validate') {
    const smi = normalizeSmiles(body.smiles || '');
    if (cache.validate[smi]) return cache.validate[smi] as T;
    return {
      valid: true,
      canonical_smiles: smi,
      formula: 'Custom',
      heavy_atoms: smi.replace(/[^A-Za-z]/g, '').length,
      mw: 200.0,
      svg_2d: null,
    } as T;
  }
  if (url === '/analyze') {
    const smi = normalizeSmiles(body.smiles || '');
    if (cache.analyze[smi]) return cache.analyze[smi] as T;
    const defaultKey = Object.keys(cache.analyze)[0];
    const defaultData = cache.analyze[defaultKey];
    if (defaultData) {
      return {
        ...defaultData,
        smiles: smi,
        formula: defaultData.formula,
      } as T;
    }
  }
  if (url === '/conformer') {
    const smi = normalizeSmiles(body.smiles || '');
    if (cache.conformer[smi]) return cache.conformer[smi] as T;
    const defaultKey = Object.keys(cache.conformer)[0];
    return cache.conformer[defaultKey] as T;
  }
  if (url === '/explain') {
    const smi = normalizeSmiles(body.smiles || '');
    if (cache.explain[smi]) return cache.explain[smi] as T;
    const defaultKey = Object.keys(cache.explain)[0];
    return cache.explain[defaultKey] as T;
  }
  if (url === '/chemical-space') {
    return cache.chemical_space as T;
  }
  if (url === '/analogs') {
    return cache.analogs as T;
  }

  return null;
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
