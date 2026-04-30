import type { SolveResult, Cell } from '@/engines/shared/types';
import { fractionToLatex } from '@/engines/numeric/parser';

interface ExportData {
  method: string;
  dimensions: { rows: number; cols: number };
  headers: string[];
  coefficients: string[][];
  result: SolveResult;
  language: 'es' | 'en';
}

function cellToLatex(cell: Cell): string {
  if (cell.type === 'fraction') {
    return fractionToLatex(cell.num, cell.den);
  }
  return cell.latex;
}

function matrixToLatex(matrix: Cell[][], headers: string[]): string {
  const numCols = headers.length + 1;
  let latex = '\\begin{bmatrix}\n';

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < numCols; c++) {
      latex += cellToLatex(matrix[r][c]);
      if (c < numCols - 1) latex += ' & ';
    }
    if (r < matrix.length - 1) latex += ' \\\\n';
  }

  latex += '\n\\end{bmatrix}';
  return latex;
}

export function generateLatexDocument(data: ExportData): string {
  const { method, dimensions, headers, coefficients, result, language } = data;
  const isSpanish = language === 'es';

  const methodNames: Record<string, string> = {
    gaussian: isSpanish ? 'Eliminacion Gaussiana' : 'Gaussian Elimination',
    'gauss-jordan': isSpanish ? 'Gauss-Jordan' : 'Gauss-Jordan',
    cramer: isSpanish ? 'Regla de Cramer' : "Cramer's Rule",
    inverse: isSpanish ? 'Matriz Inversa' : 'Inverse Matrix',
    lu: isSpanish ? 'Descomposicion LU' : 'LU Decomposition',
  };

  const methodName = methodNames[method] || method;
  const date = new Date().toLocaleDateString(isSpanish ? 'es-ES' : 'en-US');

  const title = isSpanish ? 'Solucion de Sistema de Ecuaciones Lineales' : 'Linear System Solution';
  const originalSystem = isSpanish ? 'Sistema Original' : 'Original System';
  const methodLabel = isSpanish ? 'Metodo' : 'Method';
  const solutionSteps = isSpanish ? 'Pasos de la Solucion' : 'Solution Steps';
  const solutionLabel = isSpanish ? 'Solucion' : 'Solution';
  const resultLabel = isSpanish ? 'Resultado' : 'Result';
  const noSolution = isSpanish ? 'El sistema no tiene solucion (es inconsistente).' : 'The system has no solution (is inconsistent).';
  const infiniteSolutions = isSpanish ? 'El sistema tiene infinitas soluciones.' : 'The system has infinitely many solutions.';
  const metadataLabel = isSpanish ? 'Metadata' : 'Metadata';
  const dimensionLabel = isSpanish ? 'Dimension' : 'Dimension';
  const dateLabel = isSpanish ? 'Fecha' : 'Date';
  const stepLabel = isSpanish ? 'Paso' : 'Step';

  let latex = '\\documentclass{article}\n';
  latex += '\\usepackage{amsmath}\n';
  latex += '\\usepackage{amssymb}\n';
  latex += '\\usepackage[utf8]{inputenc}\n';
  latex += '\\usepackage{hyperref}\n';
  latex += '\\usepackage{geometry}\n';
  latex += '\\geometry{margin=1in}\n\n';
  latex += '\\title{' + title + '}\n';
  latex += '\\author{Linear Systems Solver}\n';
  latex += '\\date{' + date + '}\n\n';
  latex += '\\begin{document}\n\n';
  latex += '\\maketitle\n\n';
  latex += '\\section{' + originalSystem + '}\n\n';

  latex += '\\begin{alignat}{' + dimensions.cols + '}{}\n';
  for (let r = 0; r < dimensions.rows; r++) {
    let equation = '';
    for (let c = 0; c < dimensions.cols; c++) {
      const coeff = coefficients[r][c] || '0';
      if (c === 0) {
        equation += coeff === '1' ? headers[c] : coeff === '-1' ? '-' + headers[c] : coeff + headers[c];
      } else {
        equation += coeff.startsWith('-') ? ' - ' + coeff.slice(1) + headers[c] : ' + ' + coeff + headers[c];
      }
    }
    equation += ' = ' + (coefficients[r][dimensions.cols] || '0');
    latex += '  ' + equation + ' \\\\n';
  }
  latex += '\\end{alignat}\n\n';

  latex += '\\section{' + methodLabel + '}\n';
  latex += methodName + '\n\n';

   if (result.steps.length > 0) {
     latex += '\\section{' + solutionSteps + '}\n\n';

     result.steps.forEach((step, index) => {
       latex += '\\subsection*{' + stepLabel + ' ' + (index + 1) + '}\n';
       latex += '\\noindent\\textbf{' + step.phase + '}\n\n';
       latex += '\\noindent\\textit{' + step.operationLabel + '}\n\n';
       latex += '\\[\n' + matrixToLatex(step.matrixAfter, headers) + '\n\\]\n\n';
     });
   }

  if (result.solution && !result.hasNoSolution) {
    latex += '\\section{' + solutionLabel + '}\n\n';

    if (result.hasInfiniteSolutions) {
      latex += infiniteSolutions + '\\newline\n';
    }

     latex += '\\begin{align*}\n';
     result.solution.forEach((cell, i) => {
       latex += '  ' + headers[i] + ' &= ' + cellToLatex(cell);
       if (i < result.solution!.length - 1) latex += ' \\\\\n';
     });
     latex += '\n\\end{align*}\n\n';
  } else if (result.hasNoSolution) {
    latex += '\\section{' + resultLabel + '}\n';
    latex += noSolution + '\\newline\n';
  }

  latex += '\\section{' + metadataLabel + '}\n';
  latex += '\\begin{itemize}\n';
  latex += '\\item ' + methodLabel + ': ' + methodName + '\n';
  latex += '\\item ' + dimensionLabel + ': ' + dimensions.rows + 'x' + dimensions.cols + '\n';
  latex += '\\item ' + dateLabel + ': ' + date + '\n';
  latex += '\\end{itemize}\n\n';

  latex += '\\end{document}\n';

  return latex;
}

export function downloadLatex(data: ExportData): void {
  const latex = generateLatexDocument(data);
  const blob = new Blob([latex], { type: 'text/x-latex' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const { rows, cols } = data.dimensions;
  const timestamp = Date.now();
  a.download = 'sistema_' + rows + 'x' + cols + '_' + data.method + '_' + timestamp + '.tex';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
