import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { EngineMode, MethodId, Cell, HistoryEntry as HistoryEntryType } from '@/engines/shared/types';

interface Step {
  phase: string;
  operationLabel: string;
  matrixBefore: Cell[][];
  matrixAfter: Cell[][];
  descriptionKey: string;
  isKeyStep: boolean;
}

interface AppStore {
  mode: EngineMode;
  method: MethodId | null;
  rows: number;
  cols: number;
  headers: string[];
  coefficients: string[][];
  paramSymbol: string;
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;
  isLoading: boolean;
  pyodideLoaded: boolean;
  language: 'es' | 'en';
  history: HistoryEntryType[];
  setMode: (mode: EngineMode) => void;
  setMethod: (method: MethodId | null) => void;
  setDimensions: (rows: number, cols: number) => void;
  setHeaders: (headers: string[]) => void;
  setCoefficient: (row: number, col: number, value: string) => void;
  setParamSymbol: (symbol: string) => void;
  setResult: (result: { steps: Step[]; solution: Cell[] | null; hasNoSolution: boolean; hasInfiniteSolutions: boolean }) => void;
  setLoading: (loading: boolean) => void;
  setPyodideLoaded: (loaded: boolean) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  addToHistory: (entry: HistoryEntryType) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  resetMatrix: () => void;
}

const generateHeaders = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `x${i + 1}`);
};

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      mode: 'numeric',
      method: null,
      rows: 2,
      cols: 2,
      headers: generateHeaders(2),
      coefficients: [
        ['', '', ''],
        ['', '', ''],
      ],
      paramSymbol: '',
      steps: [],
      solution: null,
      hasNoSolution: false,
      hasInfiniteSolutions: false,
      isLoading: false,
      pyodideLoaded: false,
      language: 'es',
      history: [],

      setMode: (mode) => set({ mode }),
      setMethod: (method) => set({ method }),
      setDimensions: (rows, cols) => {
        const currentCoeffs = useStore.getState().coefficients;
        const currentHeaders = useStore.getState().headers;
        const newCoefficients = Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) =>
            currentCoeffs[r]?.[c] ?? ''
          )
        );
        const newHeaders = cols > currentHeaders.length
          ? [...currentHeaders, ...generateHeaders(cols - currentHeaders.length)]
          : currentHeaders.slice(0, cols);
        set({ rows, cols, coefficients: newCoefficients, headers: newHeaders });
      },
      setHeaders: (headers) => set({ headers }),
      setCoefficient: (row, col, value) =>
        set((state) => {
          const newCoeffs = state.coefficients.map((r, ri) =>
            r.map((c, ci) => (ri === row && ci === col ? value : c))
          );
          return { coefficients: newCoeffs };
        }),
      setParamSymbol: (paramSymbol) => set({ paramSymbol }),
      setResult: (result) =>
        set({
          steps: result.steps,
          solution: result.solution,
          hasNoSolution: result.hasNoSolution,
          hasInfiniteSolutions: result.hasInfiniteSolutions,
        }),
      setLoading: (isLoading) => set({ isLoading }),
      setPyodideLoaded: (pyodideLoaded) => set({ pyodideLoaded }),
      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language });
      },
      addToHistory: (entry) =>
        set((state) => ({ history: [entry, ...state.history] })),
      removeFromHistory: (id) =>
        set((state) => ({ history: state.history.filter((e) => e.id !== id) })),
      clearHistory: () => set({ history: [] }),
      resetMatrix: () =>
        set({
          rows: 2,
          cols: 2,
          headers: generateHeaders(2),
          coefficients: [
            ['', '', ''],
            ['', '', ''],
          ],
          paramSymbol: '',
          steps: [],
          solution: null,
          hasNoSolution: false,
          hasInfiniteSolutions: false,
        }),
    }),
    {
      name: 'linear-systems-store',
      partialize: (state) => ({
        language: state.language,
        history: state.history,
      }),
    }
  )
);

export type { HistoryEntryType as HistoryEntry };
