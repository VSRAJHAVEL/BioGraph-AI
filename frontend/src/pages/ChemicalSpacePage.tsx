import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Compass, RefreshCw, Database, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ChemicalSpaceResponse } from '@/lib/api/types';
import { useAppStore } from '@/store/useAppStore';
import GuideCard from '@/components/GuideCard';
import SmilesInputBar from '@/components/SmilesInputBar';
import NextStepSuggestion from '@/components/NextStepSuggestion';
import { toast } from 'sonner';

export default function ChemicalSpacePage() {
  const { currentSmiles, setCurrentSmiles, theme } = useAppStore();
  const isDark = theme === 'dark';
  const [dataset, setDataset] = useState<'esol' | 'bbbp' | 'tox21'>('esol');

  const { data, isLoading, refetch } = useQuery<ChemicalSpaceResponse>({
    queryKey: ['chemicalSpace', currentSmiles, dataset],
    queryFn: () => api.getChemicalSpace(currentSmiles, dataset),
    enabled: Boolean(currentSmiles),
  });

  const handleRun = () => {
    if (!currentSmiles) {
      toast.error('Please enter a SMILES string first');
      return;
    }
    refetch();
  };

  const referenceData = data?.reference_points || [];
  const queryData = data?.query_coords ? [{ ...data.query_coords, id: 'Query Compound', target: 0 }] : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
          High-Dimensional Topological Embeddings
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight flex items-center gap-3">
          <Compass className="w-8 h-8 text-primary" />
          Chemical Space &amp; Tanimoto Neighborhood
        </h1>
        <p className="text-sm text-on-surface-variant">
          2D Principal Component Analysis (PCA) projection of 2048-bit Morgan circular fingerprints with Tanimoto structural nearest-neighbor ranking.
        </p>
      </div>

      <GuideCard pageId="space" onTryExample={(s) => setCurrentSmiles(s)} />

      <SmilesInputBar onAnalyze={handleRun} isAnalyzing={isLoading} />

      {/* 2. Dataset Landscape Filter */}
      <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-outline">
            Reference Landscape:
          </span>
          <div className="flex gap-2">
            {[
              { id: 'esol', label: 'ESOL Delaney (Aqueous Solubility)' },
              { id: 'bbbp', label: 'BBBP (Blood-Brain Permeability)' },
              { id: 'tox21', label: 'Tox21 (Toxicology Manifold)' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDataset(d.id as any)}
                className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all font-mono active:scale-95 ${
                  dataset === d.id
                    ? 'bg-surface-container-highest border-white/20 text-primary font-semibold shadow-sm'
                    : 'bg-surface-container border-transparent text-outline hover:text-on-surface'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-primary">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Projecting Morgan Fingerprints...</span>
          </div>
        )}
      </section>

      {/* 3. Main Visual Landscape & Nearest Neighbors */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* 2D PCA Scatter Plot (7 cols) */}
          <div className="animate-stagger lg:col-span-7 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-2xl border border-white/[0.04] flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                    Manifold Projection
                  </span>
                  <h3 className="font-headline text-xl text-on-surface font-normal">
                    2D PCA Fingerprint Space
                  </h3>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-surface-container text-outline border border-white/[0.04]">
                  {referenceData.length} Reference Compounds
                </span>
              </div>

              <div className="h-96 w-full bg-black/[0.03] dark:bg-[#08090b] rounded-2xl p-3 border border-black/[0.06] dark:border-white/[0.03] shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="PC 1"
                      stroke={isDark ? '#4d463b' : '#c4c8d0'}
                      tick={{ fill: isDark ? '#998f82' : '#86868b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      domain={['auto', 'auto']}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="PC 2"
                      stroke={isDark ? '#4d463b' : '#c4c8d0'}
                      tick={{ fill: isDark ? '#998f82' : '#86868b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      domain={['auto', 'auto']}
                    />
                    <ZAxis range={[30, 200]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          const isQuery = p.id === 'Query Compound';
                          return (
                            <div className="bg-surface-container-high border border-white/10 p-3 rounded-2xl text-xs shadow-2xl space-y-1 font-mono">
                              <p className={`font-semibold ${isQuery ? 'text-primary' : 'text-secondary'}`}>
                                {isQuery ? '★ Current Query Compound' : p.id}
                              </p>
                              <p className="text-outline">
                                PC1: {p.x.toFixed(2)} | PC2: {p.y.toFixed(2)}
                              </p>
                              {!isQuery && (
                                <p className="text-on-surface">
                                  Target: <span className="font-semibold text-primary">{p.target.toFixed(2)}</span>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Reference Dataset Points */}
                    <Scatter name="Training Reference" data={referenceData} fill="#7C9CC4" opacity={0.65}>
                      {referenceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill="#7C9CC4" />
                      ))}
                    </Scatter>

                    {/* Query Molecule Star Marker */}
                    {queryData.length > 0 && (
                      <Scatter name="Query Molecule" data={queryData} fill="#f1cf9c">
                        <Cell fill="#f1cf9c" stroke="#ffdeac" strokeWidth={2.5} />
                      </Scatter>
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-outline pt-3 border-t border-surface-container-highest/40 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C9CC4] inline-block" />
                <span>Reference dataset compounds</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary border border-[#ffdeac] inline-block" />
                <span className="text-primary font-semibold">Your Molecule (Query)</span>
              </div>
            </div>
          </div>

          {/* Nearest Neighbors Ranking Table (5 cols) */}
          <div className="animate-stagger lg:col-span-5 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-2xl border border-white/[0.04] flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                    Structural Analogs
                  </span>
                  <h3 className="font-headline text-xl text-on-surface font-normal">
                    Top Nearest Neighbors
                  </h3>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Tanimoto Metric
                </span>
              </div>

              <div className="space-y-3">
                {data.nearest_neighbors.map((nn) => (
                  <div
                    key={nn.Rank}
                    className="p-3.5 bg-surface-container border border-white/[0.04] rounded-2xl hover:border-white/10 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center font-mono">
                          #{nn.Rank}
                        </span>
                        <span className="text-xs font-semibold text-on-surface font-mono">
                          {nn['Compound ID']}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-secondary">
                          {(nn['Tanimoto Similarity'] * 100).toFixed(1)}% Tanimoto
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-outline truncate bg-black/[0.03] dark:bg-[#08090b] px-3 py-1.5 rounded-xl border border-black/[0.04] dark:border-white/[0.02]">
                      {nn.SMILES}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs font-mono">
                      <span className="text-outline">
                        Target:{' '}
                        <span className="font-semibold text-on-surface">{nn['Target Value'].toFixed(2)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentSmiles(nn.SMILES);
                          toast.success(`Loaded analog ${nn['Compound ID']} as current query`);
                        }}
                        className="text-primary hover:text-[#ffdeac] font-medium flex items-center gap-1 active:scale-95 transition"
                      >
                        <span>Load analog</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <NextStepSuggestion currentPage="space" />
          </div>
        </motion.div>
      )}

      {/* 4. Empty State */}
      {!data && !isLoading && (
        <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-14 text-center space-y-3 border border-white/[0.04]">
          <Compass className="w-10 h-10 text-outline mx-auto" />
          <h3 className="font-headline text-xl text-on-surface font-normal">No Chemical Space Projection</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            Enter a SMILES string to project your molecule against the PCA embedding manifold and identify structurally similar reference drugs.
          </p>
        </div>
      )}
    </div>
  );
}
