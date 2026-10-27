import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AnalyzeResponse } from '../lib/api/types';

interface AppState {
  // Current Molecule
  smiles: string;
  setSmiles: (smiles: string) => void;
  currentSmiles: string;
  setCurrentSmiles: (smiles: string) => void;

  // Cached Analysis
  analysisData: AnalyzeResponse | null;
  setAnalysisData: (data: AnalyzeResponse | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  analysisError: string | null;
  setAnalysisError: (err: string | null) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // UI Modals & Panels
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sketcherOpen: boolean;
  setSketcherOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  welcomeModalOpen: boolean;
  setWelcomeModalOpen: (open: boolean) => void;

  // User Guidance & Preferences
  tourCompleted: boolean;
  setTourCompleted: (completed: boolean) => void;
  showTooltips: boolean;
  setShowTooltips: (show: boolean) => void;
  dismissedGuides: string[];
  toggleGuideDismissed: (guideId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      smiles: 'CC(=O)Oc1ccccc1C(=O)O', // Aspirin default
      setSmiles: (smiles) => set({ smiles, currentSmiles: smiles }),
      currentSmiles: 'CC(=O)Oc1ccccc1C(=O)O',
      setCurrentSmiles: (smiles) => set({ smiles, currentSmiles: smiles }),

      analysisData: null,
      setAnalysisData: (data) => set({ analysisData: data, analysisError: null }),
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      analysisError: null,
      setAnalysisError: (analysisError) => set({ analysisError }),

      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme: next });
      },

      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      sketcherOpen: false,
      setSketcherOpen: (sketcherOpen) => set({ sketcherOpen }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      welcomeModalOpen: false,
      setWelcomeModalOpen: (welcomeModalOpen) => set({ welcomeModalOpen }),

      tourCompleted: false,
      setTourCompleted: (tourCompleted) => set({ tourCompleted }),
      showTooltips: true,
      setShowTooltips: (showTooltips) => set({ showTooltips }),
      dismissedGuides: [],
      toggleGuideDismissed: (guideId) => {
        const current = get().dismissedGuides;
        if (current.includes(guideId)) {
          set({ dismissedGuides: current.filter((id) => id !== guideId) });
        } else {
          set({ dismissedGuides: [...current, guideId] });
        }
      },
    }),
    {
      name: 'biograph-ai-storage',
      partialize: (state) => ({
        smiles: state.smiles,
        theme: state.theme,
        tourCompleted: state.tourCompleted,
        showTooltips: state.showTooltips,
        dismissedGuides: state.dismissedGuides,
      }),
    }
  )
);
