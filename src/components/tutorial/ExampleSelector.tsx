import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/useStore';
import type { Example } from '@/engines/shared/types';

interface ExampleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (example: Example) => void;
}

export function ExampleSelector({ isOpen, onClose, onSelect }: ExampleSelectorProps) {
  const { t, i18n } = useTranslation();
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const { pyodideLoaded } = useStore();

  useEffect(() => {
    if (!isOpen) return;
    fetch('/examples.json')
      .then((res) => res.json())
      .then((data) => setExamples(data.examples))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const isExampleDisabled = (example: Example): boolean => {
    return example.mode === 'symbolic' && !pyodideLoaded;
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-border">
        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
          <h2 className="text-base font-bold text-secondary-dark">{t('exampleSelector.title')}</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary text-xl w-6 h-6 flex items-center justify-center">
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <p className="text-center text-secondary text-sm">{t('exampleSelector.loading')}</p>
          ) : (
            <div className="grid gap-2">
              {examples.map((example) => {
                const disabled = isExampleDisabled(example);
                const desc = example.description[i18n.language as 'es' | 'en'] || example.description.es;
                return (
                  <button
                    key={example.id}
                    onClick={() => !disabled && onSelect(example)}
                    disabled={disabled}
                    className={`p-3 border border-border text-left ${
                      disabled
                        ? 'bg-gray-50 text-secondary-light cursor-not-allowed'
                        : 'bg-surface hover:bg-gray-50 hover:border-primary'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-secondary-dark">{example.id}</span>
                      <span className={`text-xs px-2 py-0.5 border ${
                        example.mode === 'numeric'
                          ? 'border-primary/30 text-primary bg-primary/5'
                          : 'border-purple-200 text-purple-600 bg-purple-50'
                      }`}>
                        {example.mode}
                      </span>
                    </div>
                    <p className="text-xs text-secondary">{desc}</p>
                    {disabled && (
                      <p className="text-xs text-orange-500 mt-1">
                        {t('exampleSelector.pyodideNotLoaded')}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}