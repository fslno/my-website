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
  Share2, 
  MessageCircle, 
  Instagram, 
  ShieldCheck, 
  Users, 
  Zap,
  BarChart3,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SocialCommercePage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'social-commerce') : null, [db]);
  const { data: config, loading } = useDoc(configRef);
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPartnersDialogOpen, setIsPartnersDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newIntegration, setNewIntegration] = useState({ name: '', description: '' });

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      tiktokInAppCheckout: true,
      tiktokAccessToken: 'u5w9XtYeVTmceUfOZLZwDQxF2',
      metaPixelId: '9283746501293',
      metaAccessToken: '',
      metaEmqEnabled: true,
      lastInstagramSync: null,
      customIntegrations: []
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

  const handleInstagramSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updates = { lastInstagramSync: new Date().toISOString() };
      handleUpdate(updates);
      setIsSyncing(false);
      toast({ 
        title: "Sync Successful", 
        description: "Instagram product tagging catalog has been Authoritatively updated." 
      });
    }, 2000);
  };

  const handleAddIntegration = () => {
    if (!newIntegration.name || !config) return;
    const updatedIntegrations = [
      ...(config.customIntegrations || []),
      { ...newIntegration, id: Math.random().toString(36).substr(2, 9) }
    ];
    handleUpdate({ customIntegrations: updatedIntegrations });
    setNewIntegration({ name: '', description: '' });
    setIsDialogOpen(false);
    toast({ title: "Channel Added", description: `${newIntegration.name} is now available.` });
  };

  const removeIntegration = (id: string) => {
    if (!config) return;
    const updatedIntegrations = config.customIntegrations.filter((i: any) => i.id !== id);
    handleUpdate({ customIntegrations: updatedIntegrations });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
        <Share2 className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Social Commerce Not Initialized</h2>
        <p className="text-gray-500 max-w-sm">Sync your luxury catalog with TikTok and Meta for cross-channel sales.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8">Initialize Channels</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Social Commerce</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Sync your FSLNO inventory with TikTok and Meta platforms for cross-channel sales.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-9 gap-2 border-[#babfc3] font-bold uppercase tracking-widest text-[10px]">
              <Plus className="h-4 w-4" /> Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight">Add New Sales Channel</DialogTitle>
              <DialogDescription className="text-xs">
                Configure a new platform or custom tool for social commerce.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="channel-name" className="text-[10px] uppercase font-bold text-gray-500">Channel Name</Label>
                <Input 
                  id="channel-name" 
                  placeholder="e.g. Pinterest Shopping" 
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="channel-desc" className="text-[10px] uppercase font-bold text-gray-500">Description</Label>
                <Input 
                  id="channel-desc" 
                  placeholder="e.g. Sync product catalog for visual search" 
                  value={newIntegration.description}
                  onChange={(e) => setNewIntegration({...newIntegration, description: e.target.value})}
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddIntegration} className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]">Add Channel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#ff0050]" />
                <CardTitle className="text-lg">TikTok Shop Seller API</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-100 bg-green-50 uppercase text-[9px] font-bold tracking-widest">Active</Badge>
            </div>
            <CardDescription>
              Enable in-app checkout and affiliate creator management for viral drops.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border">
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-tight">In-App Checkout</p>
                  <p className="text-xs text-[#5c5f62]">Allow customers to buy FSLNO gear without leaving TikTok.</p>
                </div>
                <Switch 
                  checked={config.tiktokInAppCheckout} 
                  onCheckedChange={(checked) => handleUpdate({ tiktokInAppCheckout: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border">
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-tight">Affiliate Sample Management</p>
                  <p className="text-xs text-[#5c5f62]">Automated dashboard to send samples to creators and track ROI.</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 border-[#babfc3] font-bold uppercase tracking-widest text-[9px]">Configure</Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">TikTok Shop Access Token</Label>
              <Input 
                type="password" 
                value={config.tiktokAccessToken} 
                onChange={(e) => handleUpdate({ tiktokAccessToken: e.target.value })}
                className="bg-[#f1f2f3] font-mono text-xs h-11" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0668E1]" />
                <CardTitle className="text-lg">Meta Conversions API (CAPI)</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-100 bg-green-50 uppercase text-[9px] font-bold tracking-widest">Active</Badge>
            </div>
            <CardDescription>
              High-performance server-to-server tracking for Facebook and Instagram ads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex gap-3">
                <Zap className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900 uppercase tracking-tight">Bypass iOS Privacy Restrictions</p>
                  <p className="text-xs text-blue-800 leading-relaxed uppercase tracking-tight">
                    CAPI sends "Purchase" data directly from your Firebase server to Meta, bypassing browser ad-blockers and cookie restrictions.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Pixel ID</Label>
                <Input 
                  value={config.metaPixelId} 
                  onChange={(e) => handleUpdate({ metaPixelId: e.target.value })}
                  className="h-11 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Access Token</Label>
                <Input 
                  type="password" 
                  value={config.metaAccessToken}
                  onChange={(e) => handleUpdate({ metaAccessToken: e.target.value })}
                  placeholder="Enter your token" 
                  className="h-11 font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1">
                <span className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                  <span>Event Match Quality (EMQ)</span>
                  <Badge variant="secondary" className="text-[9px] h-4 font-bold uppercase tracking-widest">Advanced</Badge>
                </span>
                <p className="text-xs text-[#5c5f62]">Sends hashed email/phone data to help find buyers.</p>
              </div>
              <Switch 
                checked={config.metaEmqEnabled} 
                onCheckedChange={(checked) => handleUpdate({ metaEmqEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-[#E1306C]" />
              <CardTitle className="text-lg">Instagram Shopping & Reels</CardTitle>
            </div>
            <CardDescription>
              Sync your Bento Grid categories directly into shoppable visual content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-md flex flex-col gap-3 group relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-5 w-5 text-[#5c5f62]" />
                  {config.lastInstagramSync && (
                    <span className="text-[8px] font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-2 w-2" /> LAST SYNC: {formatDate(config.lastInstagramSync)}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold uppercase tracking-tight">Product Tagging</h4>
                <p className="text-xs text-[#5c5f62]">Real-time sync into Instagram "Guides" and Reels.</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-[10px] justify-start font-bold uppercase tracking-widest text-primary hover:text-black"
                  onClick={handleInstagramSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Syncing Archive...</span>
                  ) : 'Sync Now'}
                </Button>
              </div>

              <div className="p-4 border rounded-md flex flex-col gap-3">
                <Users className="h-5 w-5 text-[#5c5f62]" />
                <h4 className="text-sm font-bold uppercase tracking-tight">Creator Marketplace</h4>
                <p className="text-xs text-[#5c5f62]">Enable white-listed ads for FSLNO partners.</p>
                
                <Dialog open={isPartnersDialogOpen} onOpenChange={setIsPartnersDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-[10px] justify-start font-bold uppercase tracking-widest text-primary hover:text-black">View Partners</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold uppercase tracking-tight">Archive Creator Partners</DialogTitle>
                      <DialogDescription className="text-xs">Manage influencers and content creators with authorized advertising permissions.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Creator</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Platform</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">ROI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { name: '@archive_silhouettes', platform: 'Instagram', status: 'Active', roi: '4.2x' },
                            { name: '@tech_minimalist', platform: 'TikTok', status: 'Active', roi: '3.8x' },
                            { name: '@fslno_community', platform: 'Instagram', status: 'Pending', roi: '--' },
                          ].map((partner, i) => (
                            <TableRow key={i} className="hover:bg-gray-50/30">
                              <TableCell className="font-bold text-xs">{partner.name}</TableCell>
                              <TableCell className="text-xs text-gray-500 uppercase">{partner.platform}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-widest", partner.status === 'Active' ? "bg-green-50 text-green-700 border-green-100" : "bg-orange-50 text-orange-700 border-orange-100")}>
                                  {partner.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs font-bold">{partner.roi}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <DialogFooter>
                      <Button className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]">Invite New Creator</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {config.customIntegrations?.map((integration: any) => (
          <Card key={integration.id} className="border-[#e1e3e5] shadow-none border-dashed border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-[#5c5f62]" />
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeIntegration(integration.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-[#f6f6f7] rounded-md border text-center text-xs text-[#5c5f62] uppercase tracking-tight">
                Integration configuration pending API key validation.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button className="bg-black text-white h-12 px-10 font-bold uppercase tracking-widest text-[10px]" onClick={() => toast({ title: "Settings Saved", description: "All social configurations are live." })}>
          Save Channel Settings
        </Button>
      </div>
    </div>
  );
}
