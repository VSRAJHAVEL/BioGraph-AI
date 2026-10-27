import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, CheckCircle2, Database } from 'lucide-react';
import { api } from '@/lib/api/client';
import { BenchmarksResponse } from '@/lib/api/types';
import GuideCard from '@/components/GuideCard';
import MetricInfoPopover from '@/components/MetricInfoPopover';

export default function BenchmarksPage() {
  const { data, isLoading } = useQuery<BenchmarksResponse>({
    queryKey: ['benchmarks'],
    queryFn: () => api.getBenchmarks(),
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
          Rigorous Scaffold-Partitioned Generalization
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight flex items-center gap-3">
          <Award className="w-8 h-8 text-primary" />
          Empirical Benchmarks &amp; Model Performance
        </h1>
        <p className="text-sm text-on-surface-variant">
          Reproduced empirical test metrics across strict Bemis-Murcko scaffold partitions (0% scaffold overlap between train, val, and test splits).
        </p>
      </div>

      <GuideCard pageId="benchmarks" />

      {/* 2. Methodology Card */}
      <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-xl border border-primary/20 flex items-start gap-4">
        <ShieldCheck className="w-7 h-7 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-headline text-lg text-on-surface flex items-center gap-2">
            Zero Scaffold Leakage Guarantee
            <MetricInfoPopover metricKey="scaffold" />
          </h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            All models were evaluated on 80/10/10 Bemis-Murcko scaffold splits. Test metrics reflect genuine out-of-distribution structural generalization rather than memorized core motifs. No synthetic or unverified metrics are reported.
          </p>
        </div>
      </section>

      {isLoading && (
        <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-14 text-center text-outline font-mono text-xs">
          Loading verified benchmark metrics...
        </div>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* ESOL Benchmark Card */}
          <section className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl border border-white/[0.04] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                  Delaney Benchmark
                </span>
                <h3 className="font-headline text-2xl text-on-surface font-normal flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  {data.datasets.esol.name} — {data.datasets.esol.task}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  1,128 compounds | Primary Metric: {data.datasets.esol.metric} (Lower is better)
                </p>
              </div>
              <span className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                Scaffold Split (Test N=113)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-container-highest/60 text-outline uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3 font-sans">Architecture</th>
                    <th className="py-3 px-3">Test RMSE ↓</th>
                    <th className="py-3 px-3">Test MAE ↓</th>
                    <th className="py-3 px-3">Test R² ↑</th>
                    <th className="py-3 px-3 font-sans">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/30">
                  {data.datasets.esol.models.map((m) => (
                    <tr
                      key={m.model}
                      className={`hover:bg-surface-container/40 transition-colors ${
                        m.rank === 1 ? 'bg-primary/5 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        {m.rank === 1 ? (
                          <span className="inline-block px-2.5 py-0.5 bg-primary text-on-primary rounded-full font-bold text-[10px]">
                            #1 BEST
                          </span>
                        ) : (
                          <span className="text-outline">#{m.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-on-surface">
                        {m.model}
                      </td>
                      <td className="py-3 px-3 font-bold text-primary tabular-nums">
                        {m.rmse !== undefined ? m.rmse.toFixed(4) : '—'}
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant tabular-nums">
                        {m.mae !== undefined ? m.mae.toFixed(4) : '—'}
                      </td>
                      <td className="py-3 px-3 text-secondary tabular-nums">
                        {m.r2 !== undefined ? m.r2.toFixed(4) : '—'}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* BBBP Benchmark Card */}
          <section className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl border border-white/[0.04] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                  Blood-Brain Barrier Benchmark
                </span>
                <h3 className="font-headline text-2xl text-on-surface font-normal flex items-center gap-2">
                  <Database className="w-5 h-5 text-secondary" />
                  {data.datasets.bbbp.name} — {data.datasets.bbbp.task}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  2,039 compounds | Primary Metric: {data.datasets.bbbp.metric} (Higher is better)
                </p>
              </div>
              <span className="text-xs font-mono bg-secondary/15 text-secondary border border-secondary/30 px-3 py-1 rounded-full">
                Scaffold Split (Test N=204)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-container-highest/60 text-outline uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3 font-sans">Architecture</th>
                    <th className="py-3 px-3">Test ROC-AUC ↑</th>
                    <th className="py-3 px-3">Test PR-AUC ↑</th>
                    <th className="py-3 px-3 font-sans">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/30">
                  {data.datasets.bbbp.models.map((m) => (
                    <tr
                      key={m.model}
                      className={`hover:bg-surface-container/40 transition-colors ${
                        m.rank === 1 ? 'bg-secondary/5 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        {m.rank === 1 ? (
                          <span className="inline-block px-2.5 py-0.5 bg-secondary text-on-secondary rounded-full font-bold text-[10px]">
                            #1 BEST
                          </span>
                        ) : (
                          <span className="text-outline">#{m.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-on-surface">
                        {m.model}
                      </td>
                      <td className="py-3 px-3 font-bold text-secondary tabular-nums">
                        {m.roc_auc !== undefined ? (m.roc_auc * 100).toFixed(2) + '%' : '—'}
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant tabular-nums">
                        {m.pr_auc !== undefined ? (m.pr_auc * 100).toFixed(2) + '%' : '—'}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tox21 Benchmark Card */}
          <section className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl border border-white/[0.04] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                  Multi-Task Toxicity Benchmark
                </span>
                <h3 className="font-headline text-2xl text-on-surface font-normal flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  {data.datasets.tox21.name} — {data.datasets.tox21.task}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  7,831 compounds | 12 Biological Pathways | Primary Metric: {data.datasets.tox21.metric}
                </p>
              </div>
              <span className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                Scaffold Split (Test N=784)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-container-highest/60 text-outline uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3 font-sans">Architecture</th>
                    <th className="py-3 px-3">Mean Test ROC-AUC ↑</th>
                    <th className="py-3 px-3 font-sans">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/30">
                  {data.datasets.tox21.models.map((m) => (
                    <tr
                      key={m.model}
                      className={`hover:bg-surface-container/40 transition-colors ${
                        m.rank === 1 ? 'bg-primary/5 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        {m.rank === 1 ? (
                          <span className="inline-block px-2.5 py-0.5 bg-primary text-on-primary rounded-full font-bold text-[10px]">
                            #1 BEST
                          </span>
                        ) : (
                          <span className="text-outline">#{m.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-on-surface">
                        {m.model}
                      </td>
                      <td className="py-3 px-3 font-bold text-primary tabular-nums">
                        {m.roc_auc !== undefined ? (m.roc_auc * 100).toFixed(2) + '%' : '—'}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
