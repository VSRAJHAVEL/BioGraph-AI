import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Orbit, Box } from 'lucide-react';

interface NextStepSuggestionProps {
  currentPage?: string;
  currentStep?: string;
  smiles?: string;
  onSelectNext?: (path: string) => void;
}

export const NextStepSuggestion: React.FC<NextStepSuggestionProps> = ({
  currentPage,
  currentStep,
  onSelectNext,
}) => {
  const navigate = useNavigate();
  const page = currentPage || currentStep || 'predict';

  const getSuggestions = () => {
    switch (page) {
      case 'predict':
        return [
          {
            title: 'Explain Substructure Attribution',
            description: 'Run GNNExplainer to see which atoms and bonds drove this prediction.',
            icon: Sparkles,
            path: '/explain',
            color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-300',
          },
          {
            title: 'Check ADMET & Bioavailability Radar',
            description: 'Inspect Lipinski Rule of 5 and PAINS false-positive filters.',
            icon: Shield,
            path: '/admet',
            color: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 text-emerald-300',
          },
        ];
      case 'admet':
        return [
          {
            title: 'Explore 3D Conformation',
            description: 'Inspect the energy-minimized 3D conformer and steric surface.',
            icon: Box,
            path: '/viewer',
            color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
          },
          {
            title: 'Generate Lead Analogs',
            description: 'Discover bioisosteres and R-group variants to improve solubility.',
            icon: Sparkles,
            path: '/analogs',
            color: 'from-amber-500/20 to-rose-500/20 border-amber-500/30 text-amber-300',
          },
        ];
      case 'explain':
        return [
          {
            title: 'Navigate Chemical Space',
            description: 'Locate this molecule in the 2D PCA landscape against benchmark libraries.',
            icon: Orbit,
            path: '/space',
            color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300',
          },
        ];
      case 'space':
      case 'chemicalSpace':
        return [
          {
            title: 'Lead Optimization & Analogs',
            description: 'Evolve this scaffold with bioisosteric functional group replacements.',
            icon: Sparkles,
            path: '/analogs',
            color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
          },
        ];
      default:
        return [
          {
            title: 'Predict Consensus Properties',
            description: 'Return to the main multi-model prediction studio.',
            icon: Sparkles,
            path: '/predict',
            color: 'from-cyan-500/20 to-indigo-500/20 border-cyan-500/30 text-cyan-300',
          },
        ];
    }
  };

  const suggestions = getSuggestions();

  return (
    <div className="pt-6 border-t border-surface-container-highest/40 space-y-3">
      <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-outline block">
        Suggested Next Workflow Steps
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                if (onSelectNext) onSelectNext(s.path);
                navigate(s.path);
              }}
              className="p-4 rounded-3xl bg-surface-container-low/75 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.04] hover:border-primary/40 text-left transition flex items-center justify-between group active:scale-95 shadow-apple-sm dark:shadow-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-inner">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-on-surface">{s.title}</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">{s.description}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary group-hover:translate-x-1 transition" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NextStepSuggestion;
