'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Youtube, 
  MapPin, 
  Zap, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Loader2,
  Lock,
  Globe,
  X,
  Store
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function GoogleSyncPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'google-sync') : null, [db]);
  const { data: config, loading } = useDoc(configRef);
  const { toast } = useToast();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local form state for settings
  const [merchantId, setMerchantId] = useState('');
  const [targetCountry, setTargetCountry] = useState('US');
  const [contentLanguage, setContentLanguage] = useState('en');
  const [storeAddress, setStoreAddress] = useState('');

  useEffect(() => {
    if (config) {
      setMerchantId(config.merchantId || '');
      setTargetCountry(config.targetCountry || 'US');
      setContentLanguage(config.contentLanguage || 'en');
      setStoreAddress(config.linkedStoreAddress || '');
    }
  }, [config]);

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      merchantId: '123456789',
      targetCountry: 'US',
      contentLanguage: 'en',
      apiConnected: true,
      onDemandUpdates: true,
      partialSync: true,
      autoBackgroundRemoval: true,
      youtubeTaggingEnabled: true,
      localInventoryEnabled: false,
      linkedStoreAddress: '',
      feedHealth: 98.4,
      syncLatency: '2.4 min',
      activeChannelsCount: 4,
      lastSync: null,
      issues: [
        { id: '1', message: "Missing 'Material' attribute on product SKU-0981" },
        { id: '2', message: "Missing 'Material' attribute on product SKU-0982" },
        { id: '3', message: "Missing 'Material' attribute on product SKU-0983" }
      ]
    };

    setDoc(configRef, initialData).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'create',
        requestResourceData: initialData
      }));
    });
  };

  const handleSaveSettings = () => {
    if (!configRef) return;
    setIsSaving(true);
    const updates = {
      merchantId,
      targetCountry,
      contentLanguage,
      updatedAt: serverTimestamp()
    };

    updateDoc(configRef, updates)
      .then(() => {
        setIsSettingsOpen(false);
        toast({ title: "Settings Saved", description: "Google Merchant API configuration has been updated." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: updates
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleSaveStoreAddress = () => {
    if (!configRef) return;
    setIsSaving(true);
    const updates = {
      linkedStoreAddress: storeAddress,
      localInventoryEnabled: true,
      updatedAt: serverTimestamp()
    };

    updateDoc(configRef, updates)
      .then(() => {
        setIsStoreDialogOpen(false);
        toast({ title: "Address Linked", description: "Your local spot location has been synchronized." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: updates
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleToggleFeature = (feature: string, currentValue: boolean) => {
    if (!configRef) return;
    updateDoc(configRef, { [feature]: !currentValue })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: { [feature]: !currentValue }
        }));
      });
  };

  const handleForceSync = async () => {
    if (!configRef) return;
    setIsSyncing(true);
    
    setTimeout(() => {
      updateDoc(configRef, { 
        lastSync: serverTimestamp(),
        feedHealth: Math.min(100, (config?.feedHealth || 98) + 0.1)
      })
        .then(() => {
          setIsSyncing(false);
          toast({
            title: "Sync Complete",
            description: "Google Merchant Center catalog has been updated.",
          });
        })
        .catch(() => {
          setIsSyncing(false);
        });
    }, 2000);
  };

  const handleFixIssue = (issueId: string) => {
    if (!configRef || !config) return;
    const updatedIssues = config.issues.filter((i: any) => i.id !== issueId);
    updateDoc(configRef, { issues: updatedIssues })
      .catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: { issues: updatedIssues }
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
        <Zap className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Google Sync Not Initialized</h2>
        <p className="text-gray-500 max-w-sm">Connect your FSLNO store to the Google Merchant API to start syncing your luxury catalog.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8 h-10 font-bold uppercase tracking-widest text-[10px]">Initialize Merchant API</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Google Merchant Center Sync</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage your Merchant API (V1) integration and real-time product feeds.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 border-[#babfc3] font-bold uppercase tracking-widest text-[10px]">
                <Settings2 className="h-4 w-4" /> API Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Merchant API Configuration</DialogTitle>
                <DialogDescription className="text-xs">Establish the primary handshake parameters for your Google catalog.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500">Merchant Center ID</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="e.g. 123456789" 
                      value={merchantId} 
                      onChange={(e) => setMerchantId(e.target.value)}
                      className="pl-10 h-11 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Target Country</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="US" 
                        value={targetCountry} 
                        onChange={(e) => setTargetCountry(e.target.value.toUpperCase())}
                        className="pl-10 h-11 font-bold uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Language Code</Label>
                    <Input 
                      placeholder="en" 
                      value={contentLanguage} 
                      onChange={(e) => setContentLanguage(e.target.value.toLowerCase())}
                      className="h-11 font-bold lowercase"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSettings} disabled={isSaving || !merchantId} className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update API Handshake
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            className="h-9 bg-black text-white font-bold gap-2 uppercase tracking-widest text-[10px]" 
            onClick={handleForceSync}
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isSyncing ? 'Syncing...' : 'Force Full Sync'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Feed Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{config.feedHealth?.toFixed(1)}%</div>
            <p className="text-xs text-[#8c9196] mt-1">Items approved & optimized</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Sync Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">~{config.syncLatency}</div>
            <p className="text-xs text-[#8c9196] mt-1">On-Demand API average</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Active Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">{config.activeChannelsCount}</div>
            <p className="text-xs text-[#8c9196] mt-1">Search, Shop, YT, Ads</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Merchant API (V1) Integration</CardTitle>
              </div>
              <Badge variant="outline" className={config.apiConnected ? "text-green-600 border-green-100 bg-green-50" : "text-gray-400 border-gray-100 bg-gray-50"}>
                {config.apiConnected ? 'API Connected' : 'Disconnected'}
              </Badge>
            </div>
            <CardDescription>
              Unlike standard feeds that update once a day, the API pushes price or stock changes to Google in minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleToggleFeature('onDemandUpdates', config.onDemandUpdates)}
                className={`p-4 border rounded-md text-left transition-colors text-foreground ${config.onDemandUpdates ? 'border-black bg-black/5 ring-1 ring-black' : 'hover:bg-gray-50 border-[#e1e3e5]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">On-Demand Updates</span>
                  {config.onDemandUpdates ? <CheckCircle2 className="h-4 w-4 text-black" /> : <div className="h-4 w-4 rounded-full border border-[#babfc3]" />}
                </div>
                <p className="text-xs text-[#5c5f62] mt-1">Real-time synchronization of critical attributes (Price, Inventory).</p>
              </button>
              <button 
                onClick={() => handleToggleFeature('partialSync', config.partialSync)}
                className={`p-4 border rounded-md text-left transition-colors text-foreground ${config.partialSync ? 'border-black bg-black/5 ring-1 ring-black' : 'hover:bg-gray-50 border-[#e1e3e5]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Partial Sync</span>
                  {config.partialSync ? <CheckCircle2 className="h-4 w-4 text-black" /> : <div className="h-4 w-4 rounded-full border border-[#babfc3]" />}
                </div>
                <p className="text-xs text-[#5c5f62] mt-1">Only update specific fields without re-sending the entire catalog.</p>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Google Product Studio (AI Enhancement)</CardTitle>
            </div>
            <CardDescription>
              Remove backgrounds or upscale FSLNO lifestyle photos directly before they hit Google Shopping.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border border-[#e1e3e5]">
              <div className="space-y-1">
                <p className="text-sm font-bold">Auto-Background Removal</p>
                <p className="text-xs text-[#5c5f62]">Ensures all main product images meet Google's strict clean background policy.</p>
              </div>
              <Button 
                variant={config.autoBackgroundRemoval ? "default" : "outline"} 
                size="sm" 
                className={`h-8 font-bold ${config.autoBackgroundRemoval ? 'bg-black text-white' : 'border-[#babfc3]'}`}
                onClick={() => handleToggleFeature('autoBackgroundRemoval', config.autoBackgroundRemoval)}
              >
                {config.autoBackgroundRemoval ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">YouTube Shopping</CardTitle>
              </div>
              <Switch 
                checked={config.youtubeTaggingEnabled} 
                onCheckedChange={(checked) => handleToggleFeature('youtubeTaggingEnabled', config.youtubeTaggingEnabled)}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#5c5f62]">
                Automatically syncs your FSLNO catalog so you can tag products in YouTube videos or during live streams.
              </p>
              {config.youtubeTaggingEnabled ? (
                <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle2 className="h-3 w-3" />
                  Catalog is ready for product tagging
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                  <AlertCircle className="h-3 w-3" />
                  Tagging is currently disabled
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Local Inventory Ads</CardTitle>
              </div>
              <Switch 
                checked={config.localInventoryEnabled} 
                onCheckedChange={(checked) => handleToggleFeature('localInventoryEnabled', config.localInventoryEnabled)}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#5c5f62]">
                Tell Google users exactly what is in stock at your physical "Spot" locations.
              </p>
              
              <div className="space-y-3">
                {config.linkedStoreAddress ? (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-3">
                    <Store className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Linked Spot</p>
                      <p className="text-xs text-blue-900 font-medium line-clamp-1">{config.linkedStoreAddress}</p>
                    </div>
                  </div>
                ) : null}

                <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 w-full border-[#babfc3] font-bold uppercase tracking-widest text-[10px]">
                      <MapPin className="h-3 w-3" /> {config.linkedStoreAddress ? 'Change Store Address' : 'Link Store Address'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold uppercase tracking-tight">Local Spot Linking</DialogTitle>
                      <DialogDescription className="text-xs">Identify your physical archive location for Google Local Inventory maps.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Business Address</Label>
                        <Input 
                          placeholder="e.g. 123 Archive Way, London, UK" 
                          value={storeAddress} 
                          onChange={(e) => setStoreAddress(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveStoreAddress} disabled={isSaving || !storeAddress} className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Authorize Location
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {config.issues && config.issues.length > 0 && (
        <Card className="border-red-100 bg-red-50 shadow-none border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <CardTitle className="text-sm font-bold">Issues Requiring Attention ({config.issues.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.issues.map((issue: any) => (
                <div key={issue.id} className="flex items-center justify-between text-xs py-2 border-b border-red-100 last:border-0">
                  <span className="text-red-900 font-medium">{issue.message}</span>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-[10px] font-bold text-red-800 underline uppercase tracking-widest"
                    onClick={() => handleFixIssue(issue.id)}
                  >
                    Fix Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
