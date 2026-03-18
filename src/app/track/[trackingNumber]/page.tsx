'use client';

import React, { use } from 'react';
import { Truck, Package, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ trackingNumber: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function TrackingPage(props: PageProps) {
  const resolvedParams = React.use(props.params);
  const { trackingNumber } = resolvedParams;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 pt-32 pb-20">
      <div className="max-w-xl w-full space-y-12">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto shadow-xl">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Shipment Tracing</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">ID: {trackingNumber.toUpperCase()}</p>
        </div>

        <div className="bg-white border p-8 space-y-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
          <div className="flex items-start gap-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-blue-600" /></div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">In Transit</h2>
              <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-medium">Your selection has been dispatched from the studio.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1 bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none"><Link href="/">Return</Link></Button>
          <Button asChild variant="outline" className="flex-1 border-black h-14 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none"><Link href="/account/orders">Orders</Link></Button>
        </div>
      </div>
    </div>
  );
}