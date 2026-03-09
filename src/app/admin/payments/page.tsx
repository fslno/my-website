
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
  RefreshCw,
  Apple,
  Globe,
  Loader2,
  Lock,
  ExternalLink
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
        <p className="text-gray-500 max-w-sm">Configure your Stripe and PayPal gateways to start accepting luxury payments globally.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8">Initialize Payment Core</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Global Payment Gateways</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage secure checkout integrations for 135+ currencies and express methods.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 py-1 px-3 flex items-center gap-2">
            <ShieldCheck className="h-3 w-3" /> PCI DSS Compliant
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Tabs defaultValue="stripe" className="w-full">
            <TabsList className="bg-white border w-full justify-start h-12 p-1 gap-2">
              <TabsTrigger value="stripe" className="gap-2 data-[state=active]:bg-[#635BFF] data-[state=active]:text-white">
                <Zap className="h-4 w-4" /> Stripe
              </TabsTrigger>
              <TabsTrigger value="paypal" className="gap-2 data-[state=active]:bg-[#0070BA] data-[state=active]:text-white">
                <Globe className="h-4 w-4" /> PayPal
              </TabsTrigger>
              <TabsTrigger value="express" className="gap-2">
                <Zap className="h-4 w-4" /> Express Checkout
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stripe" className="mt-6 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[#635BFF]" />
                      <CardTitle className="text-lg">Stripe (The Core)</CardTitle>
                    </div>
                    <Switch 
                      checked={config.stripeEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ stripeEnabled: checked })}
                    />
                  </div>
                  <CardDescription>
                    Primary engine for Credit Cards, iDEAL, Klarna, and Bancontact.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="flex-1 space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Operation Mode</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant={config.stripeMode === 'test' ? 'default' : 'outline'}
                          size="sm"
                          className={config.stripeMode === 'test' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                          onClick={() => handleUpdate({ stripeMode: 'test' })}
                        >
                          Test Mode
                        </Button>
                        <Button 
                          variant={config.stripeMode === 'live' ? 'default' : 'outline'}
                          size="sm"
                          className={config.stripeMode === 'live' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => handleUpdate({ stripeMode: 'live' })}
                        >
                          Live Mode
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="secondary" className="bg-white border text-[10px]">
                        Supports 135+ Currencies
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Publishable Key</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          value={config.stripePublishableKey} 
                          onChange={(e) => handleUpdate({ stripePublishableKey: e.target.value })}
                          className="pl-10 font-mono text-xs" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Secret Key</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password"
                          value={config.stripeSecretKey} 
                          onChange={(e) => handleUpdate({ stripeSecretKey: e.target.value })}
                          className="pl-10 font-mono text-xs" 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paypal" className="mt-6 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-[#0070BA]" />
                      <CardTitle className="text-lg">PayPal Commerce Platform</CardTitle>
                    </div>
                    <Switch 
                      checked={config.paypalEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ paypalEnabled: checked })}
                    />
                  </div>
                  <CardDescription>
                    Essential for global trust. Managed via Smart Payment Buttons.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[#0070BA]/5 border border-[#0070BA]/20 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#0070BA]">PayPal Pay Later</p>
                      <p className="text-xs text-[#0070BA]/80">Offer 4 interest-free payments to increase AOV.</p>
                    </div>
                    <Switch 
                      checked={config.paypalPayLaterEnabled} 
                      onCheckedChange={(checked) => handleUpdate({ paypalPayLaterEnabled: checked })}
                    />
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Client ID</Label>
                      <Input 
                        value={config.paypalClientId} 
                        onChange={(e) => handleUpdate({ paypalClientId: e.target.value })}
                        className="font-mono text-xs" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="express" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-[#e1e3e5] shadow-none">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Apple className="h-5 w-5" />
                        <CardTitle className="text-lg">Apple Pay</CardTitle>
                      </div>
                      <Switch 
                        checked={config.applePayEnabled} 
                        onCheckedChange={(checked) => handleUpdate({ applePayEnabled: checked })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-[#5c5f62] leading-relaxed">
                      High-priority "Buy Now" button on product pages. Bypasses entire address form using biometric authentication.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-[#e1e3e5] shadow-none">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-[#4285F4]" />
                        <CardTitle className="text-lg">Google Pay</CardTitle>
                      </div>
                      <Switch 
                        checked={config.googlePayEnabled} 
                        onCheckedChange={(checked) => handleUpdate({ googlePayEnabled: checked })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-[#5c5f62] leading-relaxed">
                      Frictionless checkout for Chrome and Android users. One-tap ordering with stored credit cards and addresses.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
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
                  <p className="text-xs font-bold">3D Secure 2.0</p>
                  <p className="text-[10px] text-gray-400">Strong Customer Authentication active.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold">Tokenized Payments</p>
                  <p className="text-[10px] text-gray-400">Card data never touches your server.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Merchant Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between text-xs h-9" asChild>
                <a href="https://dashboard.stripe.com" target="_blank">
                  Open Stripe Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-between text-xs h-9" asChild>
                <a href="https://www.paypal.com/mep/dashboard" target="_blank">
                  Open PayPal Manager <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="bg-black text-white h-11 px-8 font-bold" onClick={() => toast({ title: "Payments Saved", description: "Global checkout configurations are now live." })}>
          Save Gateway Settings
        </Button>
      </div>
    </div>
  );
}
