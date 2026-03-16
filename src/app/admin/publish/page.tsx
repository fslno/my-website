'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Publish Reverted Segment.
 * Confirms the neutralization of the isolation protocol.
 */
export default function PublishRevertedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="max-w-md space-y-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Protocol Unified</h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">
            The environment separation protocol has been Authoritatively neutralized. Changes made in the studio now manifest immediately across the entire domain.
          </p>
        </div>

        <div className="p-6 bg-gray-50 border border-dashed rounded-none">
          <p className="text-[10px] text-gray-500 uppercase font-bold leading-relaxed">
            Manual publishing is no longer required. All data paths are forensicly unified with the root manifest.
          </p>
        </div>

        <Button asChild className="bg-black text-white px-10 h-14 font-bold uppercase tracking-widest text-[10px] rounded-none shadow-2xl">
          <Link href="/admin"><ArrowLeft className="mr-3 h-4 w-4" /> Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
