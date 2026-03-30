'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Truck, AlertCircle, CheckCircle2, MapPin, Zap, ChevronRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getLivePath } from '@/lib/deployment';

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
  isFreeEligible?: boolean;
}

/**
 * Enhanced Logistics Discovery Engine.
 * Authoritatively manifests live API rates and Regional Manual Overrides.
 * Prioritizes manual regional overrides if they match the participant's province.
 */
export function StallionRates({ address, cartItems, onRateSelect, selectedRateId, manualRates, isFreeEligible }: StallionRatesProps) {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const shippingConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/shipping')) : null, [db]);

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

  const handlingFee = Number(storeConfig?.handlingFee ?? 0);

  useEffect(() => {
    // 01. Logic Gate: Regional rates only require province
    const hasProvince = !!address.province;
    const isFullAddress = !!(address.city && address.postalCode && address.province);

    if (!hasProvince) {
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

      // A. Ingest Regional Manual Rates (Province Overrides)
      if (shippingConfig?.provinceRatesEnabled && Array.isArray(manualRates) && address.province) {
        const matched = manualRates.find((r: any) =>
          r.province?.toUpperCase() === (address.province || '').toUpperCase() &&
          (r.active !== false)
        );
        if (matched) {
          const regionalHandlingFee = matched.handlingFee !== undefined ? Number(matched.handlingFee) : handlingFee;
          fetchedRates.push({
            id: `manual-${matched.province}-std`,
            service: matched.carrier || 'Shipping',
            label: 'Standard Shipping',
            totalCost: (Number(matched.rate ?? matched.standard) || 0) + regionalHandlingFee,
            estimate: matched.estimate || '',
            type: 'standard'
          });

          if (matched.expressActive && matched.express) {
            fetchedRates.push({
              id: `manual-${matched.province}-exp`,
              service: matched.carrier || 'Shipping',
              label: 'Express Shipping',
              totalCost: (Number(matched.express) || 0) + regionalHandlingFee,
              estimate: matched.expressEstimate || '',
              type: 'express'
            });
          }
        }
      }

      // B. Authoritative API Discovery (Stallion) - DISABLED as per simplification
      // Note: Kept for reference but bypassed in favor of base rate

      // C. Fallback Protocol: If no regional rates, use base rate
      if (fetchedRates.length === 0) {
        fetchedRates.push({
          id: 'base-rate',
          service: 'Standard Logistics',
          label: 'Shipping',
          totalCost: Number(shippingConfig?.baseShippingRate ?? shippingConfig?.standardRate ?? 15) + handlingFee,
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

  const isAddressIncomplete = !address.province;

  if (isAddressIncomplete) {
    return (
      <div className="p-8 border-2 border-dashed rounded-none flex flex-col items-center justify-center gap-3 bg-gray-50/30">
        <MapPin className="h-5 w-5 text-gray-300" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Enter province for shipping rates.</p>
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
            <Label
              key={rate.id}
              className={cn(
                "flex items-center justify-between p-4 border-2 transition-all cursor-pointer rounded-none bg-white",
                selectedRateId === rate.id ? "border-black shadow-md" : "border-[#f1f5f9] hover:border-gray-200"
              )}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={rate.id} id={rate.id} className="sr-only" />
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedRateId === rate.id ? "border-black bg-black" : "border-gray-200"
                )}>
                  {selectedRateId === rate.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">{rate.label}</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">
                    {rate.estimate ? `Est. delivery: ${rate.estimate}` : (rate.type === 'express' ? 'Fast Archival Fulfillment' : 'Secure Delivery Service')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-primary">
                  {(isFreeEligible && rate.type === 'standard') ? 'FREE' : `C$${(Number(rate.totalCost) || 0).toFixed(2)}`}
                </span>
              </div>
            </Label>
          ))}
        </RadioGroup>
      ) : (
        <div className="p-8 border-2 border-dashed rounded-none text-center bg-gray-50/30">
          <AlertCircle className="h-5 w-5 text-gray-300 mx-auto mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No services available for this region.</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest px-1">
        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Logistics Protocol Active
      </div>
    </div>
  );
}
