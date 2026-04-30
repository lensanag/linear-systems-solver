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
  initialMatrix?: string[][];
  method?: string;
}

function parseCoefficient(value: string): Cell {
  const trimmed = value.trim();
  if (trimmed.includes('/')) {
    const [num, den] = trimmed.split('/');
    return { type: 'fraction', num: num.trim(), den: den.trim(), latex: '' };
  }
  return { type: 'value', latex: trimmed };
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
  headers = [],
  initialMatrix,
  method
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

  const initialMatrixAsCells: Cell[][] | null = initialMatrix
    ? initialMatrix.map(row => row.map(cell => parseCoefficient(cell)))
    : null;

  const methodName = method ? t(`methods.${method}`, { defaultValue: method }) : null;

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
        {initialMatrixAsCells && (
          <div className="border border-border p-4 bg-muted border-l-4 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                0
              </span>
              <h3 className="font-semibold text-sm text-text-primary">
                {t('stepPanel.initialMatrix')}
              </h3>
            </div>
            <p className="text-xs text-text-secondary mb-2 font-mono">
              {t('stepPanel.initialMatrixDesc')}
            </p>
            <MatrixRenderer matrix={initialMatrixAsCells} />
          </div>
        )}
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

      {methodName && (
        <div className="mt-4 p-3 bg-muted border border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </span>
            <h3 className="font-semibold text-sm text-text-primary">{t('stepPanel.metadata')}</h3>
          </div>
          <p className="text-xs text-text-secondary">
            <span className="font-medium">{t('stepPanel.methodUsed')}:</span> {methodName}
          </p>
        </div>
      )}
    </div>
  );
}