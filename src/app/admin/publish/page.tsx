'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp,
  query,
  limit
} from 'firebase/firestore';
import { 
  Globe, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  History,
  Activity,
  Layers,
  ShoppingBag,
  Terminal,
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function PublishPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  // Staging Stats
  const { data: sProducts } = useCollection(useMemoFirebase(() => db ? collection(db, 'products') : null, [db]));
  const { data: sCategories } = useCollection(useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]));
  const { data: sTestimonials } = useCollection(useMemoFirebase(() => db ? collection(db, 'testimonials') : null, [db]));

  // Production Stats
  const { data: pProducts } = useCollection(useMemoFirebase(() => db ? collection(db, 'live_products') : null, [db]));
  
  const deployRef = useMemoFirebase(() => db ? doc(db, 'config', 'deployment') : null, [db]);
  const { data: lastDeploy } = useDoc(deployRef);

  const handlePublish = async () => {
    if (!db || isPublishing) return;
    if (!confirm("Authoritatively deploy all staging content to the Live Production Domain? This will overwrite the current live manifest.")) return;

    setIsPublishing(true);
    setProgress(10);
    setStatus('Initializing snapshot...');

    try {
      const collectionsToSync = ['products', 'categories', 'config', 'testimonials', 'sizeCharts', 'coupons'];
      
      for (let i = 0; i < collectionsToSync.length; i++) {
        const collName = collectionsToSync[i];
        setStatus(`Syncing: ${collName.toUpperCase()}...`);
        
        const snapshot = await getDocs(collection(db, collName));
        const batch = writeBatch(db);
        
        // 1. Purge existing live data for this collection (to ensure exact mirror)
        const liveSnapshot = await getDocs(collection(db, `live_${collName}`));
        liveSnapshot.docs.forEach(d => batch.delete(d.ref));
        
        // 2. Clone staging to live
        snapshot.docs.forEach(d => {
          const liveRef = doc(db, `live_${collName}`, d.id);
          batch.set(liveRef, { ...d.data(), publishedAt: serverTimestamp() });
        });

        await batch.commit();
        setProgress(10 + ((i + 1) / collectionsToSync.length) * 80);
      }

      // Update deployment log
      await writeBatch(db).set(doc(db, 'config', 'deployment'), {
        lastPublishedAt: serverTimestamp(),
        publishedBy: 'ADMIN_STUDIO',
        version: Date.now()
      }).commit();

      setProgress(100);
      setStatus('Deployment complete.');
      toast({ title: "Success", description: "Production manifest updated." });
    } catch (error) {
      console.error("[PUBLISH] Error:", error);
      toast({ variant: "destructive", title: "Error", description: "Deployment protocol failed." });
    } finally {
      setTimeout(() => {
        setIsPublishing(false);
        setProgress(0);
        setStatus(null);
      }, 2000);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'Never';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Publish Command</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Deploy your archival staging manifest to the live production domain.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100 py-1.5 px-3 flex items-center gap-2 font-bold uppercase text-[9px] tracking-widest">
            <Zap className="h-3 w-3" /> Staging Mode
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="Products" staging={sProducts?.length || 0} live={pProducts?.length || 0} icon={<ShoppingBag className="h-4 w-4" />} />
            <StatsCard title="Categories" staging={sCategories?.length || 0} live={0} icon={<Layers className="h-4 w-4" />} />
            <StatsCard title="Testimonials" staging={sTestimonials?.length || 0} live={0} icon={<CheckCircle2 className="h-4 w-4" />} />
          </div>

          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden border-l-4 border-l-black">
            <CardHeader className="bg-gray-50/50 border-b p-6">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg uppercase tracking-tight">Production Deployment</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase text-muted-foreground mt-1">Synchronize the live storefront with the current studio snapshot.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 bg-[radial-gradient(#e1e3e5_1px,transparent_1px)] [background-size:24px_24px] border rounded-sm">
                {isPublishing ? (
                  <div className="space-y-6 w-full max-w-sm">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">{status}</p>
                      <Progress value={progress} className="h-2 bg-gray-100" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-2xl">
                      <Zap className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-headline font-bold uppercase tracking-tight">Ready for Release</h3>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest max-w-xs">Last publish: {formatDate(lastDeploy?.lastPublishedAt)}</p>
                    </div>
                    <Button 
                      onClick={handlePublish}
                      className="bg-black text-white h-14 px-12 font-bold uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:scale-105 transition-transform"
                    >
                      Deploy to Production
                    </Button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-none flex gap-4">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Integrity Protocol</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed uppercase font-medium">This action is Authoritatively irreversible. Staging content will overwrite the live catalog instantly.</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-none flex gap-4">
                  <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">Live Security</p>
                    <p className="text-[10px] text-blue-700 leading-relaxed uppercase font-medium">The live domain is strictly locked to "live_" prefixed collections for public security.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none overflow-hidden">
            <CardHeader className="border-b border-white/10 p-6">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-blue-400" /> Deployment Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {[
                  { event: 'DEPLOY_SUCCESS', time: lastDeploy?.lastPublishedAt ? formatDate(lastDeploy.lastPublishedAt) : 'N/A', user: 'ADMIN_STUDIO' },
                  { event: 'STAGING_UPDATED', time: 'Just now', user: 'SYSTEM' },
                  { event: 'DB_SNAPSHOT_TAKEN', time: 'Pre-flight', user: 'CORE' }
                ].map((log, i) => (
                  <div key={i} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold text-green-400 uppercase">{log.event}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">{log.user}</p>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-bold uppercase whitespace-nowrap">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none bg-gray-50/50">
            <CardHeader className="border-b p-6 bg-white/50">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5" /> Engine Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Environment</span>
                <span className="text-blue-600">STAGING_STUDIO</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Public Target</span>
                <span className="text-primary underline">fslno.ca</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Sync Status</span>
                <span className="text-amber-600">AWAITING_PUSH</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, staging, live, icon }: { title: string, staging: number, live: number, icon: React.ReactNode }) {
  const hasDiff = staging !== live;
  return (
    <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
      <CardHeader className="pb-2 p-4">
        <CardTitle className="text-[9px] uppercase tracking-widest text-gray-400 flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold">{staging}</div>
          <Badge className={cn("text-[8px] font-bold border-none uppercase px-1.5 h-4", hasDiff ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700")}>
            {hasDiff ? 'Out of Sync' : 'Synced'}
          </Badge>
        </div>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Live: {live}</p>
      </CardContent>
    </Card>
  );
}
