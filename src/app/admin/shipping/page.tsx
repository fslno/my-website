
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Package, 
  MapPin, 
  ShieldCheck, 
  Globe, 
  Zap,
  CheckCircle2,
  Loader2,
  Leaf,
  Navigation,
  Lock
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function ShippingPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'shipping') : null, [db]);
  const { data: config, loading } = useDoc(configRef);
  const { toast } = useToast();

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      carriers: ['USPS', 'UPS', 'FedEx', 'DHL', 'Royal Mail'],
      goGreenPlus: true,
      localPickup: true,
      lockerIntegration: false,
      addressValidation: true,
      ddpEnabled: true
    };
    setDoc(configRef, initialData).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'create',
        requestResourceData: initialData
      }));
    });
  };

  const handleUpdate = (updates: any) => {
    if (!configRef) return;
    updateDoc(configRef, updates).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <Truck className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Shipping Config Not Initialized</h2>
        <p className="text-gray-500 max-w-sm">Configure your global carriers, carbon-neutral options, and local pickup logic.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8">Initialize Logistics</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Shipping & Pickup Logistics</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage global carrier integrations, carbon-neutral shipping, and locker pickup APIs.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 py-1 px-3 flex items-center gap-2">
            <Zap className="h-3 w-3" /> Real-time Rates Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Global Carriers</CardTitle>
            </div>
            <CardDescription>North America & Europe Integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {config.carriers?.map((carrier: string) => (
                <Badge key={carrier} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                  {carrier}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-[#5c5f62] leading-relaxed">
              Express Carriers: UPS, FedEx, DHL. <br />
              Economy: USPS, Royal Mail, Canada Post, DPD, Evri.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none border-green-100 bg-green-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Luxury Express</CardTitle>
              </div>
              <Switch 
                checked={config.goGreenPlus} 
                onCheckedChange={(checked) => handleUpdate({ goGreenPlus: checked })}
              />
            </div>
            <CardDescription>DHL Express GoGreen Plus</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-green-800 leading-relaxed">
              Essential for luxury brands. Carbon-neutral shipping using Sustainable Aviation Fuel (SAF). Shows "GoGreen" badge at checkout.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Pickup Logic</CardTitle>
            </div>
            <CardDescription>In-Store & Pop-Up Pickup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Google Local Inventory API</span>
              <Switch 
                checked={config.localPickup} 
                onCheckedChange={(checked) => handleUpdate({ localPickup: checked })}
              />
            </div>
            <p className="text-[11px] text-[#5c5f62] leading-relaxed">
              If enabled, "Pick up today" only appears if the item exists in the specific local Firestore inventory for that "Spot."
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Locker Integration</CardTitle>
            </div>
            <CardDescription>Secure Pickup Locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-md border border-purple-100">
              <div className="space-y-1">
                <p className="text-sm font-bold text-purple-900">UPS Access Point & FedEx OnSite</p>
                <p className="text-xs text-purple-800">Allow customers to choose secure pickup lockers to reduce high-value theft.</p>
              </div>
              <Switch 
                checked={config.lockerIntegration} 
                onCheckedChange={(checked) => handleUpdate({ lockerIntegration: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Address Validation API</CardTitle>
                </div>
                <Switch 
                  checked={config.addressValidation} 
                  onCheckedChange={(checked) => handleUpdate({ addressValidation: checked })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#5c5f62] leading-relaxed">
                Automatically correct typos at checkout to prevent "Return to Origin" (RTO) losses for high-end drops.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">DDP (Delivered Duty Paid)</CardTitle>
                </div>
                <Switch 
                  checked={config.ddpEnabled} 
                  onCheckedChange={(checked) => handleUpdate({ ddpEnabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#5c5f62] leading-relaxed">
                Calculate and collect international customs duties at checkout. No surprise bills for your customers at the border.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="bg-black text-white h-11 px-8 font-bold" onClick={() => toast({ title: "Logistics Saved", description: "Global shipping settings are now active." })}>
          Save Logistics Settings
        </Button>
      </div>
    </div>
  );
}
