import React from 'react';
import { Atom, ShieldCheck, Cpu, Search, HelpCircle, Sun, Moon, Edit3, Menu } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onStartTour?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onStartTour }) => {
  const { theme, toggleTheme, setCommandPaletteOpen, setSketcherOpen, setWelcomeModalOpen, setSmiles } = useAppStore();

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] dark:border-white/[0.04] bg-surface-container-low/75 backdrop-blur-2xl px-4 md:px-6 py-2.5 flex items-center justify-between shadow-apple-sm dark:shadow-none transition-colors duration-300">
      <div className="flex items-center space-x-3.5">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-outline hover:text-on-surface focus:outline-none"
          aria-label="Toggle Sidebar Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-2xl bg-surface-container-high/90 flex items-center justify-center text-primary border border-black/[0.05] dark:border-white/[0.08] shadow-apple-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:rotate-6 transition-all duration-300">
          <Atom className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-headline text-xl text-on-surface font-semibold tracking-tight">
              BioGraph
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/25 shadow-xs">
              AI v2.0 PROD
            </span>
          </div>
          <div className="text-[11px] font-mono text-outline hidden sm:block">
            Deep Graph Neural Network Molecular Property Prediction Platform
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2.5">
        {/* Preset Quick Chips in Navbar */}
        <div className="hidden xl:flex items-center space-x-1.5 text-xs bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-full border border-black/[0.04] dark:border-white/[0.05]">
          <span className="text-[10px] font-mono uppercase text-outline px-2">Presets:</span>
          {['Aspirin', 'Caffeine', 'Ibuprofen', 'Paracetamol'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                const map: Record<string, string> = {
                  Aspirin: 'CC(=O)Oc1ccccc1C(=O)O',
                  Caffeine: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C',
                  Ibuprofen: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
                  Paracetamol: 'CC(=O)Nc1ccc(O)cc1',
                };
                if (map[preset]) setSmiles(map[preset]);
              }}
              className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container-high border border-black/[0.04] dark:border-white/[0.04] transition text-[11px] font-medium shadow-xs active:scale-95"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Status indicators */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-surface-container border border-black/[0.04] dark:border-white/[0.04] text-on-surface-variant flex items-center gap-1.5 font-mono text-[11px] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>CUDA 12.4 · PyG 2.8</span>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-surface-container border border-black/[0.04] dark:border-white/[0.04] text-on-surface-variant flex items-center gap-1.5 font-mono text-[11px] shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
            <span>0% Leakage Guarantee</span>
          </span>
        </div>

        {/* Command Palette Button */}
        <button
          type="button"
          id="cmd-palette-btn"
          onClick={() => setCommandPaletteOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-black/[0.05] dark:border-white/[0.04] text-on-surface-variant text-xs font-medium flex items-center gap-2 transition shadow-xs"
          title="Search or Jump to page (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-outline" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 rounded-md bg-surface-container-highest text-[10px] text-outline font-mono border border-black/[0.05] dark:border-white/[0.05]">
            ⌘K
          </kbd>
        </button>

        {/* Sketch Structure */}
        <button
          type="button"
          id="sketcher-button"
          onClick={() => setSketcherOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary border border-primary/30 text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shadow-xs"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sketcher</span>
        </button>

        {/* Apple macOS Segmented Glass Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="relative flex items-center p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] transition shadow-inner"
          title={theme === 'dark' ? 'Switch to Apple Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Dark / Light Theme"
        >
          <span className={`flex items-center justify-center w-7 h-6 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-white text-primary shadow-apple-sm font-medium' : 'text-outline hover:text-on-surface'}`}>
            <Sun className="w-3.5 h-3.5" />
          </span>
          <span className={`flex items-center justify-center w-7 h-6 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-[#282a2e] text-primary shadow-sm font-medium' : 'text-outline hover:text-on-surface'}`}>
            <Moon className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Tour / Help Button */}
        <button
          type="button"
          onClick={() => {
            if (onStartTour) onStartTour();
            else setWelcomeModalOpen(true);
          }}
          className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-black/[0.05] dark:border-white/[0.04] text-primary hover:text-on-surface transition shadow-xs"
          title="Start Guided Spotlight Tour"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
