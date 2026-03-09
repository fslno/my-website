
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Zap, 
  Target, 
  UserCheck, 
  TrendingDown, 
  TrendingUp,
  Loader2,
  Activity,
  MousePointer2,
  RefreshCw
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function AnalyticsPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'analytics') : null, [db]);
  const { data: config, loading } = useDoc(configRef);
  const { toast } = useToast();

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      ga4MeasurementId: 'G-FSLNO777888',
      funnelTrackingEnabled: true,
      predictiveAudiencesEnabled: true,
      userIdTrackingEnabled: true,
      churnProbabilityEnabled: true,
      purchaseProbabilityEnabled: true
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
        <BarChart3 className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">GA4 Analytics Not Initialized</h2>
        <p className="text-gray-500 max-w-sm">Connect your FSLNO storefront to Google Analytics 4 to enable advanced funnel tracking and predictive insights.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8">Initialize GA4 Core</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">GA4 & Predictive Analytics</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage custom funnel events and Google AI-driven audience predictions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 gap-2 border-[#babfc3]">
            <RefreshCw className="h-4 w-4" /> Reset Streams
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Real-time Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              42
            </div>
            <p className="text-xs text-[#8c9196] mt-1">Currently active on FSLNO.com</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">3.8%</div>
            <p className="text-xs text-[#8c9196] mt-1">+0.4% from last 24h</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">High-Intent Audiences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">1,204</div>
            <p className="text-xs text-[#8c9196] mt-1">Identified by Google AI</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Custom Funnel Tracking</CardTitle>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50">Active</Badge>
            </div>
            <CardDescription>
              Measure specific interaction points in the "Spot Closing" journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border">
                <div className="space-y-1">
                  <span className="text-sm font-bold flex items-center gap-2">
                    <MousePointer2 className="h-4 w-4" /> view_item_list
                  </span>
                  <p className="text-xs text-[#5c5f62]">Tracks which FSLNO category (e.g., "Outerwear") gets the most impressions.</p>
                </div>
                <Switch 
                  checked={config.funnelTrackingEnabled} 
                  onCheckedChange={(checked) => handleUpdate({ funnelTrackingEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Checkout Drop-off Analysis</p>
                  <p className="text-xs text-[#5c5f62]">Pinpoints exactly where users drop off between add_to_cart and begin_checkout.</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 border-[#babfc3]">View Funnel</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Predictive Audiences (Google AI)</CardTitle>
            </div>
            <CardDescription>
              Leverage machine learning to anticipate customer behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" /> Churn Probability
                  </span>
                  <Switch 
                    checked={config.churnProbabilityEnabled} 
                    onCheckedChange={(checked) => handleUpdate({ churnProbabilityEnabled: checked })}
                  />
                </div>
                <p className="text-xs text-[#5c5f62] leading-relaxed">
                  Identify users likely to stop visiting so you can send automated "Come Back" discounts via Firebase Cloud Messaging.
                </p>
              </div>
              <div className="p-4 border rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" /> 7-day Purchasers
                  </span>
                  <Switch 
                    checked={config.purchaseProbabilityEnabled} 
                    onCheckedChange={(checked) => handleUpdate({ purchaseProbabilityEnabled: checked })}
                  />
                </div>
                <p className="text-xs text-[#5c5f62] leading-relaxed">
                  Creates high-intent audiences that automatically sync with Google Ads for "Spot Closing" retargeting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Cross-Device User ID Tracking</CardTitle>
              </div>
              <Switch 
                checked={config.userIdTrackingEnabled} 
                onCheckedChange={(checked) => handleUpdate({ userIdTrackingEnabled: checked })}
              />
            </div>
            <CardDescription>
              Stitch together user sessions across mobile and desktop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-md">
              <div className="flex gap-3">
                <Target className="h-5 w-5 text-purple-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-purple-900">Unified Customer Journey</p>
                  <p className="text-xs text-purple-800 leading-relaxed">
                    Connects behavior if a user browses on their phone during lunch but finishes the purchase on their desktop at home. Requires "Login" event.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">GA4 Measurement ID</Label>
              <Input 
                value={config.ga4MeasurementId} 
                onChange={(e) => handleUpdate({ ga4MeasurementId: e.target.value })}
                className="bg-[#f1f2f3]" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="bg-black text-white h-11 px-8 font-bold" onClick={() => toast({ title: "Analytics Saved", description: "GA4 streaming configurations are live." })}>
          Save Analytics Settings
        </Button>
      </div>
    </div>
  );
}
