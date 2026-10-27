import React, { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { GuideCard } from '../components/GuideCard';
import { SmilesInputBar } from '../components/SmilesInputBar';
import { BioavailabilityRadarChart } from '../components/BioavailabilityRadarChart';
import { MetricInfoPopover } from '../components/MetricInfoPopover';
import { NextStepSuggestion } from '../components/NextStepSuggestion';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api/client';

export const AdmetPage: React.FC = () => {
  const { smiles, setSmiles, analysisData, setAnalysisData, setIsLoading, setAnalysisError } = useAppStore();

  const handleAnalyze = (targetSmiles: string) => {
    setIsLoading(true);
    setAnalysisError(null);
    api.analyze(targetSmiles)
      .then(setAnalysisData)
      .catch((err) => setAnalysisError(err.message || 'Analysis failed'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!analysisData && smiles) {
      handleAnalyze(smiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radar = analysisData?.radar;
  const filt = analysisData?.filters;
  const alrt = analysisData?.alerts;
  const desc = analysisData?.descriptors;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
          Physicochemical & Pharmacokinetic Filtering
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          In Silico ADMET & Bioavailability Profiler
        </h1>
        <p className="text-sm text-on-surface-variant">
          Evaluating Lipinski Rule of 5, Veber criteria, PAINS false-positive alerts, and 6-axis oral bioavailability envelopes.
        </p>
      </div>

      <GuideCard
        pageKey="admet"
        onTryExample={(exampleSmiles) => {
          setSmiles(exampleSmiles);
          handleAnalyze(exampleSmiles);
        }}
      />

      <SmilesInputBar onAnalyze={handleAnalyze} />

      {/* 2. Radar & Filter Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 6-Axis Bioavailability Radar */}
        <div className="animate-stagger lg:col-span-6 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-2xl border border-white/[0.04] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                Bioavailability Polygon
              </span>
              <h3 className="font-headline text-xl text-on-surface font-normal">
                Oral Absorption Envelope
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/20">
              6-Axis Criteria
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            The target molecule polygon (<span className="text-secondary font-medium">Sage Green</span>) should ideally fit within the optimal bioavailability envelope (<span className="text-primary font-medium">Dashed Gold</span>) for efficient human gastrointestinal transit.
          </p>

          <div className="py-2">
            {radar ? (
              <BioavailabilityRadarChart radarData={radar} />
            ) : (
              <div className="h-64 flex items-center justify-center text-outline text-xs">
                Computing oral bioavailability polygon...
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-container-highest/40 text-center font-mono text-[11px] text-on-surface-variant">
            <div className="p-2 rounded-xl bg-surface-container">
              <span className="text-outline block text-[10px]">LIPO: LogP</span>
              <span className="text-primary font-semibold">[-0.7, 5.0]</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-container">
              <span className="text-outline block text-[10px]">SIZE: MW</span>
              <span className="text-primary font-semibold">[150, 500] Da</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-container">
              <span className="text-outline block text-[10px]">POLAR: TPSA</span>
              <span className="text-primary font-semibold">[20, 130] Å²</span>
            </div>
          </div>
        </div>

        {/* Right Column: Medicinal Chemistry Rule Cards */}
        <div className="animate-stagger lg:col-span-6 flex flex-col gap-4">
          {/* Lipinski Rule of 5 */}
          <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-headline text-lg text-on-surface">Lipinski's Rule of Five</span>
                <MetricInfoPopover metricKey="lipinski" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${filt?.Lipinski.passed ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}`}>
                {filt?.Lipinski.passed ? 'PASSED (0 Violations)' : `${filt?.Lipinski.num_violations} VIOLATION(S)`}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              MW ≤ 500 Da, LogP ≤ 5, H-bond Donors ≤ 5, H-bond Acceptors ≤ 10.
            </p>
            {filt && filt.Lipinski.violations.length > 0 && (
              <div className="mt-2 text-xs text-rose-400 font-mono">
                Violations: {filt.Lipinski.violations.join(', ')}
              </div>
            )}
          </div>

          {/* Veber Rule */}
          <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-headline text-lg text-on-surface">Veber Bioavailability Rule</span>
                <MetricInfoPopover metricKey="veber" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${filt?.Veber.passed ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}`}>
                {filt?.Veber.passed ? 'PASSED' : `${filt?.Veber.num_violations} VIOLATION(S)`}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Rotatable Bonds ≤ 10 and Polar Surface Area (TPSA) ≤ 140 Å².
            </p>
          </div>

          {/* PAINS Assay Alerts */}
          <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-headline text-lg text-on-surface">PAINS Structural Alerts</span>
                <MetricInfoPopover metricKey="pains" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${!alrt?.PAINS.has_alerts ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}`}>
                {!alrt?.PAINS.has_alerts ? 'CLEAN (0 Alerts)' : `${alrt?.PAINS.count} ALERT(S)`}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Identifies pan-assay interference compounds (rhodanines, catechols, quinones) that produce optical or covalent false hits in bioassays.
            </p>
            {alrt?.PAINS.has_alerts && (
              <div className="mt-2 text-xs text-rose-400 font-mono">
                {alrt.PAINS.descriptions.join(', ')}
              </div>
            )}
          </div>

          {/* Brenk Filters */}
          <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-headline text-lg text-on-surface">Brenk Toxicological Filters</span>
                <MetricInfoPopover metricKey="brenk" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${!alrt?.Brenk.has_alerts ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}`}>
                {!alrt?.Brenk.has_alerts ? 'CLEAN (0 Flags)' : `${alrt?.Brenk.count} ALERT(S)`}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Screens for mutagenic, reactive, or unstable chemical fragments (heavy metals, nitroso groups, reactive alkyl halides).
            </p>
          </div>
        </div>
      </div>

      {/* 3. Physicochemical Property Matrix */}
      {desc && (
        <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl border border-white/[0.04] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                Quantitative Molecular Descriptors
              </span>
              <h3 className="font-headline text-2xl text-on-surface font-normal">
                Physicochemical Telemetry
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-surface-container text-on-surface-variant border border-white/[0.04]">
              RDKit 2024 Engine
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {Object.entries(desc).map(([k, v]) => (
              <div key={k} className="p-3.5 rounded-2xl bg-surface-container flex flex-col border border-white/[0.02] hover:border-white/[0.06] transition-colors">
                <span className="text-[10px] font-mono uppercase text-outline truncate" title={k}>{k}</span>
                <span className="font-mono text-base text-on-surface font-medium mt-0.5 tabular-nums">
                  {typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <NextStepSuggestion currentPage="admet" />
    </div>
  );
};

export default AdmetPage;
