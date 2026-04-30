import type { HistoryEntry } from '@/engines/shared/types';
import { useStore } from '@/store/useStore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RotateCcw, Trash2, AlertTriangle, Hash } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ isOpen, onClose, onRestore }: HistoryPanelProps) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const { history, removeFromHistory, clearHistory } = useStore();

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatPreview = (entry: HistoryEntry): string => {
    if (!entry.coefficients.length || !entry.coefficients[0].length) return '';
    const firstRow = entry.coefficients[0];
    const preview = firstRow.map((val, idx) => {
      const header = entry.headers[idx] || `x${idx + 1}`;
      const value = val || '0';
      return `${value}${header}`;
    }).join(' + ');
    const b = firstRow[firstRow.length - 1] || '';
    return `${preview} = ${b}`;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface shadow-xl z-50 flex flex-col border-l border-border">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted">
        <h2 className="text-base font-bold text-text-primary">{t('history.title')}</h2>
        <button onClick={onClose} className="text-text-secondary hover:text-primary w-6 h-6 flex items-center justify-center rounded hover:bg-border">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {history.length === 0 ? (
          <p className="text-text-secondary text-center text-sm">{t('history.empty')}</p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="border border-border p-3 bg-muted">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm text-text-primary">
                    {entry.label || entry.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-text-muted">{formatDate(entry.createdAt)}</span>
                </div>
                <p className="text-xs text-text-secondary mb-1">
                  {entry.method ? t(`methods.${entry.method}`) : t('history.noMethod')} | {entry.rows}×{entry.cols}
                </p>
                <div className="flex items-center gap-1 text-xs text-text-muted bg-surface px-2 py-1 border border-border font-mono truncate mb-2">
                  <Hash size={10} />
                  <span className="truncate">{formatPreview(entry)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRestore(entry)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white hover:bg-primary-dark rounded"
                  >
                    <RotateCcw size={12} />
                    {t('history.restore')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(entry.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={12} />
                    {t('history.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="p-4 border-t border-border">
          <button
            onClick={() => setConfirmClearAll(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded"
          >
            <Trash2 size={14} />
            {t('history.clearAll')}
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center">
          <div className="bg-surface p-4 border border-border shadow-lg max-w-sm rounded">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-red-500" />
              <p className="text-sm text-text-primary">{t('history.confirmDelete')}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:bg-muted rounded"
              >
                {t('history.cancel')}
              </button>
              <button
                onClick={() => {
                  removeFromHistory(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded"
              >
                <Trash2 size={12} />
                {t('history.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearAll && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center">
          <div className="bg-surface p-4 border border-border shadow-lg max-w-sm rounded">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-red-500" />
              <p className="text-sm text-text-primary">{t('history.confirmClearAll')}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:bg-muted rounded"
              >
                {t('history.cancel')}
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setConfirmClearAll(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded"
              >
                <Trash2 size={12} />
                {t('history.clearAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}