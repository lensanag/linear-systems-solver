import type { Step, SolveResult } from '@/engines/shared/types';
import { createMatrixFromStrings, createStep, fractionToString, createEmptyResult } from './utils';
import {
  multiplyFractions,
  addFractions,
  subtractFractions,
  divideFractions,
  isZero,
  createFraction,
  createFractionCell,
} from './parser';
import { createNumericCell } from './types';

function calculateDeterminant(matrix: { num: number; den: number }[]): { num: number; den: number } {
  const n = matrix.length;
  if (n === 1) return matrix[0];

  if (n === 2) {
    const a = createFraction(matrix[0][0].num, matrix[0][0].den);
    const b = createFraction(matrix[0][1].num, matrix[0][1].den);
    const c = createFraction(matrix[1][0].num, matrix[1][0].den);
    const d = createFraction(matrix[1][1].num, matrix[1][1].den);
    const ad = multiplyFractions(a, d);
    const bc = multiplyFractions(b, c);
    return subtractFractions(ad, bc);
  }

  let det = createFraction(0, 1);
  for (let col = 0; col < n; col++) {
    const subMatrix: { num: number; den: number }[][] = [];
    for (let row = 1; row < n; row++) {
      const newRow: { num: number; den: number }[] = [];
      for (let c = 0; c < n; c++) {
        if (c !== col) newRow.push(matrix[row][c]);
      }
      subMatrix.push(newRow);
    }
    const subDet = calculateDeterminant(subMatrix);
    const subDetFrac = createFraction(subDet.num, subDet.den);
    const sign = col % 2 === 0 ? 1 : -1;
    const cell = createFraction(matrix[0][col].num, matrix[0][col].den);
    const cofactor = multiplyFractions(createFraction(sign, 1), multiplyFractions(cell, subDetFrac));
    det = addFractions(det, cofactor);
  }

  return det;
}

function calculateInverse(matrix: { num: number; den: number }[][]): { num: number; den: number }[][] | null {
  const n = matrix.length;
  const augmented: { num: number; den: number }[][] = matrix.map((row, i) => {
    const identityRow: { num: number; den: number }[] = Array(n).fill(null).map((_, j) =>
      createNumericCell(i === j ? 1 : 0, 1)
    );
    return [...row, ...identityRow];
  });

  for (let col = 0; col < n; col++) {
    let pivotRow = -1;
    for (let row = col; row < n; row++) {
      if (!isZero(augmented[row][col].num, augmented[row][col].den)) {
        pivotRow = row;
        break;
      }
    }
    if (pivotRow === -1) return null;

    if (pivotRow !== col) {
      [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];
    }

    const pivotCell = createFraction(augmented[col][col].num, augmented[col][col].den);
    const pivotInverse = divideFractions(createFraction(1, 1), pivotCell);
    if (!pivotInverse) return null;

    for (let c = 0; c < 2 * n; c++) {
      const cell = createFraction(augmented[col][c].num, augmented[col][c].den);
      const product = multiplyFractions(pivotInverse, cell);
      augmented[col][c] = { num: product.num, den: product.den };
    }

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = createFraction(augmented[row][col].num, augmented[row][col].den);
      if (isZero(factor.num, factor.den)) continue;

      for (let c = 0; c < 2 * n; c++) {
        const pivotRowCell = createFraction(augmented[col][c].num, augmented[col][c].den);
        const product = multiplyFractions(factor, pivotRowCell);
        const current = createFraction(augmented[row][c].num, augmented[row][c].den);
        const diff = subtractFractions(current, product);
        augmented[row][c] = { num: diff.num, den: diff.den };
      }
    }
  }

  return augmented.map(row => row.slice(n));
}

export function solveInverse(coefficients: string[][]): SolveResult {
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

  const detA = calculateDeterminant(coeffMatrix);
  if (isZero(detA.num, detA.den)) {
    return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
  }

  steps.push(createStep(
    'steps.inverse.detA',
    `det(A) = ${fractionToString(detA.num, detA.den)}`,
    coeffMatrix,
    coeffMatrix,
    'steps.inverse.detA',
    true
  ));

  const inverseMatrix = calculateInverse(coeffMatrix);
  if (!inverseMatrix) {
    return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
  }

  steps.push(createStep(
    'steps.inverse.calculated',
    'A⁻¹ calculada mediante Gauss-Jordan',
    coeffMatrix,
    inverseMatrix,
    'steps.inverse.calculated',
    true
  ));

  const solution: { num: number; den: number }[] = [];
  for (let row = 0; row < numRows; row++) {
    let sum = createFraction(0, 1);
    for (let col = 0; col < numCols; col++) {
      const invCell = createFraction(inverseMatrix[row][col].num, inverseMatrix[row][col].den);
      const bCell = createFraction(bVector[col].num, bVector[col].den);
      const product = multiplyFractions(invCell, bCell);
      sum = addFractions(sum, product);
    }
    solution.push({ num: sum.num, den: sum.den });
  }

  return {
    steps,
    solution: solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}