import type { NumericCell } from './types';
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
import { createNumericCell } from './types';

export function createMatrixFromStrings(
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

export function createStep(
  phase: string,
  operationLabel: string,
  matrixBefore: NumericCell[][],
  matrixAfter: NumericCell[][],
  descriptionKey: string,
  isKeyStep: boolean
): Step {
  return {
    phase,
    operationLabel,
    matrixBefore: matrixBefore.map(row => row.map(c => createFractionCell(c.num, c.den))),
    matrixAfter: matrixAfter.map(row => row.map(c => createFractionCell(c.num, c.den))),
    descriptionKey,
    isKeyStep,
  };
}

export function createEmptyResult(): SolveResult {
  return { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
}

export function fractionToString(num: number, den: number): string {
  return den === 1 ? num.toString() : `${num}/${den}`;
}

export {
  createFractionCell,
  normalizeFraction,
  multiplyFractions,
  addFractions,
  subtractFractions,
  divideFractions,
  isZero,
  createFraction,
  createNumericCell as makeNumericCell,
};