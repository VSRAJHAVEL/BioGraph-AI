import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  Atom,
  Box,
  Shield,
  Sparkles,
  Orbit,
  Zap,
  Table2,
  Award,
  HelpCircle,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, theme, toggleTheme } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const runCommand = (command: () => void) => {
    command();
    setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => setCommandPaletteOpen(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl bg-white/80 dark:bg-surface-container-low/85 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.08] rounded-3xl shadow-apple-lg dark:shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <Command className="w-full text-on-surface">
          <div className="flex items-center px-4 py-1 border-b border-black/[0.06] dark:border-white/[0.06]">
            <Search className="w-4 h-4 text-outline mr-2.5 shrink-0" />
            <Command.Input
              placeholder="Search discovery pages, actions, or shortcuts..."
              className="w-full py-3 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none font-sans"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2.5 text-xs space-y-1">
            <Command.Empty className="py-6 text-center text-outline text-xs font-mono">
              No matching pages or actions found.
            </Command.Empty>

            <Command.Group heading="Discovery Engines" className="text-outline font-mono font-semibold px-2.5 py-1 text-[10px] uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/predict'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <Atom className="w-4 h-4 text-primary" />
                <span className="font-medium">Consensus Predict (Multi-Model Ensemble)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/viewer'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <Box className="w-4 h-4 text-model-gat" />
                <span className="font-medium">3D Conformation & Energetics Viewer</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/admet'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <Shield className="w-4 h-4 text-secondary" />
                <span className="font-medium">In Silico ADMET & Bioavailability Radar</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/explain'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <Sparkles className="w-4 h-4 text-model-mpnn" />
                <span className="font-medium">GNNExplainer Pharmacophore Saliency</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/space'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <Orbit className="w-4 h-4 text-model-gcn" />
                <span className="font-medium">Chemical Space Landscape Explorer</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/analogs'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-medium">Lead Optimization (MMP Bioisostere Generator)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/batch'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <Table2 className="w-4 h-4 text-model-gin" />
                <span className="font-medium">High-Throughput Batch Virtual Screening</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/benchmarks'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <Award className="w-4 h-4 text-primary" />
                <span className="font-medium">Verified Benchmark Evaluation Metrics</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/help'))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                <HelpCircle className="w-4 h-4 text-secondary" />
                <span className="font-medium">Help, Glossary & Keyboard Shortcuts</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="System Control" className="text-outline font-mono font-semibold px-2.5 py-1 text-[10px] uppercase tracking-wider pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <Command.Item
                onSelect={() => runCommand(toggleTheme)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-model-gat" />}
                <span className="font-medium">Toggle Appearance ({theme === 'dark' ? 'Switch to Apple Light Mode' : 'Switch to Dark Mode'})</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="px-4 py-2.5 bg-black/[0.03] dark:bg-black/20 border-t border-black/[0.06] dark:border-white/[0.06] text-[11px] text-outline flex justify-between font-mono">
            <span>Navigate: ↑ ↓ • Select: ↵</span>
            <span>Dismiss: Esc</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;
