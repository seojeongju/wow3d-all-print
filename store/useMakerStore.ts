import { create } from 'zustand';
import { simplifyPoints, smoothPoints } from '@/lib/sketch-optimizer';
import type { BasePlateType, MakerSceneInput } from '@/lib/maker-geometry';
import { getMakerTemplate, type MakerTemplateId } from '@/lib/maker-templates';

interface Point {
  x: number;
  y: number;
}

interface Path {
  id: string;
  points: Point[];
  color: string;
  width: number;
  isClosed?: boolean;
}

interface ImportedSvg {
  id: string;
  name: string;
  svgContent: string;
}

interface MakerState {
  paths: Path[];
  importedSvgs: ImportedSvg[];
  currentPath: Point[];
  isDrawing: boolean;
  tool: 'pen' | 'eraser';
  strokeWidth: number;
  strokeColor: string;
  canvasSize: { width: number; height: number };

  extrusionHeight: number;
  basePlateType: BasePlateType;
  baseHeight: number;
  bevelMm: number;
  rimHeightMm: number;
  baseSizeMm: number;
  cornerRadiusMm: number;
  activeTemplateId: MakerTemplateId | null;
  showGrid: boolean;

  startDrawing: (point: Point) => void;
  continueDrawing: (point: Point) => void;
  endDrawing: () => void;

  clearCanvas: () => void;
  undo: () => void;

  setTool: (tool: 'pen' | 'eraser') => void;
  setStrokeWidth: (width: number) => void;
  setStrokeColor: (color: string) => void;
  setExtrusionHeight: (height: number) => void;
  setBasePlateType: (type: BasePlateType) => void;
  setBaseHeight: (height: number) => void;
  setBevelMm: (mm: number) => void;
  setRimHeightMm: (mm: number) => void;
  setBaseSizeMm: (mm: number) => void;
  setCornerRadiusMm: (mm: number) => void;
  applyTemplate: (id: MakerTemplateId) => void;
  setShowGrid: (show: boolean) => void;

  addImportedSvg: (svg: ImportedSvg) => void;
  removeImportedSvg: (id: string) => void;

  exportTrigger: number;
  triggerExport: () => void;

  updateCanvasSize: (width: number, height: number) => void;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function makerSceneInputFromState(s: {
  paths: Path[];
  importedSvgs: ImportedSvg[];
  extrusionHeight: number;
  basePlateType: BasePlateType;
  baseHeight: number;
  bevelMm: number;
  rimHeightMm: number;
  baseSizeMm: number;
  cornerRadiusMm: number;
  canvasSize: { width: number; height: number };
}): MakerSceneInput {
  return {
    paths: s.paths,
    importedSvgs: s.importedSvgs,
    extrusionHeight: s.extrusionHeight,
    basePlateType: s.basePlateType,
    baseHeight: s.baseHeight,
    bevelMm: s.bevelMm,
    rimHeightMm: s.rimHeightMm,
    baseSizeMm: s.baseSizeMm,
    cornerRadiusMm: s.cornerRadiusMm,
    canvasSize: s.canvasSize,
  };
}

export const useMakerStore = create<MakerState>((set, get) => ({
  paths: [],
  importedSvgs: [],
  currentPath: [],
  isDrawing: false,
  tool: 'pen',
  strokeWidth: 5,
  strokeColor: '#ffffff',
  canvasSize: { width: 800, height: 600 },
  exportTrigger: 0,

  extrusionHeight: 5,
  basePlateType: 'none',
  baseHeight: 2,
  bevelMm: 0,
  rimHeightMm: 0,
  baseSizeMm: 40,
  cornerRadiusMm: 4,
  activeTemplateId: null,
  showGrid: true,

  startDrawing: (point) => set({
    isDrawing: true,
    currentPath: [point]
  }),

  continueDrawing: (point) => {
    const { isDrawing, currentPath } = get();
    if (!isDrawing) return;

    const lastPoint = currentPath[currentPath.length - 1];
    if (lastPoint) {
      const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
      if (dist < 2) return;
    }

    set({ currentPath: [...currentPath, point] });
  },

  endDrawing: () => {
    const { currentPath, paths, tool, strokeWidth, strokeColor } = get();
    if (currentPath.length < 2) {
      set({ isDrawing: false, currentPath: [] });
      return;
    }

    const optimizedPoints = smoothPoints(simplifyPoints(currentPath, 1), 2);

    const newPath: Path = {
      id: crypto.randomUUID(),
      points: optimizedPoints,
      color: tool === 'eraser' ? '#0f172a' : strokeColor,
      width: strokeWidth
    };

    set({
      paths: [...paths, newPath],
      isDrawing: false,
      currentPath: []
    });
  },

  clearCanvas: () => set({ paths: [], currentPath: [] }),

  undo: () => set((state) => ({
    paths: state.paths.slice(0, -1)
  })),

  addImportedSvg: (svg) => set((state) => ({
    importedSvgs: [...state.importedSvgs, svg]
  })),

  removeImportedSvg: (id) => set((state) => ({
    importedSvgs: state.importedSvgs.filter(s => s.id !== id)
  })),

  triggerExport: () => set((state) => ({ exportTrigger: state.exportTrigger + 1 })),

  setTool: (tool) => set({ tool }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setExtrusionHeight: (height) => set({ extrusionHeight: clamp(height, 0.4, 50) }),
  setBasePlateType: (type) => set({ basePlateType: type, activeTemplateId: null }),
  setBaseHeight: (height) => set({ baseHeight: clamp(height, 0.5, 20) }),
  setBevelMm: (mm) => set({ bevelMm: clamp(mm, 0, 3) }),
  setRimHeightMm: (mm) => set({ rimHeightMm: clamp(mm, 0, 8) }),
  setBaseSizeMm: (mm) => set({ baseSizeMm: clamp(mm, 10, 80) }),
  setCornerRadiusMm: (mm) => set({ cornerRadiusMm: clamp(mm, 0.4, 16) }),
  applyTemplate: (id) => {
    const t = getMakerTemplate(id);
    if (!t) return;
    set({
      activeTemplateId: t.id,
      basePlateType: t.basePlateType,
      baseSizeMm: t.baseSizeMm,
      baseHeight: t.baseHeight,
      extrusionHeight: t.extrusionHeight,
      rimHeightMm: t.rimHeightMm,
      bevelMm: t.bevelMm,
      cornerRadiusMm: t.cornerRadiusMm,
    });
  },
  setShowGrid: (show) => set({ showGrid: show }),
  updateCanvasSize: (width, height) => set({ canvasSize: { width, height } })
}));
