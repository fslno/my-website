'use client';

import React, { use } from 'react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const POLICY_DATA: Record<string, string[]> = {
  'shipping': [
    'GLOBAL LOGISTICS MANIFEST',
    'PROCESSING DURATION: 2-4 DAYS',
    'FLAT RATE DISPATCH ACTIVE',
    'SIGNATURE REQUIRED UPON RECEIPT'
  ],
  'tracking': [
    'SHIPMENT TRACING PROTOCOL',
    'INPUT REFERENCE IN PORTAL',
    'REAL-TIME SYNC COMMENCING',
    'STATUS: AWAITING CARRIER HANDSHAKE'
  ],
  'terms': [
    'ARCHIVE TERMS OF OPERATION',
    'ALL TRANSACTIONS ARE FINAL',
    'INTELLECTUAL PROPERTY PROTECTED',
    'USER CONSENT IS MANDATORY'
  ],
  'privacy': [
    'DATA ENCRYPTION PROTOCOL',
    'ZERO THIRD-PARTY LEAKAGE',
    'SECURE ARCHIVE STORAGE',
    'COOKIE CLEARANCE ACTIVE'
  ]
};

/**
 * Permanent 4-Line Utility Segment.
 * Forensicly hard-coded to ensure zero-DB latency and visual consistency.
 */
export default function UtilityPolicyPage(props: PageProps) {
  const { slug } = use(props.params);
  const content = POLICY_DATA[slug.toLowerCase()];

  if (!content) {
    notFound();
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 pt-40 pb-20">
      <div className="max-w-md w-full border-l border-black pl-6 py-2 space-y-1">
        {content.map((line, idx) => (
          <p 
            key={idx} 
            className="font-mono text-[11px] uppercase tracking-[0.1em] leading-tight text-primary"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
