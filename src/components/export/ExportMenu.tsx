import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { showPDFWarning, exportToPDF } from './pdf';
import { showImageWarning, exportToImage } from './image';
import { downloadLatex } from './latex';
import type { SolveResult } from '@/engines/shared/types';
import { useTranslation } from 'react-i18next';

interface ExportMenuProps {
  result: SolveResult | null;
  previewElementId?: string;
}

export function ExportMenu({ result, previewElementId = 'solution-preview' }: ExportMenuProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { method, rows, cols, headers, coefficients } = useStore();

  const language = i18n.language === 'en' ? 'en' : 'es';

  if (!result) return null;

  const handleExportPDF = async () => {
    if (!showPDFWarning(language === 'es')) return;
    try {
      await exportToPDF(previewElementId, {
        method: method || 'unknown',
        dimensions: { rows, cols },
        headers,
        result,
        language,
      });
    } catch (error) {
      console.error('PDF export failed:', error);
    }
    setIsOpen(false);
  };

  const handleExportImage = async () => {
    if (!showImageWarning(language === 'es')) return;
    try {
      await exportToImage(previewElementId, {
        method: method || 'unknown',
        dimensions: { rows, cols },
        result,
      });
    } catch (error) {
      console.error('Image export failed:', error);
    }
    setIsOpen(false);
  };

  const handleExportLatex = () => {
    downloadLatex({
      method: method || 'unknown',
      dimensions: { rows, cols },
      headers,
      coefficients,
      result,
      language,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-xs bg-surface border border-border text-secondary hover:border-primary hover:text-primary flex items-center gap-1"
      >
        {t('exportMenu.export')}
        <span className="text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-surface border border-border shadow-sm z-50">
          <button
            onClick={handleExportPDF}
            className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 border-b border-border"
          >
            {t('exportMenu.pdf')}
          </button>
          <button
            onClick={handleExportImage}
            className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 border-b border-border"
          >
            {t('exportMenu.png')}
          </button>
          <button
            onClick={handleExportLatex}
            className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
          >
            {t('exportMenu.latex')}
          </button>
        </div>
      )}
    </div>
  );
}