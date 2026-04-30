import type { Step, SolveResult } from '@/engines/shared/types';
import {
  parseFraction,
  createFractionCell,
  normalizeFraction,
  multiplyFractions,
  addFractions,
  subtractFractions,
  divideFractions,
  isZero,
  createFraction,
} from './parser';

interface NumericCell {
  num: number;
  den: number;
}

function createNumericCell(num: number, den: number): NumericCell {
  return { num, den };
}

function cloneMatrix(matrix: NumericCell[][]): NumericCell[][] {
  return matrix.map((row) => row.map((cell) => ({ ...cell })));
}

function createMatrixFromStrings(
  coefficients: string[][],
  numCols: number
): NumericCell[][] | null {
  const result: NumericCell[][] = [];
  for (const row of coefficients) {
    const numericRow: NumericCell[] = [];
    for (let c = 0; c < numCols; c++) {
      const cell = row[c];
      if (!cell || cell.trim() === '') {
        numericRow.push({ num: 0, den: 1 });
      } else {
        const parsed = parseFraction(cell);
        if (!parsed) return null;
        numericRow.push({ num: parsed.num, den: parsed.den });
      }
    }
    result.push(numericRow);
  }
  return result;
}

export function solveGaussian(
  coefficients: string[][],
  headers: string[]
): SolveResult {
  const numRows = coefficients.length;
  const numCols = headers.length;
  const augCols = numCols + 1;

  const matrix = createMatrixFromStrings(coefficients, augCols);
  if (!matrix) {
    return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
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
      steps.push({
        phase: 'Pivoting',
        operationLabel: `F${col + 1} ↔ F${pivotRow + 1}`,
        matrixBefore: matrixBefore.map(row => row.map(c => createFractionCell(c.num, c.den))),
        matrixAfter: matrixAfter.map(row => row.map(c => createFractionCell(c.num, c.den))),
        descriptionKey: 'steps.pivoting.swap',
        isKeyStep: true,
      });
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
        const normalized = normalizeFraction(diff.num, diff.den);
        augmentedMatrix[row][c] = { num: normalized.num, den: normalized.den };
      }

      const matrixAfter = cloneMatrix(augmentedMatrix);
      const factorStr = factorResult.den === 1 ? factorResult.num.toString() : `${factorResult.num}/${factorResult.den}`;
      steps.push({
        phase: 'Eliminación hacia adelante',
        operationLabel: `F${row + 1} → F${row + 1} - (${factorStr})F${col + 1}`,
        matrixBefore: matrixBefore.map(row => row.map(c => createFractionCell(c.num, c.den))),
        matrixAfter: matrixAfter.map(row => row.map(c => createFractionCell(c.num, c.den))),
        descriptionKey: 'steps.forward_elimination',
        isKeyStep: false,
      });
    }
  }

  const solution: NumericCell[] = Array(numCols).fill(null).map(() => ({ num: 0, den: 1 }));

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

    const normalized = normalizeFraction(result.num, result.den);
    solution[pivotCol] = { num: normalized.num, den: normalized.den };
  }

  let hasInfiniteSolutions = false;
  for (let col = 0; col < numCols; col++) {
    if (solution[col].num === 0 && solution[col].den === 1) {
      hasInfiniteSolutions = true;
      break;
    }
  }

  return {
    steps,
    solution: solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: false,
    hasInfiniteSolutions: hasInfiniteSolutions,
  };
}

export function solveGaussJordan(
  coefficients: string[][],
  headers: string[]
): SolveResult {
  const numRows = coefficients.length;
  const numCols = headers.length;
  const augCols = numCols + 1;

  const matrix = createMatrixFromStrings(coefficients, augCols);
  if (!matrix) {
    return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
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
      steps.push({
        phase: 'Pivoting',
        operationLabel: `F${currentRow + 1} ↔ F${pivotRow + 1}`,
        matrixBefore: matrixBefore.map(row => row.map(c => createFractionCell(c.num, c.den))),
        matrixAfter: matrixAfter.map(row => row.map(c => createFractionCell(c.num, c.den))),
        descriptionKey: 'steps.pivoting.swap',
        isKeyStep: true,
      });
    }

    const pivotCell = createFraction(augmentedMatrix[currentRow][col].num, augmentedMatrix[currentRow][col].den);
    const pivotInverse = divideFractions(createFraction(1, 1), pivotCell);
    if (!pivotInverse) continue;

    if (pivotInverse.num !== 1 || pivotInverse.den !== 1) {
      const matrixBefore = cloneMatrix(augmentedMatrix);
      for (let c = 0; c < augCols; c++) {
        const cell = createFraction(augmentedMatrix[currentRow][c].num, augmentedMatrix[currentRow][c].den);
        const product = multiplyFractions(pivotInverse, cell);
        const normalized = normalizeFraction(product.num, product.den);
        augmentedMatrix[currentRow][c] = { num: normalized.num, den: normalized.den };
      }
      const matrixAfter = cloneMatrix(augmentedMatrix);
      const pivotStr = pivotInverse.den === 1 ? pivotInverse.num.toString() : `${pivotInverse.num}/${pivotInverse.den}`;
      steps.push({
        phase: 'Normalización del pivote',
        operationLabel: `F${currentRow + 1} → (${pivotStr})F${currentRow + 1}`,
        matrixBefore: matrixBefore.map(row => row.map(c => createFractionCell(c.num, c.den))),
        matrixAfter: matrixAfter.map(row => row.map(c => createFractionCell(c.num, c.den))),
        descriptionKey: 'steps.normalize_pivot',
        isKeyStep: true,
      });
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
        const normalized = normalizeFraction(sum.num, sum.den);
        augmentedMatrix[row][c] = { num: normalized.num, den: normalized.den };
      }

      const matrixAfter = cloneMatrix(augmentedMatrix);
      const factorStr = factor.den === 1 ? factor.num.toString() : `${factor.num}/${factor.den}`;
      steps.push({
        phase: 'Eliminación hacia atrás',
        operationLabel: `F${row + 1} → F${row + 1} + (${factorStr})F${currentRow + 1}`,
        matrixBefore: matrixBefore.map(row => row.map(c => createFractionCell(c.num, c.den))),
        matrixAfter: matrixAfter.map(row => row.map(c => createFractionCell(c.num, c.den))),
        descriptionKey: 'steps.backward_elimination',
        isKeyStep: false,
      });
    }

    currentRow++;
  }

  const solution: NumericCell[] = Array(numCols).fill(null).map(() => ({ num: 0, den: 1 }));

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

export function solveCramer(
  coefficients: string[][],
  headers: string[]
): SolveResult {
  const numRows = coefficients.length;
  const numCols = headers.length;
  const augCols = numCols + 1;

  if (numRows !== numCols) {
    return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
  }

  const matrix = createMatrixFromStrings(coefficients, augCols);
  if (!matrix) {
    return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
  }

  const steps: Step[] = [];
  const coeffMatrix: NumericCell[][] = matrix.map(row => row.slice(0, numCols) as NumericCell[]);
  const bVector: NumericCell[] = matrix.map(row => row[numCols] as NumericCell);

  const detA = calculateDeterminant(coeffMatrix);
  if (isZero(detA.num, detA.den)) {
    return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
  }

  const solution: NumericCell[] = [];
  for (let col = 0; col < numCols; col++) {
    const modifiedMatrix: NumericCell[][] = [];
    for (let r = 0; r < numRows; r++) {
      const newRow: NumericCell[] = [];
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
    const normalized = normalizeFraction(result.num, result.den);
    solution.push({ num: normalized.num, den: normalized.den });
  }

  return {
    steps,
    solution: solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}

function calculateDeterminant(matrix: NumericCell[][]): NumericCell {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];

  if (n === 2) {
    const a = createFraction(matrix[0][0].num, matrix[0][0].den);
    const b = createFraction(matrix[0][1].num, matrix[0][1].den);
    const c = createFraction(matrix[1][0].num, matrix[1][0].den);
    const d = createFraction(matrix[1][1].num, matrix[1][1].den);
    const ad = multiplyFractions(a, d);
    const bc = multiplyFractions(b, c);
    const diff = subtractFractions(ad, bc);
    const normalized = normalizeFraction(diff.num, diff.den);
    return { num: normalized.num, den: normalized.den };
  }

  let det = createFraction(0, 1);
  for (let col = 0; col < n; col++) {
    const subMatrix: NumericCell[][] = [];
    for (let row = 1; row < n; row++) {
      const newRow: NumericCell[] = [];
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

  const normalized = normalizeFraction(det.num, det.den);
  return { num: normalized.num, den: normalized.den };
}

export function solveInverse(
  coefficients: string[][],
  headers: string[]
): SolveResult {
  const numRows = coefficients.length;
  const numCols = headers.length;
  const augCols = numCols + 1;

  if (numRows !== numCols) {
    return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
  }

  const matrix = createMatrixFromStrings(coefficients, augCols);
  if (!matrix) {
    return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
  }

  const steps: Step[] = [];
  const coeffMatrix: NumericCell[][] = matrix.map(row => row.slice(0, numCols) as NumericCell[]);
  const bVector: NumericCell[] = matrix.map(row => row[numCols] as NumericCell);

  const detA = calculateDeterminant(coeffMatrix);
  if (isZero(detA.num, detA.den)) {
    return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
  }

  const inverseMatrix = calculateInverse(coeffMatrix);
  if (!inverseMatrix) {
    return { steps, solution: null, hasNoSolution: true, hasInfiniteSolutions: false };
  }

  const solution: NumericCell[] = [];
  for (let row = 0; row < numRows; row++) {
    let sum = createFraction(0, 1);
    for (let col = 0; col < numCols; col++) {
      const invCell = createFraction(inverseMatrix[row][col].num, inverseMatrix[row][col].den);
      const bCell = createFraction(bVector[col].num, bVector[col].den);
      const product = multiplyFractions(invCell, bCell);
      sum = addFractions(sum, product);
    }
    const normalized = normalizeFraction(sum.num, sum.den);
    solution.push({ num: normalized.num, den: normalized.den });
  }

  return {
    steps,
    solution: solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}

function calculateInverse(matrix: NumericCell[][]): NumericCell[][] | null {
  const n = matrix.length;
  const augmented: NumericCell[][] = matrix.map((row, i) => {
    const identityRow: NumericCell[] = Array(n).fill(null).map((_, j) =>
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
      const normalized = normalizeFraction(product.num, product.den);
      augmented[col][c] = { num: normalized.num, den: normalized.den };
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
        const normalized = normalizeFraction(diff.num, diff.den);
        augmented[row][c] = { num: normalized.num, den: normalized.den };
      }
    }
  }

  return augmented.map(row => row.slice(n));
}

export function solveLU(
  coefficients: string[][],
  headers: string[]
): SolveResult {
  const numRows = coefficients.length;
  const numCols = headers.length;
  const augCols = numCols + 1;

  if (numRows !== numCols) {
    return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
  }

  const matrix = createMatrixFromStrings(coefficients, augCols);
  if (!matrix) {
    return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
  }

  const steps: Step[] = [];
  const coeffMatrix: NumericCell[][] = matrix.map(row => row.slice(0, numCols) as NumericCell[]);
  const bVector: NumericCell[] = matrix.map(row => row[numCols] as NumericCell);

  const n = numRows;
  const U: NumericCell[][] = Array(n).fill(null).map(() => Array(n).fill(createNumericCell(0, 1)));
  const L: NumericCell[][] = Array(n).fill(null).map((_, i) =>
    Array(n).fill(null).map((_, j) => createNumericCell(i === j ? 1 : 0, 1))
  );

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

    // Compute U for column col (all rows from col to n-1)
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

    // Compute L for column col (rows below diagonal)
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

  // Forward substitution: L*y = b
  const yVector: NumericCell[] = Array(n).fill(createNumericCell(0, 1));
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

  // Back substitution: U*x = y
  const solution: NumericCell[] = Array(n).fill(createNumericCell(0, 1));
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
    const normalized = normalizeFraction(divisor.num, divisor.den);
    solution[row] = { num: normalized.num, den: normalized.den };
  }

  return {
    steps,
    solution: solution.map(c => createFractionCell(c.num, c.den)),
    hasNoSolution: false,
    hasInfiniteSolutions: false,
  };
}
