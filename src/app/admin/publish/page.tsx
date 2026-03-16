'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublishRevertedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Protocol Neutralized</h1>
        <p className="text-sm text-muted-foreground uppercase font-medium leading-relaxed">
          The environment separation protocol has been Authoritatively reverted. Changes made in the studio now manifest immediately across the entire domain.
        </p>
        <Button asChild className="bg-black text-white px-8 h-12 font-bold uppercase tracking-widest text-[10px]">
          <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
