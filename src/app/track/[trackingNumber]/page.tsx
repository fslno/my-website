'use client';

import React, { use } from 'react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { Truck, Package, CheckCircle2, Clock, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ trackingNumber: string }>;
}

/**
 * High-Fidelity Logistics Tracing Segment.
 * Manifests the status of a shipment based on its archival reference.
 */
export default function TrackingPage(props: PageProps) {
  const { trackingNumber } = use(props.params);

  return (
    <main className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
        <div className="max-w-xl w-full space-y-12">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-headline font-bold uppercase tracking-tight">Shipment Tracing</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">ID: {trackingNumber.toUpperCase()}</p>
          </div>

          <div className="bg-white border p-8 sm:p-12 space-y-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
            
            <div className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary">In Transit</h2>
                <p className="text-[11px] text-muted-foreground uppercase leading-relaxed font-medium">
                  Your selection has been dispatched from the FSLNO studio and is currently synchronized with the carrier network.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-dashed">
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Carrier Protocol</p>
                <p className="text-xs font-bold uppercase">Awaiting Synchronization</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Est. Arrival</p>
                <p className="text-xs font-bold uppercase">Pending Carrier Scan</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border rounded-sm flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                Tracking data usually manifests 24-48 hours after dispatch.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1 bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none">
              <Link href="/">Return to Studio</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 border-black h-14 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none">
              <Link href="/account/orders"><ArrowLeft className="mr-2 h-3 w-3" /> Order History</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
