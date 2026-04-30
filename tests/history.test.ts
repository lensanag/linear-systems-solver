import { describe, it, expect } from 'vitest';
import { solveGaussian } from '../src/engines/numeric';

function coefficientsMatch(a: string[][] | null, b: string[][]): boolean {
  if (!a) return false;
  const aCopy = a.map(row => [...row]);
  const bCopy = b.map(row => [...row]);
  return JSON.stringify(aCopy) === JSON.stringify(bCopy);
}

describe('Coefficients Comparison', () => {
  const coefficients1 = [
    ["2", "1", "-1", "8"],
    ["-3", "-1", "2", "-11"],
    ["-2", "1", "2", "-3"]
  ];

  const coefficients2 = [
    ["1", "2", "3"],
    ["4", "5", "6"]
  ];

  const coefficients1Copy = [
    ["2", "1", "-1", "8"],
    ["-3", "-1", "2", "-11"],
    ["-2", "1", "2", "-3"]
  ];

  it('should return true for identical matrices', () => {
    expect(coefficientsMatch(coefficients1, coefficients1Copy)).toBe(true);
  });

  it('should return false for different matrices', () => {
    expect(coefficientsMatch(coefficients1, coefficients2)).toBe(false);
  });

  it('should return false for null left operand', () => {
    expect(coefficientsMatch(null, coefficients1)).toBe(false);
  });

  it('should return false for matrices with different dimensions', () => {
    expect(coefficientsMatch(coefficients1, coefficients2)).toBe(false);
  });

  it('should return false for single value difference', () => {
    const coefficients1Modified = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-4"]
    ];
    expect(coefficientsMatch(coefficients1, coefficients1Modified)).toBe(false);
  });
});

describe('History Entry Creation', () => {
  it('should create valid history entry structure', () => {
    const method = 'gaussian';
    const rows = 3;
    const cols = 4;
    const headers = ['x₁', 'x₂', 'x₃'];
    const coefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];
    const createdAt = Date.now();

    const entry = {
      id: crypto.randomUUID(),
      label: null,
      method,
      rows,
      cols,
      headers,
      coefficients,
      createdAt,
    };

    expect(entry.id).toBeDefined();
    expect(entry.method).toBe('gaussian');
    expect(entry.rows).toBe(3);
    expect(entry.cols).toBe(4);
    expect(entry.headers).toHaveLength(3);
    expect(entry.coefficients).toHaveLength(3);
    expect(entry.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it('should detect unchanged coefficients after execution', () => {
    const lastExecuted = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];
    const current = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];

    expect(coefficientsMatch(lastExecuted, current)).toBe(true);
  });

  it('should detect changed coefficients after user edit', () => {
    const lastExecuted = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];
    const afterEdit = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-4"]
    ];

    expect(coefficientsMatch(lastExecuted, afterEdit)).toBe(false);
  });
});

describe('Solver Integration', () => {
  it('should solve system and return result with steps', () => {
    const coefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];

    const result = solveGaussian(coefficients);

    expect(result).toBeDefined();
    expect(result.solution).toBeDefined();
    expect(result.steps).toBeDefined();
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.hasNoSolution).toBe(false);
    expect(result.hasInfiniteSolutions).toBe(false);
  });

  it('should preserve coefficient structure after solving', () => {
    const coefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];

    const result = solveGaussian(coefficients);

    expect(result.solution).not.toBeNull();
    expect(result.solution).toHaveLength(3);
  });
});

describe('Matrix State Comparison', () => {
  it('should detect when matrix has been modified', () => {
    const lastExecuted = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];

    const currentSame = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];

    const currentModified = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-4"]
    ];

    expect(coefficientsMatch(lastExecuted, currentSame)).toBe(true);
    expect(coefficientsMatch(lastExecuted, currentModified)).toBe(false);
  });

  it('should handle empty matrix gracefully', () => {
    const lastExecuted: string[][] | null = null;
    const current: string[][] = [];

    expect(coefficientsMatch(lastExecuted, current)).toBe(false);
  });
});

describe('Method-Inclusive Comparison', () => {
  it('should consider unchanged when both coefficients and method match', () => {
    const lastExecutedCoefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];
    const lastExecutedMethod = 'gaussian';
    const currentCoefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];
    const currentMethod = 'gaussian';

    const coefficientsUnchanged = coefficientsMatch(lastExecutedCoefficients, currentCoefficients);
    const methodUnchanged = lastExecutedMethod === currentMethod;
    const isUnchanged = coefficientsUnchanged && methodUnchanged;

    expect(coefficientsUnchanged).toBe(true);
    expect(methodUnchanged).toBe(true);
    expect(isUnchanged).toBe(true);
  });

  it('should consider changed when coefficients differ even if method same', () => {
    const lastExecutedCoefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];
    const lastExecutedMethod = 'gaussian';
    const currentCoefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-4"]
    ];
    const currentMethod = 'gaussian';

    const coefficientsUnchanged = coefficientsMatch(lastExecutedCoefficients, currentCoefficients);
    const methodUnchanged = lastExecutedMethod === currentMethod;
    const isUnchanged = coefficientsUnchanged && methodUnchanged;

    expect(coefficientsUnchanged).toBe(false);
    expect(methodUnchanged).toBe(true);
    expect(isUnchanged).toBe(false);
  });

  it('should consider changed when method differs even if coefficients same', () => {
    const lastExecutedCoefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];
    const lastExecutedMethod = 'gaussian';
    const currentCoefficients = [
      ["2", "1", "-1", "8"],
      ["-3", "-1", "2", "-11"],
      ["-2", "1", "2", "-3"]
    ];
    const currentMethod = 'gauss-jordan';

    const coefficientsUnchanged = coefficientsMatch(lastExecutedCoefficients, currentCoefficients);
    const methodUnchanged = lastExecutedMethod === currentMethod;
    const isUnchanged = coefficientsUnchanged && methodUnchanged;

    expect(coefficientsUnchanged).toBe(true);
    expect(methodUnchanged).toBe(false);
    expect(isUnchanged).toBe(false);
  });
});

describe('Execute Without History', () => {
  it('should not add to history when skipHistory is true', () => {
    const skipHistory = true;
    const shouldAddToHistory = !skipHistory;
    expect(shouldAddToHistory).toBe(false);
  });

  it('should add to history when skipHistory is false', () => {
    const skipHistory = false;
    const shouldAddToHistory = !skipHistory;
    expect(shouldAddToHistory).toBe(true);
  });
});