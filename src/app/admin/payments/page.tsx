'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  Globe,
  Loader2,
  Lock,
  ExternalLink,
  Apple,
  Coins,
  History,
  Banknote,
  Activity,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Scale,
  Save,
  Plus,
  Trash2,
  Key,
  Shield,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';

interface CustomGateway {
  id: string;
  name: string;
  apiKey: string;
  secretKey?: string;
  enabled: boolean;
}

export default function PaymentsPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: config, isLoading: loading } = useDoc(configRef);
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isAddGatewayOpen, setIsAddGatewayOpen] = useState(false);
  
  // New Gateway Form State
  const [newGateway, setNewGateway] = useState({ name: '', apiKey: '', secretKey: '', enabled: true });

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      stripeEnabled: true,
      stripeDeleted: false,
      stripeMode: 'test',
      stripePublishableKey: '',
      stripeSecretKey: '',
      stripeDescription: 'Secure Credit Card Checkout',
      stripeFee: '2.9% + 30¢',
      paypalEnabled: true,
      paypalDeleted: false,
      paypalMode: 'sandbox',
      paypalClientId: '',
      paypalSecretKey: '',
      paypalDescription: 'Global Digital Wallet',
      paypalFee: '3.49% + 49¢',
      paypalPayLaterEnabled: true,
      klarnaEnabled: false,
      klarnaDeleted: false,
      klarnaMode: 'test',
      klarnaClientId: '',
      klarnaClientSecret: '',
      klarnaDescription: 'Interest-free installments',
      klarnaFee: '5.99% + 30¢',
      afterpayEnabled: false,
      afterpayDeleted: false,
      afterpayMode: 'sandbox',
      afterpayMerchantId: '',
      afterpaySecretKey: '',
      afterpayDescription: 'Buy now, pay later',
      afterpayFee: '6% + 30¢',
      adyenEnabled: false,
      adyenDeleted: false,
      adyenMode: 'test',
      adyenMerchantAccount: '',
      adyenApiKey: '',
      adyenDescription: 'Global merchant payments',
      adyenFee: '2.1% + 12¢',
      applePayEnabled: true,
      googlePayEnabled: true,
      fraudGuardLevel: 'high',
      threeDSecureEnabled: true,
      autoAddressComplete: true,
      acceptedCurrencies: ['USD', 'CAD', 'GBP', 'EUR'],
      geoBlockingEnabled: false,
      taxCloudEnabled: true,
      customGateways: [],
      updatedAt: serverTimestamp()
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
    updateDoc(configRef, { ...updates, updatedAt: serverTimestamp() }).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  const handleDeleteProtocol = (gateway: string) => {
    if (!config) return;
    if (!confirm(`Authoritatively remove ${gateway.toUpperCase()} from the active manifest? This will hide the tab and deactivate the gateway.`)) return;
    
    const updates: any = {
      [`${gateway}Deleted`]: true,
      [`${gateway}Enabled`]: false
    };
    handleUpdate(updates);
    toast({ title: "Protocol Removed", description: `${gateway.toUpperCase()} has been de-indexed.` });
  };

  const handleInstallNative = (gateway: string) => {
    handleUpdate({ [`${gateway}Deleted`]: false });
    toast({ title: "Protocol Restored", description: `${gateway.toUpperCase()} is now visible.` });
  };

  const handleAddGateway = () => {
    if (!newGateway.name || !newGateway.apiKey || !configRef) return;
    const currentCustom = config.customGateways || [];
    const updated = [...currentCustom, { ...newGateway, id: Math.random().toString(36).substr(2, 9) }];
    
    handleUpdate({ customGateways: updated });
    setNewGateway({ name: '', apiKey: '', secretKey: '', enabled: true });
    setIsAddGatewayOpen(false);
    toast({ title: "Gateway Added", description: `${newGateway.name} protocol ingested.` });
  };

  const handleRemoveGateway = (id: string) => {
    if (!configRef || !config) return;
    const updated = (config.customGateways || []).filter((g: any) => g.id !== id);
    handleUpdate({ customGateways: updated });
    toast({ title: "Gateway Removed", description: "Protocol de-indexed from the vault." });
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ 
        title: "Checkout Finalized", 
        description: "Global payment orchestration has been synchronized." 
      });
    }, 1000);
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
        <CreditCard className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Payments Not Initialized</h2>
        <p className="text-gray-500 max-w-sm">Configure your global gateways to start accepting payments across the archive.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8 h-12 font-bold uppercase tracking-widest text-[10px]">Initialize Payment Core</Button>
      </div>
    );
  }

  const nativeGateways = [
    { id: 'stripe', label: 'Stripe', icon: Zap, color: '#635BFF' },
    { id: 'paypal', label: 'PayPal', icon: Globe, color: '#0070BA' },
    { id: 'klarna', label: 'Klarna', icon: Coins, color: '#FFB3C7' },
    { id: 'afterpay', label: 'Afterpay', icon: History, color: '#B2FCE4' },
    { id: 'adyen', label: 'Adyen', icon: Banknote, color: '#00FF66' }
  ];

  const deletedNative = nativeGateways.filter(g => config[`${g.id}Deleted`]);

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Global Checkout Orchestration</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Manage secure checkout integrations, AI fraud defense, and regional compliance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Dialog open={isAddGatewayOpen} onOpenChange={setIsAddGatewayOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 border-black font-bold uppercase tracking-widest text-[10px] bg-white gap-2 flex-1 sm:flex-none">
                <Plus className="h-4 w-4" /> Add Gateway
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="pt-6">
                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Gateway Ingestion</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase text-muted-foreground mt-1">Install native providers or connect a custom tool.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-8 py-6">
                {deletedNative.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Install Native Providers</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {deletedNative.map(g => (
                        <Button 
                          key={g.id} 
                          variant="outline" 
                          className="h-12 justify-between px-4 border-black/10 hover:border-black rounded-none group"
                          onClick={() => handleInstallNative(g.id)}
                        >
                          <div className="flex items-center gap-3">
                            <g.icon className="h-4 w-4" style={{ color: g.color }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{g.label}</span>
                          </div>
                          <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Manual API Ingestion</Label>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Provider Name</Label>
                      <Input 
                        placeholder="e.g. Coinbase Commerce" 
                        value={newGateway.name}
                        onChange={(e) => setNewGateway({...newGateway, name: e.target.value.toUpperCase()})}
                        className="h-11 font-bold uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Publishable Key</Label>
                      <Input 
                        placeholder="ENTER PUBLIC API KEY" 
                        value={newGateway.apiKey}
                        onChange={(e) => setNewGateway({...newGateway, apiKey: e.target.value})}
                        className="h-11 font-mono text-[10px]"
                      />
                    </div>
                    <Button onClick={handleAddGateway} disabled={!newGateway.name || !newGateway.apiKey} className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[9px]">
                      Ingest Protocol
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 py-1.5 px-3 flex items-center justify-center gap-2 font-bold uppercase text-[9px] tracking-widest flex-1 sm:flex-none">
            <ShieldCheck className="h-3 w-3" /> PCI DSS Compliant
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Tabs defaultValue="stripe" className="w-full">
            <div className="overflow-hidden">
              <TabsList className="bg-white border w-full h-auto flex-wrap xl:flex-nowrap justify-start p-1 gap-2 rounded-none mb-6">
                {!config.stripeDeleted && (
                  <TabsTrigger value="stripe" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-black data-[state=active]:text-white">
                    <Zap className="h-3.5 w-3.5" /> Stripe
                  </TabsTrigger>
                )}
                {!config.paypalDeleted && (
                  <TabsTrigger value="paypal" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-[#0070BA] data-[state=active]:text-white">
                    <Globe className="h-3.5 w-3.5" /> PayPal
                  </TabsTrigger>
                )}
                {!config.klarnaDeleted && (
                  <TabsTrigger value="klarna" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-[#FFB3C7] data-[state=active]:text-black">
                    <Coins className="h-3.5 w-3.5" /> Klarna
                  </TabsTrigger>
                )}
                {!config.afterpayDeleted && (
                  <TabsTrigger value="afterpay" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-[#B2FCE4] data-[state=active]:text-black">
                    <History className="h-3.5 w-3.5" /> Afterpay
                  </TabsTrigger>
                )}
                {!config.adyenDeleted && (
                  <TabsTrigger value="adyen" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-[#00FF66] data-[state=active]:text-black">
                    <Banknote className="h-3.5 w-3.5" /> Adyen
                  </TabsTrigger>
                )}
                <TabsTrigger value="vault" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                  <Shield className="h-3.5 w-3.5" /> API Vault
                </TabsTrigger>
                <TabsTrigger value="scope" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-primary data-[state=white]">
                  <Globe className="h-3.5 w-3.5" /> Global Scope
                </TabsTrigger>
                <TabsTrigger value="express" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-black data-[state=active]:text-white">
                  <Smartphone className="h-3.5 w-3.5" /> Express
                </TabsTrigger>
              </TabsList>
            </div>

            {/* STRIPE CONTENT */}
            {!config.stripeDeleted && (
              <TabsContent value="stripe" className="m-0 space-y-6 animate-in fade-in duration-300">
                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-[#635BFF]" />
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Stripe Connect (v3)</CardTitle>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch 
                          checked={config.stripeEnabled} 
                          onCheckedChange={(checked) => handleUpdate({ stripeEnabled: checked })}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors"
                          onClick={() => handleDeleteProtocol('stripe')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Checkout Descriptor</Label>
                          <Input 
                            value={config.stripeDescription || ''} 
                            onChange={(e) => handleUpdate({ stripeDescription: e.target.value })}
                            className="h-11 text-xs font-bold uppercase" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Estimated Processing Fee</Label>
                          <Input 
                            value={config.stripeFee || ''} 
                            onChange={(e) => handleUpdate({ stripeFee: e.target.value })}
                            className="h-11 text-xs font-mono" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col justify-end p-4 bg-blue-50/50 border border-blue-100 rounded-sm">
                        <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-1">Fee Transparency</p>
                        <p className="text-[10px] text-blue-700 leading-relaxed uppercase font-medium">Standard Stripe fees typically range from 2.9% + 30¢. This is tracked for margin analysis.</p>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-2 border-dashed rounded-none space-y-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-primary">Operation Mode</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant={config.stripeMode === 'test' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.stripeMode === 'test' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-white')}
                            onClick={() => handleUpdate({ stripeMode: 'test' })}
                          >
                            Sandbox
                          </Button>
                          <Button 
                            variant={config.stripeMode === 'live' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.stripeMode === 'live' ? 'bg-green-600 hover:bg-green-700' : 'bg-white')}
                            onClick={() => handleUpdate({ stripeMode: 'live' })}
                          >
                            Production
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Publishable Key</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              value={config.stripePublishableKey || ''} 
                              onChange={(e) => handleUpdate({ stripePublishableKey: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Secret ID</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              type="password"
                              value={config.stripeSecretKey || ''} 
                              onChange={(e) => handleUpdate({ stripeSecretKey: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* PAYPAL CONTENT */}
            {!config.paypalDeleted && (
              <TabsContent value="paypal" className="m-0 space-y-6 animate-in fade-in duration-300">
                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-[#0070BA]" />
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">PayPal Express Checkout</CardTitle>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch 
                          checked={config.paypalEnabled} 
                          onCheckedChange={(checked) => handleUpdate({ paypalEnabled: checked })}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors"
                          onClick={() => handleDeleteProtocol('paypal')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Checkout Descriptor</Label>
                          <Input 
                            value={config.paypalDescription || ''} 
                            onChange={(e) => handleUpdate({ paypalDescription: e.target.value })}
                            className="h-11 text-xs font-bold uppercase" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Estimated Processing Fee</Label>
                          <Input 
                            value={config.paypalFee || ''} 
                            onChange={(e) => handleUpdate({ paypalFee: e.target.value })}
                            className="h-11 text-xs font-mono" 
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-sm">
                        <p className="text-[9px] font-bold text-blue-800 uppercase mb-1">Gateway Insights</p>
                        <p className="text-[10px] text-blue-700 leading-relaxed uppercase font-medium">PayPal typically applies a 3.49% + 49¢ fee structure for high-fidelity transactions.</p>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-2 border-dashed rounded-none space-y-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-primary">Operation Mode</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant={config.paypalMode === 'sandbox' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.paypalMode === 'sandbox' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-white')}
                            onClick={() => handleUpdate({ paypalMode: 'sandbox' })}
                          >
                            Sandbox
                          </Button>
                          <Button 
                            variant={config.paypalMode === 'live' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.paypalMode === 'live' ? 'bg-green-600 hover:bg-green-700' : 'bg-white')}
                            onClick={() => handleUpdate({ paypalMode: 'live' })}
                          >
                            Production
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Publishable Key</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              value={config.paypalClientId || ''} 
                              onChange={(e) => handleUpdate({ paypalClientId: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Secret ID</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              type="password"
                              value={config.paypalSecretKey || ''} 
                              onChange={(e) => handleUpdate({ paypalSecretKey: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* KLARNA CONTENT */}
            {!config.klarnaDeleted && (
              <TabsContent value="klarna" className="m-0 space-y-6 animate-in fade-in duration-300">
                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Coins className="h-5 w-5 text-[#FFB3C7]" />
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Klarna BNPL (v2)</CardTitle>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch 
                          checked={config.klarnaEnabled} 
                          onCheckedChange={(checked) => handleUpdate({ klarnaEnabled: checked })}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors"
                          onClick={() => handleDeleteProtocol('klarna')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Checkout Descriptor</Label>
                          <Input 
                            value={config.klarnaDescription || ''} 
                            onChange={(e) => handleUpdate({ klarnaDescription: e.target.value })}
                            className="h-11 text-xs font-bold uppercase" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Estimated Processing Fee</Label>
                          <Input 
                            value={config.klarnaFee || ''} 
                            onChange={(e) => handleUpdate({ klarnaFee: e.target.value })}
                            className="h-11 text-xs font-mono" 
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-pink-50/50 border border-pink-100 rounded-sm">
                        <p className="text-[9px] font-bold text-pink-800 uppercase mb-1">BNPL Protocol</p>
                        <p className="text-[10px] text-pink-700 leading-relaxed uppercase font-medium">BNPL fees are generally higher (~5.99%) due to credit risk handling by Klarna.</p>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-2 border-dashed rounded-none space-y-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-primary">Operation Mode</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant={config.klarnaMode === 'test' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.klarnaMode === 'test' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-white')}
                            onClick={() => handleUpdate({ klarnaMode: 'test' })}
                          >
                            Sandbox
                          </Button>
                          <Button 
                            variant={config.klarnaMode === 'live' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.klarnaMode === 'live' ? 'bg-green-600 hover:bg-green-700' : 'bg-white')}
                            onClick={() => handleUpdate({ klarnaMode: 'live' })}
                          >
                            Production
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Publishable Key</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              value={config.klarnaClientId || ''} 
                              onChange={(e) => handleUpdate({ klarnaClientId: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Secret ID</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              type="password"
                              value={config.klarnaClientSecret || ''} 
                              onChange={(e) => handleUpdate({ klarnaClientSecret: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* AFTERPAY CONTENT */}
            {!config.afterpayDeleted && (
              <TabsContent value="afterpay" className="m-0 space-y-6 animate-in fade-in duration-300">
                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <History className="h-5 w-5 text-[#B2FCE4]" />
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Afterpay Installments</CardTitle>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch 
                          checked={config.afterpayEnabled} 
                          onCheckedChange={(checked) => handleUpdate({ afterpayEnabled: checked })}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors"
                          onClick={() => handleDeleteProtocol('afterpay')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Checkout Descriptor</Label>
                          <Input 
                            value={config.afterpayDescription || ''} 
                            onChange={(e) => handleUpdate({ afterpayDescription: e.target.value })}
                            className="h-11 text-xs font-bold uppercase" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Estimated Processing Fee</Label>
                          <Input 
                            value={config.afterpayFee || ''} 
                            onChange={(e) => handleUpdate({ afterpayFee: e.target.value })}
                            className="h-11 text-xs font-mono" 
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-sm">
                        <p className="text-[9px] font-bold text-emerald-800 uppercase mb-1">Split Payment Margin</p>
                        <p className="text-[10px] text-emerald-700 leading-relaxed uppercase font-medium">Afterpay applies ~6.0% commission for split-payment orchestration.</p>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-2 border-dashed rounded-none space-y-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-primary">Operation Mode</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant={config.afterpayMode === 'sandbox' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.afterpayMode === 'sandbox' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-white')}
                            onClick={() => handleUpdate({ afterpayMode: 'sandbox' })}
                          >
                            Sandbox
                          </Button>
                          <Button 
                            variant={config.afterpayMode === 'live' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.afterpayMode === 'live' ? 'bg-green-600 hover:bg-green-700' : 'bg-white')}
                            onClick={() => handleUpdate({ afterpayMode: 'live' })}
                          >
                            Production
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Publishable Key</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              value={config.afterpayMerchantId || ''} 
                              onChange={(e) => handleUpdate({ afterpayMerchantId: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Secret ID</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              type="password" 
                              value={config.afterpaySecretKey || ''} 
                              onChange={(e) => handleUpdate({ afterpaySecretKey: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* ADYEN CONTENT */}
            {!config.adyenDeleted && (
              <TabsContent value="adyen" className="m-0 space-y-6 animate-in fade-in duration-300">
                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Banknote className="h-5 w-5 text-[#00FF66]" />
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Adyen Global Payments</CardTitle>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch 
                          checked={config.adyenEnabled} 
                          onCheckedChange={(checked) => handleUpdate({ adyenEnabled: checked })}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors"
                          onClick={() => handleDeleteProtocol('adyen')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Checkout Descriptor</Label>
                          <Input 
                            value={config.adyenDescription || ''} 
                            onChange={(e) => handleUpdate({ adyenDescription: e.target.value })}
                            className="h-11 text-xs font-bold uppercase" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Estimated Processing Fee</Label>
                          <Input 
                            value={config.adyenFee || ''} 
                            onChange={(e) => handleUpdate({ adyenFee: e.target.value })}
                            className="h-11 text-xs font-mono" 
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-sm">
                        <p className="text-[9px] font-bold text-emerald-800 uppercase mb-1">Enterprise Protocol</p>
                        <p className="text-[10px] text-emerald-700 leading-relaxed uppercase font-medium">Adyen facilitates multi-currency settlement and local payment method mapping.</p>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-2 border-dashed rounded-none space-y-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-primary">Operation Mode</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant={config.adyenMode === 'test' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.adyenMode === 'test' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-white')}
                            onClick={() => handleUpdate({ adyenMode: 'test' })}
                          >
                            Sandbox
                          </Button>
                          <Button 
                            variant={config.adyenMode === 'live' ? 'default' : 'outline'}
                            className={cn("flex-1 h-11 text-[9px] font-bold uppercase tracking-widest", config.adyenMode === 'live' ? 'bg-green-600 hover:bg-green-700' : 'bg-white')}
                            onClick={() => handleUpdate({ adyenMode: 'live' })}
                          >
                            Production
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Publishable Key</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              value={config.adyenMerchantAccount || ''} 
                              onChange={(e) => handleUpdate({ adyenMerchantAccount: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Secret ID</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              type="password"
                              value={config.adyenApiKey || ''} 
                              onChange={(e) => handleUpdate({ adyenApiKey: e.target.value })}
                              className="pl-10 h-11 font-mono text-xs" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="vault" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
                <CardHeader className="bg-zinc-900 text-white border-b p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-zinc-400" />
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Manual API Vault</CardTitle>
                      <CardDescription className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Manage manual gateway integrations and forensics.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {(config.customGateways || []).map((gateway: CustomGateway) => (
                      <div key={gateway.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded border flex items-center justify-center font-bold text-xs shrink-0", gateway.enabled ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-400')}>
                            {gateway.name.substring(0, 2)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-tight">{gateway.name}</p>
                            <div className="flex items-center gap-2">
                              <code className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded font-mono text-muted-foreground">{gateway.apiKey.substring(0, 12)}••••</code>
                              <Badge variant="outline" className={cn("text-[7px] font-bold uppercase border-none px-1.5 h-4", gateway.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400")}>
                                {gateway.enabled ? 'Active' : 'Disabled'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-3 sm:pt-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest sm:hidden">Enabled</span>
                            <Switch 
                              checked={gateway.enabled} 
                              onCheckedChange={(checked) => {
                                const updated = config.customGateways.map((g: any) => 
                                  g.id === gateway.id ? { ...g, enabled: checked } : g
                                );
                                handleUpdate({ customGateways: updated });
                              }}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveGateway(gateway.id)}
                            className="h-9 w-9 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!config.customGateways || config.customGateways.length === 0) && (
                      <div className="py-16 text-center">
                        <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">No custom gateways in the vault.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scope" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Regional Compliance & Currencies</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Accepted Currencies</Label>
                    <div className="flex flex-wrap gap-2">
                      {['USD', 'CAD', 'GBP', 'EUR', 'JPY', 'AUD'].map((curr) => (
                        <button
                          key={curr}
                          onClick={() => {
                            const current = config.acceptedCurrencies || [];
                            const updated = current.includes(curr) 
                              ? current.filter((c: string) => c !== curr)
                              : [...current, curr];
                            handleUpdate({ acceptedCurrencies: updated });
                          }}
                          className={cn(
                            "px-4 py-2 text-[10px] font-bold border transition-all",
                            config.acceptedCurrencies?.includes(curr) 
                              ? "bg-black text-white border-black" 
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                          )}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-sm">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-red-800 uppercase flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5" /> High-Risk Geo Blocking
                      </p>
                      <p className="text-[10px] text-red-700 uppercase tracking-tight opacity-70 font-medium">Block transactions from sanctioned or high-risk architectural zones.</p>
                    </div>
                    <Switch 
                      checked={config.geoBlockingEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ geoBlockingEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-sm">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-blue-800 uppercase flex items-center gap-2">
                        <Scale className="h-3.5 w-3.5" /> Automated Sales Tax (Nexus)
                      </p>
                      <p className="text-[10px] text-blue-700 uppercase tracking-tight opacity-70 font-medium">Calculate dynamic VAT/GST and local taxes in real-time across 12,000+ jurisdictions.</p>
                    </div>
                    <Switch 
                      checked={config.taxCloudEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ taxCloudEnabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="express" className="m-0 space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Apple className="h-5 w-5" />
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Apple Pay</CardTitle>
                      </div>
                      <Switch 
                        checked={config.applePayEnabled} 
                        onCheckedChange={(checked) => handleUpdate({ applePayEnabled: checked })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 p-4 sm:p-6">
                    <p className="text-[11px] text-[#5c5f62] leading-relaxed uppercase font-bold tracking-tight">
                      Frictionless biometric checkout. Requires domain validation via Stripe or Adyen.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-[#4285F4]" />
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">Google Pay</CardTitle>
                      </div>
                      <Switch 
                        checked={config.googlePayEnabled} 
                        onCheckedChange={(checked) => handleUpdate({ googlePayEnabled: checked })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 p-4 sm:p-6">
                    <p className="text-[11px] text-[#5c5f62] leading-relaxed uppercase font-bold tracking-tight">
                      Express checkout for Android and Chrome. One-tap payment using stored archival data.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none overflow-hidden">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-red-400" /> AI Fraud Guard
                </CardTitle>
                <Badge variant="outline" className="text-red-400 border-red-400/20 bg-red-400/10 uppercase text-[8px] font-bold">Shield Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase font-bold text-gray-400">Security Intensity</Label>
                  <span className="text-[9px] font-mono font-bold text-white uppercase">{config.fraudGuardLevel || 'HIGH'}</span>
                </div>
                <div className="flex gap-1">
                  {['LOW', 'MEDIUM', 'HIGH', 'MAX'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleUpdate({ fraudGuardLevel: level })}
                      className={cn(
                        "flex-1 py-2 text-[8px] font-bold border transition-all",
                        (config.fraudGuardLevel || 'HIGH') === level 
                          ? "bg-red-50 border-red-500 text-white" 
                          : "border-white/10 text-gray-500 hover:border-white/30"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase">Enforce 3D Secure</p>
                  <p className="text-[8px] text-gray-500 uppercase font-bold">Strong Auth Handshake</p>
                </div>
                <Switch 
                  checked={config.threeDSecureEnabled} 
                  onCheckedChange={(checked) => handleUpdate({ threeDSecureEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-gray-50 border rounded-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Operational Integrity
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold opacity-70">
              Payment protocol changes apply to the live production manifest. Ensure all keys are validated before finalizing.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t">
        <Button 
          className="w-full sm:w-auto bg-black text-white h-14 px-12 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out" 
          onClick={handleSaveAll}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Synchronize Payment Core
        </Button>
      </div>
    </div>
  );
}
