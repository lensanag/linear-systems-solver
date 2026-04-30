import type { SolveResult } from '@/engines/shared/types';

let pyodideInstance: any = null;
let loadingPromise: Promise<any> | null = null;

declare global {
  interface Window {
    loadPyodide: (config?: { indexURL?: string }) => Promise<any>;
  }
}

export async function loadPyodide(): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    if (typeof window !== 'undefined' && (window as any).loadPyodide) {
      pyodideInstance = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
      });
      return pyodideInstance;
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
      script.onload = async () => {
        try {
          pyodideInstance = await (window as any).loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
          });
          resolve(pyodideInstance);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    });
  })();

  return loadingPromise;
}

export function isPyodideLoaded(): boolean {
  return pyodideInstance !== null;
}

export async function runSymPySolve(
  coefficients: string[][],
  headers: string[],
  paramSymbol: string
): Promise<SolveResult> {
  const pyodide = await loadPyodide();

  const numRows = coefficients.length;
  const numCols = headers.length;

  const augmentedMatrix: number[][] = coefficients.map((row) =>
    row.map((cell) => {
      if (cell.trim() === '') return 0;
      const num = parseFloat(cell);
      return isNaN(num) ? cell : num;
    })
  );

  const A: (number | string)[][] = augmentedMatrix.map((row) => row.slice(0, numCols));
  const b: (number | string)[] = augmentedMatrix.map((row) => row[numCols]);

  const AStr = JSON.stringify(A);
  const bStr = JSON.stringify(b);

  const script = `
import json
import sympy as sp

A_raw = json.loads('${AStr}')
b_raw = json.loads('${bStr}')

A = sp.Matrix(A_raw)
b = sp.Matrix(b_raw)

n = A.shape[0]
m = A.shape[1]

augmented = A.row_join(b)

steps_data = []

for col in range(min(n, m)):
    for row in range(col, n):
        if augmented[row, col] != 0:
            if row != col:
                augmented.row_swap(row, col)
                steps_data.append({
                    'phase': 'Pivoting',
                    'operation': f'F{row+1} <-> F{col+1}',
                    'matrix': [[str(x) for x in row] for row in augmented.tolist()]
                })
            break
    
    if augmented[col, col] == 0:
        continue
    
    for row in range(col+1, n):
        if augmented[row, col] != 0:
            factor = augmented[row, col] / augmented[col, col]
            augmented[row] = augmented[row] - factor * augmented[col]
            steps_data.append({
                'phase': 'Eliminación hacia adelante',
                'operation': f'F{row+1} -> F{row+1} - ({sp.simplify(factor)})*F{col+1}',
                'matrix': [[str(x) for x in row] for row in augmented.tolist()]
            })

for col in range(min(n, m)-1, -1, -1):
    if augmented[col, col] == 0:
        continue
    for row in range(col-1, -1, -1):
        if augmented[row, col] != 0:
            factor = augmented[row, col] / augmented[col, col]
            augmented[row] = augmented[row] - factor * augmented[col]
            steps_data.append({
                'phase': 'Eliminación hacia atrás',
                'operation': f'F{row+1} -> F{row+1} - ({sp.simplify(factor)})*F{col+1}',
                'matrix': [[str(x) for x in row] for row in augmented.tolist()]
            })

has_zero_row = False
for row in range(n):
    if all(augmented[row, col] == 0 for col in range(m)):
        if augmented[row, m] != 0:
            has_zero_row = True
            break

solutions = []
if not has_zero_row:
    for row in range(n):
        pivot_col = None
        for col in range(m):
            if augmented[row, col] != 0:
                pivot_col = col
                break
        if pivot_col is not None:
            sol = sp.simplify(augmented[row, m] / augmented[row, pivot_col])
            solutions.append(str(sol))
        else:
            solutions.append('0')

result_data = {
    'status': 'no_solution' if has_zero_row else 'ok',
    'solutions': solutions,
    'steps': steps_data
}
result_data
`;

  const resultData = await pyodide.runPythonAsync(script);

  const status = resultData.get('status');

  if (status === 'no_solution') {
    return {
      steps: [],
      solution: null,
      hasNoSolution: true,
      hasInfiniteSolutions: false,
    };
  }

  const stepsData = resultData.get('steps');
  const steps: any[] = [];

  if (stepsData && stepsData.size > 0) {
    for (let i = 0; i < stepsData.size; i++) {
      const step = stepsData.get(i);
      const phase = step.get('phase');
      const operation = step.get('operation');
      const matrix = step.get('matrix');

      steps.push({
        phase,
        operationLabel: operation,
        matrixBefore: matrix,
        matrixAfter: matrix,
        descriptionKey: 'steps.elimination',
        isKeyStep: false,
      });
    }
  }

  const solutionsData = resultData.get('solutions');
  const solution: any[] = [];

  if (solutionsData && solutionsData.size > 0) {
    for (let i = 0; i < solutionsData.size; i++) {
      const s = solutionsData.get(i);
      solution.push({
        type: 'symbolic' as const,
        expression: s,
        latex: s,
      });
    }
  }

  return {
    steps,
    solution,
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}

export async function analyzeWithSymPy(
  coefficients: string[][],
  headers: string[],
  paramSymbol: string
): Promise<{
  determinant: string;
  cases: Array<{ condition: string; description: { es: string; en: string } }>;
} | null> {
  try {
    const pyodide = await loadPyodide();

    const numRows = coefficients.length;
    const numCols = headers.length;

    const AList: string[][] = coefficients.map((row) => row.slice(0, numCols));

    const script = `
import json
import sympy as sp

param = sp.Symbol('${paramSymbol}')
A = sp.Matrix(${JSON.stringify(AList)})

det = sp.simplify(A.det())

cases = []

for sol in sp.solve(det, param):
    cases.append({
        'condition': f'${paramSymbol} = {sol}',
        'description': {'es': 'caso especial', 'en': 'special case'}
    })

if det != 0:
    cases.insert(0, {
        'condition': f'${paramSymbol} != any_special_value',
        'description': {'es': 'solución única', 'en': 'unique solution'}
    })

{'determinant': str(det), 'cases': cases}
`;

    const result = await pyodide.runPythonAsync(script);

    return {
      determinant: result.get('determinant'),
      cases: result.get('cases').toJs(),
    };
  } catch (error) {
    console.error('SymPy analysis error:', error);
    return null;
  }
}