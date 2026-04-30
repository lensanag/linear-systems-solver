import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SolveResult } from '@/engines/shared/types';

interface ExportData {
  method: string;
  dimensions: { rows: number; cols: number };
  headers: string[];
  result: SolveResult;
  language: 'es' | 'en';
}

export async function exportToPDF(elementId: string, data: ExportData): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const isSpanish = data.language === 'es';

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgWidth = pageWidth - 2 * margin;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const { rows, cols } = data.dimensions;
  const timestamp = Date.now();
  pdf.save(`sistema_${rows}x${cols}_${data.method}_${timestamp}.pdf`);
}

export function showPDFWarning(isSpanish: boolean): boolean {
  return window.confirm(
    isSpanish
      ? 'La exportación PDF es aproximada. El renderizado puede diferir del original. ¿Continuar?'
      : 'PDF export is approximate. Rendering may differ from the original. Continue?'
  );
}
