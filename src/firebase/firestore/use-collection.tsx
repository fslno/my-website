'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * Hook to listen to a Firestore collection or query with robust cleanup.
 * @param query The Firestore Query or CollectionReference to listen to.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!query) {
      if (mounted) {
        setLoading(false);
        setData([]);
      }
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        if (!mounted) return;
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as unknown as T[];
        setData(items);
        setLoading(false);
      },
      (err: FirestoreError) => {
        if (!mounted) return;
        if (err.code === 'permission-denied') {
          // Attempt to extract path if possible safely
          const path = (query as any)._query?.path?.toString() || 'collection';
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path,
            operation: 'list',
          }));
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [query]);

  return { data, loading, error };
}

/**
 * Stabilizes a Firestore query or reference so it can be used as a dependency in hooks.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
