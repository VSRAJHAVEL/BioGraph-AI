import React, { useEffect, useRef, useState } from 'react';
import { RotateCw, Maximize2, Minimize2, Focus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface Conformer3DViewerProps {
  molBlock?: string | null;
  energyKcal?: number | null;
  status?: string;
  height?: number;
}

declare global {
  interface Window {
    $3Dmol: any;
  }
}

export const Conformer3DViewer: React.FC<Conformer3DViewerProps> = ({
  molBlock,
  energyKcal,
  status = 'MMFF94 force field optimized',
  height = 360,
}) => {
  const { theme } = useAppStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [style, setStyle] = useState<'ball_and_stick' | 'stick' | 'sphere' | 'wireframe'>('ball_and_stick');
  const [surface, setSurface] = useState<'none' | 'vdw' | 'sas' | 'ses'>('none');
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize and update 3Dmol viewer
  useEffect(() => {
    if (!containerRef.current || !window.$3Dmol) return;

    const bgHex = theme === 'dark' ? '#08090b' : '#f8fafc';

    if (!viewerRef.current) {
      viewerRef.current = window.$3Dmol.createViewer(containerRef.current, {
        backgroundColor: bgHex,
      });
    } else {
      viewerRef.current.setBackgroundColor(bgHex);
    }

    const viewer = viewerRef.current;
    viewer.clear();

    if (molBlock) {
      viewer.addModel(molBlock, 'mol');

      const carbonScheme = theme === 'dark' ? 'cyanCarbon' : 'greenCarbon';

      // Set style
      if (style === 'stick') {
        viewer.setStyle({}, { stick: { radius: 0.18, colorscheme: carbonScheme } });
      } else if (style === 'ball_and_stick') {
        viewer.setStyle(
          {},
          {
            stick: { radius: 0.14, colorscheme: carbonScheme },
            sphere: { scale: 0.28, colorscheme: carbonScheme },
          }
        );
      } else if (style === 'sphere') {
        viewer.setStyle({}, { sphere: { scale: 0.85, colorscheme: carbonScheme } });
      } else if (style === 'wireframe') {
        viewer.setStyle({}, { line: { linewidth: 2.0, colorscheme: carbonScheme } });
      }

      // Set surface
      viewer.removeAllSurfaces();
      const surfMap: Record<string, any> = {
        vdw: window.$3Dmol.SurfaceType.VDW,
        sas: window.$3Dmol.SurfaceType.SAS,
        ses: window.$3Dmol.SurfaceType.SES,
      };
      if (surfMap[surface]) {
        viewer.addSurface(surfMap[surface], {
          opacity: 0.65,
          color: theme === 'dark' ? '#38bdf8' : '#0284c7',
        });
      }

      viewer.zoomTo();
      viewer.render();
    }
  }, [molBlock, style, surface, theme]);

  // Handle ResizeObserver on container to resize WebGL canvas smoothly
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (viewerRef.current) {
        viewerRef.current.resize();
        viewerRef.current.render();
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Listen for fullscreen events and Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement &&
        (document.fullscreenElement === wrapperRef.current ||
         wrapperRef.current?.contains(document.fullscreenElement))
      );
      setIsFullscreen(isFs);
      setTimeout(() => {
        if (viewerRef.current) {
          viewerRef.current.resize();
          viewerRef.current.zoomTo();
          viewerRef.current.render();
        }
      }, 100);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const toggleSpin = () => {
    if (!viewerRef.current) return;
    const next = !isSpinning;
    setIsSpinning(next);
    viewerRef.current.spin(next);
  };

  const resetCamera = () => {
    if (!viewerRef.current) return;
    viewerRef.current.zoomTo();
    viewerRef.current.render();
  };

  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!isFullscreen) {
      setIsFullscreen(true);
      if (wrapper.requestFullscreen) {
        try {
          await wrapper.requestFullscreen();
        } catch {
          // CSS fixed overlay fallback works if HTML5 requestFullscreen fails
        }
      }
      setTimeout(() => {
        if (viewerRef.current) {
          viewerRef.current.resize();
          viewerRef.current.zoomTo();
          viewerRef.current.render();
        }
      }, 120);
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch {}
      }
      setTimeout(() => {
        if (viewerRef.current) {
          viewerRef.current.resize();
          viewerRef.current.zoomTo();
          viewerRef.current.render();
        }
      }, 120);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#08090b] text-on-surface p-6 flex flex-col justify-between overflow-hidden shadow-2xl'
          : 'space-y-4'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
            3D Molecular Conformer
          </span>
          <h3 className="font-headline text-xl text-on-surface font-normal">
            Force-Field Geometry
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {energyKcal !== null && energyKcal !== undefined && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 text-xs font-mono font-medium">
              E<sub>strain</sub>: {energyKcal.toFixed(2)} kcal/mol
            </span>
          )}

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as any)}
            className="bg-surface-container border border-white/[0.04] text-xs text-on-surface rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          >
            <option value="ball_and_stick">Ball & Stick</option>
            <option value="stick">Stick Only</option>
            <option value="sphere">Spacefill (CPK)</option>
            <option value="wireframe">Wireframe</option>
          </select>

          <select
            value={surface}
            onChange={(e) => setSurface(e.target.value as any)}
            className="bg-surface-container border border-white/[0.04] text-xs text-on-surface rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          >
            <option value="none">No Surface</option>
            <option value="vdw">VDW Surface</option>
            <option value="sas">SAS Surface</option>
            <option value="ses">SES Surface</option>
          </select>

          <button
            type="button"
            onClick={toggleSpin}
            className={`p-2 rounded-xl border text-xs transition active:scale-95 ${
              isSpinning
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-surface-container text-outline border-white/[0.04] hover:text-on-surface'
            }`}
            title="Toggle Continuous Rotation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={resetCamera}
            className="p-2 rounded-xl bg-surface-container border border-white/[0.04] text-outline hover:text-on-surface text-xs transition active:scale-95"
            title="Reset Camera Zoom & Center"
          >
            <Focus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border text-xs transition active:scale-95 ${
              isFullscreen
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container text-outline border-white/[0.04] hover:text-on-surface'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ height: isFullscreen ? 'calc(100vh - 160px)' : height }}
        className="w-full rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.04] bg-black/[0.03] dark:bg-[#08090b] relative shadow-inner"
      />

      <div className="pt-3 border-t border-surface-container-highest/40 text-[11px] font-mono text-outline flex justify-between items-center shrink-0">
        <span>⚡ {status}</span>
        <span>Left-click: Rotate • Scroll: Zoom • Right-click: Pan{isFullscreen ? ' • Press Esc to exit fullscreen' : ''}</span>
      </div>
    </div>
  );
};
