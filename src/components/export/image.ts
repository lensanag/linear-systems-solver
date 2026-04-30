import html2canvas from 'html2canvas';
import type { SolveResult } from '@/engines/shared/types';

interface ExportData {
  method: string;
  dimensions: { rows: number; cols: number };
  result: SolveResult;
}

/**
 * Wait for all KaTeX elements to finish rendering before proceeding.
 * This ensures fractions and other math elements are properly laid out
 * when html2canvas captures the content.
 */
async function waitForKaTeXRender(element: HTMLElement, maxWaitMs: number = 5000): Promise<void> {
  return new Promise((resolve) => {
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

    // Timeout fallback
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

export async function exportToImage(elementId: string, data: ExportData): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // Wait for KaTeX to render before capturing
  await waitForKaTeXRender(element);

  // Small additional delay to ensure DOM is fully settled
  await new Promise(resolve => setTimeout(resolve, 100));

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
