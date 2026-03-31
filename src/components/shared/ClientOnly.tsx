'use client';

import React from 'react';

/**
 * ClientOnly wrapper — single stable DOM node.
 *
 * The div is always present, so React always has an anchor node.
 * suppressHydrationWarning silences server/client content mismatches
 * so this component never causes "Something Went Wrong" crashes.
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <div style={{ display: 'contents' }} suppressHydrationWarning>
      {children}
    </div>
  );
}
