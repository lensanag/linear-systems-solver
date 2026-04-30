import { useEffect, useRef } from 'react';
import type { Step, Cell } from '@/engines/shared/types';
import { fractionToLatex } from '@/engines/numeric/parser';
import katex from 'katex';
import { useTranslation } from 'react-i18next';

interface StepPanelProps {
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;
  headers?: string[];
}

function CellRenderer({ cell }: { cell: Cell }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      let latex: string;
      if (cell.type === 'fraction') {
        latex = fractionToLatex(cell.num, cell.den);
      } else {
        latex = cell.latex;
      }
      try {
        katex.render(latex, ref.current, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        ref.current.textContent = latex;
      }
    }
  }, [cell]);

  return <span ref={ref} className="font-mono" />;
}

function MatrixRenderer({ matrix }: { matrix: Cell[][] }) {
  return (
    <div className="my-2">
      <table className="border-collapse mx-auto">
        <tbody>
          {matrix.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-gray-400 px-2 py-1 text-center">
                  <CellRenderer cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StepPanel({
  steps,
  solution,
  hasNoSolution,
  hasInfiniteSolutions,
  headers = []
}: StepPanelProps) {
  const { t } = useTranslation();

  if (steps.length === 0 && !solution) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t('stepPanel.placeholder')}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{t('stepPanel.title')}</h2>

      {hasNoSolution && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded text-red-700">
          {t('results.noSolution')}
        </div>
      )}

      {hasInfiniteSolutions && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded text-yellow-700">
          {t('results.infiniteSolutions')}
        </div>
      )}

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {index + 1}
              </span>
              <h3 className="font-semibold">{step.phase}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">{step.operationLabel}</p>
            <MatrixRenderer matrix={step.matrixAfter} />
          </div>
        ))}
      </div>

      {solution && !hasNoSolution && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded">
          <h3 className="font-bold text-green-800 mb-2">{t('stepPanel.solution')}</h3>
          <div className="flex flex-wrap gap-4">
            {solution.map((cell, i) => (
              <div key={i} className="text-lg">
                {headers[i] && <span className="mr-2">{headers[i]} =</span>}
                <CellRenderer cell={cell} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
