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
  const { i18n } = useTranslation();
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Ejemplos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <p className="text-center text-gray-500">Cargando ejemplos...</p>
          ) : (
            <div className="grid gap-3">
              {examples.map((example) => {
                const disabled = isExampleDisabled(example);
                const desc = example.description[i18n.language as 'es' | 'en'] || example.description.es;
                return (
                  <button
                    key={example.id}
                    onClick={() => !disabled && onSelect(example)}
                    disabled={disabled}
                    className={`p-4 rounded border text-left ${
                      disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">{example.id}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        example.mode === 'numeric' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {example.mode}
                      </span>
                    </div>
                    <p className="text-sm">{desc}</p>
                    {disabled && (
                      <p className="text-xs text-orange-600 mt-1">
                        Pyodide no está cargado — ejemplo simbólico deshabilitado
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
