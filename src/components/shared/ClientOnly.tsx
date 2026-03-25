'use client';

import React, { useEffect, useState } from 'react';

/**
 * ClientOnly wrapper to prevent hydration mismatches.
 * Authoritatively manifests children only after the client has mounted.
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
