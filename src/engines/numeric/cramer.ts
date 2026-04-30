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

export function solveCramer(coefficients: string[][]): SolveResult {
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

  steps.push(createStep(
    'Matriz aumentada',
    'Sistema original',
    coeffMatrix,
    matrix.map(row => row.slice(0, numCols)),
    'steps.cramer.augmented',
    true
  ));

  const detA = calculateDeterminant(coeffMatrix);
  if (isZero(detA.num, detA.den)) {
    return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
  }

  const detAStr = fractionToString(detA.num, detA.den);
  steps.push(createStep(
    'Determinante de A',
    `det(A) = ${detAStr}`,
    coeffMatrix,
    coeffMatrix,
    'steps.cramer.detA',
    true
  ));

  const solution: { num: number; den: number }[] = [];
  for (let col = 0; col < numCols; col++) {
    const modifiedMatrix: { num: number; den: number }[][] = [];
    for (let r = 0; r < numRows; r++) {
      const newRow: { num: number; den: number }[] = [];
      for (let c = 0; c < numCols; c++) {
        newRow.push(c === col ? bVector[r] : coeffMatrix[r][c]);
      }
      modifiedMatrix.push(newRow);
    }
    const detCol = calculateDeterminant(modifiedMatrix);
    const detColFrac = createFraction(detCol.num, detCol.den);
    const detAFrac = createFraction(detA.num, detA.den);
    const result = divideFractions(detColFrac, detAFrac);
    if (!result) {
      return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
    }
    solution.push({ num: result.num, den: result.den });

    const detColStr = fractionToString(detCol.num, detCol.den);
    const resultStr = fractionToString(result.num, result.den);
    steps.push(createStep(
      `Reemplazar columna ${col + 1}`,
      `x${col + 1} = det(A_${col + 1}) / det(A) = ${detColStr} / ${detAStr} = ${resultStr}`,
      coeffMatrix,
      modifiedMatrix,
      'steps.cramer.replace',
      false
    ));
  }

  return {
    steps,
    solution: solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}