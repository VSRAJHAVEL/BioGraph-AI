import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Sparkles, Info, RefreshCw, Cpu, Database } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ExplainResponse } from '@/lib/api/types';
import { useAppStore } from '@/store/useAppStore';
import GuideCard from '@/components/GuideCard';
import SmilesInputBar from '@/components/SmilesInputBar';
import NextStepSuggestion from '@/components/NextStepSuggestion';
import { toast } from 'sonner';

const MODEL_COLORS: Record<string, string> = {
  mpnn: '#9A86C9',
  gat: '#C98B5E',
  gin: '#C98AA3',
  gcn: '#7C9CC4',
};

export default function ExplainPage() {
  const { currentSmiles, setCurrentSmiles } = useAppStore();
  const [model, setModel] = useState<'mpnn' | 'gat' | 'gin' | 'gcn'>('mpnn');
  const [dataset, setDataset] = useState<'esol' | 'bbbp' | 'tox21'>('esol');
  const [epochs, setEpochs] = useState<number>(35);

  const explainMutation = useMutation({
    mutationFn: () => api.explain(currentSmiles, model, dataset, 0, epochs),
    onError: (err: any) => {
      toast.error('GNNExplainer failed: ' + err.message);
    },
  });

  const handleRun = (targetSmiles?: string | React.MouseEvent) => {
    const smi = (typeof targetSmiles === 'string' ? targetSmiles : currentSmiles || '').trim();
    if (!smi) {
      toast.error('Please enter a SMILES string first');
      return;
    }
    if (smi !== currentSmiles) {
      setCurrentSmiles(smi);
    }
    explainMutation.mutate();
  };

  const data: ExplainResponse | undefined = explainMutation.data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
          Explainable Graph Artificial Intelligence (XAI)
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          GNNExplainer Pharmacophore Attribution
        </h1>
        <p className="text-sm text-on-surface-variant">
          Sub-graph masking and mutual information maximization identifying key functional groups driving deep graph predictions.
        </p>
      </div>

      <GuideCard pageId="explain" onTryExample={(s) => setCurrentSmiles(s)} />

      <SmilesInputBar onAnalyze={handleRun} isAnalyzing={explainMutation.isPending} />

      {/* 2. Control Bar */}
      <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-outline">
              Architecture:
            </label>
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container border border-white/[0.03]">
              {(['mpnn', 'gat', 'gin', 'gcn'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition active:scale-95 flex items-center gap-1.5 ${
                    model === m
                      ? 'bg-surface-container-highest text-on-surface border border-white/20 shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: MODEL_COLORS[m] }}
                  />
                  <span>{m.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-secondary" />
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-outline">
              Target:
            </label>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as any)}
              className="bg-surface-container border border-white/[0.04] text-on-surface text-xs rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none font-mono"
            >
              <option value="esol">ESOL Delaney (Aqueous Solubility)</option>
              <option value="bbbp">BBBP (Blood-Brain Barrier)</option>
              <option value="tox21">Tox21 (12 Bioassay Panels)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-outline">
              Optimization Epochs:
            </label>
            <select
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              className="bg-surface-container border border-white/[0.04] text-on-surface text-xs rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none font-mono"
            >
              <option value={20}>20 (Fast Preview)</option>
              <option value={35}>35 (Standard Optimization)</option>
              <option value={50}>50 (Fine-grained Attribution)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={explainMutation.isPending || !currentSmiles}
          className="px-6 py-2.5 rounded-2xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed shadow-[0_8px_20px_rgba(241,207,156,0.25)] flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
        >
          {explainMutation.isPending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Optimizing Subgraph Mask...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Run GNNExplainer</span>
            </>
          )}
        </button>
      </section>

      {/* 3. Loading State */}
      {explainMutation.isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-14 text-center space-y-4 border border-primary/20 shadow-2xl"
        >
          <div className="inline-block p-4 rounded-2xl bg-primary/10 border border-primary/30 animate-pulse">
            <Sparkles className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h3 className="font-headline text-2xl text-on-surface">Computing Sub-Graph Edge Mask</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Maximizing mutual information between the full molecular graph and compact masked subgraph over {epochs} optimization iterations...
          </p>
        </motion.div>
      )}

      {/* 4. Results View */}
      {data && !explainMutation.isPending && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Top Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visual Highlight 2D */}
            <div className="lg:col-span-6 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-2xl border border-white/[0.04] flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                    Attribution Heatmap
                  </span>
                  <h3 className="font-headline text-xl text-on-surface font-normal">
                    Salient Sub-Graph Highlight
                  </h3>
                </div>
                <span className="text-[11px] font-mono bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                  {model.toUpperCase()} on {dataset.toUpperCase()}
                </span>
              </div>

              <div
                className="rdkit-svg-auto w-full flex justify-center py-4 bg-black/[0.03] dark:bg-[#08090b] rounded-2xl p-4 border border-black/[0.06] dark:border-white/[0.03] shadow-inner"
                dangerouslySetInnerHTML={{ __html: data.svg_highlighted }}
              />

              <p className="text-xs text-on-surface-variant text-center pt-2">
                Atoms with warmer yellow/orange aura contributed most strongly to the model&apos;s output.
              </p>
            </div>

            {/* Prediction Summary & Drivers */}
            <div className="lg:col-span-6 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-2xl border border-white/[0.04] flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                    Prediction Context
                  </span>
                  <h3 className="font-headline text-xl text-on-surface font-normal">
                    Model Inference Telemetry
                  </h3>
                </div>

                <div className="p-5 bg-surface-container rounded-2xl border border-white/[0.04] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-outline">Target Predicted Value</span>
                    <div className="font-display text-4xl text-on-surface mt-1 tabular-nums">
                      {dataset === 'esol'
                        ? `${data.prediction.toFixed(2)} logS`
                        : `${(data.prediction * 100).toFixed(1)}%`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-outline">GNN Bias</span>
                    <div className="text-base font-mono font-semibold text-primary mt-1">
                      {model.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-outline font-semibold">
                    Top Saliency Driver Atoms:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.atom_details.slice(0, 5).map((atom) => (
                      <div
                        key={atom.atom_idx}
                        className="bg-surface-container border border-white/[0.04] px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono flex items-center justify-center font-bold text-[10px]">
                          {atom.element}
                        </span>
                        <span className="text-on-surface font-mono">#{atom.atom_idx}</span>
                        <span className="font-mono font-semibold text-secondary">
                          {(atom.normalized_saliency * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container/60 border border-white/[0.04] text-xs text-on-surface-variant flex items-start gap-2.5">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  High saliency on polar heteroatoms (e.g., O, N) typically decreases LogP and increases aqueous solubility, whereas extended aromatic carbon assemblies drive lipophilic partition.
                </span>
              </div>
            </div>
          </div>

          {/* Atom Importance Table */}
          <section className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl border border-white/[0.04] space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                Attribution Spectrum
              </span>
              <h3 className="font-headline text-2xl text-on-surface font-normal">
                Atom-Level Attribution Weights
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-container-highest/60 text-outline uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Atom Index</th>
                    <th className="py-3 px-3">Element</th>
                    <th className="py-3 px-3">Hybridization</th>
                    <th className="py-3 px-3">Aromatic</th>
                    <th className="py-3 px-3">Raw Saliency</th>
                    <th className="py-3 px-3">Normalized Importance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/30">
                  {data.all_atoms.map((atom) => (
                    <tr key={atom.atom_idx} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3 px-3 text-outline">#{atom.atom_idx}</td>
                      <td className="py-3 px-3 font-bold text-on-surface">
                        <span className="inline-block px-2 py-0.5 bg-surface-container-high rounded text-primary">
                          {atom.element}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant">{atom.hybridization}</td>
                      <td className="py-3 px-3">
                        {atom.aromatic ? (
                          <span className="text-[10px] text-primary font-semibold">Yes</span>
                        ) : (
                          <span className="text-[10px] text-outline">No</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant tabular-nums">
                        {atom.importance.toFixed(4)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-28 bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, atom.normalized_saliency * 100))}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-primary font-semibold tabular-nums">
                            {(atom.normalized_saliency * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <NextStepSuggestion currentPage="explain" />
        </motion.div>
      )}

      {/* Empty State */}
      {!data && !explainMutation.isPending && (
        <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-14 text-center space-y-3 border border-white/[0.04]">
          <Search className="w-10 h-10 text-outline mx-auto" />
          <h3 className="font-headline text-xl text-on-surface font-normal">No Explanation Computed Yet</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            Select a target dataset and GNN architecture above, then click &quot;Run GNNExplainer&quot; to inspect which atoms steer the graph prediction.
          </p>
        </div>
      )}
    </div>
  );
}
