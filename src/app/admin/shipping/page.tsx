'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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
  Lock,
  Plus,
  Trash2,
  ExternalLink,
  Settings2
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

  const [isAddCarrierOpen, setIsAddCarrierOpen] = useState(false);
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierApiKey, setNewCarrierApiKey] = useState('');

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      carriers: [
        { name: 'USPS', active: true, apiKey: 'fslno_sample_key' },
        { name: 'UPS', active: true, apiKey: 'fslno_sample_key' },
        { name: 'FedEx', active: true, apiKey: 'fslno_sample_key' },
        { name: 'DHL', active: true, apiKey: 'fslno_sample_key' },
        { name: 'Royal Mail', active: true, apiKey: 'fslno_sample_key' }
      ],
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

  const handleAddCarrier = () => {
    if (!newCarrierName || !config) return;
    const currentCarriers = Array.isArray(config.carriers) ? config.carriers : [];
    
    // Check if already exists as string or object
    const exists = currentCarriers.some((c: any) => 
      (typeof c === 'string' ? c === newCarrierName : c.name === newCarrierName)
    );

    if (exists) {
      toast({ variant: "destructive", title: "Already Exists", description: "This carrier is already in your archive." });
      return;
    }

    const updatedCarriers = [
      ...currentCarriers,
      { name: newCarrierName, active: true, apiKey: newCarrierApiKey || 'pending_configuration' }
    ];

    handleUpdate({ carriers: updatedCarriers });
    setNewCarrierName('');
    setNewCarrierApiKey('');
    setIsAddCarrierOpen(false);
    toast({ title: "Carrier Integrated", description: `${newCarrierName} API connection has been initialized.` });
  };

  const handleRemoveCarrier = (name: string) => {
    if (!config) return;
    const updatedCarriers = config.carriers.filter((c: any) => 
      (typeof c === 'string' ? c !== name : c.name !== name)
    );
    handleUpdate({ carriers: updatedCarriers });
    toast({ title: "Carrier Removed", description: "Integration has been decommissioned." });
  };

  const handleToggleCarrier = (name: string, active: boolean) => {
    if (!config) return;
    const updatedCarriers = config.carriers.map((c: any) => {
      if (typeof c === 'string') return c === name ? { name: c, active } : { name: c, active: true };
      if (c.name === name) return { ...c, active };
      return c;
    });
    handleUpdate({ carriers: updatedCarriers });
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Global Carrier Integrations</CardTitle>
                </div>
                <CardDescription>Direct API connections for North America & Europe.</CardDescription>
              </div>
              <Dialog open={isAddCarrierOpen} onOpenChange={setIsAddCarrierOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 font-bold uppercase tracking-widest text-[10px] border-black">
                    <Plus className="h-3.5 w-3.5" /> Add Platform
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">New Carrier API Integration</DialogTitle>
                    <DialogDescription className="text-xs">Establish a new logistics handshake for real-time rate calculations.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Carrier Name</Label>
                      <Input 
                        placeholder="e.g. Canada Post, DPD, Evri" 
                        value={newCarrierName} 
                        onChange={(e) => setNewCarrierName(e.target.value.toUpperCase())}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">API Key / Access Token</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password"
                          placeholder="••••••••••••••••" 
                          value={newCarrierApiKey} 
                          onChange={(e) => setNewCarrierApiKey(e.target.value)}
                          className="pl-10 h-11 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddCarrier} disabled={!newCarrierName} className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]">
                      Connect Integration
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {config.carriers?.map((carrier: any, idx: number) => {
                  const name = typeof carrier === 'string' ? carrier : carrier.name;
                  const active = typeof carrier === 'string' ? true : carrier.active;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded bg-white border flex items-center justify-center font-bold text-xs ${active ? 'text-black' : 'text-gray-300'}`}>
                          {name.substring(0, 2)}
                        </div>
                        <div className="space-y-0.5">
                          <p className={`text-sm font-bold uppercase ${!active && 'text-gray-400'}`}>{name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">API: {active ? 'CONNECTED' : 'DISABLED'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={active} 
                          onCheckedChange={(checked) => handleToggleCarrier(name, checked)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveCarrier(name)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {(!config.carriers || config.carriers.length === 0) && (
                  <p className="text-center py-8 text-xs text-gray-400 italic">No carrier platforms integrated.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <div className="space-y-6">
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400">Checkout Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-bold">Address Validation API</p>
                  <p className="text-[10px] text-gray-400">Typos automatically corrected.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold">DDP Compliance</p>
                  <p className="text-[10px] text-gray-400">Customs duties collected at checkout.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Locker Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">UPS Access Point</p>
                <Switch 
                  checked={config.lockerIntegration} 
                  onCheckedChange={(checked) => handleUpdate({ lockerIntegration: checked })}
                />
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Allow customers to choose secure pickup lockers to reduce high-value theft for limited drops.
              </p>
            </CardContent>
          </Card>

          <Button className="w-full bg-black text-white h-14 font-bold uppercase tracking-widest text-[11px]" onClick={() => toast({ title: "Logistics Saved", description: "All global shipping configurations are live." })}>
            Save Logistics Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
