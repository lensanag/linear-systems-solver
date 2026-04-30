import type { HistoryEntry } from '@/engines/shared/types';
import { useStore } from '@/store/useStore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const { t } = useTranslation();
  const { history, removeFromHistory, clearHistory } = useStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleRestore = (entry: HistoryEntry) => {
    const store = useStore.getState();
    store.setMode(entry.mode);
    store.setMethod(entry.method);
    store.setDimensions(entry.rows, entry.cols);
    store.setHeaders(entry.headers);
    entry.coefficients.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        store.setCoefficient(ri, ci, cell);
      });
    });
    store.setParamSymbol(entry.paramSymbol);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold">{t('history.title')}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {history.length === 0 ? (
          <p className="text-gray-500 text-center">{t('history.empty')}</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">
                    {entry.label || entry.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(entry.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {entry.mode} | {entry.method || t('history.noMethod')} | {entry.rows}×{entry.cols}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(entry)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    {t('history.restore')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(entry.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    {t('history.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="p-4 border-t">
          <button
            onClick={() => setConfirmClearAll(true)}
            className="w-full px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            {t('history.clearAll')}
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white p-4 rounded shadow-xl max-w-sm">
            <p className="mb-4">{t('history.confirmDelete')}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                {t('history.cancel')}
              </button>
              <button
                onClick={() => {
                  removeFromHistory(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                {t('history.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearAll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white p-4 rounded shadow-xl max-w-sm">
            <p className="mb-4">{t('history.confirmClearAll')}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                {t('history.cancel')}
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setConfirmClearAll(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                {t('history.clearAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
