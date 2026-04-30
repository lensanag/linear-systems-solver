import { useStore } from '@/store/useStore';
import { solveGaussian, solveGaussJordan, solveCramer, solveInverse, solveLU } from '@/engines/numeric';
import { solveSymbolicGaussian, solveSymbolicGaussJordan } from '@/engines/symbolic';
import { runSymPySolve } from '@/utils/pyodideLoader';
import type { SolveResult } from '@/engines/shared/types';
import { useTranslation } from 'react-i18next';
import { MatrixInput } from '@/components/matrix/MatrixInput';
import { MethodSelector } from '@/components/solver/MethodSelector';

interface SolverPanelProps {
  onSolve: (result: SolveResult) => void;
}

export function SolverPanel({ onSolve }: SolverPanelProps) {
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
  } = useStore();

  const numRows = coefficients.length;
  const numCols = coefficients[0]?.length ?? 3;

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

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4" id="mode-selector">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('numeric')}
            className={`px-4 py-2 rounded font-medium ${
              mode === 'numeric'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('modes.numeric')}
          </button>
          <button
            onClick={() => setMode('symbolic')}
            className={`px-4 py-2 rounded font-medium ${
              mode === 'symbolic'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('modes.symbolic')}
          </button>
        </div>

        {mode === 'symbolic' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{t('solverPanel.parameter')}:</label>
            <input
              type="text"
              value={paramSymbol}
              onChange={(e) => setParamSymbol(e.target.value.slice(0, 5))}
              maxLength={5}
              className="w-16 px-2 py-1 border rounded text-center"
              placeholder="a"
            />
          </div>
        )}
      </div>

      <MethodSelector
        mode={mode}
        rows={numRows}
        cols={numCols}
        selectedMethod={method}
        onSelect={setMethod}
      />

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

      <button
        id="solve-button"
        onClick={handleExecute}
        disabled={isLoading || !method}
        className="px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? t('solverPanel.calculating') : t('actions.execute')}
      </button>
    </div>
  );
}