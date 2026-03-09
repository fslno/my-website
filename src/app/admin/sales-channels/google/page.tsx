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
  Loader2
} from 'lucide-react';
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

  // Initialize defaults if not present
  useEffect(() => {
    if (!loading && !config && configRef) {
      setDoc(configRef, {
        apiConnected: true,
        onDemandUpdates: true,
        partialSync: true,
        autoBackgroundRemoval: true,
        feedHealth: 98.4,
        syncLatency: '2.4 min',
        activeChannelsCount: 4,
        lastSync: null,
        issues: [
          { id: '1', message: "Missing 'Material' attribute on product SKU-0981" },
          { id: '2', message: "Missing 'Material' attribute on product SKU-0982" },
          { id: '3', message: "Missing 'Material' attribute on product SKU-0983" }
        ]
      });
    }
  }, [loading, config, configRef]);

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
    
    // Simulate sync process
    setTimeout(() => {
      updateDoc(configRef, { lastSync: serverTimestamp() })
        .then(() => {
          setIsSyncing(false);
          toast({
            title: "Sync Complete",
            description: "Google Merchant Center catalog has been updated.",
          });
        })
        .catch(() => {
          setIsSyncing(false);
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: configRef.path,
            operation: 'update',
          }));
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

  const syncData = config || {
    apiConnected: false,
    onDemandUpdates: false,
    partialSync: false,
    autoBackgroundRemoval: false,
    feedHealth: 0,
    syncLatency: 'N/A',
    activeChannelsCount: 0,
    issues: []
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Google Merchant Center Sync</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage your Merchant API (V1) integration and real-time product feeds.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 gap-2 border-[#babfc3]">
            <Settings2 className="h-4 w-4" /> API Settings
          </Button>
          <Button 
            className="h-9 bg-black text-white font-bold gap-2" 
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
            <div className="text-2xl font-bold text-green-600">{syncData.feedHealth}%</div>
            <p className="text-xs text-[#8c9196] mt-1">492/500 items approved</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Sync Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">~{syncData.syncLatency}</div>
            <p className="text-xs text-[#8c9196] mt-1">On-Demand API average</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Active Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">{syncData.activeChannelsCount}</div>
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
              <Badge variant="outline" className={syncData.apiConnected ? "text-green-600 border-green-100 bg-green-50" : "text-gray-400 border-gray-100 bg-gray-50"}>
                {syncData.apiConnected ? 'API Connected' : 'Disconnected'}
              </Badge>
            </div>
            <CardDescription>
              Unlike standard feeds that update once a day, the API pushes price or stock changes to Google in minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleToggleFeature('onDemandUpdates', syncData.onDemandUpdates)}
                className={`p-4 border rounded-md text-left transition-colors text-foreground ${syncData.onDemandUpdates ? 'border-black bg-black/5 ring-1 ring-black' : 'hover:bg-gray-50 border-[#e1e3e5]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">On-Demand Updates</span>
                  {syncData.onDemandUpdates ? <CheckCircle2 className="h-4 w-4 text-black" /> : <div className="h-4 w-4 rounded-full border border-[#babfc3]" />}
                </div>
                <p className="text-xs text-[#5c5f62] mt-1">Real-time synchronization of critical attributes (Price, Inventory).</p>
              </button>
              <button 
                onClick={() => handleToggleFeature('partialSync', syncData.partialSync)}
                className={`p-4 border rounded-md text-left transition-colors text-foreground ${syncData.partialSync ? 'border-black bg-black/5 ring-1 ring-black' : 'hover:bg-gray-50 border-[#e1e3e5]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Partial Sync</span>
                  {syncData.partialSync ? <CheckCircle2 className="h-4 w-4 text-black" /> : <div className="h-4 w-4 rounded-full border border-[#babfc3]" />}
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
                variant={syncData.autoBackgroundRemoval ? "default" : "outline"} 
                size="sm" 
                className={`h-8 font-bold ${syncData.autoBackgroundRemoval ? 'bg-black text-white' : 'border-[#babfc3]'}`}
                onClick={() => handleToggleFeature('autoBackgroundRemoval', syncData.autoBackgroundRemoval)}
              >
                {syncData.autoBackgroundRemoval ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">YouTube Shopping</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#5c5f62]">
                Automatically syncs your FSLNO catalog so you can tag products in YouTube videos or during live streams.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-2 rounded border border-green-100">
                <CheckCircle2 className="h-3 w-3" />
                Catalog is ready for product tagging
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Local Inventory Ads</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#5c5f62]">
                Tell Google users exactly what is in stock at your physical "Spot" locations.
              </p>
              <Button variant="outline" size="sm" className="h-8 gap-2 w-full border-[#babfc3]">
                <MapPin className="h-3 w-3" /> Link Store Address
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {syncData.issues && syncData.issues.length > 0 && (
        <Card className="border-red-100 bg-red-50 shadow-none border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <CardTitle className="text-sm font-bold">Issues Requiring Attention ({syncData.issues.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncData.issues.map((issue: any) => (
                <div key={issue.id} className="flex items-center justify-between text-xs py-2 border-b border-red-100 last:border-0">
                  <span className="text-red-900 font-medium">{issue.message}</span>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-[10px] font-bold text-red-800 underline"
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
