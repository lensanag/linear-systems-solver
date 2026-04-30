import type { MethodId, EngineMode } from '@/engines/shared/types';
import { cn } from '@/components/matrix/MatrixInput';

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
    <div className="flex flex-wrap gap-2 mb-4" id="method-selector">
      {METHODS.map((method) => {
        const disabled = isMethodDisabled(method.id);
        const isSelected = selectedMethod === method.id;
        return (
          <button
            key={method.id}
            onClick={() => !disabled && onSelect(method.id)}
            disabled={disabled}
            title={disabled ? getTooltip(method.id) : ''}
            className={cn(
              'px-3 py-2 rounded border text-sm font-medium transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            )}
          >
            {method.labelKey}
            {disabled && <span className="ml-1 text-xs">ⓘ</span>}
          </button>
        );
      })}
    </div>
  );
}
