import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Check,
  Trash2,
  Undo2,
  Redo2,
  Move,
  PenTool,
  Eraser,
  Sparkles,
  Layers,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { api } from '../lib/api/client';
import { SketcherAtom, SketcherBond } from '../lib/api/types';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';

type DrawMode = 'draw' | 'move' | 'erase';

const ELEMENT_COLORS_DARK: Record<string, { bg: string; text: string; stroke: string; glow: string }> = {
  C: { bg: '#0f172a', text: '#94a3b8', stroke: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)' },
  N: { bg: '#1e1b4b', text: '#818cf8', stroke: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' },
  O: { bg: '#4c0519', text: '#fb7185', stroke: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
  S: { bg: '#451a03', text: '#fbbf24', stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  F: { bg: '#042f2e', text: '#2dd4bf', stroke: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)' },
  Cl: { bg: '#064e3b', text: '#34d399', stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  Br: { bg: '#431407', text: '#fb923c', stroke: '#ea580c', glow: 'rgba(234, 88, 12, 0.4)' },
  I: { bg: '#3b0764', text: '#c084fc', stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  P: { bg: '#422006', text: '#facc15', stroke: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' },
  H: { bg: '#1e293b', text: '#cbd5e1', stroke: '#64748b', glow: 'rgba(100, 116, 139, 0.4)' },
};

const ELEMENT_COLORS_LIGHT: Record<string, { bg: string; text: string; stroke: string; glow: string }> = {
  C: { bg: '#f1f5f9', text: '#0f172a', stroke: '#64748b', glow: 'rgba(100, 116, 139, 0.25)' },
  N: { bg: '#e0e7ff', text: '#312e81', stroke: '#4f46e5', glow: 'rgba(79, 70, 229, 0.25)' },
  O: { bg: '#ffe4e6', text: '#881337', stroke: '#e11d48', glow: 'rgba(225, 29, 72, 0.25)' },
  S: { bg: '#fef3c7', text: '#78350f', stroke: '#d97706', glow: 'rgba(217, 119, 6, 0.25)' },
  F: { bg: '#ccfbf1', text: '#134e4a', stroke: '#0d9488', glow: 'rgba(13, 148, 136, 0.25)' },
  Cl: { bg: '#d1fae5', text: '#064e3b', stroke: '#059669', glow: 'rgba(5, 150, 105, 0.25)' },
  Br: { bg: '#ffedd5', text: '#7c2d12', stroke: '#ea580c', glow: 'rgba(234, 88, 12, 0.25)' },
  I: { bg: '#f3e8ff', text: '#581c87', stroke: '#9333ea', glow: 'rgba(147, 51, 234, 0.25)' },
  P: { bg: '#fef9c3', text: '#713f12', stroke: '#ca8a04', glow: 'rgba(202, 138, 4, 0.25)' },
  H: { bg: '#f8fafc', text: '#334155', stroke: '#94a3b8', glow: 'rgba(148, 163, 184, 0.25)' },
};

const COMMON_ELEMENTS = ['C', 'N', 'O', 'S', 'F', 'Cl', 'Br', 'I'];

export const JsmeSketcherModal: React.FC = () => {
  const { sketcherOpen, setSketcherOpen, smiles, setSmiles, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [atoms, setAtoms] = useState<SketcherAtom[]>([]);
  const [bonds, setBonds] = useState<SketcherBond[]>([]);
  const [mode, setMode] = useState<DrawMode>('draw');
  const [selectedElement, setSelectedElement] = useState<string>('C');
  const [bondOrder, setBondOrder] = useState<number>(1);

  // Interaction State
  const [draggedAtomId, setDraggedAtomId] = useState<number | null>(null);
  const [bondStartAtomId, setBondStartAtomId] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawingDrag, setIsDrawingDrag] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredAtomId, setHoveredAtomId] = useState<number | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<{ atoms: SketcherAtom[]; bonds: SketcherBond[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Real-time SMILES & Formula
  const [currentSmiles, setCurrentSmiles] = useState<string>('');
  const [formula, setFormula] = useState<string>('');
  const [mw, setMw] = useState<number>(0);
  const [customImportSmiles, setCustomImportSmiles] = useState<string>('');

  const svgRef = useRef<SVGSVGElement>(null);
  const dragInfoRef = useRef<{
    isDown: boolean;
    startX: number;
    startY: number;
    startAtomId: number | null;
    hasMovedPastThreshold: boolean;
  } | null>(null);
  const justFinishedDragRef = useRef<boolean>(false);

  // Push state to history
  const pushHistory = useCallback((newAtoms: SketcherAtom[], newBonds: SketcherBond[]) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, { atoms: newAtoms, bonds: newBonds }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Load SMILES into 2D graph
  const loadSmilesIntoGraph = useCallback(async (smi: string) => {
    if (!smi || !smi.trim()) {
      setAtoms([]);
      setBonds([]);
      setCurrentSmiles('');
      setFormula('');
      setMw(0);
      return;
    }
    try {
      const res = await api.sketcherSmilesToGraph(smi.trim());
      setAtoms(res.atoms);
      setBonds(res.bonds);
      setCurrentSmiles(res.smiles);
      pushHistory(res.atoms, res.bonds);
    } catch (e: any) {
      console.error('Failed to load SMILES into sketcher:', e);
    }
  }, [pushHistory]);

  // Preload initial workspace molecule when opening
  useEffect(() => {
    if (sketcherOpen) {
      if (smiles && smiles.trim()) {
        loadSmilesIntoGraph(smiles.trim());
      } else {
        setAtoms([]);
        setBonds([]);
        setCurrentSmiles('');
        setFormula('');
        setMw(0);
        setHistory([]);
        setHistoryIndex(-1);
      }
    }
  }, [sketcherOpen, smiles, loadSmilesIntoGraph]);

  // Escape key cancels active bond drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBondStartAtomId(null);
        setCursorPos(null);
        setIsDrawingDrag(false);
        setDragStartPos(null);
        setHoveredAtomId(null);
        dragInfoRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync graph state to backend to generate canonical SMILES & formula
  const syncGraphToSmiles = useCallback(async (updatedAtoms: SketcherAtom[], updatedBonds: SketcherBond[]) => {
    if (updatedAtoms.length === 0) {
      setCurrentSmiles('');
      setFormula('');
      setMw(0);
      return;
    }
    try {
      const res = await api.sketcherGraphToSmiles(updatedAtoms, updatedBonds);
      setCurrentSmiles(res.smiles);
      if (res.formula) {
        setFormula(res.formula);
      }
      if (res.mw) {
        setMw(parseFloat(res.mw.toFixed(2)));
      }
    } catch (e: any) {
      console.error('Error generating SMILES from graph:', e);
    }
  }, []);

  // Update history & trigger sync
  const commitGraph = (newAtoms: SketcherAtom[], newBonds: SketcherBond[]) => {
    setAtoms(newAtoms);
    setBonds(newBonds);
    pushHistory(newAtoms, newBonds);
    syncGraphToSmiles(newAtoms, newBonds);
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setAtoms(target.atoms);
      setBonds(target.bonds);
      setHistoryIndex(historyIndex - 1);
      syncGraphToSmiles(target.atoms, target.bonds);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setAtoms(target.atoms);
      setBonds(target.bonds);
      setHistoryIndex(historyIndex + 1);
      syncGraphToSmiles(target.atoms, target.bonds);
    }
  };

  // Clear Canvas (100% Reset)
  const handleClear = () => {
    commitGraph([], []);
    setBondStartAtomId(null);
    setCursorPos(null);
    setIsDrawingDrag(false);
    setDragStartPos(null);
    setHoveredAtomId(null);
    toast.info('Canvas cleared');
  };

  // Ring Templates
  const addRingTemplate = (ringType: 'benzene' | 'cyclohexane' | 'cyclopentane' | 'pyridine') => {
    const centerX = 360;
    const centerY = 200;
    const n = ringType === 'cyclopentane' ? 5 : 6;
    const radius = 55;

    const newAtoms: SketcherAtom[] = [];
    const newBonds: SketcherBond[] = [];
    const startId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;

    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const x = Math.round(centerX + radius * Math.cos(angle));
      const y = Math.round(centerY + radius * Math.sin(angle));
      const el = ringType === 'pyridine' && i === 0 ? 'N' : 'C';
      newAtoms.push({ id: startId + i, element: el, x, y });
    }

    for (let i = 0; i < n; i++) {
      const src = startId + i;
      const dst = startId + ((i + 1) % n);
      let order = 1;
      if (ringType === 'benzene' || ringType === 'pyridine') {
        order = i % 2 === 0 ? 2 : 1;
      }
      newBonds.push({ source: src, target: dst, order });
    }

    commitGraph([...atoms, ...newAtoms], [...bonds, ...newBonds]);
    toast.success(`Added ${ringType} ring template`);
  };

  // Canvas Mouse Coordinates
  const getCanvasCoords = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  // Helper to connect or toggle bond between two atoms
  const connectAtoms = (atom1Id: number, atom2Id: number) => {
    if (atom1Id === atom2Id) return;
    const existingIndex = bonds.findIndex(
      (b) =>
        (b.source === atom1Id && b.target === atom2Id) ||
        (b.source === atom2Id && b.target === atom1Id)
    );

    if (existingIndex >= 0) {
      // Cycle order
      const updated = [...bonds];
      updated[existingIndex].order = (updated[existingIndex].order % 3) + 1;
      commitGraph(atoms, updated);
      toast.info(`Updated bond to ${updated[existingIndex].order === 1 ? 'Single' : updated[existingIndex].order === 2 ? 'Double' : 'Triple'}`);
    } else {
      // Add new bond
      const newBond: SketcherBond = {
        source: atom1Id,
        target: atom2Id,
        order: bondOrder,
      };
      commitGraph(atoms, [...bonds, newBond]);
      toast.success('Bond connected!');
    }
  };

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'draw') return;
    const coords = getCanvasCoords(e);
    dragInfoRef.current = {
      isDown: true,
      startX: coords.x,
      startY: coords.y,
      startAtomId: null,
      hasMovedPastThreshold: false,
    };
  };

  // Canvas Click (Handles Two-Click bond to empty canvas or single atom drop)
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'draw') return;
    if (justFinishedDragRef.current) return;

    const coords = getCanvasCoords(e);

    if (bondStartAtomId !== null) {
      // Two-Click mode: atom was selected, clicked canvas -> add bonded substituent atom!
      const newId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;
      const newAtom: SketcherAtom = { id: newId, element: selectedElement, x: coords.x, y: coords.y };
      const newBond: SketcherBond = { source: bondStartAtomId, target: newId, order: bondOrder };
      commitGraph([...atoms, newAtom], [...bonds, newBond]);
      setBondStartAtomId(null);
      setCursorPos(null);
      setHoveredAtomId(null);
      toast.success(`Connected new ${selectedElement} atom`);
      return;
    }

    // Single click on empty canvas with nothing selected -> drop single isolated atom
    const newId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;
    const newAtom: SketcherAtom = { id: newId, element: selectedElement, x: coords.x, y: coords.y };
    commitGraph([...atoms, newAtom], bonds);
  };

  // Mouse Down on Atom
  const handleAtomMouseDown = (e: React.MouseEvent, atom: SketcherAtom) => {
    e.stopPropagation();

    if (mode === 'erase') {
      const remainingAtoms = atoms.filter((a) => a.id !== atom.id);
      const remainingBonds = bonds.filter((b) => b.source !== atom.id && b.target !== atom.id);
      commitGraph(remainingAtoms, remainingBonds);
      return;
    }

    if (mode === 'move') {
      setDraggedAtomId(atom.id);
      return;
    }

    if (mode === 'draw') {
      // Record drag start info; do NOT set bondStartAtomId here to avoid click race condition!
      dragInfoRef.current = {
        isDown: true,
        startX: atom.x,
        startY: atom.y,
        startAtomId: atom.id,
        hasMovedPastThreshold: false,
      };
    }
  };

  // Atom Click (Handles Two-Click Mode or Atom Mutation)
  const handleAtomClick = (e: React.MouseEvent, atom: SketcherAtom) => {
    e.stopPropagation();

    if (mode !== 'draw') return;
    if (justFinishedDragRef.current) return;

    if (bondStartAtomId === null) {
      // Step 1: Select first atom
      setBondStartAtomId(atom.id);
      setCursorPos({ x: atom.x, y: atom.y });
      toast.info(`Selected ${atom.element}. Click another atom or empty canvas to connect.`);
    } else if (bondStartAtomId === atom.id) {
      // Clicked the same atom again: mutate element if different element selected in toolbar, or cancel
      if (atom.element !== selectedElement) {
        const updated = atoms.map((a) => (a.id === atom.id ? { ...a, element: selectedElement } : a));
        commitGraph(updated, bonds);
        toast.info(`Changed atom to ${selectedElement}`);
      }
      setBondStartAtomId(null);
      setCursorPos(null);
      setHoveredAtomId(null);
    } else {
      // Step 2: Clicked second atom -> Connect bond!
      connectAtoms(bondStartAtomId, atom.id);
      setBondStartAtomId(null);
      setCursorPos(null);
      setHoveredAtomId(null);
    }
  };

  // Bond Click (Cycle Order or Erase)
  const handleBondClick = (e: React.MouseEvent, bondIndex: number) => {
    e.stopPropagation();
    if (mode === 'erase') {
      const remaining = bonds.filter((_, idx) => idx !== bondIndex);
      commitGraph(atoms, remaining);
      return;
    }
    // Cycle bond order: 1 -> 2 -> 3 -> 1
    const updated = [...bonds];
    const nextOrder = (updated[bondIndex].order % 3) + 1;
    updated[bondIndex].order = nextOrder;
    commitGraph(atoms, updated);
    toast.info(`Changed bond to ${nextOrder === 1 ? 'Single' : nextOrder === 2 ? 'Double' : 'Triple'}`);
  };

  // Mouse Move on Canvas
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getCanvasCoords(e);

    if (draggedAtomId !== null && mode === 'move') {
      setAtoms((prev) =>
        prev.map((a) => (a.id === draggedAtomId ? { ...a, x: coords.x, y: coords.y } : a))
      );
      return;
    }

    if (mode === 'draw') {
      // Check if mouse is held down
      if (dragInfoRef.current?.isDown) {
        const dx = coords.x - dragInfoRef.current.startX;
        const dy = coords.y - dragInfoRef.current.startY;
        const dist = Math.hypot(dx, dy);

        if (!dragInfoRef.current.hasMovedPastThreshold && dist > 6) {
          dragInfoRef.current.hasMovedPastThreshold = true;
          setIsDrawingDrag(true);
          setDragStartPos({ x: dragInfoRef.current.startX, y: dragInfoRef.current.startY });
        }

        if (dragInfoRef.current.hasMovedPastThreshold) {
          setCursorPos(coords);

          // Find if hovering near another atom to highlight as target
          const near = atoms.find(
            (a) => Math.hypot(a.x - coords.x, a.y - coords.y) <= 22 && a.id !== dragInfoRef.current?.startAtomId
          );
          setHoveredAtomId(near ? near.id : null);
          return;
        }
      }

      // If not dragging, but an atom is selected for two-click connection:
      if (bondStartAtomId !== null) {
        setCursorPos(coords);
        const near = atoms.find(
          (a) => Math.hypot(a.x - coords.x, a.y - coords.y) <= 22 && a.id !== bondStartAtomId
        );
        setHoveredAtomId(near ? near.id : null);
      }
    }
  };

  // Mouse Up on Canvas
  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getCanvasCoords(e);

    if (draggedAtomId !== null) {
      setDraggedAtomId(null);
      pushHistory(atoms, bonds);
      syncGraphToSmiles(atoms, bonds);
      return;
    }

    if (mode === 'draw' && dragInfoRef.current?.isDown) {
      const isDrag = dragInfoRef.current.hasMovedPastThreshold;
      const startAtomId = dragInfoRef.current.startAtomId;
      const startPos = { x: dragInfoRef.current.startX, y: dragInfoRef.current.startY };

      dragInfoRef.current = null;
      setIsDrawingDrag(false);
      setDragStartPos(null);

      if (isDrag) {
        // Suppress click event immediately following a drag
        justFinishedDragRef.current = true;
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 100);

        // Case 1: Dragged from an origin atom
        if (startAtomId !== null) {
          if (hoveredAtomId !== null && hoveredAtomId !== startAtomId) {
            // Released on target atom -> Connect bond!
            connectAtoms(startAtomId, hoveredAtomId);
            setBondStartAtomId(null);
            setCursorPos(null);
            setHoveredAtomId(null);
            return;
          }

          const dist = Math.hypot(coords.x - startPos.x, coords.y - startPos.y);
          if (dist > 25) {
            // Released in empty space -> Create new atom & bond!
            const newId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;
            const newAtom: SketcherAtom = { id: newId, element: selectedElement, x: coords.x, y: coords.y };
            const newBond: SketcherBond = { source: startAtomId, target: newId, order: bondOrder };
            commitGraph([...atoms, newAtom], [...bonds, newBond]);
            setBondStartAtomId(null);
            setCursorPos(null);
            setHoveredAtomId(null);
            toast.success('Drawn new branch bond');
            return;
          }
        }

        // Case 2: Dragged on empty canvas (starting from nowhere)
        if (startAtomId === null) {
          const dist = Math.hypot(coords.x - startPos.x, coords.y - startPos.y);
          if (dist > 30) {
            // Dragged out a full bond on blank canvas!
            const id1 = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;
            const id2 = id1 + 1;
            const atom1: SketcherAtom = { id: id1, element: selectedElement, x: startPos.x, y: startPos.y };
            const atom2: SketcherAtom = { id: id2, element: selectedElement, x: coords.x, y: coords.y };
            const newBond: SketcherBond = { source: id1, target: id2, order: bondOrder };
            commitGraph([...atoms, atom1, atom2], [...bonds, newBond]);
            setBondStartAtomId(null);
            setCursorPos(null);
            setHoveredAtomId(null);
            toast.success('Drawn new bond');
            return;
          }
        }

        setBondStartAtomId(null);
        setCursorPos(null);
        setHoveredAtomId(null);
      }
      // If not a drag, mouseUp does nothing; onClick handles click logic!
    }
  };

  const handleMouseLeave = () => {
    if (dragInfoRef.current?.isDown) {
      dragInfoRef.current = null;
      setIsDrawingDrag(false);
      setDragStartPos(null);
      setHoveredAtomId(null);
    }
  };

  // Transfer to Studio
  const handleTransfer = () => {
    if (!currentSmiles || !currentSmiles.trim()) {
      toast.error('Canvas is empty. Draw a chemical structure first.');
      return;
    }
    setSmiles(currentSmiles.trim());
    setSketcherOpen(false);
    toast.success(`Transferred ${currentSmiles} to main studio!`);
  };

  if (!sketcherOpen) return null;

  const bondStartAtom = atoms.find((a) => a.id === bondStartAtomId);
  const startDragCoords = bondStartAtom ? { x: bondStartAtom.x, y: bondStartAtom.y } : isDrawingDrag ? dragStartPos : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white/95 dark:bg-surface-container-low/95 backdrop-blur-3xl max-w-4xl w-full rounded-3xl p-6 shadow-apple-lg dark:shadow-2xl border border-black/[0.08] dark:border-white/[0.08] space-y-4">
        {/* Header (Cleaned, no traffic lights near logo) */}
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                Modern 2D Chemical Canvas Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-semibold">
                  Native Vector Canvas
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant">
                Drag from an atom to connect bonds, click two atoms to link, or drag on canvas to create new bonds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
              title="Clear all atoms and bonds on the canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Canvas
            </button>
            <button
              onClick={() => setSketcherOpen(false)}
              className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Control Bar: Drawing Tools, Elements, Orders, History */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-surface-container/70 p-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] shadow-xs">
          {/* Interaction Mode */}
          <div className="flex items-center gap-1 bg-surface-container-high/80 p-1 rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMode('draw');
                setBondStartAtomId(null);
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
                mode === 'draw' ? 'bg-primary text-on-primary shadow-apple-sm' : 'text-outline hover:text-on-surface'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" /> Draw
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('move');
                setBondStartAtomId(null);
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
                mode === 'move' ? 'bg-primary text-on-primary shadow-apple-sm' : 'text-outline hover:text-on-surface'
              }`}
            >
              <Move className="w-3.5 h-3.5" /> Move
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('erase');
                setBondStartAtomId(null);
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
                mode === 'erase' ? 'bg-rose-500 text-white shadow-apple-sm' : 'text-outline hover:text-rose-400'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" /> Erase
            </button>
          </div>

          {/* Element Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-outline mr-1 font-mono">Atom:</span>
            {COMMON_ELEMENTS.map((el) => {
              const active = selectedElement === el;
              return (
                <button
                  key={el}
                  type="button"
                  onClick={() => setSelectedElement(el)}
                  className={`w-7 h-7 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center ${
                    active
                      ? 'bg-primary text-on-primary shadow-apple-sm ring-2 ring-primary/40'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-black/[0.06] dark:border-white/[0.06]'
                  }`}
                >
                  {el}
                </button>
              );
            })}
          </div>

          {/* Bond Order */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-outline mr-1 font-mono">Bond:</span>
            {[
              { order: 1, label: 'Single (—)' },
              { order: 2, label: 'Double (═)' },
              { order: 3, label: 'Triple (≡)' },
            ].map((b) => (
              <button
                key={b.order}
                type="button"
                onClick={() => setBondOrder(b.order)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                  bondOrder === b.order
                    ? 'bg-primary/20 text-primary border-primary/40 font-bold'
                    : 'bg-surface-container border-black/[0.06] dark:border-white/[0.06] text-outline hover:text-on-surface'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* History Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface disabled:opacity-30 border border-black/[0.06] dark:border-white/[0.06] transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface disabled:opacity-30 border border-black/[0.06] dark:border-white/[0.06] transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ring Stamps & Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline flex items-center gap-1 font-mono">
              <Layers className="w-3.5 h-3.5 text-primary" /> Ring Stamps:
            </span>
            <button
              type="button"
              onClick={() => addRingTemplate('benzene')}
              className="px-2.5 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-black/[0.06] dark:border-white/[0.06] transition active:scale-95 shadow-xs font-medium"
            >
              Benzene
            </button>
            <button
              type="button"
              onClick={() => addRingTemplate('pyridine')}
              className="px-2.5 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-black/[0.06] dark:border-white/[0.06] transition active:scale-95 shadow-xs font-medium"
            >
              Pyridine
            </button>
            <button
              type="button"
              onClick={() => addRingTemplate('cyclohexane')}
              className="px-2.5 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-black/[0.06] dark:border-white/[0.06] transition active:scale-95 shadow-xs font-medium"
            >
              Cyclohexane
            </button>
            <button
              type="button"
              onClick={() => addRingTemplate('cyclopentane')}
              className="px-2.5 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-black/[0.06] dark:border-white/[0.06] transition active:scale-95 shadow-xs font-medium"
            >
              Cyclopentane
            </button>
          </div>

          {/* Quick SMILES Importer */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Paste SMILES (e.g. CCO)..."
              value={customImportSmiles}
              onChange={(e) => setCustomImportSmiles(e.target.value)}
              className="px-3 py-1 bg-black/[0.03] dark:bg-black/40 border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-xs font-mono text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary w-48 shadow-inner"
            />
            <button
              type="button"
              onClick={() => {
                if (customImportSmiles.trim()) {
                  loadSmilesIntoGraph(customImportSmiles.trim());
                  setCustomImportSmiles('');
                }
              }}
              className="px-3 py-1 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-semibold flex items-center gap-1 transition active:scale-95 shadow-xs"
            >
              <Upload className="w-3 h-3" /> Load
            </button>
          </div>
        </div>

        {/* Interactive SVG Canvas */}
        <div className="relative w-full h-[400px] bg-white dark:bg-[#070b14] rounded-2xl border border-black/[0.08] dark:border-white/[0.06] overflow-hidden select-none shadow-inner">
          {/* Active drawing hint pill */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            {bondStartAtomId !== null ? (
              <span className="px-3 py-1 rounded-full bg-primary text-on-primary text-[11px] font-mono font-semibold shadow-md animate-pulse flex items-center gap-1.5">
                ⚡ Drag or click target atom to connect bond (Esc to cancel)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container/80 backdrop-blur-md text-outline text-[11px] font-mono border border-black/[0.05] dark:border-white/[0.05]">
                Tip: Drag between atoms or click two atoms to connect bonds
              </span>
            )}
          </div>

          <svg
            ref={svgRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="0.75" fill={isDark ? '#334155' : '#94a3b8'} opacity={isDark ? 0.4 : 0.5} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#canvas-grid)" />

            {/* Render Bonds */}
            {bonds.map((b, idx) => {
              const srcAtom = atoms.find((a) => a.id === b.source);
              const dstAtom = atoms.find((a) => a.id === b.target);
              if (!srcAtom || !dstAtom) return null;

              const dx = dstAtom.x - srcAtom.x;
              const dy = dstAtom.y - srcAtom.y;
              const len = Math.hypot(dx, dy) || 1;
              const normX = -dy / len;
              const normY = dx / len;
              const offset = 3.5;

              return (
                <g
                  key={idx}
                  onClick={(e) => handleBondClick(e, idx)}
                  className="cursor-pointer group"
                >
                  {/* Invisible hit-area for easy clicking */}
                  <line
                    x1={srcAtom.x}
                    y1={srcAtom.y}
                    x2={dstAtom.x}
                    y2={dstAtom.y}
                    stroke="transparent"
                    strokeWidth="16"
                  />

                  {/* Single Bond */}
                  {b.order === 1 && (
                    <line
                      x1={srcAtom.x}
                      y1={srcAtom.y}
                      x2={dstAtom.x}
                      y2={dstAtom.y}
                      stroke={isDark ? '#94a3b8' : '#334155'}
                      strokeWidth="3.2"
                      className="group-hover:stroke-primary transition-colors"
                    />
                  )}

                  {/* Double Bond */}
                  {b.order === 2 && (
                    <>
                      <line
                        x1={srcAtom.x + normX * offset}
                        y1={srcAtom.y + normY * offset}
                        x2={dstAtom.x + normX * offset}
                        y2={dstAtom.y + normY * offset}
                        stroke={isDark ? '#38bdf8' : '#0284c7'}
                        strokeWidth="2.5"
                        className="group-hover:stroke-primary"
                      />
                      <line
                        x1={srcAtom.x - normX * offset}
                        y1={srcAtom.y - normY * offset}
                        x2={dstAtom.x - normX * offset}
                        y2={dstAtom.y - normY * offset}
                        stroke={isDark ? '#38bdf8' : '#0284c7'}
                        strokeWidth="2.5"
                        className="group-hover:stroke-primary"
                      />
                    </>
                  )}

                  {/* Triple Bond */}
                  {b.order === 3 && (
                    <>
                      <line
                        x1={srcAtom.x}
                        y1={srcAtom.y}
                        x2={dstAtom.x}
                        y2={dstAtom.y}
                        stroke={isDark ? '#f59e0b' : '#d97706'}
                        strokeWidth="2.5"
                      />
                      <line
                        x1={srcAtom.x + normX * (offset * 1.5)}
                        y1={srcAtom.y + normY * (offset * 1.5)}
                        x2={dstAtom.x + normX * (offset * 1.5)}
                        y2={dstAtom.y + normY * (offset * 1.5)}
                        stroke={isDark ? '#f59e0b' : '#d97706'}
                        strokeWidth="2.2"
                      />
                      <line
                        x1={srcAtom.x - normX * (offset * 1.5)}
                        y1={srcAtom.y - normY * (offset * 1.5)}
                        x2={dstAtom.x - normX * (offset * 1.5)}
                        y2={dstAtom.y - normY * (offset * 1.5)}
                        stroke={isDark ? '#f59e0b' : '#d97706'}
                        strokeWidth="2.2"
                      />
                    </>
                  )}
                </g>
              );
            })}

            {/* Interactive Bond Drag Line (with pointer-events-none so it never blocks clicks!) */}
            {startDragCoords && cursorPos && (
              <g className="pointer-events-none">
                <line
                  x1={startDragCoords.x}
                  y1={startDragCoords.y}
                  x2={cursorPos.x}
                  y2={cursorPos.y}
                  stroke={isDark ? '#f1cf9c' : '#ad7316'}
                  strokeWidth="3"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <circle
                  cx={cursorPos.x}
                  cy={cursorPos.y}
                  r="6"
                  fill={isDark ? '#f1cf9c' : '#ad7316'}
                  opacity="0.8"
                />
              </g>
            )}

            {/* Render Atoms */}
            {atoms.map((a) => {
              const colors = (isDark ? ELEMENT_COLORS_DARK : ELEMENT_COLORS_LIGHT)[a.element] ||
                (isDark ? ELEMENT_COLORS_DARK.C : ELEMENT_COLORS_LIGHT.C);
              const isSelected = bondStartAtomId === a.id;
              const isHoveredTarget = hoveredAtomId === a.id;

              return (
                <g
                  key={a.id}
                  transform={`translate(${a.x}, ${a.y})`}
                  onClick={(e) => handleAtomClick(e, a)}
                  onMouseDown={(e) => handleAtomMouseDown(e, a)}
                  className="cursor-pointer group"
                >
                  {/* Glowing Target Ring when dragging near */}
                  {isHoveredTarget && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                      className="animate-spin"
                    />
                  )}

                  {/* Atom Circle */}
                  <circle
                    r="15"
                    fill={colors.bg}
                    stroke={isSelected ? (isDark ? '#f1cf9c' : '#ad7316') : isHoveredTarget ? '#22c55e' : colors.stroke}
                    strokeWidth={isSelected || isHoveredTarget ? '3.5' : '2'}
                    style={{
                      filter: isSelected ? `drop-shadow(0 0 10px ${colors.glow})` : 'none',
                    }}
                    className="group-hover:brightness-110 transition-all"
                  />
                  {/* Symbol */}
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fill={colors.text}
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="ui-monospace, monospace"
                    className="pointer-events-none select-none"
                  >
                    {a.element}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Empty Canvas Guidance Overlay */}
          {atoms.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-2 select-none">
              <PenTool className="w-8 h-8 text-primary/50 animate-bounce" />
              <p className="text-sm font-semibold text-on-surface">Blank Blueprint Canvas</p>
              <p className="text-xs text-outline">
                Click anywhere on the grid to drop an atom, or pick a ring template above.
              </p>
            </div>
          )}
        </div>

        {/* Real-time Chemistry Banner & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="bg-surface-container px-3.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-outline block font-mono">SMILES</span>
              <span className="font-mono text-xs font-bold text-primary">
                {currentSmiles || '<empty>'}
              </span>
            </div>

            {formula && (
              <div className="bg-surface-container px-3.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-outline block font-mono">Formula</span>
                <span className="font-mono text-xs font-bold text-on-surface">{formula}</span>
              </div>
            )}

            {mw > 0 && (
              <div className="bg-surface-container px-3.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-outline block font-mono">Mass</span>
                <span className="font-mono text-xs font-bold text-on-surface">{mw} Da</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSketcherOpen(false)}
              className="px-4 py-2 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold border border-black/[0.06] dark:border-white/[0.06] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransfer}
              disabled={!currentSmiles}
              className="px-5 py-2 rounded-2xl bg-primary text-on-primary font-semibold text-xs flex items-center gap-1.5 shadow-apple-sm dark:shadow-glow hover:opacity-95 disabled:opacity-40 transition active:scale-95"
            >
              <Check className="w-4 h-4" /> Transfer to Studio <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsmeSketcherModal;
