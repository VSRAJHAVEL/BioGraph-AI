import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Wand2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Database,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { AnalogsResponse } from '@/lib/api/types';
import { useAppStore } from '@/store/useAppStore';
import GuideCard from '@/components/GuideCard';
import SmilesInputBar from '@/components/SmilesInputBar';
import MetricInfoPopover from '@/components/MetricInfoPopover';
import NextStepSuggestion from '@/components/NextStepSuggestion';
import { toast } from 'sonner';

export default function AnalogsPage() {
  const { currentSmiles, setCurrentSmiles } = useAppStore();
  const [dataset, setDataset] = useState<'esol' | 'bbbp'>('esol');
  const [maxAnalogs, setMaxAnalogs] = useState<number>(8);

  const { data, isLoading, refetch } = useQuery<AnalogsResponse>({
    queryKey: ['analogs', currentSmiles, dataset, maxAnalogs],
    queryFn: () => api.getAnalogs(currentSmiles, dataset, maxAnalogs),
    enabled: Boolean(currentSmiles),
  });

  const handleRun = () => {
    if (!currentSmiles) {
      toast.error('Please enter a SMILES string first');
      return;
    }
    refetch();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
          Systematic Bioisosteric Transformations
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" />
          Bioisosteric Analog &amp; Lead Optimizer
        </h1>
        <p className="text-sm text-on-surface-variant">
          Matched Molecular Pair (MMP) transforms: bioisosteric functional group substitutions, fluorination, and polar surface tuning to optimize ADMET trade-offs.
        </p>
      </div>

      <GuideCard pageId="analogs" onTryExample={(s) => setCurrentSmiles(s)} />

      <SmilesInputBar onAnalyze={handleRun} isAnalyzing={isLoading} />

      {/* 2. Control Bar */}
      <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-outline flex items-center gap-1.5">
              Target Objective:
              <MetricInfoPopover metricKey="qed" />
            </label>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as any)}
              className="bg-surface-container border border-white/[0.04] text-on-surface text-xs rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none font-mono"
            >
              <option value="esol">Optimize Solubility (ESOL logS)</option>
              <option value="bbbp">Optimize BBB Penetration (BBBP)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-outline">
              Max Candidates:
            </label>
            <select
              value={maxAnalogs}
              onChange={(e) => setMaxAnalogs(Number(e.target.value))}
              className="bg-surface-container border border-white/[0.04] text-on-surface text-xs rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none font-mono"
            >
              <option value={4}>4 Candidates</option>
              <option value={8}>8 Candidates</option>
              <option value={12}>12 Candidates</option>
            </select>
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-outline">
              Parent Value:{' '}
              <strong className="text-primary font-bold">
                {dataset === 'esol'
                  ? `${data.parent_val.toFixed(2)} logS`
                  : `${(data.parent_val * 100).toFixed(1)}%`}
              </strong>
            </span>
            <span className="text-outline">
              Parent QED: <strong className="text-secondary">{data.parent_qed.toFixed(3)}</strong>
            </span>
          </div>
        )}
      </section>

      {/* 3. Loading State */}
      {isLoading && (
        <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-14 text-center space-y-4 border border-primary/20 shadow-2xl">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <h3 className="font-headline text-2xl text-on-surface">Evaluating Matched Molecular Pairs</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            Applying chemical transformations and running multi-model GNN inference on candidate analogs...
          </p>
        </div>
      )}

      {/* 4. Candidates Grid */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.analogs.map((analog, idx) => {
              const isPositiveDelta = analog.delta > 0;
              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04] hover:border-white/10 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {analog.transformation}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold font-mono">
                        {isPositiveDelta ? (
                          <span className="text-secondary flex items-center">
                            <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{analog.delta.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center">
                            <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                            {analog.delta.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed italic">
                      &quot;{analog.rationale}&quot;
                    </p>

                    <div className="bg-black/[0.03] dark:bg-[#08090b] p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.03] text-[11px] font-mono text-on-surface break-all select-all shadow-inner">
                      {analog.smiles}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                      <div className="bg-surface-container p-2.5 rounded-xl border border-white/[0.02]">
                        <span className="text-outline block text-[10px] uppercase">Predicted</span>
                        <span className="font-semibold text-on-surface">
                          {dataset === 'esol'
                            ? `${analog.predicted_value.toFixed(2)} logS`
                            : `${(analog.predicted_value * 100).toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="bg-surface-container p-2.5 rounded-xl border border-white/[0.02]">
                        <span className="text-outline block text-[10px] uppercase">QED Score</span>
                        <span className="font-semibold text-secondary">
                          {analog.qed.toFixed(3)}
                        </span>
                      </div>
                      <div className="bg-surface-container p-2.5 rounded-xl border border-white/[0.02]">
                        <span className="text-outline block text-[10px] uppercase">MW / LogP</span>
                        <span className="text-on-surface-variant">
                          {analog.mw.toFixed(0)} Da / {analog.logp.toFixed(1)}
                        </span>
                      </div>
                      <div className="bg-surface-container p-2.5 rounded-xl border border-white/[0.02]">
                        <span className="text-outline block text-[10px] uppercase">Lipinski Ro5</span>
                        <span className="flex items-center gap-1">
                          {analog.lipinski_pass ? (
                            <span className="text-secondary flex items-center font-semibold">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Pass
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center font-semibold">
                              <XCircle className="w-3 h-3 mr-0.5" /> Violations
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSmiles(analog.smiles);
                      toast.success(`Loaded analog candidate into active workspace!`);
                    }}
                    className="w-full mt-2 py-2.5 px-3 text-xs bg-surface-container hover:bg-surface-container-high hover:border-primary/40 border border-white/[0.04] rounded-2xl text-primary font-semibold transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Use as Active Molecule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <NextStepSuggestion currentPage="analogs" />
        </motion.div>
      )}

      {/* 5. Empty State */}
      {!data && !isLoading && (
        <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-14 text-center space-y-3 border border-white/[0.04]">
          <Wand2 className="w-10 h-10 text-outline mx-auto" />
          <h3 className="font-headline text-xl text-on-surface font-normal">No Analog Generation Run</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            Provide a lead SMILES structure above to generate bioisosteric modifications that optimize solubility or blood-brain barrier penetration.
          </p>
        </div>
      )}
    </div>
  );
}
