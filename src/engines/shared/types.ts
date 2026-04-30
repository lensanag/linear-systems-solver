export interface FractionCell {
  type: 'fraction';
  num: number;
  den: number;
}

export type Cell = FractionCell;

export type MethodId =
  | 'gaussian'
  | 'gauss-jordan'
  | 'cramer'
  | 'inverse'
  | 'lu';

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
  method: MethodId | null;
  rows: number;
  cols: number;
  headers: string[];
  coefficients: string[][];
  createdAt: number;
}

export interface Example {
  id: string;
  dimensions: { rows: number; cols: number };
  headers: string[];
  coefficients: string[][];
  method: MethodId;
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
  method: MethodId | null;
  rows: number;
  cols: number;
  headers: string[];
  coefficients: string[][];
  createdAt: number;
}