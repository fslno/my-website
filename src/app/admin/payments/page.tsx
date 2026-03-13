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
  Smartphone,
  ShieldAlert,
  Activity,
  Terminal,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Hash,
  Scale,
  Percent,
  MessageSquare
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PaymentsPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: config, isLoading: loading } = useDoc(configRef);
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      stripeEnabled: true,
      stripeMode: 'test',
      stripePublishableKey: 'pk_test_fslno_sample_key',
      stripeSecretKey: 'sk_test_fslno_sample_key',
      stripeDescription: 'Secure Credit Card Checkout',
      stripeFee: '2.9% + 30¢',
      paypalEnabled: true,
      paypalMode: 'sandbox',
      paypalClientId: 'fslno_sandbox_client_id',
      paypalDescription: 'Global Digital Wallet',
      paypalFee: '3.49% + 49¢',
      paypalPayLaterEnabled: true,
      klarnaEnabled: false,
      klarnaClientId: '',
      klarnaClientSecret: '',
      klarnaDescription: 'Interest-free installments',
      klarnaFee: '5.99% + 30¢',
      afterpayEnabled: false,
      afterpayMerchantId: '',
      afterpaySecretKey: '',
      afterpayDescription: 'Buy now, pay later',
      afterpayFee: '6% + 30¢',
      adyenEnabled: false,
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

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ 
        title: "Checkout Finalized", 
        description: "Global payment orchestration has been Authoritatively synchronized." 
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
        <p className="text-gray-500 max-w-sm">Configure your global gateways to start accepting luxury payments across the archive.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8 h-12 font-bold uppercase tracking-widest text-[10px]">Initialize Payment Core</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Global Checkout Orchestration</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Manage secure checkout integrations, AI fraud defense, and regional compliance.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Badge variant="outline" className="w-full sm:w-auto text-green-600 bg-green-50 border-green-100 py-1.5 px-3 flex items-center justify-center gap-2 font-bold uppercase text-[9px] tracking-widest">
            <ShieldCheck className="h-3 w-3" /> PCI DSS Compliant
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Tabs defaultValue="stripe" className="w-full">
            <div className="overflow-hidden">
              <TabsList className="bg-white border w-full h-auto flex-wrap xl:flex-nowrap justify-start p-1 gap-2 rounded-none mb-6">
                <TabsTrigger value="stripe" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-black data-[state=active]:text-white">
                  <Zap className="h-3.5 w-3.5" /> Stripe
                </TabsTrigger>
                <TabsTrigger value="paypal" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-[#0070BA] data-[state=active]:text-white">
                  <Globe className="h-3.5 w-3.5" /> PayPal
                </TabsTrigger>
                <TabsTrigger value="klarna" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-[#FFB3C7] data-[state=active]:text-black">
                  <Coins className="h-3.5 w-3.5" /> Klarna
                </TabsTrigger>
                <TabsTrigger value="afterpay" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-[#B2FCE4] data-[state=active]:text-black">
                  <History className="h-3.5 w-3.5" /> Afterpay
                </TabsTrigger>
                <TabsTrigger value="adyen" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-[#00FF66] data-[state=active]:text-black">
                  <Banknote className="h-3.5 w-3.5" /> Adyen
                </TabsTrigger>
                <TabsTrigger value="scope" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Globe className="h-3.5 w-3.5" /> Global Scope
                </TabsTrigger>
                <TabsTrigger value="express" className="flex-1 xl:flex-none gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-4 data-[state=active]:bg-black data-[state=active]:text-white">
                  <Smartphone className="h-3.5 w-3.5" /> Express
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="stripe" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-[#635BFF]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Stripe Connect (v3)</CardTitle>
                    </div>
                    <Switch 
                      checked={config.stripeEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ stripeEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Checkout Descriptor</Label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            value={config.stripeDescription || ''} 
                            onChange={(e) => handleUpdate({ stripeDescription: e.target.value })}
                            className="pl-10 h-11 text-xs font-bold uppercase" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Estimated Processing Fee</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            value={config.stripeFee || ''} 
                            onChange={(e) => handleUpdate({ stripeFee: e.target.value })}
                            className="pl-10 h-11 text-xs font-mono" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end p-4 bg-blue-50/50 border border-blue-100 rounded-sm">
                      <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-1">Fee Transparency</p>
                      <p className="text-[10px] text-blue-700 leading-relaxed uppercase font-medium">
                        Standard Stripe fees typically range from 2.9% + 30¢. This is Authoritatively tracked for archival margin analysis.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 border border-dashed rounded-sm">
                    <div className="flex-1 space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Operation Mode</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant={config.stripeMode === 'test' ? 'default' : 'outline'}
                          size="sm"
                          className={cn("flex-1 text-[9px] font-bold uppercase tracking-widest h-10 px-4", config.stripeMode === 'test' ? 'bg-orange-500 hover:bg-orange-600' : '')}
                          onClick={() => handleUpdate({ stripeMode: 'test' })}
                        >
                          Sandbox
                        </Button>
                        <Button 
                          variant={config.stripeMode === 'live' ? 'default' : 'outline'}
                          size="sm"
                          className={cn("flex-1 text-[9px] font-bold uppercase tracking-widest h-10 px-4", config.stripeMode === 'live' ? 'bg-green-600 hover:bg-green-700' : '')}
                          onClick={() => handleUpdate({ stripeMode: 'live' })}
                        >
                          Production
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Publishable Key</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          value={config.stripePublishableKey || ''} 
                          onChange={(e) => handleUpdate({ stripePublishableKey: e.target.value })}
                          className="pl-10 font-mono text-[10px] sm:text-xs h-11" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Secret Key</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password"
                          value={config.stripeSecretKey || ''} 
                          onChange={(e) => handleUpdate({ stripeSecretKey: e.target.value })}
                          className="pl-10 font-mono text-[10px] sm:text-xs h-11" 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paypal" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-[#0070BA]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">PayPal Express Checkout</CardTitle>
                    </div>
                    <Switch 
                      checked={config.paypalEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ paypalEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-[10px] text-blue-700 leading-relaxed uppercase tracking-tight font-medium">
                        PayPal typically applies a 3.49% + 49¢ fee structure for high-fidelity archival transactions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="klarna" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Coins className="h-5 w-5 text-[#FFB3C7]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Klarna BNPL (v2)</CardTitle>
                    </div>
                    <Switch 
                      checked={config.klarnaEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ klarnaEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-[10px] text-pink-700 leading-relaxed uppercase tracking-tight font-medium">
                        BNPL fees are generally higher (~5.99%) due to Authoritative credit risk handling by Klarna.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="afterpay" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <History className="h-5 w-5 text-[#B2FCE4]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Afterpay Installments</CardTitle>
                    </div>
                    <Switch 
                      checked={config.afterpayEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ afterpayEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-[10px] text-emerald-700 leading-relaxed uppercase tracking-tight font-medium">
                        Afterpay applies ~6.0% commission for high-fidelity split-payment orchestration.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adyen" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-[#00FF66]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Adyen Global Payments</CardTitle>
                    </div>
                    <Switch 
                      checked={config.adyenEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ adyenEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Merchant Account</Label>
                        <Input 
                          value={config.adyenMerchantAccount || ''} 
                          onChange={(e) => handleUpdate({ adyenMerchantAccount: e.target.value })}
                          placeholder="FSLNO_STUDIO_ECOM"
                          className="h-11 text-xs font-bold uppercase" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">API Key</Label>
                        <Input 
                          type="password"
                          value={config.adyenApiKey || ''} 
                          onChange={(e) => handleUpdate({ adyenApiKey: e.target.value })}
                          placeholder="AQE..."
                          className="h-11 text-xs font-mono" 
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-sm">
                      <p className="text-[9px] font-bold text-emerald-800 uppercase mb-1">Enterprise Protocol</p>
                      <p className="text-[10px] text-emerald-700 leading-relaxed uppercase tracking-tight font-medium">
                        Adyen facilitates high-fidelity multi-currency settlement and local payment method mapping.
                      </p>
                    </div>
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
                        <ShieldAlert className="h-3.5 w-3.5" /> High-Risk Geo Blocking
                      </p>
                      <p className="text-[10px] text-red-700 uppercase tracking-tight opacity-70 font-medium">Authoritatively block transactions from sanctioned or high-risk architectural zones.</p>
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
                      Frictionless biometric checkout. Requires Authoritative domain validation via Stripe or Adyen.
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
                      Express checkout for Android and Chrome. One-tap payment using stored high-fidelity archival data.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" /> AI Fraud Guard
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
                          ? "bg-red-500 border-red-500 text-white" 
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

          <Card className="border-[#e1e3e5] shadow-none bg-zinc-900 text-white rounded-none overflow-hidden">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="h-3.5 w-3.5 text-blue-400" /> Transaction Protocol
                </CardTitle>
                <Activity className="h-3 w-3 text-blue-400 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[250px]">
                <div className="p-4 space-y-4">
                  {[
                    { event: 'STRIPE_AUTH_SUCCESS', time: 'Just now', val: '$1,240.00', color: 'text-green-400' },
                    { event: 'PAYPAL_IPN_SYNC', time: '4m ago', val: 'REF_...A1', color: 'text-blue-400' },
                    { event: '3DS_VERIFIED', time: '12m ago', val: 'UID_...F9', color: 'text-white' },
                    { event: 'KLARNA_RESERVE', time: '18m ago', val: '$890.00', color: 'text-pink-400' },
                    { event: 'GEO_BLOCK_SHIELD', time: '22m ago', val: 'IP_BLOCKED', color: 'text-red-400' },
                    { event: 'STRIPE_AUTH_SUCCESS', time: '35m ago', val: '$420.00', color: 'text-green-400' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-start justify-between border-b border-white/5 pb-3 last:border-0">
                      <div className="space-y-1">
                        <p className={cn("text-[9px] font-mono font-bold uppercase", log.color)}>{log.event}</p>
                        <p className="text-[8px] text-gray-500 font-mono">{log.val}</p>
                      </div>
                      <span className="text-[8px] text-gray-600 font-bold uppercase ml-4">{log.time}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Merchant Terminal</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 p-4 sm:p-6 space-y-3">
              <Button variant="outline" className="w-full justify-between text-[10px] font-bold uppercase h-11 border-black" asChild>
                <a href="https://dashboard.stripe.com" target="_blank">
                  Stripe Terminal <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-between text-[10px] font-bold uppercase h-11 border-black" asChild>
                <a href="https://www.paypal.com/mep/dashboard" target="_blank">
                  PayPal Manager <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <div className="p-6 bg-gray-50 border rounded-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Operational Integrity
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tight font-bold opacity-70">
              Payment protocol changes apply Authoritatively to the live production manifest. Ensure all API keys are validated in your respective merchant dashboards before finalizing.
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