'use client';

import React, { useEffect, useState } from 'react';

/**
 * ClientOnly wrapper to prevent hydration mismatches.
 * Shows the content only after the page has loaded.
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
