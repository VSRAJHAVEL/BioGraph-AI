import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import CommandPalette from '@/components/CommandPalette';
import JsmeSketcherModal from '@/components/JsmeSketcherModal';
import WelcomeTourModal from '@/components/WelcomeTourModal';

import PredictPage from '@/pages/PredictPage';
import ExplainPage from '@/pages/ExplainPage';
import AdmetPage from '@/pages/AdmetPage';
import Viewer3DPage from '@/pages/Viewer3DPage';
import ChemicalSpacePage from '@/pages/ChemicalSpacePage';
import AnalogsPage from '@/pages/AnalogsPage';
import BatchScreenPage from '@/pages/BatchScreenPage';
import BenchmarksPage from '@/pages/BenchmarksPage';
import HelpPage from '@/pages/HelpPage';

import { useAppStore } from '@/store/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function GlobalShortcuts() {
  const navigate = useNavigate();
  const { setCommandPaletteOpen } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd+K or Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // If user is inside an input, don't trigger navigation shortcuts
      if (isInput) return;

      // '?' for Help
      if (e.key === '?') {
        e.preventDefault();
        navigate('/help');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setCommandPaletteOpen]);

  return null;
}

function MainLayout() {
  const { theme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-on-surface flex flex-col font-sans selection:bg-primary-container selection:text-on-primary-container relative transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,215,160,0.22),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(165,205,255,0.18),transparent_50%)] dark:bg-[radial-gradient(circle_at_25%_15%,rgba(21,24,29,0.9),transparent_65%),radial-gradient(circle_at_80%_85%,rgba(21,24,29,0.7),transparent_60%)]" />
      <GlobalShortcuts />
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar />

        <main className="flex-1 transition-all duration-300 p-4 md:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/predict" replace />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/explain" element={<ExplainPage />} />
            <Route path="/admet" element={<AdmetPage />} />
            <Route path="/viewer" element={<Viewer3DPage />} />
            <Route path="/space" element={<ChemicalSpacePage />} />
            <Route path="/analogs" element={<AnalogsPage />} />
            <Route path="/batch" element={<BatchScreenPage />} />
            <Route path="/benchmarks" element={<BenchmarksPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="*" element={<Navigate to="/predict" replace />} />
          </Routes>
        </main>
      </div>

      <CommandPalette />
      <JsmeSketcherModal />
      <WelcomeTourModal />

      <Toaster position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} richColors closeButton />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
