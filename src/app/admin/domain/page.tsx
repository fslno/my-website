'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  ShieldCheck, 
  FileText, 
  Search, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Terminal,
  Zap,
  Copy,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MetaTag {
  id: string;
  name: string;
  content: string;
}

interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export default function DomainPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'domain') : null, [db]);
  const { data: config, loading } = useDoc(configRef);
  const { toast } = useToast();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);

  // Local Form State
  const [domain, setDomain] = useState('fslno.com');
  const [metaTags, setMetaTags] = useState<MetaTag[]>([]);
  const [robotsTxt, setRobotsTxt] = useState('User-agent: *\nAllow: /');
  const [indexingEnabled, setIndexingEnabled] = useState(true);
  
  // API Tokens State
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');

  useEffect(() => {
    if (config) {
      setDomain(config.primaryDomain || 'fslno.com');
      setMetaTags(config.metaTags || []);
      setRobotsTxt(config.robotsTxt || 'User-agent: *\nAllow: /');
      setIndexingEnabled(config.searchIndexingEnabled ?? true);
      setApiTokens(config.apiTokens || []);
    }
  }, [config]);

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      primaryDomain: 'fslno.com',
      status: 'connected',
      metaTags: [
        { id: '1', name: 'google-site-verification', content: 'G-ARCHIVE-777' }
      ],
      sitemapUrl: 'https://fslno.com/sitemap.xml',
      robotsTxt: 'User-agent: *\nAllow: /',
      searchIndexingEnabled: true,
      sslStatus: 'valid',
      sslExpiry: '2026-12-31T23:59:59Z',
      apiTokens: [],
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

  const handleConnectDomain = () => {
    if (!configRef) return;
    setIsConnecting(true);
    
    // Simulate DNS Handshake
    setTimeout(() => {
      updateDoc(configRef, { 
        primaryDomain: domain,
        status: 'connected',
        updatedAt: serverTimestamp()
      })
        .then(() => {
          setIsConnecting(false);
          toast({ title: "Domain Connected", description: `${domain} is now Authoritatively verified.` });
        })
        .catch(() => setIsConnecting(false));
    }, 2000);
  };

  const handleSaveAll = () => {
    if (!configRef) return;
    setIsSaving(true);
    const updates = {
      metaTags,
      robotsTxt,
      searchIndexingEnabled: indexingEnabled,
      apiTokens,
      updatedAt: serverTimestamp()
    };

    updateDoc(configRef, updates)
      .then(() => {
        setIsSaving(false);
        toast({ title: "Visibility Saved", description: "Search engine and integration parameters have been synchronized." });
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

  const addMetaTag = () => {
    setMetaTags([...metaTags, { id: Math.random().toString(36).substr(2, 9), name: '', content: '' }]);
  };

  const updateMetaTag = (id: string, field: keyof MetaTag, value: string) => {
    setMetaTags(metaTags.map(tag => tag.id === id ? { ...tag, [field]: value } : tag));
  };

  const removeMetaTag = (id: string) => {
    setMetaTags(metaTags.filter(tag => tag.id !== id));
  };

  // API Token Handlers
  const handleGenerateToken = () => {
    if (!newTokenName || !configRef) return;
    
    const token = 'fslno_' + Math.random().toString(36).substr(2, 32);
    const newToken: ApiToken = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTokenName,
      token,
      createdAt: new Date().toISOString()
    };
    
    const updatedTokens = [...apiTokens, newToken];
    setApiTokens(updatedTokens);
    
    updateDoc(configRef, { apiTokens: updatedTokens, updatedAt: serverTimestamp() })
      .then(() => {
        setNewTokenName('');
        setIsTokenDialogOpen(false);
        toast({ title: "Token Generated", description: `${newTokenName} access key is now active.` });
      });
  };

  const handleDeleteToken = (id: string) => {
    if (!configRef) return;
    const updatedTokens = apiTokens.filter(t => t.id !== id);
    setApiTokens(updatedTokens);
    updateDoc(configRef, { apiTokens: updatedTokens, updatedAt: serverTimestamp() })
      .then(() => {
        toast({ title: "Token Revoked", description: "Access key has been Authoritatively decommissioned." });
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
        <Globe className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Visibility Core Not Initialized</h2>
        <p className="text-gray-500 max-w-sm px-4">Establish the archive's primary domain and indexing handshake to go live.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8 h-12 font-bold uppercase tracking-widest text-[10px]">Initialize Visibility</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Domain & Site Visibility</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Manage your store's primary address and Authoritatively orchestrate search engine visibility.</p>
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={isSaving}
          className="w-full sm:w-auto h-10 px-8 bg-black text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Commit Visibility Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg uppercase tracking-tight">Domain Name & Site Address</CardTitle>
              </div>
              <CardDescription className="text-xs font-medium uppercase tracking-tight">
                The primary URL for your archive. Connect a custom domain to ensure your high-fidelity brand is secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <Input 
                    placeholder="Enter your domain (e.g. fslno.com)" 
                    value={domain} 
                    onChange={(e) => setDomain(e.target.value)}
                    className="h-12 uppercase font-bold tracking-tight" 
                  />
                </div>
                <Button 
                  onClick={handleConnectDomain}
                  disabled={isConnecting || domain === config.primaryDomain}
                  className="bg-black text-white h-12 font-bold px-8 uppercase tracking-widest text-[10px] w-full sm:w-auto"
                >
                  {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {config.status === 'connected' && domain === config.primaryDomain ? 'Re-Verify' : 'Connect'}
                </Button>
              </div>
              
              {config.status === 'connected' && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-green-800 text-sm">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-bold uppercase text-[10px]">Security Protocol Active</p>
                      <p className="text-[11px] opacity-80 uppercase tracking-tight leading-tight">Primary domain is connected and Authoritatively secured via HTTPS.</p>
                    </div>
                  </div>
                  <Dialog open={isCertOpen} onOpenChange={setIsCertOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-[10px] h-auto p-0 text-green-800 font-bold underline uppercase tracking-widest">View Certificate</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                      <DialogHeader className="pt-8 border-b pb-6">
                        <div className="flex items-center gap-3 text-primary mb-2">
                          <Lock className="h-5 w-5 text-green-600" />
                          <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight text-primary">Certificate Manifest</DialogTitle>
                        </div>
                        <DialogDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Forensic SSL metadata for {domain}</DialogDescription>
                      </DialogHeader>
                      <div className="py-6 space-y-6 font-mono">
                        <section className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issuer Identity</p>
                          <div className="p-4 bg-gray-50 border rounded-sm text-[11px] text-primary uppercase break-all">
                            Let's Encrypt Authority X3
                          </div>
                        </section>
                        <section className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temporal Validity</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 border rounded-sm space-y-1">
                              <p className="text-[8px] text-gray-400 font-bold uppercase">Issued On</p>
                              <p className="text-[10px] font-bold">OCT 01, 2025</p>
                            </div>
                            <div className="p-3 bg-gray-50 border rounded-sm space-y-1">
                              <p className="text-[8px] text-gray-400 font-bold uppercase">Expires On</p>
                              <p className="text-[10px] font-bold text-green-600">DEC 31, 2026</p>
                            </div>
                          </div>
                        </section>
                      </div>
                      <div className="flex justify-end pt-6 border-t">
                        <Button onClick={() => setIsCertOpen(false)} className="bg-black text-white h-12 px-8 font-bold uppercase tracking-widest text-[10px] w-full sm:w-auto">Close Manifest</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b bg-gray-50/30">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg uppercase tracking-tight">API Integration Tokens</CardTitle>
                </div>
                <CardDescription className="text-xs font-medium uppercase tracking-tight mt-1">
                  Generate high-fidelity secure tokens to Authoritatively integrate with third-party archival tools.
                </CardDescription>
              </div>
              <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 font-bold uppercase tracking-widest text-[10px] border-black bg-white w-full sm:w-auto">
                    <Plus className="h-3.5 w-3.5" /> New Token
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                  <DialogHeader className="pt-6">
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Generate Access Token</DialogTitle>
                    <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-1">Create a new key for external API handshakes.</DialogDescription>
                  </DialogHeader>
                  <div className="py-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Integration Name</Label>
                      <Input 
                        placeholder="e.g. Analytics Bridge" 
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        className="h-12 uppercase font-bold"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleGenerateToken} disabled={!newTokenName} className="w-full bg-black text-white h-14 font-bold uppercase tracking-widest text-[10px]">
                      Generate Key
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                {apiTokens.map((token) => (
                  <div key={token.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 border rounded-sm group gap-4">
                    <div className="space-y-1 min-w-0 w-full">
                      <div className="flex items-center gap-2">
                        <Key className="h-3 w-3 text-gray-400 shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-widest truncate">{token.name}</p>
                      </div>
                      <p className="text-[9px] font-mono text-gray-400">CREATED: {new Date(token.createdAt).toLocaleDateString()}</p>
                      <div className="flex items-center gap-2 mt-2 w-full">
                        <code className="text-[10px] bg-white border px-2 py-1.5 rounded font-mono text-primary select-all truncate flex-1">
                          {token.token.substring(0, 12)}••••••••
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white border" 
                          onClick={() => {
                            navigator.clipboard.writeText(token.token);
                            toast({ title: "Copied", description: "API Token saved to clipboard." });
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteToken(token.id)}
                      className="text-red-500 hover:bg-red-50 self-end sm:self-center h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {apiTokens.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed rounded-sm bg-gray-50/50">
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">No active API handshakes cataloged.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b bg-gray-50/30">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-lg uppercase tracking-tight">Header Meta Tags & Verification</CardTitle>
                </div>
                <CardDescription className="text-xs font-medium uppercase tracking-tight mt-1">
                  Inject high-fidelity custom code for Google Search Console, Pinterest, and Meta verification.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addMetaTag} className="h-9 gap-2 font-bold uppercase tracking-widest text-[10px] border-black bg-white w-full sm:w-auto">
                <Plus className="h-3.5 w-3.5" /> Add Tag
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                {metaTags.map((tag) => (
                  <div key={tag.id} className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-top-2 duration-300 group bg-white border p-3 sm:p-0 sm:border-none">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                      <div className="space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-gray-400 sm:hidden">Tag Name</Label>
                        <Input 
                          placeholder="Tag Name (e.g. google-site-verification)" 
                          value={tag.name} 
                          onChange={(e) => updateMetaTag(tag.id, 'name', e.target.value)}
                          className="h-11 text-xs font-bold uppercase" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[8px] uppercase font-bold text-gray-400 sm:hidden">Content Hash</Label>
                        <Input 
                          placeholder="Verification Content Hash" 
                          value={tag.content} 
                          onChange={(e) => updateMetaTag(tag.id, 'content', e.target.value)}
                          className="h-11 text-xs font-mono" 
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeMetaTag(tag.id)}
                      className="h-11 w-full sm:w-11 text-red-500 hover:bg-red-50 border sm:border-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {metaTags.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed rounded-sm bg-gray-50/50">
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">No verification snippets cataloged.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="bg-gray-50/30 border-b">
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg uppercase tracking-tight">Robots.txt Control</CardTitle>
              </div>
              <CardDescription className="text-xs font-medium uppercase tracking-tight mt-1">
                Authoritatively direct search engine crawlers across the archive paths.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea 
                value={robotsTxt} 
                onChange={(e) => setRobotsTxt(e.target.value)}
                placeholder="User-agent: *\nAllow: /"
                className="min-h-[150px] font-mono text-xs p-4 bg-gray-50 resize-none border-primary/10 rounded-none"
              />
              <p className="mt-3 text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-tight leading-relaxed">
                Warning: Improper configurations can decommission your entire archive from search results.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="bg-gray-50/30 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Archival Sitemap</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-[10px] sm:text-[11px] text-[#5c5f62] uppercase font-medium leading-relaxed tracking-tight">
                Your sitemap.xml is Authoritatively generated to help Google index your new drops instantly.
              </p>
              <div className="flex items-center justify-between p-3 bg-[#f6f6f7] rounded-sm border gap-3 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold truncate flex-1">{config.sitemapUrl}</span>
                <Button variant="ghost" size="sm" className="h-8 gap-2 uppercase text-[9px] font-bold shrink-0 bg-white border" asChild>
                  <a href={config.sitemapUrl} target="_blank">
                    <ExternalLink className="h-3 w-3" /> View
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none bg-gray-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Search Indexing</CardTitle>
              </div>
              <Switch 
                checked={indexingEnabled} 
                onCheckedChange={setIndexingEnabled} 
              />
            </CardHeader>
            <CardContent>
              <p className="text-[10px] sm:text-[11px] text-[#5c5f62] uppercase font-medium leading-relaxed tracking-tight">
                Visibility Toggle: When ON, Google and Bing can find your archive. Turn OFF for "Maintenance Mode" or private "Spot Closing" drops.
              </p>
              {indexingEnabled ? (
                <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-sm border border-green-100">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Visible to Global Crawlers</span>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-sm border border-red-100">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Private: Crawling Decommissioned</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none overflow-hidden">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5" /> DNS Health Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start justify-between border-b border-white/5 pb-4 gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase">A-Record (IP)</p>
                  <p className="text-[9px] text-gray-400 font-mono truncate">151.101.1.195</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-none text-[8px] font-bold uppercase tracking-widest shrink-0">Matched</Badge>
              </div>
              <div className="flex items-start justify-between border-b border-white/5 pb-4 gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase">CNAME (WWW)</p>
                  <p className="text-[9px] text-gray-400 font-mono truncate">fslno.com</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-none text-[8px] font-bold uppercase tracking-widest shrink-0">Matched</Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase">SPF / TXT</p>
                  <p className="text-[9px] text-gray-400 font-mono truncate">v=spf1 include:_spf.google.com</p>
                </div>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-none text-[8px] font-bold uppercase tracking-widest shrink-0">Propagating</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-gray-50 border rounded-sm space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> DNS Integrity Note
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tight font-medium">
              Visibility changes strictly apply to the live production manifest. Ensure DNS propagation is complete before enforcing "Canceled" indexing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
