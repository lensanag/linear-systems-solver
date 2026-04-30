import type { SolveResult } from '@/engines/shared/types';
import { createMatrixFromStrings, createStep, fractionToString, createEmptyResult } from './utils';
import { cloneMatrix } from './types';
import {
  multiplyFractions,
  addFractions,
  subtractFractions,
  divideFractions,
  isZero,
  createFraction,
  createFractionCell,
} from './parser';

export function solveGaussian(coefficients: string[][]): SolveResult {
  const numRows = coefficients.length;
  const numCols = coefficients[0]?.length ? coefficients[0].length - 1 : 0;
  const augCols = numCols + 1;

  if (numCols === 0) {
    return createEmptyResult();
  }

  const matrix = createMatrixFromStrings(coefficients, augCols);
  if (!matrix) {
    return createEmptyResult();
  }

  const steps: Step[] = [];
  const augmentedMatrix = matrix;

  for (let col = 0; col < numCols; col++) {
    let pivotRow = -1;
    for (let row = col; row < numRows; row++) {
      if (!isZero(augmentedMatrix[row][col].num, augmentedMatrix[row][col].den)) {
        pivotRow = row;
        break;
      }
    }

    if (pivotRow === -1) continue;

    if (pivotRow !== col) {
      const matrixBefore = cloneMatrix(augmentedMatrix);
      [augmentedMatrix[col], augmentedMatrix[pivotRow]] = [augmentedMatrix[pivotRow], augmentedMatrix[col]];
      const matrixAfter = cloneMatrix(augmentedMatrix);
      steps.push(createStep(
        'Pivoting',
        `F${col + 1} ↔ F${pivotRow + 1}`,
        matrixBefore,
        matrixAfter,
        'steps.pivoting.swap',
        true
      ));
    }

    for (let row = col + 1; row < numRows; row++) {
      const pivotCell = augmentedMatrix[col][col];
      const factorCell = augmentedMatrix[row][col];

      if (isZero(factorCell.num, factorCell.den)) continue;

      const pivot = createFraction(pivotCell.num, pivotCell.den);
      const factor = createFraction(factorCell.num, factorCell.den);
      const factorResult = divideFractions(factor, pivot);
      if (!factorResult) continue;

      const matrixBefore = cloneMatrix(augmentedMatrix);

      for (let c = col; c < augCols; c++) {
        const pivotColCell = createFraction(augmentedMatrix[col][c].num, augmentedMatrix[col][c].den);
        const product = multiplyFractions(factorResult, pivotColCell);
        const current = createFraction(augmentedMatrix[row][c].num, augmentedMatrix[row][c].den);
        const diff = subtractFractions(current, product);
        augmentedMatrix[row][c] = { num: diff.num, den: diff.den };
      }

      const matrixAfter = cloneMatrix(augmentedMatrix);
      const factorStr = fractionToString(factorResult.num, factorResult.den);
      steps.push(createStep(
        'Eliminación hacia adelante',
        `F${row + 1} → F${row + 1} - (${factorStr})F${col + 1}`,
        matrixBefore,
        matrixAfter,
        'steps.forward_elimination',
        false
      ));
    }
  }

  const solution: { num: number; den: number }[] = Array(numCols).fill(null).map(() => ({ num: 0, den: 1 }));

  for (let row = numRows - 1; row >= 0; row--) {
    let pivotCol = -1;
    for (let col = 0; col < numCols; col++) {
      if (!isZero(augmentedMatrix[row][col].num, augmentedMatrix[row][col].den)) {
        pivotCol = col;
        break;
      }
    }

    if (pivotCol === -1) {
      const bCell = augmentedMatrix[row][numCols];
      if (!isZero(bCell.num, bCell.den)) {
        return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
      }
      continue;
    }

    let sum = createFraction(augmentedMatrix[row][numCols].num, augmentedMatrix[row][numCols].den);
    for (let col = pivotCol + 1; col < numCols; col++) {
      const solCol = createFraction(solution[col].num, solution[col].den);
      const matCell = createFraction(augmentedMatrix[row][col].num, augmentedMatrix[row][col].den);
      const product = multiplyFractions(solCol, matCell);
      sum = addFractions(sum, product);
    }

    const diff = subtractFractions(sum, createFraction(augmentedMatrix[row][pivotCol].num, augmentedMatrix[row][pivotCol].den));
    if (isZero(diff.num, diff.den)) continue;

    const pivot = createFraction(augmentedMatrix[row][pivotCol].num, augmentedMatrix[row][pivotCol].den);
    const result = divideFractions(diff, pivot);
    if (!result) {
      return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
    }

    solution[pivotCol] = { num: result.num, den: result.den };
  }

  let pivotColCount = 0;
  for (let row = 0; row < numRows; row++) {
    let found = false;
    for (let col = 0; col < numCols; col++) {
      if (!isZero(augmentedMatrix[row][col].num, augmentedMatrix[row][col].den)) {
        found = true;
        break;
      }
    }
    if (found) pivotColCount++;
  }

  const hasInfiniteSolutions = pivotColCount < numCols;

  return {
    steps,
    solution: solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: false,
    hasInfiniteSolutions: hasInfiniteSolutions,
  };
}