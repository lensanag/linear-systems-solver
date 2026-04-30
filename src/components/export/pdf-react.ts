import { pdf } from '@react-pdf/renderer';
import React from 'react';
import type { SolveResult, Cell } from '@/engines/shared/types';

interface ExportData {
  method: string;
  dimensions: { rows: number; cols: number };
  headers: string[];
  result: SolveResult;
  coefficients: string[][];
  language: 'es' | 'en';
}

/**
 * Generate a PDF using @react-pdf/renderer
 * This approach avoids html2canvas limitations and provides crisp, vector-based output.
 */
export async function generatePDFReact(data: ExportData): Promise<Blob> {
  // Dynamically import to avoid bundling issues on non-browser environments
  const { PDFDocument } = await import('./PDFDocument');

  const isSpanish = data.language === 'es';
  const title = isSpanish
    ? 'Solución de Sistema de Ecuaciones Lineales'
    : 'Linear System Solution';

  const methodNames: Record<string, string> = {
    gaussian: isSpanish ? 'Eliminación Gaussiana' : 'Gaussian Elimination',
    'gauss-jordan': isSpanish ? 'Gauss-Jordan' : 'Gauss-Jordan',
    cramer: isSpanish ? 'Regla de Cramer' : "Cramer's Rule",
    inverse: isSpanish ? 'Matriz Inversa' : 'Inverse Matrix',
    lu: isSpanish ? 'Descomposición LU' : 'LU Decomposition',
  };

  const methodName = methodNames[data.method] || data.method;

  // Convert string[][] coefficients to Cell[][] format
  const initialMatrix: Cell[][] | undefined = data.coefficients.map((row) =>
    row.map((cell) => ({
      type: 'value' as const,
      latex: cell,
    }))
  );

  // Create the PDF document
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

  // Generate PDF blob
  const blob = await pdf(doc).toBlob();
  return blob;
}

/**
 * Export to PDF using @react-pdf/renderer
 */
export async function exportToPDFReact(data: ExportData): Promise<void> {
  try {
    const blob = await generatePDFReact(data);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const { rows, cols } = data.dimensions;
    const timestamp = Date.now();
    link.download = `sistema_${rows}x${cols}_${data.method}_${timestamp}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}

/**
 * Show a warning before PDF export (informing about limitations)
 */
export function showPDFWarning(isSpanish: boolean): boolean {
  return window.confirm(
    isSpanish
      ? 'La exportación PDF renderizará las matrices en formato texto. ¿Continuar?'
      : 'PDF export will render matrices as text. Continue?'
  );
}
