import React, { useEffect } from 'react';
import { Box } from 'lucide-react';
import { GuideCard } from '../components/GuideCard';
import { SmilesInputBar } from '../components/SmilesInputBar';
import { Conformer3DViewer } from '../components/Conformer3DViewer';
import { NextStepSuggestion } from '../components/NextStepSuggestion';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api/client';

export const Viewer3DPage: React.FC = () => {
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

  const desc = analysisData?.descriptors;
  const conformer = analysisData?.conformer;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
          Stereochemical Energy Minimization
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight flex items-center gap-3">
          <Box className="w-8 h-8 text-primary" />
          3D Molecular Conformation & Force-Field Studio
        </h1>
        <p className="text-sm text-on-surface-variant">
          Generates low-energy 3D stereochemical conformers using ETKDGv3 distance-geometry physics and MMFF94 force field relaxation.
        </p>
      </div>

      <GuideCard
        pageKey="viewer3d"
        onTryExample={(exampleSmiles) => {
          setSmiles(exampleSmiles);
          handleAnalyze(exampleSmiles);
        }}
      />

      <SmilesInputBar onAnalyze={handleAnalyze} />

      {/* 2. Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 2D Chemical Projection */}
        <div className="animate-stagger lg:col-span-5 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-2xl border border-white/[0.04] flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                  2D Reference Topology
                </span>
                <h3 className="font-headline text-xl text-on-surface font-normal">
                  Skeletal Projection
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-surface-container text-primary border border-primary/20">
                {analysisData?.formula || 'Formula'}
              </span>
            </div>

            <div
              className="rdkit-svg-auto w-full aspect-square max-h-[300px] rounded-2xl bg-black/[0.03] dark:bg-[#08090b] p-4 flex items-center justify-center border border-black/[0.06] dark:border-white/[0.03] shadow-inner"
              dangerouslySetInnerHTML={{
                __html: analysisData?.svg_2d || '<span class="text-outline text-xs">No molecule loaded</span>',
              }}
            />
          </div>

          <div className="pt-4 border-t border-surface-container-highest/40 flex items-center justify-between text-xs font-mono text-outline">
            <span>SMILES:</span>
            <span className="text-on-surface-variant font-medium truncate max-w-[280px]">
              {analysisData?.smiles || '--'}
            </span>
          </div>
        </div>

        {/* Right Column: Interactive 3D WebGL Conformation */}
        <div className="animate-stagger lg:col-span-7 rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-2xl border border-white/[0.04]">
          <Conformer3DViewer
            molBlock={conformer?.mol_block}
            energyKcal={conformer?.energy_kcal}
            status={conformer?.status}
            height={360}
          />
        </div>
      </div>

      {/* 3. Physicochemical & Steric Matrix */}
      {desc && (
        <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl border border-white/[0.04] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                Steric & Thermodynamic Descriptors
              </span>
              <h3 className="font-headline text-2xl text-on-surface font-normal">
                Conformation Attributes
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-surface-container text-on-surface-variant border border-white/[0.04]">
              MMFF94 Relaxed
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

      <NextStepSuggestion currentPage="3d" />
    </div>
  );
};

export default Viewer3DPage;
