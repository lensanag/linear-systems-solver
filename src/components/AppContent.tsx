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
import { usePyodide } from '@/hooks/usePyodide';

export function AppContent() {
  usePyodide();
  const { t, i18n } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentResult, setCurrentResult] = useState<SolveResult | null>(null);

  const { addToHistory, setLanguage, coefficients, headers, mode, method, paramSymbol } = useStore();

  const rows = coefficients.length;
  const cols = coefficients[0]?.length ?? 3;

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
    store.setHeaders(example.headers);
    store.setCoefficients(example.coefficients);
    if (example.paramSymbol) {
      store.setParamSymbol(example.paramSymbol);
    }
    setShowExamples(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('app.title')}</h1>
              <p className="text-xs text-secondary mt-0.5">Linear Systems Solver</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as 'es' | 'en')}
                className="px-2 py-1 border border-border rounded text-sm text-secondary bg-surface"
              >
                <option value="es">ES</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-surface border-b border-border">
        <div className="container mx-auto px-4 flex gap-1 py-1.5">
          <button
            onClick={() => setShowTour(true)}
            className="px-3 py-1.5 text-sm font-medium text-secondary hover:text-primary hover:bg-gray-50 rounded"
          >
            {currentLanguage === 'es' ? 'Tutorial' : 'Tutorial'}
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1.5 text-sm font-medium text-secondary hover:text-primary hover:bg-gray-50 rounded"
            id="history-tab"
          >
            {t('history.title')}
          </button>
          <button
            onClick={() => setShowExamples(true)}
            className="px-3 py-1.5 text-sm font-medium text-secondary hover:text-primary hover:bg-gray-50 rounded"
          >
            {currentLanguage === 'es' ? 'Ejemplos' : 'Examples'}
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="bg-surface border border-border" id="matrix-editor">
            <SolverPanel onSolve={handleSolve} />
          </div>
          <div className="bg-surface border border-border relative" id="step-panel">
            <div id="solution-preview">
              {currentResult && (
                <div className="absolute top-3 right-3 z-10" id="export-menu">
                  <ExportMenu result={currentResult} />
                </div>
              )}
              <StepPanel
                headers={headers}
                steps={currentResult?.steps || []}
                solution={currentResult?.solution || null}
                hasNoSolution={currentResult?.hasNoSolution || false}
                hasInfiniteSolutions={currentResult?.hasInfiniteSolutions || false}
              />
            </div>
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