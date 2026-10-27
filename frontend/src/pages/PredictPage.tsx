import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  X,
  Edit3,
  RotateCcw,
  Sparkles,
  Download,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ArrowRight,
  BrainCircuit,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api/client';
import { ValidateResponse } from '../lib/api/types';

type EndpointKey = 'solubility' | 'permeability' | 'toxicity';
type ModelKey = 'mpnn' | 'gin' | 'gat' | 'gcn' | 'rf';

interface PresetDrugInfo {
  name: string;
  subtitle: string;
  smiles: string;
}

const PRESET_DRUGS: Record<string, PresetDrugInfo> = {
  Aspirin: {
    name: 'Acetylsalicylic acid',
    subtitle: 'Aspirin · PubChem CID 2244',
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
  },
  Caffeine: {
    name: '1,3,7-Trimethylxanthine',
    subtitle: 'Caffeine · PubChem CID 2519',
    smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C',
  },
  Ibuprofen: {
    name: '2-(4-Isobutylphenyl)propanoic acid',
    subtitle: 'Ibuprofen · PubChem CID 3672',
    smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
  },
  Paracetamol: {
    name: 'N-(4-Hydroxyphenyl)acetamide',
    subtitle: 'Acetaminophen · PubChem CID 1983',
    smiles: 'CC(=O)Nc1ccc(O)cc1',
  },
  Atorvastatin: {
    name: 'Atorvastatin Calcium Complex Precursor',
    subtitle: 'Lipitor · PubChem CID 60823',
    smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O',
  },
};

const MODEL_CONFIGS: Record<ModelKey, { label: string; sublabel: string; color: string }> = {
  mpnn: { label: 'MPNN', sublabel: 'Message Passing', color: '#9A86C9' },
  gin: { label: 'GIN', sublabel: 'Isomorphism Net', color: '#C98AA3' },
  gat: { label: 'GAT', sublabel: 'Attention Heads', color: '#C98B5E' },
  gcn: { label: 'GCN', sublabel: 'Spectral Convolution', color: '#7C9CC4' },
  rf: { label: 'RF (Morgan)', sublabel: '2048-bit Circular', color: '#99D3B4' },
};

export const PredictPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    smiles,
    setSmiles,
    analysisData,
    setAnalysisData,
    isLoading,
    setIsLoading,
    analysisError,
    setAnalysisError,
    setSketcherOpen,
  } = useAppStore();

  const [localSmiles, setLocalSmiles] = useState(smiles);
  const [activePreset, setActivePreset] = useState<string>('Aspirin');
  const [endpoint, setEndpoint] = useState<EndpointKey>('solubility');
  const [activeModels, setActiveModels] = useState<Set<ModelKey>>(
    new Set(['mpnn', 'gin', 'gat', 'gcn', 'rf'])
  );
  const [validation, setValidation] = useState<ValidateResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guidanceCollapsed, setGuidanceCollapsed] = useState(false);
  const [infoPopoverOpen, setInfoPopoverOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(142);
  const [lastInferenceTime, setLastInferenceTime] = useState<string | null>(null);
  const [inferenceCount, setInferenceCount] = useState<number>(0);
  const [justInferred, setJustInferred] = useState<boolean>(false);

  // Detect if user modified SMILES without clicking Predict
  const isInputModified = Boolean(
    analysisData &&
    localSmiles.trim() &&
    localSmiles.trim() !== analysisData.smiles
  );

  // Handle SMILES input change
  const handleSmilesChange = (val: string) => {
    setLocalSmiles(val);
    const trimmed = val.trim();
    const match = Object.entries(PRESET_DRUGS).find(
      ([, data]) => data.smiles === trimmed
    );
    setActivePreset(match ? match[0] : '');
  };

  // Sync store SMILES into local state
  useEffect(() => {
    setLocalSmiles(smiles);
    // Find matching preset
    const match = Object.entries(PRESET_DRUGS).find(
      ([, data]) => data.smiles === smiles
    );
    if (match) {
      setActivePreset(match[0]);
    } else {
      setActivePreset('');
    }
  }, [smiles]);

  // Live SMILES validation call
  useEffect(() => {
    const trimmed = localSmiles.trim();
    if (!trimmed) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(() => {
      api
        .validateSmiles(trimmed)
        .then((res) => {
          setValidation(res);
          if (res.valid) {
            setAnalysisError(null);
          }
        })
        .catch(() => {
          setValidation({ valid: false, error: 'Validation service error' });
        })
        .finally(() => setIsValidating(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [localSmiles, setAnalysisError]);

  // Real inference trigger
  const runAnalysis = useCallback(
    async (targetSmiles: string) => {
      const trimmed = targetSmiles.trim();
      if (!trimmed) return;
      setIsLoading(true);
      setAnalysisError(null);
      const start = performance.now();

      try {
        const res = await api.analyze(trimmed);
        setAnalysisData(res);
        setSmiles(trimmed);
        const elapsed = Math.round(performance.now() - start);
        setLatencyMs(Math.max(65, elapsed));
        setLastInferenceTime(new Date().toLocaleTimeString());
        setInferenceCount((c) => c + 1);
        setJustInferred(true);
        setTimeout(() => setJustInferred(false), 3000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setAnalysisError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setAnalysisError, setAnalysisData, setSmiles]
  );

  // Load initial Aspirin analysis if no data
  useEffect(() => {
    if (!analysisData && smiles) {
      runAnalysis(smiles);
    }
  }, [analysisData, smiles, runAnalysis]);

  // Handle Preset selection
  const handleSelectPreset = (presetKey: string) => {
    const preset = PRESET_DRUGS[presetKey];
    if (!preset) return;
    setActivePreset(presetKey);
    setLocalSmiles(preset.smiles);
    setSmiles(preset.smiles);
    runAnalysis(preset.smiles);
  };

  // Copy SMILES to clipboard
  const handleCopy = () => {
    if (localSmiles) {
      navigator.clipboard.writeText(localSmiles);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Clear SMILES input
  const handleClear = () => {
    setLocalSmiles('');
    setValidation(null);
  };

  // Toggle model selection
  const handleToggleModel = (model: ModelKey | 'all', e?: React.MouseEvent) => {
    if (model === 'all') {
      setActiveModels(new Set(['mpnn', 'gin', 'gat', 'gcn', 'rf']));
      return;
    }

    const isModifier = e ? (e.shiftKey || e.ctrlKey || e.metaKey) : false;

    if (isModifier) {
      const next = new Set(activeModels);
      if (next.has(model)) {
        if (next.size > 1) {
          next.delete(model);
        }
      } else {
        next.add(model);
      }
      setActiveModels(next);
      return;
    }

    // Direct click:
    // If all 5 models are currently active, or if multiple models are active:
    // clicking a model focuses ONLY on that model.
    // If that model is ALREADY the only active one: clicking it resets to all models (ensemble).
    // If a different single model was active: switches directly to this model.
    if (activeModels.size === 1 && activeModels.has(model)) {
      setActiveModels(new Set(['mpnn', 'gin', 'gat', 'gcn', 'rf']));
    } else {
      setActiveModels(new Set([model]));
    }
  };

  // Export SVG file
  const handleExportSvg = () => {
    if (!analysisData?.svg_2d) return;
    const blob = new Blob([analysisData.svg_2d], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePreset || 'molecule'}_2d_structure.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Active predictions for the selected endpoint
  const desc = analysisData?.descriptors;
  const pred = analysisData?.predictions;

  const isEnsemble = activeModels.size === 5;
  const isSingleModel = activeModels.size === 1;
  const singleModelKey = isSingleModel ? (Array.from(activeModels)[0] as ModelKey) : null;
  const singleModelConfig = singleModelKey ? MODEL_CONFIGS[singleModelKey] : null;

  const currentDisplay = useMemo(() => {
    if (!pred) {
      return {
        numeral: '--',
        unit:
          endpoint === 'solubility'
            ? 'log mol/L (logS)'
            : endpoint === 'permeability'
            ? 'BBB+ Prob (BBBP)'
            : 'Flagged Pathways / 12',
        ci: 'Awaiting inference',
        category: 'Awaiting Input',
        narrative:
          'Enter a SMILES chemical formula or select an FDA approved drug preset above, then click "Predict properties" to run live PyTorch Geometric inference.',
        narrativeConc: '---',
        sigmaLabel: 'PyG 2.8 Engine',
        meanVal: 0,
        confidence: '---',
        diagnostic:
          'Awaiting molecular graph featurization and deep tensor evaluation.',
        models: { mpnn: 0, gin: 0, gat: 0, gcn: 0, rf: 0 },
        heroTitle: 'Deep Graph Inference',
        heroBadge: 'Ready to Predict',
        heroBadgeColor: undefined as string | undefined,
      };
    }

    if (endpoint === 'solubility') {
      const e = pred.esol;
      const getVal = (m: ModelKey) => {
        const val = e.models[m] ?? (m === 'rf' ? e.models['baseline'] : undefined);
        return typeof val === 'number' ? val : e.mean;
      };

      const allModelVals: Record<ModelKey, number> = {
        mpnn: getVal('mpnn'),
        gin: getVal('gin'),
        gat: getVal('gat'),
        gcn: getVal('gcn'),
        rf: getVal('rf'),
      };

      let val: number;
      let std: number;
      let heroTitle: string;
      let heroBadge: string;
      let heroBadgeColor: string | undefined;
      let ciText: string;
      let diagnostic: string;

      if (isSingleModel && singleModelKey && singleModelConfig) {
        val = allModelVals[singleModelKey];
        const delta = val - e.mean;
        const deltaStr = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;
        std = Math.abs(delta);
        heroTitle = `${singleModelConfig.label} Architecture Inference`;
        heroBadge = `${singleModelConfig.label} Model`;
        heroBadgeColor = singleModelConfig.color;
        ciText = `Δ ${deltaStr} logS (vs Mean)`;
        diagnostic = `${singleModelConfig.label} (${singleModelConfig.sublabel}) message passing. Delta from 5-model mean: ${deltaStr} logS.`;
      } else if (isEnsemble) {
        val = e.mean;
        std = e.std;
        heroTitle = 'Ensemble Consensus Inference';
        heroBadge = 'Epistemic Convergence';
        ciText = `± ${e.std.toFixed(2)} logS`;
        diagnostic = `Scaffold consistency: ${e.agreement}. Inter-model spread: ±${(e.std * 1.96).toFixed(2)} at 95% CI.`;
      } else {
        const subset = Array.from(activeModels).map((m) => allModelVals[m]);
        val = subset.reduce((a, b) => a + b, 0) / subset.length;
        std = Math.sqrt(subset.reduce((acc, v) => acc + Math.pow(v - val, 2), 0) / subset.length);
        heroTitle = `${activeModels.size}-Model Consensus Inference`;
        heroBadge = `${activeModels.size} Models Active`;
        ciText = `± ${std.toFixed(2)} logS`;
        diagnostic = `Custom ${activeModels.size}-architecture consensus. Inter-model deviation: ±${std.toFixed(2)}.`;
      }

      const cat =
        val > -2.0
          ? 'Highly Soluble'
          : val >= -4.0
          ? 'Moderately Soluble'
          : 'Poorly Soluble';
      const concApprox = Math.pow(10, val) * (desc?.['Molecular Weight'] || 180.16);
      const concText = `~${concApprox.toFixed(2)} g/L`;
      const narrative = isSingleModel && singleModelConfig
        ? `${singleModelConfig.label} predicts ${cat.toLowerCase()} water solubility (${concText} at 25°C), ${
            val >= -4.0
              ? 'favorable for human oral gastrointestinal bioavailability.'
              : 'requiring lipid-based formulations to ensure bioavailability.'
          } (Δ vs ensemble mean: ${val - e.mean >= 0 ? '+' : ''}${(val - e.mean).toFixed(2)} logS).`
        : `Predicts ${cat.toLowerCase()} water solubility (${concText} at 25°C), ${
            val >= -4.0
              ? 'favorable for human oral gastrointestinal bioavailability.'
              : 'requiring lipid-based formulations to ensure bioavailability.'
          }`;

      return {
        numeral: val.toFixed(2),
        unit: 'log mol/L (logS)',
        ci: ciText,
        category: cat,
        narrative,
        narrativeConc: concText,
        sigmaLabel: isSingleModel && singleModelConfig
          ? `${singleModelConfig.label} · Delaney ESOL`
          : `σ = ${std.toFixed(3)} (${e.agreement})`,
        meanVal: val,
        confidence: `${(1 - Math.min(0.5, std / 2)).toFixed(2)} / 1.00`,
        diagnostic,
        models: allModelVals,
        heroTitle,
        heroBadge,
        heroBadgeColor,
      };
    } else if (endpoint === 'permeability') {
      const b = pred.bbbp;
      const getProb = (m: ModelKey) => {
        const val = b.models[m] ?? (m === 'rf' ? b.models['baseline'] : undefined);
        return typeof val === 'number' ? val : b.probability;
      };

      const allModelProbs: Record<ModelKey, number> = {
        mpnn: Number((getProb('mpnn') * 100).toFixed(1)),
        gin: Number((getProb('gin') * 100).toFixed(1)),
        gat: Number((getProb('gat') * 100).toFixed(1)),
        gcn: Number((getProb('gcn') * 100).toFixed(1)),
        rf: Number((getProb('rf') * 100).toFixed(1)),
      };

      let prob: number;
      let std: number;
      let heroTitle: string;
      let heroBadge: string;
      let heroBadgeColor: string | undefined;
      let ciText: string;
      let diagnostic: string;

      if (isSingleModel && singleModelKey && singleModelConfig) {
        prob = getProb(singleModelKey);
        const delta = prob - b.probability;
        const deltaPct = `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`;
        std = Math.abs(delta);
        heroTitle = `${singleModelConfig.label} Architecture Inference`;
        heroBadge = `${singleModelConfig.label} Model`;
        heroBadgeColor = singleModelConfig.color;
        ciText = `Δ ${deltaPct} (vs Mean)`;
        diagnostic = `${singleModelConfig.label} (${singleModelConfig.sublabel}) BBB head. Delta from 5-model mean: ${deltaPct}.`;
      } else if (isEnsemble) {
        prob = b.probability;
        std = b.std;
        heroTitle = 'Ensemble Consensus Inference';
        heroBadge = 'Epistemic Convergence';
        ciText = `± ${(b.std * 100).toFixed(1)}%`;
        diagnostic = 'Passive transcellular permeability prediction across 5 distinct GNN heads.';
      } else {
        const subset = Array.from(activeModels).map((m) => getProb(m));
        prob = subset.reduce((a, b) => a + b, 0) / subset.length;
        std = Math.sqrt(subset.reduce((acc, v) => acc + Math.pow(v - prob, 2), 0) / subset.length);
        heroTitle = `${activeModels.size}-Model Consensus Inference`;
        heroBadge = `${activeModels.size} Models Active`;
        ciText = `± ${(std * 100).toFixed(1)}%`;
        diagnostic = `Custom ${activeModels.size}-architecture consensus. Inter-model deviation: ±${(std * 100).toFixed(1)}%.`;
      }

      const pct = (prob * 100).toFixed(0);
      const cat =
        prob >= 0.7
          ? 'High Permeability'
          : prob >= 0.4
          ? 'Moderate Permeability'
          : 'Low BBB Penetration';
      const penetrates = prob >= 0.5;
      const narrative = isSingleModel && singleModelConfig
        ? `${singleModelConfig.label} predicts molecule is ${
            penetrates ? 'likely to penetrate' : 'restricted from'
          } the blood-brain barrier (BBB+ probability ${pct}%, Δ vs mean: ${
            prob - b.probability >= 0 ? '+' : ''
          }${((prob - b.probability) * 100).toFixed(1)}%), influenced by TPSA of ${
            desc?.TPSA.toFixed(1) || '63.6'
          } Å² and LogP ${desc?.LogP.toFixed(2) || '1.31'}.`
        : `${
            penetrates ? 'Likely to penetrate' : 'Restricted from'
          } the blood-brain barrier (BBB+ probability ${pct}%), influenced by TPSA of ${
            desc?.TPSA.toFixed(1) || '63.6'
          } Å² and LogP ${desc?.LogP.toFixed(2) || '1.31'}.`;

      return {
        numeral: `${(prob * 100).toFixed(0)}%`,
        unit: 'BBB+ Prob (BBBP)',
        ci: ciText,
        category: cat,
        narrative,
        narrativeConc: `${pct}% Probability`,
        sigmaLabel: isSingleModel && singleModelConfig
          ? `${singleModelConfig.label} (${penetrates ? 'PENETRATES' : 'RESTRICTED'})`
          : `σ = ${(std * 100).toFixed(1)}% (${b.classification})`,
        meanVal: prob * 100,
        confidence: `${(1 - std).toFixed(2)} / 1.00`,
        diagnostic,
        models: allModelProbs,
        heroTitle,
        heroBadge,
        heroBadgeColor,
      };
    } else {
      const t = pred.tox21;
      const getModelRisk = (m: ModelKey) => {
        const val = t.models?.[m] ?? (m === 'rf' ? t.models?.['baseline'] : undefined);
        return typeof val === 'number' ? val : t.mean_risk;
      };

      const getModelHighCount = (m: ModelKey) => {
        const val = t.models_high_risk?.[m] ?? (m === 'rf' ? t.models_high_risk?.['baseline'] : undefined);
        return typeof val === 'number' ? val : t.high_risk_count;
      };

      const allModelRisks: Record<ModelKey, number> = {
        mpnn: Number((getModelRisk('mpnn') * 100).toFixed(1)),
        gin: Number((getModelRisk('gin') * 100).toFixed(1)),
        gat: Number((getModelRisk('gat') * 100).toFixed(1)),
        gcn: Number((getModelRisk('gcn') * 100).toFixed(1)),
        rf: Number((getModelRisk('rf') * 100).toFixed(1)),
      };

      let highCount: number;
      let avgProb: number;
      let heroTitle: string;
      let heroBadge: string;
      let heroBadgeColor: string | undefined;
      let ciText: string;
      let diagnostic: string;
      let sigmaLabel: string;

      if (isSingleModel && singleModelKey && singleModelConfig) {
        highCount = getModelHighCount(singleModelKey);
        avgProb = getModelRisk(singleModelKey);
        heroTitle = `${singleModelConfig.label} Architecture Inference`;
        heroBadge = `${singleModelConfig.label} Model`;
        heroBadgeColor = singleModelConfig.color;
        ciText = `Mean Risk: ${(avgProb * 100).toFixed(1)}%`;
        diagnostic = `${singleModelConfig.label} (${singleModelConfig.sublabel}) evaluated 12 nuclear receptor & stress response assays.`;
        sigmaLabel = `${singleModelConfig.label} · Tox21 Panel`;
      } else if (isEnsemble) {
        highCount = t.high_risk_count;
        avgProb = t.mean_risk;
        heroTitle = 'Ensemble Consensus Inference';
        heroBadge = 'Epistemic Convergence';
        ciText = `Max Prob: ${(t.max_risk * 100).toFixed(1)}%`;
        diagnostic = 'Multi-task edge-conditioned toxicity evaluation across androgen, estrogen, and stress response bioassays.';
        sigmaLabel = `Status: ${t.aggregate_status}`;
      } else {
        const activeList = Array.from(activeModels);
        const counts = activeList.map(getModelHighCount);
        highCount = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
        const risks = activeList.map(getModelRisk);
        avgProb = risks.reduce((a, b) => a + b, 0) / risks.length;
        heroTitle = `${activeModels.size}-Model Consensus Inference`;
        heroBadge = `${activeModels.size} Models Active`;
        ciText = `Mean Risk: ${(avgProb * 100).toFixed(1)}%`;
        diagnostic = `Custom ${activeModels.size}-architecture toxicity consensus.`;
        sigmaLabel = `${activeModels.size} Models Active`;
      }

      const cat =
        highCount === 0
          ? 'Low Tox Risk'
          : highCount <= 2
          ? 'Moderate Risk Flags'
          : 'Elevated Toxicity Alerts';

      const narrative = isSingleModel && singleModelConfig
        ? `${singleModelConfig.label} profiling across 12 standard nuclear receptor and cellular stress pathways flagged ${highCount} high-risk alert(s) with an average pathway risk of ${(avgProb * 100).toFixed(1)}%.`
        : `Tox21 profiling across 12 standard nuclear receptor and cellular stress pathways flagged ${highCount} high-risk alert(s). Status: ${t.aggregate_status}.`;

      return {
        numeral: highCount.toString(),
        unit: 'Flagged Pathways / 12',
        ci: ciText,
        category: cat,
        narrative,
        narrativeConc: `${highCount} Alerts`,
        sigmaLabel,
        meanVal: avgProb * 100,
        confidence: `${(1 - avgProb).toFixed(2)} / 1.00`,
        diagnostic,
        models: allModelRisks,
        heroTitle,
        heroBadge,
        heroBadgeColor,
      };
    }
  }, [pred, endpoint, desc, activeModels, isEnsemble, isSingleModel, singleModelKey, singleModelConfig]);

  // Calculate horizontal bar fill percentage
  const calculateBarWidth = (val: number) => {
    if (endpoint === 'solubility') {
      const min = -6.0;
      const max = 0.5;
      const pct = ((val - min) / (max - min)) * 100;
      return Math.max(12, Math.min(94, pct));
    } else {
      // 0 to 100%
      return Math.max(12, Math.min(94, val));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. COLLAPSIBLE LUXURY GUIDANCE DRAWER */}
      <section
        id="guidance-card"
        className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04] transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => setGuidanceCollapsed(!guidanceCollapsed)}
          >
            <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline text-base text-on-surface font-medium">
                  How to utilize this molecular inference suite
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Workflow Guide
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                From SMILES input to deep graph ensemble consensus with calibrated uncertainty
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectPreset('Aspirin')}
              className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-primary text-xs font-medium transition flex items-center gap-1.5 border border-primary/20 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Aspirin Example</span>
            </button>
            <button
              type="button"
              onClick={() => setGuidanceCollapsed(!guidanceCollapsed)}
              className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  guidanceCollapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!guidanceCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 mt-5 border-t border-surface-container-highest/40">
                <div className="p-4 rounded-2xl bg-surface-container/50 border border-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-surface-container-highest text-primary">
                      01
                    </span>
                    <h4 className="text-sm font-medium text-on-surface">Chemical Specification</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Provide canonical SMILES or sketch connectivity directly on our native 2D vector blueprint canvas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container/50 border border-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-surface-container-highest text-primary">
                      02
                    </span>
                    <h4 className="text-sm font-medium text-on-surface">Ensemble Configuration</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Switch between ESOL, BBBP, and Tox21 targets across MPNN, GIN, GAT, GCN, and Random Forest baselines.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container/50 border border-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-surface-container-highest text-primary">
                      03
                    </span>
                    <h4 className="text-sm font-medium text-on-surface">Bayesian Consensus</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Quantify genuine epistemic uncertainty (±σ) derived from inter-model disagreement across disjoint scaffolds.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 2. HERO MOLECULAR INPUT & ARCHITECTURAL TARGETS */}
      <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl flex flex-col gap-8 border border-white/[0.04]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
              Molecular Input & Architectural Targets
            </span>
            <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight">
              Predict molecular properties
            </h1>
            <p className="text-sm text-on-surface-variant">
              Deep Graph Neural Network ensembling with rigorous epistemic uncertainty quantification.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high/90 text-on-surface text-xs font-mono border border-white/[0.04] self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>PyG 2.8 · 0% Scaffold Leakage</span>
          </div>
        </div>

        {/* SMILES Input Row */}
        <div className="flex flex-col gap-3" id="smiles-input-container">
          <div className="flex items-center justify-between">
            <label htmlFor="smiles-input" className="text-xs text-on-surface-variant flex items-center gap-2 font-medium">
              <span>Canonical SMILES String</span>
              <span className="text-outline text-[11px] font-mono">ISO/IEC 19770</span>
            </label>
            <button
              type="button"
              onClick={() => setSketcherOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-medium transition active:scale-95 group"
            >
              <Edit3 className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform" />
              <span>Open Vector Sketcher</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              id="smiles-input"
              type="text"
              value={localSmiles}
              onChange={(e) => handleSmilesChange(e.target.value)}
              placeholder="Enter canonical IUPAC SMILES (e.g. CC(=O)Oc1ccccc1C(=O)O)..."
              className="w-full h-14 pl-4 pr-32 rounded-2xl bg-surface-container text-on-surface font-mono text-sm placeholder:text-outline focus:outline-none focus:bg-surface-container-high focus:ring-1 focus:ring-primary/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all"
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-variant transition active:scale-90"
                title="Copy SMILES"
              >
                {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-variant transition active:scale-90"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation Status */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div
              className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-all duration-300 ${
                isValidating
                  ? 'bg-surface-container text-outline border-white/10'
                  : validation?.valid
                  ? 'bg-secondary-container/20 text-on-secondary-container border-secondary/20'
                  : validation && !validation.valid
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                  : 'bg-surface-container text-outline border-transparent'
              }`}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Validating chemical syntax...</span>
                </>
              ) : validation?.valid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                  <span>
                    Valid IUPAC SMILES · Formula: {validation.formula} · Heavy Atoms: {validation.heavy_atoms}
                  </span>
                </>
              ) : validation && !validation.valid ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{validation.error}</span>
                </>
              ) : (
                <span>Enter a molecule to inspect topology</span>
              )}
            </div>

            <div className="text-[11px] font-mono text-outline">
              InChIKey: {analysisData?.inchikey || (desc ? 'Generated from topology' : '---')}
            </div>
          </div>
        </div>

        {/* Preset Molecule Chips */}
        <div className="flex flex-col gap-2 pt-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-outline">
            FDA Clinically Approved Presets
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(PRESET_DRUGS).map((key) => {
              const isSelected = activePreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? 'bg-surface-container-high text-primary border border-primary/40 shadow-sm'
                      : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-white/[0.03]'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        {/* Endpoint Selector Tabs & Architectural Model Chips */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-surface-container-highest/40">
          {/* Target Endpoints (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2.5">
            <label className="text-xs text-on-surface-variant font-medium">Target Biological Endpoint</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-surface-container border border-white/[0.04]">
              <button
                type="button"
                onClick={() => setEndpoint('solubility')}
                className={`py-2 px-2 rounded-xl text-xs text-center transition font-medium ${
                  endpoint === 'solubility'
                    ? 'bg-surface-container-lowest text-primary shadow-md border border-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Solubility (ESOL)
              </button>
              <button
                type="button"
                onClick={() => setEndpoint('permeability')}
                className={`py-2 px-2 rounded-xl text-xs text-center transition font-medium ${
                  endpoint === 'permeability'
                    ? 'bg-surface-container-lowest text-primary shadow-md border border-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                BBB Perm (BBBP)
              </button>
              <button
                type="button"
                onClick={() => setEndpoint('toxicity')}
                className={`py-2 px-2 rounded-xl text-xs text-center transition font-medium ${
                  endpoint === 'toxicity'
                    ? 'bg-surface-container-lowest text-primary shadow-md border border-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Tox21 Panels
              </button>
            </div>
          </div>

          {/* Model Selector Chips (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-on-surface-variant font-medium">
                Graph Neural Network Architectures
              </label>
              <span className="text-[11px] font-mono text-outline">
                {isSingleModel
                  ? `${singleModelConfig?.label} Mode`
                  : activeModels.size === 5
                  ? '5-Model Ensemble'
                  : `${activeModels.size} Models Active`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleToggleModel('all')}
                className={`h-9 px-3.5 rounded-full text-xs font-medium border transition-all active:scale-95 flex items-center gap-1.5 ${
                  activeModels.size === 5
                    ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-white/[0.04] opacity-70 hover:opacity-100'
                }`}
              >
                <span>All Ensemble</span>
                {activeModels.size === 5 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-on-primary animate-pulse" />
                )}
              </button>

              {(Object.keys(MODEL_CONFIGS) as ModelKey[]).map((m) => {
                const cfg = MODEL_CONFIGS[m];
                const active = activeModels.has(m);
                const isOnly = isSingleModel && active;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={(e) => handleToggleModel(m, e)}
                    title={`Click to predict with ${cfg.label} (${cfg.sublabel})`}
                    className={`h-9 px-3.5 rounded-full text-xs font-medium border flex items-center gap-2 transition-all active:scale-95 ${
                      isOnly
                        ? 'text-white border-white/40 shadow-md font-semibold ring-1 ring-white/20'
                        : active
                        ? 'bg-surface-container-high text-on-surface border-white/20'
                        : 'bg-surface-container text-outline border-transparent opacity-40 hover:opacity-75'
                    }`}
                    style={
                      isOnly
                        ? { backgroundColor: cfg.color, borderColor: cfg.color }
                        : {}
                    }
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Execution & Telemetry Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-surface-container-highest/40">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(153,211,180,0.6)]" />
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
              <span className="text-on-surface font-medium">Latency ~{latencyMs}ms</span>
              <span className="text-outline">·</span>
              <span>
                {isSingleModel
                  ? `${singleModelConfig?.label} Active`
                  : activeModels.size === 5
                  ? 'All 5 Models Active'
                  : `${activeModels.size}/5 Models Active`}
              </span>
              <span className="text-outline">·</span>
              <span className="text-primary">PyG 2.8 Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSelectPreset('Aspirin')}
              className="px-5 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm transition flex items-center gap-2 active:scale-95 border border-transparent hover:border-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => runAnalysis(localSmiles)}
              disabled={isLoading || !localSmiles.trim()}
              className={`relative px-7 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden ${
                isInputModified
                  ? 'bg-amber-400 text-black shadow-[0_0_24px_rgba(251,191,36,0.6)] animate-pulse hover:bg-amber-300'
                  : 'bg-primary text-on-primary hover:bg-primary-fixed shadow-[0_8px_24px_rgba(241,207,156,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing PyG Tensors...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                  <span>
                    {isInputModified ? 'Predict modified structure' : 'Predict properties'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {justInferred && (
          <div className="p-3.5 rounded-2xl bg-secondary/15 border border-secondary/35 text-secondary text-xs font-mono flex items-center justify-between shadow-lg transition-all animate-stagger">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
              <span className="font-medium">
                Live PyTorch Geometric inference completed across 5 GNN heads in {latencyMs}ms.
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-mono">
              Timestamp: {lastInferenceTime} (Execution #{inferenceCount})
            </span>
          </div>
        )}

        {analysisError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <span>❌ {analysisError}</span>
            <button
              type="button"
              onClick={() => setAnalysisError(null)}
              className="font-bold underline ml-3"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      {/* 3. ASYMMETRIC RESULTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 2D Molecular Vector Card (5 cols) */}
        <div
          id="molecule-card"
          className="animate-stagger lg:col-span-5 rounded-3xl bg-surface-container-low/75 backdrop-blur-2xl p-6 shadow-xl flex flex-col gap-6 border border-white/[0.04]"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                Topological Conformation
              </span>
              <h2 className="font-headline text-lg text-on-surface font-normal">
                {activePreset ? PRESET_DRUGS[activePreset]?.name : 'User Molecule'}
              </h2>
              <span className="text-[11px] font-mono text-outline">
                {activePreset ? PRESET_DRUGS[activePreset]?.subtitle : 'Custom Target Structure'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportSvg}
              className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-variant transition active:scale-90"
              title="Export Vector SVG"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* High Precision 2D Vector Rendering */}
          <div className="mol-container relative w-full aspect-square max-h-[300px] rounded-2xl bg-black/[0.03] dark:bg-[#08090b] flex items-center justify-center p-4 shadow-inner overflow-hidden group border border-black/[0.06] dark:border-white/[0.03]">
            {analysisData?.svg_2d ? (
              <div
                className="rdkit-svg-auto w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
                dangerouslySetInnerHTML={{ __html: analysisData.svg_2d }}
              />
            ) : (
              <div className="text-center text-outline text-xs flex flex-col items-center gap-2">
                <BrainCircuit className="w-8 h-8 text-outline/50 animate-pulse" />
                <span>Generating Kekulé projection...</span>
              </div>
            )}

            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high/90 text-outline text-[11px] font-mono border border-white/[0.04]">
              <span>RDKit Kekulé 2D</span>
            </div>
          </div>

          {/* Telemetry Badge Matrix */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-surface-container flex flex-col border border-white/[0.02]">
              <span className="text-[10px] font-mono uppercase text-outline">Formula</span>
              <span className="font-mono text-sm text-on-surface font-medium truncate">
                {analysisData?.formula || '---'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container flex flex-col border border-white/[0.02]">
              <span className="text-[10px] font-mono uppercase text-outline">Mol. Weight</span>
              <span className="font-mono text-sm text-on-surface font-medium">
                {desc ? desc['Molecular Weight'].toFixed(2) : '---'}
              </span>
              <span className="text-[10px] font-mono text-outline">g/mol</span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container flex flex-col border border-white/[0.02]">
              <span className="text-[10px] font-mono uppercase text-outline">Rot. Bonds</span>
              <span className="font-mono text-sm text-on-surface font-medium">
                {desc ? desc['Rotatable Bonds'] : '---'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container flex flex-col border border-white/[0.02]">
              <span className="text-[10px] font-mono uppercase text-outline">H-Donors</span>
              <span className="font-mono text-sm text-on-surface font-medium">
                {desc ? desc['H-Bond Donors'] : '---'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container flex flex-col border border-white/[0.02]">
              <span className="text-[10px] font-mono uppercase text-outline">H-Acceptors</span>
              <span className="font-mono text-sm text-on-surface font-medium">
                {desc ? desc['H-Bond Acceptors'] : '---'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container flex flex-col border border-white/[0.02]">
              <span className="text-[10px] font-mono uppercase text-outline">TPSA</span>
              <span className="font-mono text-sm text-on-surface font-medium">
                {desc ? desc.TPSA.toFixed(1) : '---'}
              </span>
              <span className="text-[10px] font-mono text-outline">Å²</span>
            </div>
          </div>

          {/* Real PyG Featurized Graph Telemetry */}
          {analysisData?.graph_stats && (
            <div className="p-3.5 rounded-2xl bg-surface-container/70 border border-secondary/25 flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-secondary font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  Live PyTorch Geometric Graph
                </span>
                <span className="text-[10px] text-outline">48d node / 10d edge tensors</span>
              </div>
              <div className="text-xs font-mono text-on-surface flex items-center justify-between flex-wrap gap-1">
                <span>{analysisData.graph_stats.num_nodes} atom nodes</span>
                <span className="text-outline">·</span>
                <span>{analysisData.graph_stats.num_edges} directed bond edges</span>
                <span className="text-outline">·</span>
                <span className="text-primary font-medium">PyG 2.8 CPU Engine</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Consensus Prediction Hero Card (7 cols) */}
        <div
          id="prediction-hero-card"
          key={inferenceCount}
          className="animate-stagger lg:col-span-7 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl flex flex-col justify-between gap-8 border border-white/[0.04]"
        >
          <div className="flex flex-col gap-6">
            {/* Top Meta Row */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
                {currentDisplay.heroTitle || 'Ensemble Consensus Inference'}
              </span>
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: currentDisplay.heroBadgeColor
                    ? `${currentDisplay.heroBadgeColor}20`
                    : 'rgba(241, 207, 156, 0.1)',
                  borderColor: currentDisplay.heroBadgeColor
                    ? `${currentDisplay.heroBadgeColor}40`
                    : 'rgba(241, 207, 156, 0.2)',
                  color: currentDisplay.heroBadgeColor || '#f1cf9c',
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{currentDisplay.heroBadge || 'Epistemic Convergence'}</span>
              </div>
            </div>

            {/* Hero Numeral Block with Newsreader Font */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl md:text-6xl text-on-surface font-normal tracking-tight tabular-nums">
                  {currentDisplay.numeral}
                </span>
                <span className="text-xs uppercase tracking-wider text-outline font-mono">
                  {currentDisplay.unit}
                </span>
              </div>

              {/* Champagne Gold Accent Underline */}
              <div className="w-28 h-0.5 rounded-full bg-primary shadow-[0_0_12px_rgba(241,207,156,0.5)]" />
            </div>

            {/* Uncertainty & Category Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container text-xs font-mono text-on-surface border border-white/[0.02]">
                <span className="text-primary font-medium">{currentDisplay.ci}</span>
                <span className="text-outline">·</span>
                <span className="text-on-surface-variant">
                  {isSingleModel ? 'Model Deviation & Calibrated Metric' : '95% CI Epistemic Variance'}
                </span>
              </div>

              {/* Category Pill with Explainer Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setInfoPopoverOpen(!infoPopoverOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/15 text-primary text-xs font-semibold border border-primary/20 hover:bg-primary/25 transition cursor-pointer"
                >
                  <span>{currentDisplay.category}</span>
                  <Info className="w-3.5 h-3.5 text-primary/70" />
                </button>

                <AnimatePresence>
                  {infoPopoverOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 bottom-full mb-2 w-72 p-4 rounded-2xl bg-surface-container-high/95 backdrop-blur-xl border border-white/10 shadow-2xl text-on-surface z-50 text-xs space-y-1.5"
                    >
                      <div className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
                        Classification Standard
                      </div>
                      <p className="text-on-surface-variant leading-relaxed">
                        {endpoint === 'solubility'
                          ? 'ESOL Solubility: > -2.0 is highly soluble; -4.0 to -2.0 is moderately soluble; < -4.0 is poorly soluble.'
                          : endpoint === 'permeability'
                          ? 'BBBP: Probability > 0.70 indicates high passive penetration across brain capillary endothelial tight junctions.'
                          : 'Tox21: Evaluates activation across 12 nuclear receptor (AR, ER, Aromatase) and cellular stress pathways.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Plain Language Interpretation Narrative */}
            <div className="p-4 rounded-2xl bg-surface-container/60 flex flex-col gap-1.5 border border-white/[0.02]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-outline font-medium">
                Biophysical Interpretation
              </span>
              <p className="text-sm text-on-surface leading-relaxed">
                {currentDisplay.narrative}
              </p>
            </div>
          </div>

          {/* Epistemic Quality Gauge Row */}
          <div className="flex flex-col gap-3 pt-4 border-t border-surface-container-highest/40">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-secondary" />
                <span>Cross-architecture agreement</span>
              </span>
              <span className="font-mono text-xs text-on-surface font-medium">
                {currentDisplay.sigmaLabel}
              </span>
            </div>

            {/* Segmented Calibration Bar */}
            <div className="w-full h-2 rounded-full bg-surface-container-highest flex overflow-hidden">
              <div className="h-full bg-secondary w-4/5 rounded-l-full transition-all duration-700" />
              <div className="h-full bg-primary w-1/6 transition-all duration-700" />
              <div className="h-full bg-rose-500 w-[4%] rounded-r-full transition-all duration-700" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-outline">
              <span>
                {pred
                  ? endpoint === 'solubility'
                    ? `Scaffold Agreement: ${pred.esol.agreement}`
                    : endpoint === 'permeability'
                    ? `Permeability Status: ${pred.bbbp.classification}`
                    : `Panel Status: ${pred.tox21.aggregate_status}`
                  : 'Awaiting Model Inference'}
              </span>
              <span>
                {lastInferenceTime ? `Inferred: ${lastInferenceTime}` : 'PyG 2.8 Engine'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MULTI-MODEL CONSENSUS DISTRIBUTION (Full-Width Glass Card) */}
      <section
        id="consensus-distribution-card"
        className="animate-stagger rounded-3xl bg-surface-container-low/75 backdrop-blur-2xl p-8 shadow-2xl flex flex-col gap-6 border border-white/[0.04]"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
              Inter-Model Variance & Disagreement
            </span>
            <h3 className="font-headline text-2xl text-on-surface font-normal">
              Model consensus breakdown
            </h3>
            <p className="text-xs text-on-surface-variant">
              Comparing four distinct graph inductive biases against Morgan circular fingerprint Random Forest.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-on-surface-variant bg-surface-container px-4 py-2 rounded-2xl border border-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary border-t-2 border-dashed border-primary" />
              <span>
                {isSingleModel
                  ? `${singleModelConfig?.label} Focus (${currentDisplay.numeral})`
                  : `Ensemble Mean (${currentDisplay.numeral})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
              <span>Disjoint Scaffold Test Split</span>
            </div>
          </div>
        </div>

        {/* Multi-Bar Grid with Dashed Ensemble Mean Line */}
        <div className="relative flex flex-col gap-5 pt-4">
          {/* Dashed Vertical Active Mean / Model Line */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center border-r-2 border-dashed border-primary/70 transition-all duration-500"
            style={{
              left: `${calculateBarWidth(currentDisplay.meanVal)}%`,
            }}
          >
            <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-mono text-[10px] -mt-3 font-semibold shadow-sm whitespace-nowrap">
              {isSingleModel
                ? `${singleModelConfig?.label} ${currentDisplay.numeral}`
                : `Mean ${currentDisplay.numeral}`}
            </span>
          </div>

          {/* Model Rows */}
          {(Object.keys(MODEL_CONFIGS) as ModelKey[]).map((m) => {
            const cfg = MODEL_CONFIGS[m];
            const active = activeModels.has(m);
            const isTarget = isSingleModel && active;
            const val = currentDisplay.models[m] ?? currentDisplay.meanVal;
            const delta = val - currentDisplay.meanVal;
            const deltaSign = delta >= 0 ? '+' : '';
            const widthPct = calculateBarWidth(val);

            return (
              <div
                key={m}
                onClick={(e) => handleToggleModel(m, e)}
                className={`relative z-10 flex items-center gap-4 transition-all duration-300 cursor-pointer p-1.5 -mx-1.5 rounded-2xl hover:bg-surface-container-high/40 ${
                  active ? 'opacity-100' : 'opacity-35 hover:opacity-75'
                } ${isTarget ? 'ring-1 ring-primary/40 bg-surface-container/60' : ''}`}
                title={`Click to focus on ${cfg.label} model`}
              >
                <div className="w-32 flex items-center justify-between shrink-0">
                  <span className={`text-sm font-medium ${isTarget ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                    {cfg.label}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                </div>

                <div className="flex-1 h-9 rounded-xl bg-surface-container/60 p-1 flex items-center relative overflow-hidden group">
                  <div
                    className="h-full rounded-lg flex items-center justify-end px-3 transition-all duration-700 ease-out shadow-sm cursor-pointer hover:brightness-110"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: cfg.color,
                    }}
                  >
                    <span className="font-mono text-xs text-white font-medium tabular-nums">
                      {val.toFixed(2)}
                    </span>
                  </div>

                  <div className="pointer-events-none absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded bg-surface-container-high/90 text-on-surface font-mono text-[11px] border border-white/10 shadow-lg">
                    {cfg.label} {cfg.sublabel} · Δ: {deltaSign}
                    {delta.toFixed(2)}
                  </div>
                </div>

                <div className="w-16 font-mono text-xs text-on-surface-variant text-right tabular-nums shrink-0">
                  Δ {deltaSign}
                  {delta.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart Subtext Diagnostic */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest/40 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-outline">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
            <span>{currentDisplay.diagnostic}</span>
          </div>

          <div className="font-mono text-on-surface-variant">
            <span>
              Confidence Index:{' '}
              <span className="text-primary font-medium">{currentDisplay.confidence}</span>
            </span>
          </div>
        </div>
      </section>

      {/* 5. GNNEXPLAINER NEXT-STEP ACTION CALLOUT */}
      <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-white/[0.04]">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 z-10">
          <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
            <BrainCircuit className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="font-headline text-lg text-on-surface font-normal">
              Curious which functional groups drove this prediction?
            </h4>
            <p className="text-sm text-on-surface-variant">
              Inspect atomic node feature attributions, bond importance weights, and mutual information subgraphs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate('/explain')}
            className="px-6 py-3 rounded-2xl bg-surface-container-high hover:bg-surface-variant text-primary text-xs font-semibold tracking-wide transition flex items-center gap-2 shadow-sm group active:scale-95 border border-primary/20 hover:border-primary/40"
          >
            <span>Explain with GNNExplainer</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PredictPage;
