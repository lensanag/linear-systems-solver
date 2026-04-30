import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import type { SolveResult, Example } from '@/engines/shared/types';
import { useTranslation } from 'react-i18next';
import { SolverPanel } from '@/components/solver/SolverPanel';
import { StepPanel } from '@/components/solver/StepPanel';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { ExampleSelector } from '@/components/tutorial/ExampleSelector';
import { ExportMenu } from '@/components/export/ExportMenu';
import { TourGuide } from '@/components/tutorial/TourGuide';

export function AppContent() {
  const { t, i18n } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentResult, setCurrentResult] = useState<SolveResult | null>(null);

  const { addToHistory, setLanguage, coefficients, rows, cols, headers, mode, method, paramSymbol } = useStore();

  const currentLanguage = i18n.language === 'en' ? 'en' : 'es';

  const handleLanguageChange = (lang: 'es' | 'en') => {
    setLanguage(lang);
  };

  const handleSolve = useCallback((result: SolveResult) => {
    setCurrentResult(result);

    const entry = {
      id: crypto.randomUUID(),
      label: null,
      mode,
      method,
      rows,
      cols,
      headers,
      coefficients,
      paramSymbol,
      createdAt: Date.now(),
    };
    addToHistory(entry);
  }, [addToHistory, mode, method, rows, cols, headers, coefficients, paramSymbol]);

  const handleExampleSelect = (example: Example) => {
    const store = useStore.getState();
    store.setMode(example.mode);
    store.setMethod(example.method);
    store.setDimensions(example.dimensions.rows, example.dimensions.cols);
    store.setHeaders(example.headers);
    if (example.paramSymbol) {
      store.setParamSymbol(example.paramSymbol);
    }
    example.coefficients.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        store.setCoefficient(ri, ci, cell);
      });
    });
    setShowExamples(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">{t('app.title')}</h1>
          <div className="flex items-center gap-4">
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value as 'es' | 'en')}
              className="px-2 py-1 border rounded"
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="container mx-auto flex gap-2 p-2">
          <button
            onClick={() => setShowTour(true)}
            className="px-4 py-2 rounded font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
          >
            {currentLanguage === 'es' ? 'Tutorial' : 'Tutorial'}
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 rounded font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            id="history-tab"
          >
            {t('history.title')}
          </button>
          <button
            onClick={() => setShowExamples(true)}
            className="px-4 py-2 rounded font-medium bg-green-100 text-green-700 hover:bg-green-200"
          >
            {currentLanguage === 'es' ? 'Ejemplos' : 'Examples'}
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow" id="matrix-editor">
            <SolverPanel onSolve={handleSolve} />
          </div>
          <div className="bg-white rounded-lg shadow" id="step-panel">
            <div id="solution-preview">
              <StepPanel
                headers={headers}
                steps={currentResult?.steps || []}
                solution={currentResult?.solution || null}
                hasNoSolution={currentResult?.hasNoSolution || false}
                hasInfiniteSolutions={currentResult?.hasInfiniteSolutions || false}
              />
            </div>
            {currentResult && (
              <div className="px-4 pb-4" id="export-menu">
                <ExportMenu result={currentResult} />
              </div>
            )}
          </div>
        </div>
      </main>

      <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <ExampleSelector
        isOpen={showExamples}
        onClose={() => setShowExamples(false)}
        onSelect={handleExampleSelect}
      />
      <TourGuide
        isActive={showTour}
        onComplete={() => setShowTour(false)}
        onExit={() => setShowTour(false)}
      />
    </div>
  );
}
