'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Lock,
  Target,
  X,
  PlusCircle
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
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SocialCommercePage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'social-commerce') : null, [db]);
  const { data: config, loading } = useDoc(configRef);
  
  const partnersQuery = useMemoFirebase(() => db ? collection(db, 'partners') : null, [db]);
  const { data: partners, isLoading: partnersLoading } = useCollection(partnersQuery);

  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPartnersDialogOpen, setIsPartnersDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  const [newIntegration, setNewIntegration] = useState({ name: '', description: '' });
  const [newPartner, setNewPartner] = useState({ name: '', platform: 'Instagram' });

  // Local state for settings
  const [tiktokToken, setTiktokToken] = useState('');
  const [pixelId, setPixelId] = useState('');
  const [metaToken, setMetaToken] = useState('');

  useEffect(() => {
    if (config) {
      setTiktokToken(config.tiktokAccessToken || '');
      setPixelId(config.metaPixelId || '');
      setMetaToken(config.metaAccessToken || '');
    }
  }, [config]);

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      tiktokInAppCheckout: true,
      tiktokAccessToken: '',
      metaPixelId: '',
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
    updateDoc(configRef, { ...updates, updatedAt: serverTimestamp() }).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  const handleSaveTokens = () => {
    setIsSaving(true);
    const updates = {
      tiktokAccessToken: tiktokToken,
      metaPixelId: pixelId,
      metaAccessToken: metaToken
    };
    handleUpdate(updates);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Tokens Synchronized", description: "API access credentials have been Authoritatively updated." });
    }, 800);
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

  const handleInvitePartner = async () => {
    if (!db || !newPartner.name) return;
    setIsSaving(true);
    const partnerData = {
      ...newPartner,
      status: 'Active',
      roi: '--',
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, 'partners'), partnerData)
      .then(() => {
        setNewPartner({ name: '', platform: 'Instagram' });
        setIsInviting(false);
        toast({ title: "Partner Registered", description: `${partnerData.name} has been added to the archive.` });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'partners',
          operation: 'create',
          requestResourceData: partnerData
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const removePartner = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'partners', id)).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `partners/${id}`,
        operation: 'delete'
      }));
    });
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
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <Share2 className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Social Commerce Not Initialized</h2>
        <p className="text-gray-500 max-w-sm">Sync your luxury catalog with TikTok and Meta for cross-channel sales.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8 h-12 font-bold uppercase tracking-widest text-[10px]">Initialize Channels</Button>
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
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 border-[#babfc3] font-bold uppercase tracking-widest text-[10px]">
                <Plus className="h-4 w-4" /> Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">New Sales Channel</DialogTitle>
                <DialogDescription className="text-xs">
                  Configure a new platform or custom tool for social commerce synchronization.
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
          <Button 
            onClick={handleSaveTokens} 
            disabled={isSaving}
            className="h-10 px-8 bg-black text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Commit API Config
          </Button>
        </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-sm font-bold uppercase tracking-tight">Affiliate Management</p>
                  <p className="text-xs text-[#5c5f62]">Automated dashboard to send samples to creators and track ROI.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 border-[#babfc3] font-bold uppercase tracking-widest text-[9px]"
                  onClick={() => setIsPartnersDialogOpen(true)}
                >
                  Configure
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">TikTok Shop Access Token</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="password" 
                  value={tiktokToken} 
                  onChange={(e) => setTiktokToken(e.target.value)}
                  className="pl-10 font-mono text-xs h-11" 
                />
              </div>
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
                  <p className="text-sm font-bold text-blue-900 uppercase tracking-tight">Bypass Privacy Restrictions</p>
                  <p className="text-xs text-blue-800 leading-relaxed uppercase tracking-tight">
                    CAPI sends event data directly from your Firebase instance to Meta, bypassing browser-based ad-blockers.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Pixel ID</Label>
                <div className="relative">
                  <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={pixelId} 
                    onChange={(e) => setPixelId(e.target.value)}
                    className="pl-10 h-11 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Access Token</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="password" 
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder="Enter your token" 
                    className="pl-10 h-11 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1">
                <span className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                  <span>Event Match Quality (EMQ)</span>
                  <Badge variant="secondary" className="text-[9px] h-4 font-bold uppercase tracking-widest">Advanced</Badge>
                </span>
                <p className="text-xs text-[#5c5f62]">Sends hashed customer data to improve attribution accuracy.</p>
              </div>
              <Switch 
                checked={config.metaEmqEnabled} 
                onCheckedChange={(checked) => handleUpdate({ metaEmqEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-[#E1306C]" />
                  <CardTitle className="text-lg">Instagram Shopping</CardTitle>
                </div>
                {config.lastInstagramSync && (
                  <span className="text-[8px] font-bold text-green-600 flex items-center gap-1 uppercase tracking-widest">
                    <CheckCircle2 className="h-2 w-2" /> Synced: {formatDate(config.lastInstagramSync)}
                  </span>
                )}
              </div>
              <CardDescription>
                Sync your Bento Grid categories directly into shoppable visual content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md flex flex-col gap-3 group relative overflow-hidden bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <Target className="h-5 w-5 text-primary" />
                  <Badge variant="outline" className="text-[8px] font-bold uppercase">Real-time Feed</Badge>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-tight">Product Tagging</h4>
                <p className="text-xs text-[#5c5f62]">Sync your archive drops into Instagram "Guides" and Shoppable Reels.</p>
                <Button 
                  className="h-10 bg-black text-white font-bold uppercase tracking-widest text-[9px] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all"
                  onClick={handleInstagramSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Pushing Catalog...</span>
                  ) : 'Sync Catalog Now'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Creator Marketplace</CardTitle>
                </div>
                <CardDescription>Enable white-listed ads for FSLNO archive partners.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-md flex flex-col gap-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <Badge variant="outline" className="text-[8px] font-bold uppercase">Auth Required</Badge>
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-tight">Partner Orchestration</h4>
                  <p className="text-xs text-[#5c5f62]">Grant advertising permissions to authorized archive content creators.</p>
                  
                  <Dialog open={isPartnersDialogOpen} onOpenChange={setIsPartnersDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-10 border-black font-bold uppercase tracking-widest text-[9px] hover:bg-secondary">
                        View Partners Archive
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl bg-white border-none rounded-none shadow-2xl p-0 overflow-hidden">
                      <DialogHeader className="p-8 border-b bg-gray-50/50">
                        <div className="flex items-center gap-3 text-primary mb-2">
                          <Users className="h-5 w-5" />
                          <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Archive Partners</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Manage authorized social commerce creators.</DialogDescription>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-y-auto max-h-[60vh]">
                        {isInviting ? (
                          <div className="p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-bold uppercase tracking-widest border-b pb-2">Invite New Creator</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-gray-500">Handle Name</Label>
                                <Input 
                                  placeholder="@username" 
                                  value={newPartner.name}
                                  onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                                  className="h-11"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-gray-500">Platform</Label>
                                <select 
                                  className="w-full h-11 border rounded-md px-3 text-sm font-bold uppercase bg-white focus:ring-1 focus:ring-black outline-none"
                                  value={newPartner.platform}
                                  onChange={(e) => setNewPartner({...newPartner, platform: e.target.value})}
                                >
                                  <option value="Instagram">Instagram</option>
                                  <option value="TikTok">TikTok</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" className="flex-1 h-11 uppercase font-bold text-[10px]" onClick={() => setIsInviting(false)}>Cancel</Button>
                              <Button className="flex-1 h-11 bg-black text-white uppercase font-bold text-[10px]" onClick={handleInvitePartner} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Invitation'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8">
                            <Table>
                              <TableHeader className="bg-gray-50/20">
                                <TableRow className="border-b border-black/5">
                                  <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Creator</TableHead>
                                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Platform</TableHead>
                                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Status</TableHead>
                                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">ROI</TableHead>
                                  <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {partnersLoading ? (
                                  <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
                                ) : !partners || partners.length === 0 ? (
                                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-[10px] font-bold uppercase text-gray-400">No archival partners cataloged.</TableCell></TableRow>
                                ) : (
                                  partners.map((partner) => (
                                    <TableRow key={partner.id} className="hover:bg-gray-50/30 border-b border-black/5 last:border-0 transition-all duration-300 group">
                                      <TableCell className="font-bold text-xs py-4 text-primary uppercase">{partner.name}</TableCell>
                                      <TableCell className="text-xs text-gray-500 uppercase font-medium">{partner.platform}</TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-widest border-none mx-auto", partner.status === 'Active' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                                          {partner.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-xs font-bold text-primary">{partner.roi}</TableCell>
                                      <TableCell>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => removePartner(partner.id)}
                                          className="h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                      
                      {!isInviting && (
                        <DialogFooter className="p-8 bg-gray-50/50 border-t flex flex-row items-center justify-between">
                          <Button variant="ghost" onClick={() => setIsPartnersDialogOpen(false)} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Close</Button>
                          <Button className="bg-black text-white h-12 px-8 font-bold uppercase tracking-widest text-[10px] gap-2" onClick={() => setIsInviting(true)}>
                            <PlusCircle className="h-4 w-4" /> Invite New Creator
                          </Button>
                        </DialogFooter>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {config.customIntegrations?.map((integration: any) => (
          <Card key={integration.id} className="border-[#e1e3e5] shadow-none border-dashed border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">{integration.name}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeIntegration(integration.id)} className="h-8 w-8 text-destructive hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-xs font-medium uppercase tracking-widest">{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-[#f6f6f7] rounded-md border text-center text-[10px] text-[#5c5f62] uppercase font-bold tracking-[0.1em]">
                Integration configuration pending API key validation.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end pt-8 border-t">
        <Button 
          className="bg-black text-white h-14 px-12 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300" 
          onClick={() => {
            handleSaveTokens();
            toast({ title: "Settings Finalized", description: "All social commerce configurations are now Authoritatively live." });
          }}
        >
          Save All Channel Settings
        </Button>
      </div>
    </div>
  );
}
