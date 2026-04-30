import { useStore } from '@/store/useStore';
import { solveGaussian, solveGaussJordan, solveCramer, solveInverse, solveLU } from '@/engines/numeric';
import { solveSymbolicGaussian, solveSymbolicGaussJordan } from '@/engines/symbolic';
import { runSymPySolve } from '@/utils/pyodideLoader';
import type { SolveResult, MethodId, EngineMode } from '@/engines/shared/types';
import { useTranslation } from 'react-i18next';
import { MatrixInput } from '@/components/matrix/MatrixInput';
import { Play, RotateCcw } from 'lucide-react';

interface SolverPanelProps {
  onSolve: (result: SolveResult) => void;
  onClean?: () => void;
}

const METHODS: { id: MethodId; labelKey: string; icon: string; modes: EngineMode[] }[] = [
  { id: 'gaussian', labelKey: 'methods.gaussian', icon: 'G', modes: ['numeric', 'symbolic'] },
  { id: 'gauss-jordan', labelKey: 'methods.gauss-jordan', icon: 'GJ', modes: ['numeric', 'symbolic'] },
  { id: 'cramer', labelKey: 'methods.cramer', icon: 'Cr', modes: ['numeric'] },
  { id: 'inverse', labelKey: 'methods.inverse', icon: 'Inv', modes: ['numeric'] },
  { id: 'lu', labelKey: 'methods.lu', icon: 'LU', modes: ['numeric'] },
];

export function SolverPanel({ onSolve, onClean }: SolverPanelProps) {
  const { t } = useTranslation();
  const {
    mode,
    method,
    headers,
    coefficients,
    paramSymbol,
    setMode,
    setMethod,
    addRow,
    addCol,
    removeRow,
    removeCol,
    setCoefficient,
    setHeaders,
    setParamSymbol,
    setResult,
    setLoading,
    isLoading,
    pyodideLoaded,
    resetMatrix,
  } = useStore();

  const numRows = coefficients.length;
  const numCols = coefficients[0]?.length ?? 3;
  const isSquare = numRows === numCols - 1;

  const handleExecute = async () => {
    if (!method) {
      alert(t('validation.selectMethod'));
      return;
    }

    setLoading(true);

    try {
      let result: SolveResult;

      if (mode === 'numeric') {
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
      } else {
        if (!paramSymbol) {
          alert(t('validation.enterParamSymbol'));
          setLoading(false);
          return;
        }

        if (pyodideLoaded) {
          try {
            result = await runSymPySolve(coefficients, headers, paramSymbol);
          } catch (sympyError) {
            console.warn('Pyodide/SymPy failed, falling back to basic symbolic:', sympyError);
            switch (method) {
              case 'gaussian':
                result = solveSymbolicGaussian(coefficients, headers, paramSymbol);
                break;
              case 'gauss-jordan':
                result = solveSymbolicGaussJordan(coefficients, headers, paramSymbol);
                break;
              default:
                result = { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
            }
          }
        } else {
          switch (method) {
            case 'gaussian':
              result = solveSymbolicGaussian(coefficients, headers, paramSymbol);
              break;
            case 'gauss-jordan':
              result = solveSymbolicGaussJordan(coefficients, headers, paramSymbol);
              break;
            default:
              result = { steps: [], solution: null, hasNoSolution: false, hasInfiniteSolutions: false };
          }
        }
      }

      setResult(result);
      onSolve(result);
    } catch (error) {
      console.error('Error solving system:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClean = () => {
    resetMatrix();
    onClean?.();
  };

  const isMethodDisabled = (methodId: MethodId): boolean => {
    if (!isSquare && (methodId === 'cramer' || methodId === 'inverse' || methodId === 'lu')) {
      return true;
    }
    if (mode === 'symbolic' && methodId !== 'gaussian' && methodId !== 'gauss-jordan') {
      return true;
    }
    return false;
  };

  return (
    <div className="p-5">
      <div className="mb-5" id="mode-selector">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-sm font-medium ${mode === 'numeric' ? 'text-primary' : 'text-text-secondary'}`}>
              {t('modes.numeric')}
            </span>
            <button
              onClick={() => setMode(mode === 'numeric' ? 'symbolic' : 'numeric')}
              className={`
                relative w-12 h-6 rounded-full border transition-colors flex-shrink-0
                ${mode === 'numeric' ? 'bg-primary border-primary' : 'bg-secondary border-secondary'}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
                  ${mode === 'numeric' ? '' : 'translate-x-6'}
                `}
              />
            </button>
            <span className={`text-sm font-medium ${mode === 'symbolic' ? 'text-primary' : 'text-text-secondary'}`}>
              {t('modes.symbolic')}
            </span>
          </div>

          {mode === 'symbolic' && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <label className="text-xs text-text-secondary">{t('solverPanel.parameter')}:</label>
              <input
                type="text"
                value={paramSymbol}
                onChange={(e) => setParamSymbol(e.target.value.slice(0, 5))}
                maxLength={5}
                className="w-12 px-2 py-1 border border-border rounded text-center text-sm text-text-primary focus:border-primary focus:outline-none bg-surface"
                placeholder="a"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mb-4" id="method-selector">
        <label className="text-xs text-text-secondary uppercase tracking-wide mb-2 block">{t('methodSelector.title')}</label>
        <div className="grid grid-cols-5 gap-2">
          {METHODS.map((m) => {
            const disabled = isMethodDisabled(m.id);
            const isSelected = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => !disabled && setMethod(m.id)}
                disabled={disabled}
                title={disabled ? (m.modes.length === 1 ? t('methodSelector.squareRequired') : t('methodSelector.notAvailableSymbolic')) : ''}
                className={`
                  relative p-2 border text-center transition-all
                  ${isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : disabled
                    ? 'bg-muted text-text-muted border-border cursor-not-allowed opacity-70'
                    : 'bg-surface text-text-secondary border-border hover:border-primary hover:text-primary'
                  }
                `}
              >
                <span className="text-xs font-mono font-bold">{m.icon}</span>
                <span className="block text-[10px] mt-0.5 truncate">{t(m.labelKey)}</span>
                {disabled && m.modes.length === 1 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary text-white text-[8px] rounded-full flex items-center justify-center">!</span>
                )}
              </button>
            );
          })}
        </div>
        {!isSquare && (
          <p className="text-xs text-text-muted mt-2">{t('methodSelector.squareHint')}</p>
        )}
      </div>

      <div className="mt-5">
        <MatrixInput
          coefficients={coefficients}
          headers={headers}
          onCoefficientChange={setCoefficient}
          onHeaderChange={(i, v) => {
            const newHeaders = [...headers];
            newHeaders[i] = v;
            setHeaders(newHeaders);
          }}
          onAddRow={addRow}
          onAddCol={addCol}
          onRemoveRow={removeRow}
          onRemoveCol={removeCol}
        />
      </div>

      <div className="mt-5 flex gap-3">
        <button
          id="solve-button"
          onClick={handleExecute}
          disabled={isLoading || !method}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium border border-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={16} />
          {isLoading ? t('solverPanel.calculating') : t('actions.execute')}
        </button>
        <button
          id="clean-button"
          onClick={handleClean}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white text-sm font-medium border border-orange-600 hover:bg-orange-600"
        >
          <RotateCcw size={16} />
          {t('actions.clear')}
        </button>
      </div>
    </div>
  );
}