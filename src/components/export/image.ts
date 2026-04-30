import html2canvas from 'html2canvas';
import type { SolveResult } from '@/engines/shared/types';

interface ExportData {
  method: string;
  dimensions: { rows: number; cols: number };
  result: SolveResult;
}

export async function exportToImage(elementId: string, data: ExportData): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  const { rows, cols } = data.dimensions;
  const timestamp = Date.now();
  link.download = `sistema_${rows}x${cols}_${data.method}_${timestamp}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function showImageWarning(isSpanish: boolean): boolean {
  return window.confirm(
    isSpanish
      ? 'La exportación de imagen es aproximada. ¿Continuar?'
      : 'Image export is approximate. Continue?'
  );
}
