'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';

export function useCollection<T>(path: string, token: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await apiFetch<T[]>(path, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فهرست در دسترس نیست.');
    } finally {
      setLoading(false);
    }
  }, [path, token]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { items, setItems, loading, error, refresh };
}
