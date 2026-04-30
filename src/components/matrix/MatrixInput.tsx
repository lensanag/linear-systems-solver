import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';
import { Plus, X, Trash2, Columns, Rows3 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CellInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function CellInput({ value, onChange, error, disabled }: CellInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-16 h-9 px-2 text-center text-sm text-text-primary border border-border rounded bg-surface',
        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
        error ? 'border-red-400 bg-red-50' : '',
        disabled && 'bg-muted cursor-not-allowed'
      )}
    />
  );
}

interface HeaderCellProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function HeaderCell({ value, onChange, error }: HeaderCellProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={5}
      className={cn(
        'w-14 h-7 px-1 text-center text-xs text-text-primary border border-border rounded bg-muted',
        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
        error ? 'border-red-400 bg-red-50' : ''
      )}
    />
  );
}

interface MatrixInputProps {
  coefficients: string[][];
  headers: string[];
  onCoefficientChange: (row: number, col: number, value: string) => void;
  onHeaderChange: (index: number, value: string) => void;
  onAddRow: () => void;
  onAddCol: () => void;
  onRemoveRow: (index: number) => void;
  onRemoveCol: (index: number) => void;
}

export function MatrixInput({
  coefficients,
  headers,
  onCoefficientChange,
  onHeaderChange,
  onAddRow,
  onAddCol,
  onRemoveRow,
  onRemoveCol,
}: MatrixInputProps) {
  const { t } = useTranslation();
  const numCoeffCols = headers.length;

  return (
    <div className="overflow-x-auto pb-2">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-8 p-1"></th>
            {headers.map((header, i) => (
              <th key={i} className="p-1">
                <div className="flex flex-col items-center gap-1">
                  <HeaderCell
                    value={header}
                    onChange={(v) => onHeaderChange(i, v)}
                  />
                  <button
                    onClick={() => onRemoveCol(i)}
                    className="text-text-muted hover:text-red-500 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50"
                    title={t('matrix.removeCol')}
                  >
                    <X size={12} />
                  </button>
                </div>
              </th>
            ))}
            <th className="p-1 text-text-secondary text-xs font-normal italic">b</th>
            <th className="w-8 p-1"></th>
          </tr>
        </thead>
        <tbody>
          {coefficients.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="p-1 text-text-secondary text-xs text-center font-mono">
                {rowIndex + 1}
              </td>
              {row.slice(0, numCoeffCols).map((cell, colIndex) => (
                <td key={colIndex} className="p-1">
                  <CellInput
                    value={cell}
                    onChange={(v) => onCoefficientChange(rowIndex, colIndex, v)}
                  />
                </td>
              ))}
              <td className="p-1 text-text-muted text-sm font-bold">|</td>
              <td className="p-1">
                <CellInput
                  value={row[numCoeffCols] || ''}
                  onChange={(v) => onCoefficientChange(rowIndex, numCoeffCols, v)}
                />
              </td>
              <td className="p-1">
                <button
                  onClick={() => onRemoveRow(rowIndex)}
                  className="text-text-muted hover:text-red-500 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50"
                  title={t('matrix.removeRow')}
                >
                  <X size={12} />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td className="p-1"></td>
            <td colSpan={numCoeffCols + 2} className="p-1">
              <div className="flex gap-2">
                <button
                  onClick={onAddRow}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary bg-muted border border-border hover:border-primary hover:text-primary rounded"
                >
                  <Rows3 size={12} />
                  {t('matrix.addRow')}
                </button>
                <button
                  onClick={onAddCol}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary bg-muted border border-border hover:border-primary hover:text-primary rounded"
                >
                  <Columns size={12} />
                  {t('matrix.addCol')}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}