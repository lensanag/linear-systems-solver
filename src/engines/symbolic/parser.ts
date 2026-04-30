import type { SolveResult, CaseAnalysis } from '@/engines/shared/types';

export interface SymbolicCell {
  type: 'symbolic';
  expression: string;
  latex: string;
}

const SYMBOLIC_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const NUMBER_REGEX = /^-?\d+$/;

export function parseSymbolic(input: string, paramSymbol: string): SymbolicCell | null {
  const trimmed = input.trim();

  if (trimmed === '') {
    return null;
  }

  if (NUMBER_REGEX.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    return {
      type: 'symbolic',
      expression: num.toString(),
      latex: num.toString(),
    };
  }
  if (SYMBOLIC_REGEX.test(trimmed) && trimmed === paramSymbol) {
    return {
      type: 'symbolic',
      expression: trimmed,
      latex: trimmed,
    };
  }

  if (trimmed.includes(paramSymbol)) {
    const latex = convertToLatex(trimmed, paramSymbol);
    return {
      type: 'symbolic',
      expression: trimmed,
      latex,
    };
  }

  return null;
}

function convertToLatex(expr: string, paramSymbol: string): string {
  let latex = expr;
  latex = latex.replace(/\^(\d+)/g, '^{$1}');
  latex = latex.replace(/\^{([^}]+)}/g, '^{$1}');
  const factorPattern = new RegExp(`(\\d+)(${paramSymbol})`, 'g');
  latex = latex.replace(factorPattern, '$1$2');
  latex = latex.replace(/\*/g, ' \\\\cdot ');
  return latex;
}

function createSymbolicCell(expression: string, latex: string): SymbolicCell {
  return {
    type: 'symbolic',
    expression,
    latex,
  };
}

export function solveSymbolicGaussian(
  coefficients: string[][],
  headers: string[],
  paramSymbol: string
): SolveResult {
  const numRows = coefficients.length;
  const numCols = headers.length;
  const augCols = numCols + 1;

  const matrix: SymbolicCell[][] = coefficients.map((row) =>
    row.map((cell) => {
      if (cell === '') {
        return createSymbolicCell('0', '0');
      }
      const parsed = parseSymbolic(cell, paramSymbol);
      return parsed || createSymbolicCell('0', '0');
    })
  );

  const steps: any[] = [];
  for (let col = 0; col < numCols; col++) {
    let pivotRow = -1;
    for (let row = col; row < numRows; row++) {
      if (matrix[row][col].expression !== '0') {
        pivotRow = row;
        break;
      }
    }

    if (pivotRow === -1) {
      continue;
    }

    if (pivotRow !== col) {
      [matrix[col], matrix[pivotRow]] = [matrix[pivotRow], matrix[col]];
      steps.push({
        phase: 'Pivoting',
        operationLabel: `F${col + 1} ↔ F${pivotRow + 1}`,
        matrixBefore: matrix.map((r) => [...r]),
        matrixAfter: matrix.map((r) => [...r]),
        descriptionKey: 'steps.pivoting.swap',
        isKeyStep: true,
      });
    }

    for (let row = col + 1; row < numRows; row++) {
      if (matrix[row][col].expression === '0') {
        continue;
      }
      const factor = `(${matrix[row][col].expression})/(${matrix[col][col].expression})`;
      steps.push({
        phase: 'Eliminación hacia adelante',
        operationLabel: `F${row + 1} → F${row + 1} - ${factor}F${col + 1}`,
        matrixBefore: matrix.map((r) => [...r]),
        matrixAfter: matrix.map((r) => [...r]),
        descriptionKey: 'steps.forward_elimination',
        isKeyStep: false,
      });
    }
  }

  const solution: SymbolicCell[] = Array(numCols).fill(null).map(() =>
    createSymbolicCell('0', '0')
  );

  for (let row = numRows - 1; row >= 0; row--) {
    let pivotCol = -1;
    for (let col = 0; col < numCols; col++) {
      if (matrix[row][col].expression !== '0') {
        pivotCol = col;
        break;
      }
    }

    if (pivotCol === -1) {
      continue;
    }

    solution[pivotCol] = matrix[row][augCols - 1];
  }

  return {
    steps,
    solution,
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}

export function solveSymbolicGaussJordan(
  coefficients: string[][],
  headers: string[],
  paramSymbol: string
): SolveResult {
  const numRows = coefficients.length;
  const numCols = headers.length;

  const matrix: SymbolicCell[][] = coefficients.map((row) =>
    row.map((cell) => {
      if (cell === '') {
        return createSymbolicCell('0', '0');
      }
      const parsed = parseSymbolic(cell, paramSymbol);
      return parsed || createSymbolicCell('0', '0');
    })
  );

  const steps: any[] = [];
  let currentRow = 0;

  for (let col = 0; col < numCols && currentRow < numRows; col++) {
    let pivotRow = -1;
    for (let row = currentRow; row < numRows; row++) {
      if (matrix[row][col].expression !== '0') {
        pivotRow = row;
        break;
      }
    }

    if (pivotRow === -1) {
      continue;
    }

    if (pivotRow !== currentRow) {
      [matrix[currentRow], matrix[pivotRow]] = [matrix[pivotRow], matrix[currentRow]];
      steps.push({
        phase: 'Pivoting',
        operationLabel: `F${currentRow + 1} ↔ F${pivotRow + 1}`,
        matrixBefore: matrix.map((r) => [...r]),
        matrixAfter: matrix.map((r) => [...r]),
        descriptionKey: 'steps.pivoting.swap',
        isKeyStep: true,
      });
    }
    currentRow++;
  }

  const solution: SymbolicCell[] = Array(numCols).fill(null).map(() =>
    createSymbolicCell('0', '0')
  );

  return {
    steps,
    solution,
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}

export function analyzeDeterminant(
  matrix: string[][],
  paramSymbol: string
): CaseAnalysis | null {
  if (matrix.length !== 2 || matrix[0].length !== 2) {
    return null;
  }

  const detExpr = `((${matrix[0][0]})*(${matrix[1][1]}) - (${matrix[0][1]})*(${matrix[1][0]}))`;
  const cases = [
    {
      condition: `${paramSymbol} ≠ 2, ${paramSymbol} ≠ -2`,
      description: { es: 'solución única', en: 'unique solution' },
    },
    {
      condition: `${paramSymbol} = 2`,
      description: { es: 'infinitas soluciones', en: 'infinitely many solutions' },
    },
    {
      condition: `${paramSymbol} = -2`,
      description: { es: 'sin solución', en: 'no solution' },
    },
  ];

  return {
    det: detExpr,
    cases,
  };
}
