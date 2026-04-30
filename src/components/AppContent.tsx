import { useState, useCallback, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { solveGaussian, solveGaussJordan, solveCramer, solveInverse, solveLU } from '@/engines/numeric';
import type { SolveResult, Example, HistoryEntry } from '@/engines/shared/types';
import { useTranslation } from 'react-i18next';
import { SolverPanel } from '@/components/solver/SolverPanel';
import { StepPanel } from '@/components/solver/StepPanel';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { ExampleSelector } from '@/components/tutorial/ExampleSelector';
import { ExportMenu } from '@/components/export/ExportMenu';
import { TourGuide } from '@/components/tutorial/TourGuide';
import { AboutModal } from '@/components/AboutModal';

export function AppContent() {
  const { t, i18n } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentResult, setCurrentResult] = useState<SolveResult | null>(null);

  const { addToHistory, setLanguage, setMethod, setHeaders, setCoefficients, setResult, clearExecution, coefficients, headers, method } = useStore();

  const rows = coefficients.length;
  const cols = coefficients[0]?.length ?? 3;

  const currentLanguage = i18n.language === 'en' ? 'en' : 'es';

  const handleLanguageChange = (lang: 'es' | 'en') => {
    setLanguage(lang);
  };

  const solveSystem = useCallback((skipHistory = false) => {
    if (!method) return;

    let result: SolveResult;

    switch (method) {
      case 'gaussian':
        result = solveGaussian(coefficients);
        break;
      case 'gauss-jordan':
        result = solveGaussJordan(coefficients);
        break;
      case 'cramer':
        result = solveCramer(coefficients);
        break;
      case 'inverse':
        result = solveInverse(coefficients);
        break;
      case 'lu':
        result = solveLU(coefficients);
        break;
      default:
        result = { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
    }

    setResult(result);
    setCurrentResult(result);

    if (!skipHistory) {
      const entry = {
        id: crypto.randomUUID(),
        label: null,
        method,
        rows,
        cols,
        headers,
        coefficients,
        createdAt: Date.now(),
      };
      addToHistory(entry);
    }
  }, [method, coefficients, rows, cols, headers, addToHistory, setResult]);

  const handleSolve = useCallback((result: SolveResult, skipHistory = false) => {
    setCurrentResult(result);

    if (!skipHistory) {
      const { method: m, coefficients: c, headers: h } = useStore.getState();
      const r = c.length;
      const cols = c[0]?.length ?? 3;
      const entry = {
        id: crypto.randomUUID(),
        label: null,
        method: m,
        rows: r,
        cols,
        headers: h,
        coefficients: c,
        createdAt: Date.now(),
      };
      addToHistory(entry);
    }
  }, [addToHistory]);

  const handleRestore = (entry: HistoryEntry) => {
    const { clearExecution } = useStore.getState();
    setMethod(entry.method);
    setHeaders(entry.headers);
    setCoefficients(entry.coefficients);
    clearExecution();
    setShowHistory(false);
    setTimeout(() => {
      const { method: m, coefficients: c } = useStore.getState();
      if (!m) return;

      let result: SolveResult;
      switch (m) {
        case 'gaussian':
          result = solveGaussian(c);
          break;
        case 'gauss-jordan':
          result = solveGaussJordan(c);
          break;
        case 'cramer':
          result = solveCramer(c);
          break;
        case 'inverse':
          result = solveInverse(c);
          break;
        case 'lu':
          result = solveLU(c);
          break;
        default:
          result = { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
      }

      setResult(result, c, m);
      setCurrentResult(result);
    }, 0);
  };

  const handleExampleSelect = (example: Example) => {
    setMethod(example.method);
    setHeaders(example.headers);
    setCoefficients(example.coefficients);
    setShowExamples(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('app.title')}</h1>
              <p className="text-xs text-text-secondary mt-0.5">Linear Systems Solver</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as 'es' | 'en')}
                className="px-2 py-1 border border-border rounded text-sm text-text-secondary bg-surface"
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
            className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-muted rounded"
          >
            {currentLanguage === 'es' ? 'Tutorial' : 'Tutorial'}
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-muted rounded"
            id="history-tab"
          >
            {t('history.title')}
          </button>
          <button
            onClick={() => setShowExamples(true)}
            className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-muted rounded"
          >
            {currentLanguage === 'es' ? 'Ejemplos' : 'Examples'}
          </button>
          <button
            onClick={() => setShowAbout(true)}
            className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-muted rounded"
          >
            {currentLanguage === 'es' ? 'Acerca de' : 'About'}
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="bg-surface border border-border" id="matrix-editor">
            <SolverPanel onSolve={handleSolve} onClean={() => setCurrentResult(null)} />
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
                initialMatrix={coefficients}
                method={method}
              />
            </div>
          </div>
        </div>
      </main>

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={handleRestore}
      />
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
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}