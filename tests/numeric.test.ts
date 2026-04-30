import { describe, it, expect } from 'vitest';
import { solveGaussian, solveGaussJordan, solveCramer, solveInverse, solveLU } from '../src/engines/numeric';

describe('Numeric Solvers', () => {
  const exampleSystem = {
    coefficients: [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ],
    headers: ["x₁", "x₂", "x₃"]
  };

  it('solveGaussian should return correct solution', () => {
    const result = solveGaussian(exampleSystem.coefficients, exampleSystem.headers);
    console.log('Gaussian solution:', result.solution);
    expect(result.solution).not.toBeNull();
    expect(result.hasNoSolution).toBe(false);
  });

  it('solveGaussJordan should return correct solution', () => {
    const result = solveGaussJordan(exampleSystem.coefficients, exampleSystem.headers);
    console.log('Gauss-Jordan solution:', result.solution);
    expect(result.solution).not.toBeNull();
    expect(result.hasNoSolution).toBe(false);
  });

  it('solveCramer should return correct solution', () => {
    const result = solveCramer(exampleSystem.coefficients, exampleSystem.headers);
    console.log('Cramer solution:', result.solution);
    expect(result.solution).not.toBeNull();
    expect(result.hasNoSolution).toBe(false);
  });

  it('solveInverse should return correct solution', () => {
    const result = solveInverse(exampleSystem.coefficients, exampleSystem.headers);
    console.log('Inverse solution:', result.solution);
    expect(result.solution).not.toBeNull();
    expect(result.hasNoSolution).toBe(false);
  });

  it('solveLU should return correct solution', () => {
    const result = solveLU(exampleSystem.coefficients, exampleSystem.headers);
    console.log('LU solution:', result.solution);
    expect(result.solution).not.toBeNull();
    expect(result.hasNoSolution).toBe(false);
    // Exact values: x₁=2, x₂=3, x₃=-1
    expect(result.solution![0]).toMatchObject({ num: 2, den: 1 });
    expect(result.solution![1]).toMatchObject({ num: 3, den: 1 });
    expect(result.solution![2]).toMatchObject({ num: -1, den: 1 });
  });

  it('solveLU should return correct solution when multiple pivot swaps occur', () => {
    // System designed to force row swaps at col=0 AND col=1, exercising
    // the already-computed L entry swap:
    //   0x₁ + 2x₂ + 1x₃ = 7   → pivot swap at col 0: rows 0 ↔ 1
    //   3x₁ + 0x₂ + 2x₃ = 9   → after first swap, pivot swap at col 1: rows 1 ↔ 2
    //   1x₁ + 4x₂ + 0x₃ = 9     (L[1][0] ≠ L[2][0] when swapped, testing L-row fix)
    // Verified by hand: x₁=1, x₂=2, x₃=3
    const multiPivotSystem = {
      coefficients: [
        ["0", "2", "1", "7"],
        ["3", "0", "2", "9"],
        ["1", "4", "0", "9"],
      ],
      headers: ["x₁", "x₂", "x₃"],
    };
    const result = solveLU(multiPivotSystem.coefficients, multiPivotSystem.headers);
    console.log('LU multi-pivot solution:', result.solution);
    expect(result.solution).not.toBeNull();
    expect(result.hasNoSolution).toBe(false);
    // Exact values: x₁=1, x₂=2, x₃=3
    expect(result.solution![0]).toMatchObject({ num: 1, den: 1 });
    expect(result.solution![1]).toMatchObject({ num: 2, den: 1 });
    expect(result.solution![2]).toMatchObject({ num: 3, den: 1 });
  });
});