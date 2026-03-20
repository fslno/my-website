'use client';

import React from 'react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const POLICY_DATA: Record<string, string[]> = {
  'shipping': [
    'SHIPPING POLICY',
    'PROCESSING TIME: 2-4 DAYS',
    'FLAT RATE SHIPPING ACTIVE',
    'SIGNATURE MAY BE REQUIRED'
  ],
  'tracking': [
    'TRACK YOUR ORDER',
    'ENTER YOUR ORDER ID IN THE PORTAL',
    'REAL-TIME UPDATES AVAILABLE',
    'STATUS: READY FOR CARRIER'
  ],
  'terms': [
    'TERMS OF SERVICE',
    'ALL SALES ARE FINAL',
    'PROPERTY PROTECTED',
    'USER CONSENT REQUIRED'
  ],
  'privacy': [
    'PRIVACY POLICY',
    'SECURE DATA STORAGE',
    'WE DO NOT SELL YOUR INFO',
    'COOKIE SETTINGS ACTIVE'
  ]
};

/**
 * Policy and Utility pages.
 */
export default function UtilityPolicyPage(props: PageProps) {
  const resolvedParams = React.use(props.params);
  const { slug } = resolvedParams;
  
  const content = POLICY_DATA[slug.toLowerCase()];

  if (!content) {
    notFound();
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 pt-40 pb-20 bg-white">
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
