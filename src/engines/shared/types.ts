export interface FractionCell {
  type: 'fraction';
  num: number;
  den: number;
}

export interface SymbolicCell {
  type: 'symbolic';
  expression: string;
  latex: string;
}

export type Cell = FractionCell | SymbolicCell;

export type MethodId =
  | 'gaussian'
  | 'gauss-jordan'
  | 'cramer'
  | 'inverse'
  | 'lu';

export type EngineMode = 'numeric' | 'symbolic';

export interface Step {
  phase: string;
  operationLabel: string;
  matrixBefore: Cell[][];
  matrixAfter: Cell[][];
  descriptionKey: string;
  isKeyStep: boolean;
}

export interface SolveResult {
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;
  freeVariables?: string[];
  caseAnalysis?: CaseAnalysis;
}

export interface CaseAnalysis {
  det: string;
  cases: {
    condition: string;
    description: { es: string; en: string };
    solution?: Cell[];
  }[];
}

export interface SystemEntry {
  id: string;
  label: string | null;
  mode: EngineMode;
  method: MethodId | null;
  rows: number;
  cols: number;
  headers: string[];
  coefficients: string[][];
  paramSymbol: string | null;
  createdAt: number;
}

export interface Example {
  id: string;
  mode: EngineMode;
  dimensions: { rows: number; cols: number };
  headers: string[];
  coefficients: string[][];
  method: MethodId;
  paramSymbol?: string;
  description: { es: string; en: string };
  descriptionKey: string;
  hasNoSolution?: boolean;
  hasInfiniteSolutions?: boolean;
  freeVariables?: string[];
  caseAnalysis?: CaseAnalysis;
}

export interface HistoryEntry {
  id: string;
  label: string | null;
  mode: EngineMode;
  method: MethodId | null;
  rows: number;
  cols: number;
  headers: string[];
  coefficients: string[][];
  paramSymbol: string;
  createdAt: number;
}
