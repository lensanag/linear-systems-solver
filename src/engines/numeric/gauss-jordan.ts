import type { Step, SolveResult } from '@/engines/shared/types';
import { createMatrixFromStrings, createStep, createEmptyResult } from './utils';
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

function fractionToString(num: number, den: number): string {
  return den === 1 ? num.toString() : `${num}/${den}`;
}

export function solveGaussJordan(coefficients: string[][]): SolveResult {
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

  let currentRow = 0;
  for (let col = 0; col < numCols && currentRow < numRows; col++) {
    let pivotRow = -1;
    for (let row = currentRow; row < numRows; row++) {
      if (!isZero(augmentedMatrix[row][col].num, augmentedMatrix[row][col].den)) {
        pivotRow = row;
        break;
      }
    }

    if (pivotRow === -1) continue;

    if (pivotRow !== currentRow) {
      const matrixBefore = cloneMatrix(augmentedMatrix);
      [augmentedMatrix[currentRow], augmentedMatrix[pivotRow]] = [augmentedMatrix[pivotRow], augmentedMatrix[currentRow]];
      const matrixAfter = cloneMatrix(augmentedMatrix);
      steps.push(createStep(
        'Pivoting',
        `F${currentRow + 1} ↔ F${pivotRow + 1}`,
        matrixBefore,
        matrixAfter,
        'steps.pivoting.swap',
        true
      ));
    }

    const pivotCell = createFraction(augmentedMatrix[currentRow][col].num, augmentedMatrix[currentRow][col].den);
    const pivotInverse = divideFractions(createFraction(1, 1), pivotCell);
    if (!pivotInverse) continue;

    if (pivotInverse.num !== 1 || pivotInverse.den !== 1) {
      const matrixBefore = cloneMatrix(augmentedMatrix);
      for (let c = 0; c < augCols; c++) {
        const cell = createFraction(augmentedMatrix[currentRow][c].num, augmentedMatrix[currentRow][c].den);
        const product = multiplyFractions(pivotInverse, cell);
        augmentedMatrix[currentRow][c] = { num: product.num, den: product.den };
      }
      const matrixAfter = cloneMatrix(augmentedMatrix);
      const pivotStr = fractionToString(pivotInverse.num, pivotInverse.den);
      steps.push(createStep(
        'Normalización del pivote',
        `F${currentRow + 1} → (${pivotStr})F${currentRow + 1}`,
        matrixBefore,
        matrixAfter,
        'steps.normalize_pivot',
        true
      ));
    }

    for (let row = 0; row < numRows; row++) {
      if (row === currentRow) continue;

      const factorCell = createFraction(augmentedMatrix[row][col].num, augmentedMatrix[row][col].den);
      if (isZero(factorCell.num, factorCell.den)) continue;

      const matrixBefore = cloneMatrix(augmentedMatrix);
      const factor = multiplyFractions(createFraction(-1, 1), factorCell);

      for (let c = 0; c < augCols; c++) {
        const pivotRowCell = createFraction(augmentedMatrix[currentRow][c].num, augmentedMatrix[currentRow][c].den);
        const product = multiplyFractions(factor, pivotRowCell);
        const current = createFraction(augmentedMatrix[row][c].num, augmentedMatrix[row][c].den);
        const sum = addFractions(current, product);
        augmentedMatrix[row][c] = { num: sum.num, den: sum.den };
      }

      const matrixAfter = cloneMatrix(augmentedMatrix);
      const factorStr = fractionToString(factor.num, factor.den);
      steps.push(createStep(
        'Eliminación hacia atrás',
        `F${row + 1} → F${row + 1} + (${factorStr})F${currentRow + 1}`,
        matrixBefore,
        matrixAfter,
        'steps.backward_elimination',
        false
      ));
    }

    currentRow++;
  }

  const solution: { num: number; den: number }[] = Array(numCols).fill(null).map(() => ({ num: 0, den: 1 }));

  for (let col = 0; col < numCols; col++) {
    let found = false;
    for (let row = 0; row < numRows; row++) {
      if (!isZero(augmentedMatrix[row][col].num, augmentedMatrix[row][col].den)) {
        let isPivotCol = true;
        for (let r = 0; r < numRows; r++) {
          if (r !== row && !isZero(augmentedMatrix[r][col].num, augmentedMatrix[r][col].den)) {
            isPivotCol = false;
            break;
          }
        }
        if (isPivotCol) {
          solution[col] = augmentedMatrix[row][numCols];
          found = true;
          break;
        }
      }
    }
    if (!found) {
      solution[col] = { num: 0, den: 1 };
    }
  }

  let hasInfiniteSolutions = false;
  let hasNoSolution = false;
  for (let row = 0; row < numRows; row++) {
    let allZero = true;
    for (let col = 0; col < numCols; col++) {
      if (!isZero(augmentedMatrix[row][col].num, augmentedMatrix[row][col].den)) {
        allZero = false;
        break;
      }
    }
    if (allZero) {
      if (!isZero(augmentedMatrix[row][numCols].num, augmentedMatrix[row][numCols].den)) {
        hasNoSolution = true;
        break;
      }
    }
  }

  for (let col = 0; col < numCols; col++) {
    if (solution[col].num === 0 && solution[col].den === 1) {
      hasInfiniteSolutions = true;
      break;
    }
  }

  return {
    steps,
    solution: hasNoSolution ? null : solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: hasNoSolution,
    hasInfiniteSolutions,
  };
}