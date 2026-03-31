'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/paths';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const STATIC_FALLBACKS: Record<string, string[]> = {
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
  ],
  'returns': [
    'RETURN POLICY',
    'CONTACT SUPPORT TO INITIATE',
    'ITEMS MUST BE UNUSED',
    'WINDOW: 7 DAYS'
  ]
};

const FIELD_MAP: Record<string, string> = {
  'terms': 'termsContent',
  'privacy': 'privacyContent',
  'returns': 'returnsContent',
  'shipping': 'shippingContent',
  'contact': 'contactContent'
};


/**
 * Policy and Utility pages - Dynamically sourced from Admin -> Footer Editor.
 */
export default function UtilityPolicyPage(props: PageProps) {
  const resolvedParams = React.use(props.params);
  const { slug } = resolvedParams;
  const lowerSlug = slug.toLowerCase();
  
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
      </div>
    );
  }

  // Determine content source
  const fieldName = FIELD_MAP[lowerSlug];
  const dynamicContent = fieldName ? config?.[fieldName] : null;
  
  let displayLines: string[] = [];
  
  if (dynamicContent && typeof dynamicContent === 'string' && dynamicContent.trim()) {
    // If we have dynamic content, split it into lines for the archival design
    displayLines = dynamicContent.split('\n').filter(line => line.trim() !== '');
  } else if (lowerSlug === 'contact' && config) {
    // Specialized Contact Display from config/store
    displayLines = [
      'CONTACT US',
      config.businessName || 'FSLNO STUDIO',
      '',
      'ADDRESS:',
      config.address || 'Guelph, ON',
      '',
      'PHONE:',
      config.phone || 'N/A',
      '',
      'EMAIL:',
      config.email || 'N/A',
      '',
      'INSTAGRAM:',
      config.instagramUrl?.split('/').pop()?.toUpperCase() || '@FEISELINO'
    ].filter(Boolean);
  } else {
    // Fallback to static data if no dynamic content is set
    displayLines = STATIC_FALLBACKS[lowerSlug] || [];
  }


  if (displayLines.length === 0) {
    notFound();
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 pt-40 pb-20 bg-white">
      <div className="max-w-md w-full border-l border-black pl-6 py-2 space-y-4">
        <div className="space-y-1">
          {displayLines.map((line, idx) => (
            <p 
              key={idx} 
              className="font-mono text-[11px] uppercase tracking-[0.1em] leading-tight text-primary whitespace-pre-wrap"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
