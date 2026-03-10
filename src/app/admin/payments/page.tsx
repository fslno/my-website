'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Smartphone
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PaymentsPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: config, loading } = useDoc(configRef);
  const { toast } = useToast();

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      stripeEnabled: true,
      stripeMode: 'test',
      stripePublishableKey: 'pk_test_fslno_sample_key',
      stripeSecretKey: 'sk_test_fslno_sample_key',
      paypalEnabled: true,
      paypalMode: 'sandbox',
      paypalClientId: 'fslno_sandbox_client_id',
      paypalPayLaterEnabled: true,
      klarnaEnabled: false,
      klarnaClientId: '',
      klarnaClientSecret: '',
      afterpayEnabled: false,
      afterpayMerchantId: '',
      afterpaySecretKey: '',
      adyenEnabled: false,
      adyenMerchantAccount: '',
      adyenApiKey: '',
      applePayEnabled: true,
      googlePayEnabled: true
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
        <CreditCard className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Payments Not Initialized</h2>
        <p className="text-gray-500 max-w-sm">Configure your global gateways to start accepting luxury payments across the archive.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8 h-12 font-bold uppercase tracking-widest text-[10px]">Initialize Payment Core</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Global Payment Gateways</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage secure checkout integrations for 135+ currencies and BNPL methods.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 py-1 px-3 flex items-center gap-2 font-bold uppercase text-[9px] tracking-widest">
            <ShieldCheck className="h-3 w-3" /> PCI DSS Compliant
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Tabs defaultValue="stripe" className="w-full">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="bg-white border w-full justify-start h-14 p-1 gap-2 rounded-none mb-6 min-w-[600px]">
                <TabsTrigger value="stripe" className="gap-2 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-black data-[state=active]:text-white">
                  <Zap className="h-3.5 w-3.5" /> Stripe
                </TabsTrigger>
                <TabsTrigger value="paypal" className="gap-2 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-[#0070BA] data-[state=active]:text-white">
                  <Globe className="h-3.5 w-3.5" /> PayPal
                </TabsTrigger>
                <TabsTrigger value="klarna" className="gap-2 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-[#FFB3C7] data-[state=active]:text-black">
                  <Coins className="h-3.5 w-3.5" /> Klarna
                </TabsTrigger>
                <TabsTrigger value="afterpay" className="gap-2 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-[#B2FCE4] data-[state=active]:text-black">
                  <History className="h-3.5 w-3.5" /> Afterpay
                </TabsTrigger>
                <TabsTrigger value="adyen" className="gap-2 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-[#00FF66] data-[state=active]:text-black">
                  <Banknote className="h-3.5 w-3.5" /> Adyen
                </TabsTrigger>
                <TabsTrigger value="express" className="gap-2 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-black data-[state=active]:text-white">
                  <Smartphone className="h-3.5 w-3.5" /> Express
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="stripe" className="m-0 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-[#635BFF]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Stripe Connect</CardTitle>
                    </div>
                    <Switch 
                      checked={config.stripeEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ stripeEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex gap-4 p-4 bg-gray-50 border border-dashed rounded-sm">
                    <div className="flex-1 space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Operation Mode</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant={config.stripeMode === 'test' ? 'default' : 'outline'}
                          size="sm"
                          className={cn("text-[9px] font-bold uppercase tracking-widest h-8 px-4", config.stripeMode === 'test' ? 'bg-orange-500 hover:bg-orange-600' : '')}
                          onClick={() => handleUpdate({ stripeMode: 'test' })}
                        >
                          Sandbox
                        </Button>
                        <Button 
                          variant={config.stripeMode === 'live' ? 'default' : 'outline'}
                          size="sm"
                          className={cn("text-[9px] font-bold uppercase tracking-widest h-8 px-4", config.stripeMode === 'live' ? 'bg-green-600 hover:bg-green-700' : '')}
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
                          value={config.stripePublishableKey} 
                          onChange={(e) => handleUpdate({ stripePublishableKey: e.target.value })}
                          className="pl-10 font-mono text-xs h-11" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Secret Key</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password"
                          value={config.stripeSecretKey} 
                          onChange={(e) => handleUpdate({ stripeSecretKey: e.target.value })}
                          className="pl-10 font-mono text-xs h-11" 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paypal" className="m-0 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-[#0070BA]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">PayPal Commerce</CardTitle>
                    </div>
                    <Switch 
                      checked={config.paypalEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ paypalEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[#0070BA]/5 border border-[#0070BA]/20 rounded-sm">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-[#0070BA] uppercase">PayPal Pay Later</p>
                      <p className="text-[10px] text-[#0070BA]/80 uppercase tracking-tight">Enable installment payments for clients.</p>
                    </div>
                    <Switch 
                      checked={config.paypalPayLaterEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ paypalPayLaterEnabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Merchant Client ID</Label>
                    <Input 
                      value={config.paypalClientId} 
                      onChange={(e) => handleUpdate({ paypalClientId: e.target.value })}
                      className="font-mono text-xs h-11" 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="klarna" className="m-0 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Coins className="h-5 w-5 text-[#FFB3C7]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Klarna Payments</CardTitle>
                    </div>
                    <Switch 
                      checked={config.klarnaEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ klarnaEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Client ID (API Key)</Label>
                      <Input 
                        value={config.klarnaClientId} 
                        onChange={(e) => handleUpdate({ klarnaClientId: e.target.value })}
                        className="font-mono text-xs h-11"
                        placeholder="K_..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Client Secret</Label>
                      <Input 
                        type="password"
                        value={config.klarnaClientSecret} 
                        onChange={(e) => handleUpdate({ klarnaClientSecret: e.target.value })}
                        className="font-mono text-xs h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="afterpay" className="m-0 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <History className="h-5 w-5 text-[#B2FCE4]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Afterpay / Clearpay</CardTitle>
                    </div>
                    <Switch 
                      checked={config.afterpayEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ afterpayEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Merchant ID</Label>
                      <Input 
                        value={config.afterpayMerchantId} 
                        onChange={(e) => handleUpdate({ afterpayMerchantId: e.target.value })}
                        className="font-mono text-xs h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Secret Key</Label>
                      <Input 
                        type="password"
                        value={config.afterpaySecretKey} 
                        onChange={(e) => handleUpdate({ afterpaySecretKey: e.target.value })}
                        className="font-mono text-xs h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adyen" className="m-0 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="bg-gray-50/50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-[#00FF66]" />
                      <CardTitle className="text-sm font-bold uppercase tracking-widest">Adyen Platform</CardTitle>
                    </div>
                    <Switch 
                      checked={config.adyenEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ adyenEnabled: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Merchant Account Name</Label>
                      <Input 
                        value={config.adyenMerchantAccount} 
                        onChange={(e) => handleUpdate({ adyenMerchantAccount: e.target.value })}
                        className="font-mono text-xs h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">API Key</Label>
                      <Input 
                        type="password"
                        value={config.adyenApiKey} 
                        onChange={(e) => handleUpdate({ adyenApiKey: e.target.value })}
                        className="font-mono text-xs h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="express" className="m-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b">
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
                  <CardContent className="pt-6">
                    <p className="text-[11px] text-[#5c5f62] leading-relaxed uppercase font-bold tracking-tight">
                      Frictionless biometric checkout. Requires domain validation via Stripe or Adyen.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-[#e1e3e5] shadow-none rounded-none">
                  <CardHeader className="bg-gray-50/50 border-b">
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
                  <CardContent className="pt-6">
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
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Checkout Guard</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase">3D Secure 2.0</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">Strong Authentication Active</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase">Tokenization</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">PCI-Compliant Handshake</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Merchant Access</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
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
              <Button variant="outline" className="w-full justify-between text-[10px] font-bold uppercase h-11 border-black" asChild>
                <a href="https://ca-test.adyen.com/ca/ca/login.shtml" target="_blank">
                  Adyen Customer Area <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <div className="p-6 bg-gray-50 border rounded-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" /> Integration Note
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tight">
              Payment changes strictly apply to the live checkout orchestration. Ensure all API keys are validated in your merchant dashboards before committing.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t">
        <Button 
          className="bg-black text-white h-14 px-12 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300" 
          onClick={() => toast({ title: "Gateways Saved", description: "Global checkout configurations are now live." })}
        >
          Save All Gateway Settings
        </Button>
      </div>
    </div>
  );
}
