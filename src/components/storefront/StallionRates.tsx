
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StallionRatesProps {
  address: {
    city: string;
    postalCode: string;
    province: string;
    country: string;
  };
  cartItems: any[];
  onRateSelect: (rate: any) => void;
  selectedRateId?: string;
}

/**
 * Stallion Express Dynamic Rates Component.
 * Manifests live shipping options with Authoritative handling fees.
 */
export function StallionRates({ address, cartItems, onRateSelect, selectedRateId }: StallionRatesProps) {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const shippingConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'shipping') : null, [db]);
  
  const { data: storeConfig } = useDoc(storeConfigRef);
  const { data: shippingConfig } = useDoc(shippingConfigRef);

  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlingFee = Number(storeConfig?.handlingFee) || 2.00;

  // Authoritative Effect: Fetch rates when destination is viable
  useEffect(() => {
    const isAddressComplete = address.city && address.postalCode && address.province;
    if (!isAddressComplete) return;

    const fetchRates = async () => {
      setLoading(true);
      setError(null);

      // Aggregate Parcel Metrics
      const parcel = cartItems.reduce((acc, item) => ({
        weight: acc.weight + (Number(item.logistics?.weight || shippingConfig?.defaultWeight || 0.5) * item.quantity),
        length: Math.max(acc.length, Number(item.logistics?.length || shippingConfig?.defaultLength || 30)),
        width: Math.max(acc.width, Number(item.logistics?.width || shippingConfig?.defaultWidth || 20)),
        height: acc.height + (Number(item.logistics?.height || shippingConfig?.defaultHeight || 5) * item.quantity)
      }), { weight: 0, length: 0, width: 0, height: 0 });

      try {
        const response = await fetch('/api/shipping/stallion/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_address: {
              city: address.city,
              postal_code: address.postalCode,
              province: address.province,
              country_code: address.country === 'Canada' ? 'CA' : 'US'
            },
            parcel
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Inject Handling Fee into the manifest
        const finalRates = (data.rates || []).map((r: any) => ({
          ...r,
          totalCost: r.price + handlingFee
        }));

        setRates(finalRates);
        
        // Auto-select first rate if none selected
        if (finalRates.length > 0 && !selectedRateId) {
          onRateSelect(finalRates[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Could not calculate rates.');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [address.city, address.postalCode, address.province, cartItems, shippingConfig]);

  if (loading) {
    return (
      <div className="p-8 border-2 border-dashed rounded-none flex flex-col items-center justify-center gap-4 bg-gray-50/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Calculating live rates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border-2 border-dashed border-red-100 bg-red-50 text-red-700 rounded-none flex items-start gap-3">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Logistics Error</p>
          <p className="text-[9px] uppercase font-medium opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  if (rates.length === 0) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <RadioGroup 
        value={selectedRateId} 
        onValueChange={(id) => {
          const rate = rates.find(r => r.id === id);
          if (rate) onRateSelect(rate);
        }}
        className="grid grid-cols-1 gap-2"
      >
        {rates.map((rate) => (
          <div 
            key={rate.id} 
            className={cn(
              "flex items-center justify-between p-4 border-2 transition-all cursor-pointer hover:bg-secondary rounded-none",
              selectedRateId === rate.id ? "border-primary bg-white shadow-md ring-1 ring-primary" : "bg-gray-50/50 border-transparent"
            )}
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value={rate.id} id={rate.id} className="border-primary text-primary" />
              <Label htmlFor={rate.id} className="cursor-pointer">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">{rate.label}</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">{rate.days} Days • {rate.service}</span>
                </div>
              </Label>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-primary">C${rate.totalCost.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </RadioGroup>
      <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest px-1">
        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Stallion Express Real-Time Sync
      </div>
    </div>
  );
}
