import { create } from 'zustand';

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
  // Canvas State
  paths: Path[];
  importedSvgs: ImportedSvg[];
  currentPath: Point[];
  isDrawing: boolean;
  tool: 'pen' | 'eraser';
  strokeWidth: number;
  strokeColor: string;
  canvasSize: { width: number; height: number };

  // 3D Settings
  extrusionHeight: number; // mm
  basePlateType: 'none' | 'rect' | 'circle' | 'outline';
  baseHeight: number; // mm
  showGrid: boolean;

  // Actions
  startDrawing: (point: Point) => void;
  continueDrawing: (point: Point) => void;
  endDrawing: () => void;

  clearCanvas: () => void;
  undo: () => void;

  setTool: (tool: 'pen' | 'eraser') => void;
  setStrokeWidth: (width: number) => void;
  setExtrusionHeight: (height: number) => void;
  setBasePlateType: (type: 'none' | 'rect' | 'circle' | 'outline') => void;

  // Importer
  addImportedSvg: (svg: ImportedSvg) => void;
  removeImportedSvg: (id: string) => void;

  // Helpers
  updateCanvasSize: (width: number, height: number) => void;
}

export const useMakerStore = create<MakerState>((set, get) => ({
  paths: [],
  importedSvgs: [],
  currentPath: [],
  isDrawing: false,
  tool: 'pen',
  strokeWidth: 5,
  strokeColor: '#000000',
  canvasSize: { width: 800, height: 600 },

  extrusionHeight: 5,
  basePlateType: 'none',
  baseHeight: 2,
  showGrid: true,

  startDrawing: (point) => set({
    isDrawing: true,
    currentPath: [point]
  }),

  continueDrawing: (point) => {
    const { isDrawing, currentPath } = get();
    if (!isDrawing) return;

    // Add point only if it's far enough from the last one (optimization)
    const lastPoint = currentPath[currentPath.length - 1];
    if (lastPoint) {
      const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
      if (dist < 2) return; // 2px threshold
    }

    set({ currentPath: [...currentPath, point] });
  },

  endDrawing: () => {
    const { currentPath, paths, tool, strokeWidth, strokeColor } = get();
    if (currentPath.length < 2) {
      set({ isDrawing: false, currentPath: [] });
      return;
    }

    const newPath: Path = {
      id: crypto.randomUUID(),
      points: currentPath,
      color: tool === 'eraser' ? '#ffffff' : strokeColor, // Simplistic eraser
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

  setTool: (tool) => set({ tool }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setExtrusionHeight: (height) => set({ extrusionHeight: height }),
  setBasePlateType: (type) => set({ basePlateType: type }),
  updateCanvasSize: (width, height) => set({ canvasSize: { width, height } })
}));
