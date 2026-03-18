'use client';

import React from 'react';

/**
 * Authoritative Solid White Loading Manifest.
 * Replaces brand-based loaders with a pure white void to ensure zero-flicker transitions.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white pointer-events-none" />
  );
}
