import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { MethodId, Cell, HistoryEntry as HistoryEntryType } from '@/engines/shared/types';

interface Step {
  phase: string;
  operationLabel: string;
  matrixBefore: Cell[][];
  matrixAfter: Cell[][];
  descriptionKey: string;
  isKeyStep: boolean;
}

interface AppStore {
  method: MethodId | null;
  headers: string[];
  coefficients: string[][];
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;
  isLoading: boolean;
  language: 'es' | 'en';
  history: HistoryEntryType[];
  lastExecutedCoefficients: string[][] | null;
  lastExecutedMethod: MethodId | null;
  setMethod: (method: MethodId | null) => void;
  setCoefficients: (coefficients: string[][]) => void;
  setHeaders: (headers: string[]) => void;
  setCoefficient: (row: number, col: number, value: string) => void;
  addRow: () => void;
  addCol: () => void;
  removeRow: (index: number) => void;
  removeCol: (index: number) => void;
  setResult: (result: { steps: Step[]; solution: Cell[] | null; hasNoSolution: boolean; hasInfiniteSolutions: boolean }, coefficients: string[][], method: MethodId) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  addToHistory: (entry: HistoryEntryType) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  resetMatrix: () => void;
  clearExecution: () => void;
}

const generateHeaders = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `x${i + 1}`);
};

const DEFAULT_COEFFICIENTS = [
  ['', '', ''],
  ['', '', ''],
];

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      method: null,
      headers: generateHeaders(2),
      coefficients: [...DEFAULT_COEFFICIENTS.map(row => [...row])],
      steps: [],
      solution: null,
      hasNoSolution: false,
      hasInfiniteSolutions: false,
      isLoading: false,
      language: 'es',
      history: [],
      lastExecutedCoefficients: null,
      lastExecutedMethod: null,

      setMethod: (method) => set({ method }),

      setCoefficients: (coefficients) => {
        const numCols = coefficients[0]?.length ?? 3;
        const numRows = coefficients.length;
        const currentHeaders = get().headers;
        const newHeaders = numCols - 1 > currentHeaders.length
          ? [...currentHeaders, ...generateHeaders(numCols - 1 - currentHeaders.length)]
          : currentHeaders.slice(0, numCols - 1);
        set({ coefficients, headers: newHeaders, steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false });
      },

      setHeaders: (headers) => set({ headers }),

      setCoefficient: (row, col, value) =>
        set((state) => {
          const newCoeffs = state.coefficients.map((r, ri) =>
            r.map((c, ci) => (ri === row && ci === col ? value : c))
          );
          return { coefficients: newCoeffs, steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
        }),

      addRow: () => {
        const { coefficients } = get();
        const numCols = coefficients[0]?.length ?? 3;
        const newRow = Array(numCols).fill('');
        set({ coefficients: [...coefficients, newRow], steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false });
      },

      addCol: () => {
        const { coefficients, headers } = get();
        const newHeaders = [...headers, `x${headers.length + 1}`];
        const newCoefficients = coefficients.map(row => {
          const newRow = [...row];
          newRow.splice(row.length - 1, 0, '');
          return newRow;
        });
        set({ coefficients: newCoefficients, headers: newHeaders, steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false });
      },

      removeRow: (index: number) => {
        const { coefficients } = get();
        if (coefficients.length <= 1) return;
        const newCoefficients = coefficients.filter((_, i) => i !== index);
        set({ coefficients: newCoefficients, steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false });
      },

      removeCol: (index: number) => {
        const { coefficients, headers } = get();
        const numCols = coefficients[0]?.length ?? 3;
        if (numCols <= 2) return;
        if (index !== numCols - 1) {
          const newCoefficients = coefficients.map(row => row.filter((_, i) => i !== index));
          const newHeaders = headers.filter((_, i) => i !== index);
          set({ coefficients: newCoefficients, headers: newHeaders, steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false });
        } else {
          const newCoefficients = coefficients.map(row => row.slice(0, -1));
          const newHeaders = headers.slice(0, -1);
          set({ coefficients: newCoefficients, headers: newHeaders, steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false });
        }
      },

      setResult: (result, coefficients, method) => {
        const coefficientsCopy = coefficients.map(row => [...row]);
        return set({
          steps: result.steps,
          solution: result.solution,
          hasNoSolution: result.hasNoSolution,
          hasInfiniteSolutions: result.hasInfiniteSolutions,
          lastExecutedCoefficients: coefficientsCopy,
          lastExecutedMethod: method,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language });
      },

      addToHistory: (entry) =>
        set((state) => ({ history: [entry, ...state.history] })),

      removeFromHistory: (id) =>
        set((state) => ({ history: state.filter((e) => e.id !== id) })),

      clearHistory: () => set({ history: [] }),

      resetMatrix: () =>
        set({
          headers: generateHeaders(2),
          coefficients: [...DEFAULT_COEFFICIENTS.map(row => [...row])],
          steps: [],
          solution: null,
          hasNoSolution: false,
          hasInfiniteSolutions: false,
          lastExecutedCoefficients: null,
          lastExecutedMethod: null,
        }),

      clearExecution: () =>
        set({
          steps: [],
          solution: null,
          hasNoSolution: false,
          hasInfiniteSolutions: false,
          lastExecutedCoefficients: null,
          lastExecutedMethod: null,
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