export function fractionToLatex(num: number, den: number): string {
  if (den === 1) {
    return num.toString();
  }
  return `\\frac{${num}}{${den}}`;
}

export function cellToLatex(cell: { type: string; num?: number; den?: number; latex?: string }): string {
  if (cell.type === 'fraction' && cell.num !== undefined && cell.den !== undefined) {
    return fractionToLatex(cell.num, cell.den);
  }
  if (cell.type === 'symbolic' && cell.latex) {
    return cell.latex;
  }
  return '0';
}

export function matrixToLatex(matrix: any[][], headers: string[]): string {
  const numCols = headers.length + 1;
  let latex = '\\begin{bmatrix}';

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < numCols; c++) {
      const cell = matrix[r][c];
      latex += cellToLatex(cell);
      if (c < numCols - 1) latex += ' & ';
    }
    if (r < matrix.length - 1) latex += ' \\\\n';
  }

  latex += '\\end{bmatrix}';
  return latex;
}
