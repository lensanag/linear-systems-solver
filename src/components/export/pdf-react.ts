import { pdf } from '@react-pdf/renderer';
import React from 'react';
import type { Cell } from '@/engines/shared/types';
import { parseFraction, createFractionCell } from '@/engines/numeric/parser';

interface ExportData {
  method: string;
  dimensions: { rows: number; cols: number };
  headers: string[];
  result: {
    steps: import('@/engines/shared/types').Step[];
    solution: Cell[] | null;
    hasNoSolution: boolean;
    hasInfiniteSolutions: boolean;
  };
  coefficients: string[][];
  language: 'es' | 'en';
}

/**
 * Parse a coefficient string (e.g. "3", "-1/2", "0") into a FractionCell.
 * parseFraction returns null for "0" (its quirk), so we handle that explicitly.
 */
function parseCoeff(str: string): Cell {
  const s = str.trim();
  if (s === '0' || s === '') return createFractionCell(0, 1);
  const parsed = parseFraction(s);
  return parsed ? createFractionCell(parsed.num, parsed.den) : createFractionCell(0, 1);
}

export async function generatePDFReact(data: ExportData): Promise<Blob> {
  const { PDFDocument } = await import('./PDFDocument');

  const isSpanish = data.language === 'es';

  const title = isSpanish
    ? 'Solución de Sistema de Ecuaciones Lineales'
    : 'Linear System Solution';

  const methodNames: Record<string, string> = {
    gaussian:     isSpanish ? 'Eliminación Gaussiana' : 'Gaussian Elimination',
    'gauss-jordan': 'Gauss-Jordan',
    cramer:       isSpanish ? 'Regla de Cramer' : "Cramer's Rule",
    inverse:      isSpanish ? 'Matriz Inversa' : 'Inverse Matrix',
    lu:           isSpanish ? 'Descomposición LU' : 'LU Decomposition',
  };

  const methodName = methodNames[data.method] || data.method;

  // Build initial matrix as proper FractionCell[][]
  const initialMatrix: Cell[][] = data.coefficients.map((row) =>
    row.map((s) => parseCoeff(s))
  );

  const doc = React.createElement(PDFDocument, {
    title,
    method: methodName,
    steps: data.result.steps,
    solution: data.result.solution,
    hasNoSolution: data.result.hasNoSolution,
    hasInfiniteSolutions: data.result.hasInfiniteSolutions,
    headers: data.headers,
    dimensions: data.dimensions,
    initialMatrix,
    date: new Date().toLocaleDateString(isSpanish ? 'es-ES' : 'en-US'),
  });

  return await pdf(doc).toBlob();
}

export async function exportToPDFReact(data: ExportData): Promise<void> {
  const blob = await generatePDFReact(data);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const { rows, cols } = data.dimensions;
  link.download = `sistema_${rows}x${cols}_${data.method}_${Date.now()}.pdf`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function showPDFWarning(isSpanish: boolean): boolean {
  return window.confirm(
    isSpanish
      ? '¿Exportar como PDF? Esto generará un documento con todos los pasos y la solución.'
      : 'Export as PDF? This will generate a document with all steps and the solution.'
  );
}
