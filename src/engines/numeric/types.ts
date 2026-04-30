export interface NumericCell {
  num: number;
  den: number;
}

export function createNumericCell(num: number, den: number): NumericCell {
  return { num, den };
}

export function cloneMatrix(matrix: NumericCell[][]): NumericCell[][] {
  return matrix.map((row) => row.map((cell) => ({ ...cell })));
}