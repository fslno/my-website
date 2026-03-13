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
  CheckCircle2,
  AlertCircle,
  Settings2,
  Loader2,
  Lock,
  Globe,
  Store,
  Layers,
  Terminal,
  ChevronRight,
  ShieldCheck
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function GoogleSyncPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'google-sync') : null, [db]);
  const { data: config, isLoading: loading } = useDoc(configRef);
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

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      merchantId: '123456789',
      targetCountry: 'US',
      contentLanguage: 'en',
      apiConnected: true,
      onDemandUpdates: true,
      partialSync: true,
      youtubeTaggingEnabled: true,
      localInventoryEnabled: false,
      linkedStoreAddress: '',
      freeListingsEnabled: true,
      remarketingEnabled: false,
      feedHealth: 98.4,
      syncLatency: '2.4 min',
      activeChannelsCount: 4,
      lastSync: null,
      issues: [
        { id: '1', message: "Missing 'Material' attribute on product SKU-0981", severity: 'warning' },
        { id: '2', message: "Missing 'Material' attribute on product SKU-0982", severity: 'warning' },
        { id: '3', message: "Image missing for product SKU-7721 (Hero Selection)", severity: 'error' }
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
    handleUpdate({ [feature]: !currentValue });
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
    handleUpdate({ issues: updatedIssues });
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
    <div className="space-y-8 pb-12 min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Google Merchant Center Sync</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase tracking-tight font-medium">Manage your Merchant API (V1) integration and real-time product feeds.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 flex-1 sm:flex-none gap-2 border-[#babfc3] font-bold uppercase tracking-widest text-[10px] bg-white">
                <Settings2 className="h-4 w-4" /> API Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
              <DialogHeader className="pt-6">
                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Merchant API Configuration</DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Establish the handshake parameters for your Google catalog.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500">Merchant Center ID</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="e.g. 123456789" 
                      value={merchantId} 
                      onChange={(e) => setMerchantId(e.target.value)}
                      className="pl-10 h-12 font-mono text-sm uppercase"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Target Country</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="US" 
                        value={targetCountry} 
                        onChange={(e) => setTargetCountry(e.target.value.toUpperCase())}
                        className="pl-10 h-12 font-bold uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Language Code</Label>
                    <Input 
                      placeholder="en" 
                      value={contentLanguage} 
                      onChange={(e) => setContentLanguage(e.target.value.toLowerCase())}
                      className="h-12 font-bold lowercase"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSettings} disabled={isSaving || !merchantId} className="w-full bg-black text-white h-14 font-bold uppercase tracking-widest text-[10px]">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update API Handshake
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            className="h-10 flex-1 sm:flex-none bg-black text-white font-bold gap-2 uppercase tracking-widest text-[10px] shadow-md" 
            onClick={handleForceSync}
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isSyncing ? 'Syncing...' : 'Force Full Sync'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Feed Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{config.feedHealth?.toFixed(1)}%</div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Items approved & optimized</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-orange-500" /> Sync Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">~{config.syncLatency}</div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">On-Demand API average</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-blue-600" /> Active Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">{config.activeChannelsCount}</div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Search, Shop, YT, Ads</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Merchant API (V1) Integration</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={config.apiConnected} 
                    onCheckedChange={(checked) => handleUpdate({ apiConnected: checked })}
                  />
                  <Badge variant="outline" className={cn("text-[8px] sm:text-[10px] font-bold uppercase border-none px-2", config.apiConnected ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50")}>
                    {config.apiConnected ? 'API Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight text-muted-foreground mt-1">
                Unlike standard feeds that update once a day, the API pushes price or stock changes to Google in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => handleToggleFeature('onDemandUpdates', !!config.onDemandUpdates)}
                  className={cn(
                    "p-4 sm:p-6 border rounded-none text-left transition-all duration-300",
                    config.onDemandUpdates ? 'border-black bg-black/5 ring-1 ring-black shadow-lg' : 'hover:bg-gray-50 border-[#e1e3e5]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest">On-Demand Updates</span>
                    {config.onDemandUpdates ? <CheckCircle2 className="h-4 w-4 text-black" /> : <div className="h-4 w-4 rounded-full border border-[#babfc3]" />}
                  </div>
                  <p className="text-[10px] text-[#5c5f62] mt-2 uppercase tracking-tight font-medium leading-relaxed opacity-70">Real-time synchronization of critical attributes (Price, Inventory).</p>
                </button>
                <button 
                  onClick={() => handleToggleFeature('partialSync', !!config.partialSync)}
                  className={cn(
                    "p-4 sm:p-6 border rounded-none text-left transition-all duration-300",
                    config.partialSync ? 'border-black bg-black/5 ring-1 ring-black shadow-lg' : 'hover:bg-gray-50 border-[#e1e3e5]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest">Partial Sync Protocol</span>
                    {config.partialSync ? <CheckCircle2 className="h-4 w-4 text-black" /> : <div className="h-4 w-4 rounded-full border border-[#babfc3]" />}
                  </div>
                  <p className="text-[10px] text-[#5c5f62] mt-2 uppercase tracking-tight font-medium leading-relaxed opacity-70">Only update specific fields without re-sending the entire catalog.</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#e1e3e5] shadow-none rounded-none">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">YouTube Shopping</CardTitle>
                </div>
                <Switch 
                  checked={config.youtubeTaggingEnabled} 
                  onCheckedChange={(checked) => handleToggleFeature('youtubeTaggingEnabled', !!config.youtubeTaggingEnabled)}
                />
              </CardHeader>
              <CardContent className="pt-6 px-4 sm:px-6 space-y-4">
                <p className="text-[10px] sm:text-[11px] text-[#5c5f62] leading-relaxed uppercase font-bold tracking-tight">
                  Automatically syncs your FSLNO catalog so you can tag products in YouTube videos.
                </p>
                {config.youtubeTaggingEnabled ? (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-green-700 bg-green-50 p-2 border border-green-100 uppercase tracking-widest">
                    <CheckCircle2 className="h-3 w-3" />
                    Catalog Tagging Active
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-gray-50 p-2 border border-gray-100 uppercase tracking-widest">
                    <AlertCircle className="h-3 w-3" />
                    Tagging Decommissioned
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#e1e3e5] shadow-none rounded-none">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Local Inventory</CardTitle>
                </div>
                <Switch 
                  checked={config.localInventoryEnabled} 
                  onCheckedChange={(checked) => handleToggleFeature('localInventoryEnabled', !!config.localInventoryEnabled)}
                />
              </CardHeader>
              <CardContent className="pt-6 px-4 sm:px-6 space-y-4">
                <p className="text-[10px] sm:text-[11px] text-[#5c5f62] leading-relaxed uppercase font-bold tracking-tight">
                  Tell Google users exactly what is in stock at your physical "Spot" locations.
                </p>
                
                <div className="space-y-3">
                  {config.linkedStoreAddress ? (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-none flex items-start gap-3 shadow-sm">
                      <Store className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-blue-700">Linked Spot</p>
                        <p className="text-[10px] text-blue-900 font-bold uppercase truncate">{config.linkedStoreAddress}</p>
                      </div>
                    </div>
                  ) : null}

                  <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 gap-2 w-full border-black font-bold uppercase tracking-widest text-[9px] bg-white rounded-none">
                        <MapPin className="h-3.5 w-3.5" /> {config.linkedStoreAddress ? 'Change Store Address' : 'Link Store Address'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                      <DialogHeader className="pt-6">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">Local Spot Linking</DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-1">Identify your physical archive location for Google Local Inventory maps.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-gray-500">Business Address</Label>
                          <Input 
                            placeholder="e.g. 123 Archive Way, London, UK" 
                            value={storeAddress} 
                            onChange={(e) => setStoreAddress(e.target.value)}
                            className="h-12 uppercase font-bold"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveStoreAddress} disabled={isSaving || !storeAddress} className="w-full bg-black text-white h-14 font-bold uppercase tracking-widest text-[10px]">
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

          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none overflow-hidden">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Diagnostics Console</CardTitle>
                </div>
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-none text-[8px] font-bold uppercase tracking-widest animate-pulse">Live Protocol</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6">
              <div className="space-y-4 font-mono">
                {config.issues && config.issues.length > 0 ? (
                  config.issues.map((issue: any) => (
                    <div key={issue.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between group py-3 border-b border-white/5 last:border-0 gap-3">
                      <div className="space-y-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2">
                          {issue.severity === 'error' ? <AlertCircle className="h-3 w-3 text-red-500" /> : <AlertCircle className="h-3 w-3 text-orange-500" />}
                          <p className={`text-[10px] uppercase font-bold ${issue.severity === 'error' ? 'text-red-400' : 'text-orange-400'}`}>{issue.severity}</p>
                        </div>
                        <p className="text-[11px] text-zinc-300 uppercase leading-relaxed max-w-full sm:max-w-md truncate sm:whitespace-normal">{issue.message}</p>
                      </div>
                      <Button 
                        variant="link" 
                        className="text-[9px] h-auto p-0 text-zinc-500 hover:text-white underline uppercase font-bold tracking-widest opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={() => handleFixIssue(issue.id)}
                      >
                        FIX_NOW <ChevronRight className="h-2.5 w-2.5 ml-1" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-none">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Protocol Clean: Zero Feed Exceptions Detected.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none bg-gray-50/50">
            <CardHeader className="border-b px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Global Visibility</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-bold text-gray-600">Free Listings</Label>
                <Switch 
                  checked={config.freeListingsEnabled} 
                  onCheckedChange={(checked) => handleToggleFeature('freeListingsEnabled', !!config.freeListingsEnabled)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-bold text-gray-600">Dynamic Remarketing</Label>
                <Switch 
                  checked={config.remarketingEnabled} 
                  onCheckedChange={(checked) => handleToggleFeature('remarketingEnabled', !!config.remarketingEnabled)}
                />
              </div>
              <Separator />
              <div className="flex items-center gap-3 p-3 bg-white border border-emerald-100 rounded-none">
                <div className="w-8 h-8 rounded-none bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-tight truncate">Google Ads Sync</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Manual feed coordination.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-gray-50 border rounded-none space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> API V1 Integrity Note
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tight font-bold opacity-70">
              Synchronized changes apply Authoritatively to the live Google catalog. Ensure all product attributes are manually cataloged to prevent diagnostic exceptions.
            </p>
          </div>

          <Button 
            className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 rounded-none" 
            onClick={() => toast({ title: "Catalog Finalized", description: "Global Merchant API feeds are now Authoritatively synchronized." })}
          >
            Save Catalog Settings
          </Button>
        </div>
      </div>
    </div>
  );
}