import React, { useState, useEffect, useCallback } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2, Edit3 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api/client';
import { ValidateResponse } from '../lib/api/types';

interface SmilesInputBarProps {
  onAnalyze?: (smiles: string) => void;
  isLoading?: boolean;
  isAnalyzing?: boolean;
}

export const SmilesInputBar: React.FC<SmilesInputBarProps> = ({ onAnalyze, isLoading = false, isAnalyzing = false }) => {
  const loading = isLoading || isAnalyzing;
  const { smiles, setSmiles, setSketcherOpen } = useAppStore();
  const [localSmiles, setLocalSmiles] = useState(smiles);
  const [validation, setValidation] = useState<ValidateResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Sync from store if external update (e.g. from preset chips or sketcher)
  useEffect(() => {
    setLocalSmiles(smiles);
  }, [smiles]);

  // Debounced SMILES validation
  useEffect(() => {
    if (!localSmiles.trim()) {
      setValidation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await api.validateSmiles(localSmiles.trim());
        setValidation(res);
      } catch {
        setValidation({ valid: false, error: 'Validation network error' });
      } finally {
        setIsValidating(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [localSmiles]);

  const handleRun = useCallback(async () => {
    const trimmed = localSmiles.trim();
    if (!trimmed || loading) return;

    let valid = validation?.valid;
    if (valid === undefined) {
      try {
        const res = await api.validateSmiles(trimmed);
        setValidation(res);
        valid = res.valid;
      } catch {
        valid = false;
      }
    }

    if (!valid) return;

    setSmiles(trimmed);
    if (onAnalyze) {
      onAnalyze(trimmed);
    }
  }, [localSmiles, validation, loading, setSmiles, onAnalyze]);

  // Global Ctrl+Enter shortcut to trigger analysis
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRun]);

  const presets = [
    { name: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O', category: 'Analgesic' },
    { name: 'Caffeine', smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C', category: 'Stimulant' },
    { name: 'Ibuprofen', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', category: 'NSAID' },
    { name: 'Paracetamol', smiles: 'CC(=O)Nc1ccc(O)cc1', category: 'Antipyretic' },
    { name: 'Atorvastatin', smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O', category: 'Statin' },
  ];

  return (
    <div className="rounded-3xl bg-surface-container-low/75 backdrop-blur-2xl p-6 shadow-apple-md dark:shadow-xl border border-black/[0.06] dark:border-white/[0.04] space-y-4" id="smiles-input-container">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-outline">
            Target Molecule SMILES
          </span>
          {isValidating ? (
            <span className="text-xs font-mono text-outline flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-primary" /> Validating...
            </span>
          ) : validation?.valid ? (
            <span className="text-xs font-mono text-secondary flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Valid Structure ({validation.formula}, {validation.mw} Da)
            </span>
          ) : validation && !validation.valid ? (
            <span className="text-xs font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> {validation.error}
            </span>
          ) : null}
        </div>

        <div className="flex items-center space-x-2">
          {/* Preset Selector */}
          <select
            id="preset-selector"
            onChange={(e) => {
              if (e.target.value) {
                setLocalSmiles(e.target.value);
                setSmiles(e.target.value);
              }
            }}
            className="bg-surface-container border border-black/[0.06] dark:border-white/[0.04] rounded-xl px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-mono shadow-xs"
          >
            <option value="">-- Choose FDA Drug Preset --</option>
            {presets.map((p) => (
              <option key={p.name} value={p.smiles}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>

          {/* Sketcher Button */}
          <button
            type="button"
            id="smiles-sketcher-btn"
            onClick={() => setSketcherOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-primary/30 text-primary text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" /> Sketch Structure
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={localSmiles}
            onChange={(e) => setLocalSmiles(e.target.value)}
            placeholder="Enter canonical IUPAC SMILES string (e.g. CC(=O)OC1=CC=CC=C1C(=O)O)..."
            className="w-full bg-black/[0.03] dark:bg-[#08090b] border border-black/[0.08] dark:border-white/[0.04] rounded-2xl px-4 py-3 text-sm font-mono text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-inner transition"
          />
        </div>

        <button
          type="button"
          id="analyze-action-btn"
          onClick={handleRun}
          disabled={loading || !localSmiles.trim() || (validation !== null && !validation.valid)}
          title={validation !== null && !validation.valid ? 'Invalid SMILES structure' : 'Analyze (Ctrl+Enter)'}
          className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-semibold text-xs hover:opacity-90 shadow-apple-md dark:shadow-[0_8px_20px_rgba(241,207,156,0.25)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Predicting (5 GNNs)...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Analyze Molecule</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SmilesInputBar;
