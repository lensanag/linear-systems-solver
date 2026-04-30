import type { MethodId, EngineMode } from '@/engines/shared/types';

const METHODS: { id: MethodId; labelKey: string }[] = [
  { id: 'gaussian', labelKey: 'methods.gaussian' },
  { id: 'gauss-jordan', labelKey: 'methods.gauss-jordan' },
  { id: 'cramer', labelKey: 'methods.cramer' },
  { id: 'inverse', labelKey: 'methods.inverse' },
  { id: 'lu', labelKey: 'methods.lu' },
];

interface MethodSelectorProps {
  mode: EngineMode;
  rows: number;
  cols: number;
  selectedMethod: MethodId | null;
  onSelect: (method: MethodId) => void;
}

export function MethodSelector({ mode, rows, cols, selectedMethod, onSelect }: MethodSelectorProps) {
  const isSquare = rows === cols - 1;
  const isNumeric = mode === 'numeric';

  const isMethodDisabled = (methodId: MethodId): boolean => {
    if (!isSquare && (methodId === 'cramer' || methodId === 'inverse' || methodId === 'lu')) {
      return true;
    }
    if (!isNumeric && methodId !== 'gaussian' && methodId !== 'gauss-jordan') {
      return true;
    }
    return false;
  };

  const getTooltip = (methodId: MethodId): string => {
    if (!isSquare && (methodId === 'cramer' || methodId === 'inverse' || methodId === 'lu')) {
      return 'Este método solo aplica a sistemas cuadrados';
    }
    if (!isNumeric && methodId !== 'gaussian' && methodId !== 'gauss-jordan') {
      return 'Este método no está disponible en modo simbólico';
    }
    return '';
  };

  return (
    <div className="flex flex-wrap gap-1" id="method-selector">
      {METHODS.map((method) => {
        const disabled = isMethodDisabled(method.id);
        const isSelected = selectedMethod === method.id;
        return (
          <button
            key={method.id}
            onClick={() => !disabled && onSelect(method.id)}
            disabled={disabled}
            title={disabled ? getTooltip(method.id) : ''}
            className={`
              px-3 py-1.5 text-sm border transition-colors
              ${isSelected
                ? 'bg-primary text-white border-primary'
                : disabled
                ? 'bg-gray-50 text-secondary-light cursor-not-allowed border-border'
                : 'bg-surface text-secondary border-border hover:bg-gray-50 hover:border-secondary-light'
              }
            `}
          >
            {method.labelKey}
          </button>
        );
      })}
    </div>
  );
}