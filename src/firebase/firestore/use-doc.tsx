'use client';

import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * Hook to listen to a single Firestore document.
 * @param ref The DocumentReference to listen to.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        if (snapshot.exists()) {
          setData({ ...snapshot.data()!, id: snapshot.id } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          }));
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
