'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Truck, AlertCircle, CheckCircle2, MapPin, Zap, ChevronRight } from 'lucide-react';
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
  manualRates?: any[];
}

/**
 * Enhanced Logistics Discovery Engine.
 * Authoritatively manifests live API rates and Regional Manual Overrides.
 * Fallback protocol triggers only on absolute API handshake failure.
 */
export function StallionRates({ address, cartItems, onRateSelect, selectedRateId, manualRates }: StallionRatesProps) {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const shippingConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'shipping') : null, [db]);
  
  const { data: storeConfig } = useDoc(storeConfigRef);
  const { data: shippingConfig } = useDoc(shippingConfigRef);

  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const isStallionEnabled = useMemo(() => {
    if (!shippingConfig?.carriers) return false;
    const stallion = shippingConfig.carriers.find((c: any) => 
      (typeof c === 'string' ? c === 'STALLION EXPRESS' : c.name === 'STALLION EXPRESS')
    );
    return stallion && stallion.active !== false && stallion.apiKey && stallion.apiKey !== 'pending';
  }, [shippingConfig]);

  const handlingFee = Number(storeConfig?.handlingFee) || 2.00;

  useEffect(() => {
    const isAddressComplete = address.city && address.postalCode && address.province;
    if (!isAddressComplete) {
      setRates([]);
      setError(null);
      setUseFallback(false);
      return;
    }

    const fetchRates = async () => {
      setLoading(true);
      setError(null);
      setUseFallback(false);
      
      let fetchedRates: any[] = [];

      // 1. Authoritative API Discovery (Stallion)
      if (isStallionEnabled) {
        const parcel = cartItems.reduce((acc, item) => ({
          weight: acc.weight + (Number(item.logistics?.weight || shippingConfig?.defaultWeight || 0.6) * item.quantity),
          length: Math.max(acc.length, Number(item.logistics?.length || shippingConfig?.defaultLength || 35)),
          width: Math.max(acc.width, Number(item.logistics?.width || shippingConfig?.defaultWidth || 25)),
          height: acc.height + (Number(item.logistics?.height || shippingConfig?.defaultHeight || 10) * item.quantity)
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
          if (response.ok) {
            fetchedRates = (data.rates || []).map((r: any) => ({
              ...r,
              totalCost: r.price + handlingFee
            }));
          } else {
            throw new Error(data.error);
          }
        } catch (err: any) {
          console.warn('[LOGISTICS] API Failure, checking for manual or fallback:', err.message);
          setUseFallback(true);
        }
      }

      // 2. Ingest Regional Manual Rates (Province Overrides)
      if (manualRates && address.province) {
        const matched = manualRates.find((r: any) => r.province.toUpperCase() === address.province.toUpperCase());
        if (matched) {
          fetchedRates.push({
            id: `manual-std-${matched.province}`,
            service: 'Regional Logistics',
            label: 'Standard Shipping',
            totalCost: Number(matched.standard) + handlingFee,
            days: '3-5',
            type: 'standard'
          });
          if (Number(matched.express) > 0) {
            fetchedRates.push({
              id: `manual-exp-${matched.province}`,
              service: 'Regional Logistics',
              label: 'Express Delivery',
              totalCost: Number(matched.express) + handlingFee,
              days: '1-2',
              type: 'express'
            });
          }
        }
      }

      // 3. Fallback Protocol: If no rates found after API/Manual attempts
      if (fetchedRates.length === 0 && (isStallionEnabled || useFallback)) {
        fetchedRates.push({
          id: 'fallback-std',
          service: 'Standard Courier',
          label: 'Standard Shipping',
          totalCost: Number(shippingConfig?.standardRate || 0) + handlingFee,
          days: '4-7',
          type: 'standard'
        });
      }

      setRates(fetchedRates);
      
      // Auto-select first rate if nothing selected or current selection missing
      if (fetchedRates.length > 0 && (!selectedRateId || !fetchedRates.some(r => r.id === selectedRateId))) {
        onRateSelect(fetchedRates[0]);
      }
      setLoading(false);
    };

    fetchRates();
  }, [address.city, address.postalCode, address.province, cartItems, shippingConfig, isStallionEnabled, handlingFee, address.country, onRateSelect, selectedRateId, manualRates]);

  if (!isStallionEnabled && !(manualRates && manualRates.length > 0)) {
    return (
      <div className="p-8 border-2 border-dashed rounded-none text-center bg-gray-50/30">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Logistics protocol inactive.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 border-2 border-dashed rounded-none flex flex-col items-center justify-center gap-4 bg-gray-50/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Synchronizing logistics...</p>
      </div>
    );
  }

  const isAddressIncomplete = !address.city || !address.postalCode || !address.province;

  if (isAddressIncomplete) {
    return (
      <div className="p-8 border-2 border-dashed rounded-none flex flex-col items-center justify-center gap-3 bg-gray-50/30">
        <MapPin className="h-5 w-5 text-gray-300" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Enter address for shipping rates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {useFallback && rates.some(r => r.id === 'fallback-std') && (
        <div className="p-3 bg-amber-50 border border-amber-100 text-[9px] font-bold uppercase text-amber-700 flex items-center gap-2">
          <Zap className="h-3 w-3" /> API Latency detected. Using studio fallback rates.
        </div>
      )}
      
      {rates.length > 0 ? (
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
                selectedRateId === rate.id ? "border-primary bg-white shadow-md" : "bg-gray-50/50 border-transparent"
              )}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={rate.id} id={rate.id} className="border-primary text-primary" />
                <Label htmlFor={rate.id} className="cursor-pointer flex-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary">{rate.label}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">
                      {rate.days} Days • {rate.service}
                    </span>
                  </div>
                </Label>
              </div>
              <div className="text-right flex items-center gap-3">
                <span className="text-[11px] font-bold text-primary">C${rate.totalCost.toFixed(2)}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-20" />
              </div>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="p-8 border-2 border-dashed rounded-none text-center bg-gray-50/30">
          <AlertCircle className="h-5 w-5 text-gray-300 mx-auto mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No services available for this destination.</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest px-1">
        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Logistics Protocol Active
      </div>
    </div>
  );
}
