import type { Step, SolveResult } from '@/engines/shared/types';
import { createMatrixFromStrings, createStep, createEmptyResult } from './utils';
import { createNumericCell } from './types';
import {
  multiplyFractions,
  addFractions,
  subtractFractions,
  divideFractions,
  isZero,
  createFraction,
  createFractionCell,
} from './parser';

function fractionToString(num: number, den: number): string {
  return den === 1 ? num.toString() : `${num}/${den}`;
}

export function solveLU(coefficients: string[][]): SolveResult {
  const numRows = coefficients.length;
  const numCols = coefficients[0]?.length ? coefficients[0].length - 1 : 0;

  if (numRows !== numCols || numCols === 0) {
    return createEmptyResult();
  }

  const matrix = createMatrixFromStrings(coefficients, numCols + 1);
  if (!matrix) {
    return createEmptyResult();
  }

  const steps: Step[] = [];
  const coeffMatrix: { num: number; den: number }[][] = matrix.map(row => row.slice(0, numCols) as { num: number; den: number }[]);
  const bVector: { num: number; den: number }[] = matrix.map(row => row[numCols] as { num: number; den: number });

  const n = numRows;
  const U: { num: number; den: number }[][] = Array(n).fill(null).map(() => Array(n).fill(createNumericCell(0, 1)));
  const L: { num: number; den: number }[][] = Array(n).fill(null).map((_, i) =>
    Array(n).fill(null).map((_, j) => createNumericCell(i === j ? 1 : 0, 1))
  );

  steps.push(createStep(
    'Matrices L y U',
    'Descomposición LU con pivoteo parcial',
    coeffMatrix,
    coeffMatrix,
    'steps.lu.decompose',
    true
  ));

  for (let col = 0; col < n; col++) {
    let maxVal = 0;
    let maxRow = col;
    for (let row = col; row < n; row++) {
      const absVal = Math.abs(coeffMatrix[row][col].num / coeffMatrix[row][col].den);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row;
      }
    }

    if (isZero(coeffMatrix[maxRow][col].num, coeffMatrix[maxRow][col].den)) continue;

    if (maxRow !== col) {
      [coeffMatrix[col], coeffMatrix[maxRow]] = [coeffMatrix[maxRow], coeffMatrix[col]];
      [bVector[col], bVector[maxRow]] = [bVector[maxRow], bVector[col]];
    }

    for (let row = col; row < n; row++) {
      let sum = createFraction(0, 1);
      for (let k = 0; k < col; k++) {
        const lCell = createFraction(L[row][k].num, L[row][k].den);
        const uCell = createFraction(U[k][col].num, U[k][col].den);
        const product = multiplyFractions(lCell, uCell);
        sum = addFractions(sum, product);
      }
      const diff = subtractFractions(createFraction(coeffMatrix[row][col].num, coeffMatrix[row][col].den), sum);
      U[row][col] = { num: diff.num, den: diff.den };
    }

    for (let row = col + 1; row < n; row++) {
      let sum = createFraction(0, 1);
      for (let k = 0; k < col; k++) {
        const lCell = createFraction(L[row][k].num, L[row][k].den);
        const uCell = createFraction(U[k][col].num, U[k][col].den);
        const product = multiplyFractions(lCell, uCell);
        sum = addFractions(sum, product);
      }
      const diff = subtractFractions(createFraction(coeffMatrix[row][col].num, coeffMatrix[row][col].den), sum);
      const divisor = divideFractions(diff, createFraction(U[col][col].num, U[col][col].den));
      if (!divisor) return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
      L[row][col] = { num: divisor.num, den: divisor.den };
    }
  }

  steps.push(createStep(
    'Descomposición completada',
    'L y U calculadas',
    L,
    U,
    'steps.lu.matrices',
    true
  ));

  const yVector: { num: number; den: number }[] = Array(n).fill(createNumericCell(0, 1));
  for (let row = 0; row < n; row++) {
    let sum = createFraction(0, 1);
    for (let col = 0; col < row; col++) {
      const lCell = createFraction(L[row][col].num, L[row][col].den);
      const yCell = createFraction(yVector[col].num, yVector[col].den);
      const product = multiplyFractions(lCell, yCell);
      sum = addFractions(sum, product);
    }
    const diff = subtractFractions(createFraction(bVector[row].num, bVector[row].den), sum);
    yVector[row] = { num: diff.num, den: diff.den };
  }

  steps.push(createStep(
    'Sustitución hacia adelante',
    'L*y = b resuelto',
    L,
    yVector.map(v => [v]),
    'steps.lu.forward',
    false
  ));

  const solution: { num: number; den: number }[] = Array(n).fill(createNumericCell(0, 1));
  for (let row = n - 1; row >= 0; row--) {
    let sum = createFraction(0, 1);
    for (let col = row + 1; col < n; col++) {
      const uCell = createFraction(U[row][col].num, U[row][col].den);
      const solCell = createFraction(solution[col].num, solution[col].den);
      const product = multiplyFractions(uCell, solCell);
      sum = addFractions(sum, product);
    }
    const diff = subtractFractions(createFraction(yVector[row].num, yVector[row].den), sum);
    const divisor = divideFractions(diff, createFraction(U[row][row].num, U[row][row].den));
    if (!divisor) return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
    solution[row] = { num: divisor.num, den: divisor.den };
  }

  steps.push(createStep(
    'Sustitución hacia atrás',
    'U*x = y resuelto',
    U,
    solution.map(v => [v]),
    'steps.lu.backward',
    false
  ));

  return {
    steps,
    solution: solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}