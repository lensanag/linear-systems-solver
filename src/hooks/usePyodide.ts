import { useState, useEffect } from 'react';
import { loadPyodide, isPyodideLoaded } from '@/utils/pyodideLoader';
import { useStore } from '@/store/useStore';

export function usePyodide() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pyodideLoaded, setPyodideLoaded } = useStore();

  useEffect(() => {
    if (pyodideLoaded || loading) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadPyodide();
        setPyodideLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Pyodide');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pyodideLoaded, loading, setPyodideLoaded]);

  return { loading, error, pyodideLoaded };
}