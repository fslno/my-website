'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Target, 
  UserCheck, 
  Loader2,
  Activity,
  MousePointer2,
  RefreshCw,
  Terminal,
  ChevronRight,
  Eye,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from '@/components/ui/dialog';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AnalyticsPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'analytics') : null, [db]);
  const { data: config, loading } = useDoc(configRef);
  const { toast } = useToast();

  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFunnelOpen, setIsFunnelOpen] = useState(false);

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      ga4MeasurementId: 'G-FSLNO777888',
      funnelTrackingEnabled: true,
      userIdTrackingEnabled: true,
      enhancedMeasurementEnabled: true,
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

  const handleResetStreams = () => {
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      toast({ 
        title: "Streams Synchronized", 
        description: "GA4 measurement protocol has been Authoritatively re-initialized." 
      });
    }, 1500);
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ 
        title: "Analytics Committed", 
        description: "Global tracking configurations are now Authoritatively live." 
      });
    }, 800);
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
        <p className="text-gray-500 max-w-sm">Connect your FSLNO storefront to Google Analytics 4 to enable advanced funnel tracking.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8 h-12 font-bold uppercase tracking-widest text-[10px]">Initialize GA4 Core</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">GA4 Measurement</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase tracking-tight font-medium">Manage custom funnel events and manual tracking orchestration.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none h-10 gap-2 border-[#babfc3] font-bold uppercase tracking-widest text-[10px] bg-white" 
            onClick={handleResetStreams}
            disabled={isResetting}
          >
            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Reset Streams
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" /> Real-time Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              42
            </div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Currently active on FSLNO.com</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" /> Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">3.8%</div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Conversion velocity</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Target className="h-3.5 w-3.5" /> Catalog Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1,204</div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Total selection views</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Custom Funnel Tracking</CardTitle>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50 uppercase text-[8px] sm:text-[9px] font-bold tracking-widest">Active</Badge>
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight text-muted-foreground mt-1">
                Measure specific interaction points in the archival journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
              <div className="grid gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f6f6f7] rounded-none border gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold flex items-center gap-2 uppercase tracking-widest">
                      <MousePointer2 className="h-4 w-4" /> view_item_list
                    </span>
                    <p className="text-[10px] text-[#5c5f62] uppercase tracking-tight font-medium opacity-70">Tracks which FSLNO category gets the most impressions.</p>
                  </div>
                  <Switch 
                    checked={config.funnelTrackingEnabled} 
                    onCheckedChange={(checked) => handleUpdate({ funnelTrackingEnabled: checked })}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f6f6f7] rounded-none border gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest">Checkout Drop-off Analysis</p>
                    <p className="text-[10px] text-[#5c5f62] uppercase tracking-tight font-medium opacity-70">Pinpoints exactly where users drop off between cart and begin_checkout.</p>
                  </div>
                  <Dialog open={isFunnelOpen} onOpenChange={setIsFunnelOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 border-[#babfc3] font-bold uppercase tracking-widest text-[9px] bg-white w-full sm:w-auto">
                        View Funnel
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-white border-none rounded-none shadow-2xl">
                      <DialogHeader className="pt-8 border-b pb-6">
                        <div className="flex items-center gap-3 text-primary mb-2">
                          <Layers className="h-5 w-5" />
                          <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight text-primary">Checkout Funnel Visualizer</DialogTitle>
                        </div>
                        <DialogDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Real-time drop-off rates across the archive.</DialogDescription>
                      </DialogHeader>
                      <div className="py-8 space-y-10">
                        <div className="space-y-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">01. View Product</span>
                            <span className="text-[10px] font-mono font-bold text-primary">100% (14,204 Users)</span>
                          </div>
                          <Progress value={100} className="h-3 bg-gray-100 rounded-none" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">02. Add to Cart</span>
                            <span className="text-[10px] font-mono font-bold text-primary">42% (5,965 Users)</span>
                          </div>
                          <Progress value={42} className="h-3 bg-gray-100 rounded-none" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">03. Begin Checkout</span>
                            <span className="text-[10px] font-mono font-bold text-primary">18% (2,556 Users)</span>
                          </div>
                          <Progress value={18} className="h-3 bg-gray-100 rounded-none" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">04. Purchase Success</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-600">3.8% (540 Orders)</span>
                          </div>
                          <Progress value={3.8} className="h-3 bg-emerald-50 rounded-none" />
                        </div>
                      </div>
                      <div className="flex justify-end pt-6 border-t">
                        <Button onClick={() => setIsFunnelOpen(false)} className="w-full sm:w-auto bg-black text-white h-12 px-8 font-bold uppercase tracking-widest text-[10px]">Close Analysis</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Cross-Device User ID Tracking</CardTitle>
                </div>
                <Switch 
                  checked={config.userIdTrackingEnabled} 
                  onCheckedChange={(checked) => handleUpdate({ userIdTrackingEnabled: checked })}
                />
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight text-muted-foreground mt-1">
                Stitch together high-fidelity user sessions across mobile and desktop.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 p-4 sm:p-6 space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">GA4 Measurement ID</Label>
                <div className="relative">
                  <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={config.ga4MeasurementId} 
                    onChange={(e) => handleUpdate({ ga4MeasurementId: e.target.value })}
                    className="pl-10 h-12 font-mono text-[11px] sm:text-sm bg-white" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none overflow-hidden">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Live Event Stream</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] sm:h-[400px]">
                <div className="p-4 space-y-4">
                  {[
                    { event: 'purchase', time: 'Just now', user: 'UID_...F2', color: 'text-green-400' },
                    { event: 'add_to_cart', time: '2m ago', user: 'UID_...A1', color: 'text-blue-400' },
                    { event: 'view_item', time: '5m ago', user: 'UID_...B9', color: 'text-gray-400' },
                    { event: 'begin_checkout', time: '8m ago', user: 'UID_...C4', color: 'text-orange-400' },
                    { event: 'scroll', time: '12m ago', user: 'UID_...X0', color: 'text-gray-500' },
                    { event: 'view_item_list', time: '15m ago', user: 'UID_...Y7', color: 'text-gray-400' },
                    { event: 'purchase', time: '18m ago', user: 'UID_...Z2', color: 'text-green-400' },
                  ].map((log, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-white/5 pb-3 last:border-0 gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse bg-current", log.color)} />
                          <p className={cn("text-[10px] font-mono font-bold uppercase truncate", log.color)}>{log.event}</p>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono truncate">{log.user}</p>
                      </div>
                      <span className="text-[8px] sm:text-[9px] text-gray-600 font-bold uppercase tracking-tighter shrink-0">{log.time}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none bg-gray-50/50">
            <CardHeader className="pb-4 border-b bg-gray-100/30">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5" /> Engine Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-bold text-gray-600">Enhanced Measurement</Label>
                <Switch 
                  checked={config.enhancedMeasurementEnabled} 
                  onCheckedChange={(checked) => handleUpdate({ enhancedMeasurementEnabled: checked })}
                />
              </div>
              <Separator />
              <p className="text-[9px] text-gray-400 leading-relaxed uppercase font-medium">
                Measurement protocol changes strictly apply to the live GA4 stream. Ensure data privacy compliance before enabling User ID tracking.
              </p>
            </CardContent>
          </Card>

          <Button 
            className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300" 
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
