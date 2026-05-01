import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Example } from '@/engines/shared/types';
import { X, BookOpen, Calculator } from 'lucide-react';

interface ExampleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (example: Example) => void;
}

export function ExampleSelector({ isOpen, onClose, onSelect }: ExampleSelectorProps) {
  const { t, i18n } = useTranslation();
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${import.meta.env.BASE_URL}/examples.json`)
      .then((res) => res.json())
      .then((data) => setExamples(data.examples))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-border">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            <h2 className="text-base font-bold text-text-primary">{t('exampleSelector.title')}</h2>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-primary w-6 h-6 flex items-center justify-center rounded hover:bg-border">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Calculator size={24} className="text-primary animate-pulse" />
              <p className="text-text-secondary text-sm">{t('exampleSelector.loading')}</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {examples.map((example) => {
                const desc = example.description[i18n.language as 'es' | 'en'] || example.description.es;
                return (
                  <button
                    key={example.id}
                    onClick={() => onSelect(example)}
                    className="p-3 border border-border text-left rounded bg-surface hover:bg-muted hover:border-primary"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center gap-1 font-bold text-sm text-text-primary">
                        <Calculator size={14} className="text-primary" />
                        {example.id}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 border border-primary/30 text-primary bg-primary/5 rounded">
                        <Calculator size={10} />
                        {example.method}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{desc}</p>
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