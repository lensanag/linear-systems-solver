import { useStore } from '@/store/useStore';
import { solveGaussian, solveGaussJordan, solveCramer, solveInverse, solveLU } from '@/engines/numeric';
import type { SolveResult, MethodId } from '@/engines/shared/types';
import { useTranslation } from 'react-i18next';
import { MatrixInput } from '@/components/matrix/MatrixInput';
import { Play, RotateCcw, Check } from 'lucide-react';

interface SolverPanelProps {
  onSolve: (result: SolveResult, skipHistory?: boolean) => void;
  onClean?: () => void;
}

const METHODS: { id: MethodId; labelKey: string; icon: string }[] = [
  { id: 'gaussian', labelKey: 'methods.gaussian', icon: 'G' },
  { id: 'gauss-jordan', labelKey: 'methods.gauss-jordan', icon: 'GJ' },
  { id: 'cramer', labelKey: 'methods.cramer', icon: 'Cr' },
  { id: 'inverse', labelKey: 'methods.inverse', icon: 'Inv' },
  { id: 'lu', labelKey: 'methods.lu', icon: 'LU' },
];

function coefficientsMatch(a: string[][] | null, b: string[][]): boolean {
  if (!a) return false;
  const aCopy = a.map(row => [...row]);
  const bCopy = b.map(row => [...row]);
  return JSON.stringify(aCopy) === JSON.stringify(bCopy);
}

export function SolverPanel({ onSolve, onClean }: SolverPanelProps) {
  const { t } = useTranslation();
  const {
    method,
    headers,
    coefficients,
    lastExecutedCoefficients,
    lastExecutedMethod,
    setMethod,
    addRow,
    addCol,
    removeRow,
    removeCol,
    setCoefficient,
    setHeaders,
    setResult,
    setLoading,
    isLoading,
    resetMatrix,
  } = useStore();

  const numRows = coefficients.length;
  const numCols = coefficients[0]?.length ?? 3;
  const isSquare = numRows === numCols - 1;

  const hasExecuted = lastExecutedCoefficients !== null &&
    coefficientsMatch(lastExecutedCoefficients, coefficients) &&
    lastExecutedMethod === method;
  const isUnchanged = hasExecuted;

  const handleExecute = async () => {
    if (!method) {
      alert(t('validation.selectMethod'));
      return;
    }

    setLoading(true);

    try {
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

      setResult(result, coefficients, method);
      onSolve(result, false);
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
    return false;
  };

  return (
    <div className="p-5">
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
                title={disabled ? t('methodSelector.squareRequired') : ''}
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
                {disabled && (
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
          disabled={isLoading || !method || isUnchanged}
          className={`
            flex items-center gap-2 px-6 py-2.5 text-sm font-medium border
            ${isUnchanged && method
              ? 'bg-green-500 border-green-600 text-white cursor-not-allowed'
              : isLoading || !method
              ? 'bg-primary border-primary text-white opacity-50 cursor-not-allowed'
              : 'bg-primary border-primary text-white hover:bg-primary-dark'
            }
          `}
          title={isUnchanged ? 'Matrix unchanged since last execution' : ''}
        >
          {isUnchanged && method ? (
            <>
              <Check size={16} />
              {t('actions.executed')}
            </>
          ) : (
            <>
              <Play size={16} />
              {isLoading ? t('solverPanel.calculating') : t('actions.execute')}
            </>
          )}
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