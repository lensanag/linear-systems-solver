import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
        'w-20 h-10 px-2 text-center border rounded',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        error ? 'border-red-500 bg-red-50' : 'border-gray-300',
        disabled && 'bg-gray-100 cursor-not-allowed'
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
        'w-16 h-8 px-2 text-center text-sm border rounded',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        error ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
  const numCols = coefficients[0]?.length ? coefficients[0].length - 1 : 2;

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-8 p-2"></th>
            {headers.map((header, i) => (
              <th key={i} className="p-1">
                <div className="flex flex-col items-center gap-1">
                  <HeaderCell
                    value={header}
                    onChange={(v) => onHeaderChange(i, v)}
                  />
                  <button
                    onClick={() => onRemoveCol(i)}
                    className="text-red-500 hover:text-red-700 text-xs"
                    title="Eliminar columna"
                  >
                    ×
                  </button>
                </div>
              </th>
            ))}
            <th className="p-2 text-gray-500 text-sm">b</th>
            <th className="w-8 p-2"></th>
          </tr>
        </thead>
        <tbody>
          {coefficients.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="p-2 text-gray-500 text-sm text-center">
                F{rowIndex + 1}
              </td>
              {row.slice(0, numCols).map((cell, colIndex) => (
                <td key={colIndex} className="p-1">
                  <CellInput
                    value={cell}
                    onChange={(v) => onCoefficientChange(rowIndex, colIndex, v)}
                  />
                </td>
              ))}
              <td className="p-1 text-gray-400">|</td>
              <td className="p-1">
                <CellInput
                  value={row[numCols] || ''}
                  onChange={(v) => onCoefficientChange(rowIndex, numCols, v)}
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() => onRemoveRow(rowIndex)}
                  className="text-red-500 hover:text-red-700"
                  title="Eliminar fila"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td className="p-2"></td>
            <td colSpan={numCols + 2} className="p-2">
              <div className="flex gap-2">
                <button
                  onClick={onAddRow}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  +Fila
                </button>
                <button
                  onClick={onAddCol}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  +Columna
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
