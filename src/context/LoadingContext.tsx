'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  pushLoading: (id: string) => void;
  popLoading: (id: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  // Use a set to track different loading locks (helps with multiple items loading)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const isLoading = useMemo(() => loadingIds.size > 0, [loadingIds]);

  const pushLoading = useCallback((id: string) => {
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const popLoading = useCallback((id: string) => {
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    isLoading,
    pushLoading,
    popLoading
  }), [isLoading, pushLoading, popLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
