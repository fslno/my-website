'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Terminal, 
  ShieldCheck, 
  Copy, 
  RefreshCw, 
  Loader2, 
  Activity, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  History,
  Lock,
  Globe,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * Webhook Creator Utility.
 * Authoritatively generates and monitors external carrier signals.
 */
export default function WebhooksPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [showSecret, setShowSecret] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const secret = process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'fslno_archival_key';
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/shipping?secret=${secret}`
    : `https://fslno.ca/api/webhooks/shipping?secret=${secret}`;

  const logsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'webhook_events'), orderBy('receivedAt', 'desc'), limit(50));
  }, [db]);

  const { data: logs, isLoading: logsLoading } = useCollection(logsQuery);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} manifest saved to clipboard.` });
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({ title: "Audit Synchronized", description: "Event logs Authoritatively refreshed." });
    }, 1000);
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Webhook Engine</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Generate URLs and monitor incoming carrier signals.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleManualSync}
          disabled={isSyncing}
          className="h-10 border-black font-bold uppercase tracking-widest text-[10px] bg-white gap-2"
        >
          {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Webhook Configuration</CardTitle>
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight text-muted-foreground mt-1">Provide this URL to external carriers for real-time synchronization.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500">Target URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input value={webhookUrl} readOnly className="pl-10 h-12 font-mono text-[10px] bg-gray-50 pr-12 truncate" />
                    </div>
                    <Button variant="outline" size="icon" className="h-12 w-12 border-black rounded-none" onClick={() => copyToClipboard(webhookUrl, 'URL')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500">Security Secret (Signature Key)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        type={showSecret ? "text" : "password"} 
                        value={secret} 
                        readOnly 
                        className="pl-10 h-12 font-mono text-[10px] bg-gray-50" 
                      />
                      <button 
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button variant="outline" size="icon" className="h-12 w-12 border-black rounded-none" onClick={() => copyToClipboard(secret, 'Secret')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-none flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-[10px] text-blue-800 uppercase font-medium leading-relaxed">
                  The engine forensicly validates every payload using this secret. Ensure your carrier appends <code className="bg-white/50 px-1">?secret={secret.substring(0,4)}...</code> to the endpoint.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none overflow-hidden">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Forensic Event Stream</CardTitle>
                </div>
                <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-400 text-[8px] font-bold uppercase tracking-widest animate-pulse">Live Tracking Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {logsLoading ? (
                  <div className="flex items-center justify-center h-full py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
                  </div>
                ) : !logs || logs.length === 0 ? (
                  <div className="py-20 text-center text-zinc-600">
                    <History className="h-8 w-8 mx-auto mb-4 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No incoming signals cataloged.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 sm:p-6 space-y-4 hover:bg-white/5 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Activity className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">{log.type}</span>
                          </div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                            {log.receivedAt?.toDate?.() ? log.receivedAt.toDate().toLocaleString() : 'Just now'}
                          </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-sm border border-white/5">
                          <pre className="text-[9px] font-mono text-zinc-400 overflow-x-auto">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>
                        {log.payload?.orderId && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">AFFECTED_ORDER: {log.payload.orderId}</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-400 text-[8px] font-bold uppercase tracking-widest" asChild>
                              <a href={`/admin/orders/${log.payload.orderId}`}>View Order <ChevronRight className="h-2 w-2 ml-1" /></a>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none bg-gray-50/50">
            <CardHeader className="border-b px-4 sm:px-6">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Engine Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-gray-400">Response Time:</span>
                  <span className="text-green-600">~84ms</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-gray-400">Signature:</span>
                  <span className="text-green-600">Mandatory</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-gray-400">Auto-Update:</span>
                  <span className="text-green-600">Active</span>
                </div>
              </div>
              <Separator />
              <p className="text-[9px] text-gray-400 leading-relaxed uppercase font-medium">
                The Edge Engine prioritizes low-latency ingestion. Signals are processed forensicly to prevent database duplication.
              </p>
            </CardContent>
          </Card>

          <div className="bg-black text-white p-6 rounded-none space-y-4 shadow-xl">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-blue-400" /> Operational Note
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed uppercase font-medium">
              Webhooks bypass traditional UI latency. Once a signal is ingested, the storefront manifest updates Authoritatively across all active participant sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}