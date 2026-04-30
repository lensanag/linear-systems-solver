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

/**
 * Wait for all KaTeX elements to finish rendering before proceeding.
 * This ensures fractions and other math elements are properly laid out
 * when html2canvas captures the content.
 */
async function waitForKaTeXRender(element: HTMLElement, maxWaitMs: number = 5000): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Check if KaTeX elements exist
    const checkKaTeX = () => {
      const katexElements = element.querySelectorAll('.katex');
      if (katexElements.length > 0) {
        resolve();
        return true;
      }
      return false;
    };

    // Initial check
    if (checkKaTeX()) return;

    // Use MutationObserver to detect when KaTeX renders
    const observer = new MutationObserver(() => {
      if (checkKaTeX()) {
        observer.disconnect();
      }
    });

    observer.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'data-katex'],
    });

    // Timeout fallback (KaTeX should render quickly, but have a safety net)
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      resolve();
    }, maxWaitMs);

    // Also resolve if we detect KaTeX after a short delay
    setTimeout(() => {
      if (checkKaTeX()) {
        clearTimeout(timeoutId);
        observer.disconnect();
      }
    }, 100);
  });
}

export async function exportToPDF(elementId: string, data: ExportData): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const isSpanish = data.language === 'es';

  // Wait for KaTeX to render before capturing
  await waitForKaTeXRender(element);

  // Small additional delay to ensure DOM is fully settled
  await new Promise(resolve => setTimeout(resolve, 100));

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
