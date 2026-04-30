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

  return <span ref={ref} className="font-mono text-sm text-text-primary" />;
}

function MatrixRenderer({ matrix }: { matrix: Cell[][] }) {
  return (
    <div className="my-3">
      <table className="border-collapse mx-auto">
        <tbody>
          {matrix.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-border px-2 py-1 text-center text-sm min-w-[40px]">
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
      <div className="p-8 text-center text-text-secondary">
        {t('stepPanel.placeholder')}
      </div>
    );
  }

  const getStepPhase = (step: Step): string => {
    if (step.descriptionKey) {
      const translated = t(step.descriptionKey);
      if (translated !== step.descriptionKey) {
        return translated;
      }
    }
    return step.phase;
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">{t('stepPanel.title')}</h2>

      {hasNoSolution && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {t('results.noSolution')}
        </div>
      )}

      {hasInfiniteSolutions && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-medium">
          {t('results.infiniteSolutions')}
        </div>
      )}

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="border border-border p-4 bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-secondary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {index + 1}
              </span>
              <h3 className="font-semibold text-sm text-text-primary">{getStepPhase(step)}</h3>
            </div>
            <p className="text-xs text-text-secondary mb-2 font-mono">{step.operationLabel}</p>
            <MatrixRenderer matrix={step.matrixAfter} />
          </div>
        ))}
      </div>

      {solution && !hasNoSolution && (
        <div className="mt-5 p-4 bg-secondary/10 border border-secondary/30">
          <h3 className="font-bold text-sm text-text-primary mb-2">{t('stepPanel.solution')}</h3>
          <div className="flex flex-wrap gap-4">
            {solution.map((cell, i) => (
              <div key={i} className="text-sm">
                <span className="text-text-primary font-medium mr-1">{headers[i]} =</span>
                <CellRenderer cell={cell} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}