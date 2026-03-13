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
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Social Commerce</h1>
          <p className="text-[#5c5f62] mt-1 text-xs sm:text-sm uppercase font-medium tracking-tight">Sync archival inventory with TikTok and Meta platforms.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 flex-1 sm:flex-none gap-2 border-[#babfc3] font-bold uppercase tracking-widest text-[10px]">
                <Plus className="h-4 w-4" /> Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
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
            className="h-10 flex-1 sm:flex-none px-8 bg-black text-white font-bold uppercase tracking-widest text-[10px] shadow-md"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span className="hidden xs:inline ml-2">Commit API Config</span>
            <span className="xs:hidden ml-2">Save</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-[#ff0050]" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">TikTok Shop Seller API</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-100 bg-green-50 uppercase text-[8px] font-bold tracking-widest">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-white border rounded-sm">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-tight">In-App Checkout</p>
                  <p className="text-[10px] text-[#5c5f62] uppercase leading-tight">Biometric native shopping.</p>
                </div>
                <Switch 
                  checked={config.tiktokInAppCheckout} 
                  onCheckedChange={(checked) => handleUpdate({ tiktokInAppCheckout: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-white border rounded-sm">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-tight">Affiliate Dashboard</p>
                  <p className="text-[10px] text-[#5c5f62] uppercase leading-tight">Creator sample tracking.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 border-[#babfc3] font-bold uppercase tracking-widest text-[9px]"
                  onClick={() => setIsPartnersDialogOpen(true)}
                >
                  Orchestrate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">TikTok Shop Access Token</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="password" 
                  value={tiktokToken} 
                  onChange={(e) => setTiktokToken(e.target.value)}
                  className="pl-10 font-mono text-xs h-11 bg-gray-50/50" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#0668E1]" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Meta Conversions API</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-100 bg-green-50 uppercase text-[8px] font-bold tracking-widest">Linked</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm">
              <div className="flex gap-3">
                <Zap className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-blue-900 uppercase tracking-tight">Direct Server Dispatch</p>
                  <p className="text-[10px] text-blue-800 leading-relaxed uppercase tracking-tight opacity-70">
                    Bypass browser ad-blockers for forensic attribution accuracy.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Meta Pixel ID</Label>
                <div className="relative">
                  <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={pixelId} 
                    onChange={(e) => setPixelId(e.target.value)}
                    className="pl-10 h-11 font-mono text-xs bg-gray-50/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Server Access Token</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="password" 
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    className="pl-10 h-11 font-mono text-xs bg-gray-50/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-tight flex items-center gap-2">
                  Match Quality Protocol <Badge variant="secondary" className="text-[7px] h-3.5 px-1.5 font-bold uppercase tracking-widest">Advanced</Badge>
                </p>
                <p className="text-[10px] text-[#5c5f62] uppercase leading-tight">Stitch sessions across architectural touchpoints.</p>
              </div>
              <Switch 
                checked={config.metaEmqEnabled} 
                onCheckedChange={(checked) => handleUpdate({ metaEmqEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-[#E1306C]" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Instagram Shopping</CardTitle>
                </div>
                {config.lastInstagramSync && (
                  <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest">
                    Synced: {formatDate(config.lastInstagramSync)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-4 border border-dashed rounded-sm flex flex-col gap-4 bg-gray-50/30">
                <div className="flex items-center justify-between">
                  <Target className="h-4 w-4 text-primary opacity-40" />
                  <Badge variant="outline" className="text-[7px] font-bold uppercase tracking-widest h-4 px-1.5">Live Feed</Badge>
                </div>
                <p className="text-[10px] text-[#5c5f62] uppercase leading-relaxed font-medium">Sync bento categories into shoppable visual guides and product reels.</p>
                <Button 
                  className="h-10 bg-black text-white font-bold uppercase tracking-widest text-[9px] w-full"
                  onClick={handleInstagramSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                  {isSyncing ? 'Pushing Catalog...' : 'Sync Catalog Now'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Partner Network</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-4 border border-dashed rounded-sm flex flex-col gap-4 bg-gray-50/30">
                <div className="flex items-center justify-between">
                  <Zap className="h-4 w-4 text-orange-500 opacity-40" />
                  <Badge variant="outline" className="text-[7px] font-bold uppercase tracking-widest h-4 px-1.5">ROI Active</Badge>
                </div>
                <p className="text-[10px] text-[#5c5f62] uppercase leading-relaxed font-medium">Manage permissions and white-listed ad access for studio partners.</p>
                <Button 
                  variant="outline" 
                  className="h-10 border-black font-bold uppercase tracking-widest text-[9px] w-full hover:bg-black hover:text-white transition-all"
                  onClick={() => setIsPartnersDialogOpen(true)}
                >
                  View Archive Partners
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {config.customIntegrations?.map((integration: any) => (
          <Card key={integration.id} className="border-[#e1e3e5] shadow-none border-dashed border-2 rounded-none bg-gray-50/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary opacity-40" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">{integration.name}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeIntegration(integration.id)} className="h-8 w-8 text-destructive hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <CardDescription className="text-[10px] font-bold uppercase tracking-tight opacity-60">{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white border border-black/5 rounded-sm text-center">
                <p className="text-[9px] text-[#8c9196] uppercase font-bold tracking-widest">Awaiting forensic API validation.</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end pt-8 border-t">
        <Button 
          className="w-full sm:w-auto bg-black text-white h-14 px-12 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300" 
          onClick={() => {
            handleSaveTokens();
            toast({ title: "Manifest Finalized", description: "Channel protocols have been Authoritatively synchronized." });
          }}
        >
          Synchronize All Channels
        </Button>
      </div>

      {/* Partners Dialog - Fixed for Mobile */}
      <Dialog open={isPartnersDialogOpen} onOpenChange={setIsPartnersDialogOpen}>
        <DialogContent className="max-w-[100vw] w-screen h-screen m-0 sm:max-w-3xl sm:h-auto sm:rounded-none bg-white border-none p-0 overflow-hidden flex flex-col shadow-2xl">
          <DialogHeader className="p-6 sm:p-8 border-b bg-gray-50/50 shrink-0 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-primary">
                <Users className="h-5 w-5" />
                <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Archive Partners</DialogTitle>
              </div>
              <DialogDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Manage authorized social commerce creators.</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsPartnersDialogOpen(false)} className="rounded-full h-10 w-10 sm:hidden">
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {isInviting ? (
              <div className="p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-sm font-bold uppercase tracking-widest border-b pb-2">Invite New Creator</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Handle Identity</Label>
                    <Input 
                      placeholder="@username" 
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                      className="h-12 bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Target Platform</Label>
                    <select 
                      className="w-full h-12 border rounded-none px-3 text-[10px] font-bold uppercase bg-white focus:ring-1 focus:ring-black outline-none"
                      value={newPartner.platform}
                      onChange={(e) => setNewPartner({...newPartner, platform: e.target.value})}
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                      <option value="X (Twitter)">X (Twitter)</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Pinterest">Pinterest</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 h-12 uppercase font-bold text-[10px] rounded-none" onClick={() => setIsInviting(false)}>Cancel</Button>
                  <Button className="flex-1 h-12 bg-black text-white uppercase font-bold text-[10px] rounded-none" onClick={handleInvitePartner} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authorize Invitation'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-0 sm:p-8">
                <Table>
                  <TableHeader className="bg-gray-50/20">
                    <TableRow className="border-b border-black/5">
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest py-4 px-6">Creator</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest hidden xs:table-cell">Platform</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-center">Status</TableHead>
                      <TableHead className="text-right text-[9px] font-bold uppercase tracking-widest px-6">ROI</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnersLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
                    ) : !partners || partners.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-[10px] font-bold uppercase text-gray-400 tracking-widest">No partners cataloged.</TableCell></TableRow>
                    ) : (
                      partners.map((partner) => (
                        <TableRow key={partner.id} className="hover:bg-gray-50/30 border-b border-black/5 last:border-0 transition-all group">
                          <TableCell className="font-bold text-xs py-5 px-6 text-primary uppercase">
                            <div className="flex flex-col">
                              <span>{partner.name}</span>
                              <span className="xs:hidden text-[8px] text-gray-400 font-medium mt-0.5">{partner.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] text-gray-500 uppercase font-medium hidden xs:table-cell">{partner.platform}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-[8px] font-bold uppercase tracking-widest border-none mx-auto", partner.status === 'Active' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                              {partner.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-primary px-6">{partner.roi}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removePartner(partner.id)}
                              className="h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
          
          <DialogFooter className="p-6 sm:p-8 bg-gray-50/50 border-t flex flex-row items-center justify-between shrink-0">
            {!isInviting ? (
              <>
                <Button variant="ghost" onClick={() => setIsPartnersDialogOpen(false)} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Close Manifest</Button>
                <Button className="bg-black text-white h-12 px-8 font-bold uppercase tracking-widest text-[10px] gap-2 rounded-none shadow-lg" onClick={() => setIsInviting(true)}>
                  <PlusCircle className="h-4 w-4" /> Invite Creator
                </Button>
              </>
            ) : (
              <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mx-auto">Identity registration pending confirmation.</p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
