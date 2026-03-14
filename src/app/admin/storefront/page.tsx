'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Sparkles, 
  ShoppingBag, 
  Layers, 
  Save, 
  Loader2, 
  Image as ImageIcon,
  Trash2,
  Plus,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Eye,
  Settings2
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function StorefrontAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme, isLoading: themeLoading } = useDoc(themeRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubheadline, setHeroSubheadline] = useState('');
  const [heroButtonText, setHeroButtonText] = useState('');
  const [homepageLayout, setHomepageLayout] = useState('bento');

  useEffect(() => {
    if (theme) {
      setHeroImageUrl(theme.heroImageUrl || '');
      setHeroHeadline(theme.heroHeadline || '');
      setHeroSubheadline(theme.heroSubheadline || '');
      setHeroButtonText(theme.heroButtonText || 'Shop the Drops');
      setHomepageLayout(theme.homepageLayout || 'bento');
    }
  }, [theme]);

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setHeroImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!themeRef) return;
    setIsSaving(true);

    const payload = {
      heroImageUrl,
      heroHeadline,
      heroSubheadline,
      heroButtonText,
      homepageLayout,
      updatedAt: serverTimestamp()
    };

    setDoc(themeRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Storefront Updated", description: "Archival content has been Authoritatively synchronized." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: themeRef.path,
          operation: 'write',
          requestResourceData: payload
        }));
      })
      .finally(() => setIsSaving(false));
  };

  if (themeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Storefront Command</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Orchestrate your archival home page content and hero selection.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full sm:w-auto h-10 px-10 bg-black text-white font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#D3D3D3] transition-all"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Commit Content
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg uppercase tracking-tight">Hero Narrative</CardTitle>
              </div>
              <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground">The primary editorial focus of your storefront.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Main Headline</Label>
                    <Input 
                      value={heroHeadline} 
                      onChange={(e) => setHeroHeadline(e.target.value)}
                      placeholder="THE ARCHIVE SELECTION"
                      className="h-12 font-bold uppercase text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Subheadline</Label>
                    <Input 
                      value={heroSubheadline} 
                      onChange={(e) => setHeroSubheadline(e.target.value)}
                      placeholder="MODERN SILHOUETTES"
                      className="h-12 uppercase text-[10px] tracking-widest"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Call to Action</Label>
                    <Input 
                      value={heroButtonText} 
                      onChange={(e) => setHeroButtonText(e.target.value)}
                      placeholder="SHOP ALL"
                      className="h-12 uppercase text-[10px] font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-bold text-gray-500">Hero Media (High Fidelity)</Label>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleHeroImageUpload} />
                  <div 
                    onClick={() => !heroImageUrl && fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-none p-6 flex flex-col items-center justify-center gap-4 bg-gray-50 hover:border-black transition-all cursor-pointer min-h-[200px]"
                  >
                    {heroImageUrl ? (
                      <div className="relative w-full aspect-video rounded-sm overflow-hidden shadow-lg border">
                        <Image src={heroImageUrl} alt="Hero Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); setHeroImageUrl(''); }} className="h-9 w-9">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="icon" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="h-9 w-9">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors"><ImageIcon className="h-6 w-6" /></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ingest Primary Visual</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg uppercase tracking-tight">Homepage Architecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setHomepageLayout('bento')}
                  className={cn(
                    "p-6 border-2 text-left space-y-4 transition-all duration-300",
                    homepageLayout === 'bento' ? "border-black bg-black text-white shadow-2xl" : "border-gray-100 bg-gray-50/50 hover:bg-gray-100"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest">Bento Protocol</span>
                    {homepageLayout === 'bento' && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <p className={cn("text-[10px] uppercase leading-relaxed font-medium opacity-70", homepageLayout === 'bento' ? 'text-zinc-400' : 'text-zinc-500')}>Dynamic staggered grid featuring multiple archival categories simultaneously.</p>
                </button>
                <button 
                  onClick={() => setHomepageLayout('classic')}
                  className={cn(
                    "p-6 border-2 text-left space-y-4 transition-all duration-300",
                    homepageLayout === 'classic' ? "border-black bg-black text-white shadow-2xl" : "border-gray-100 bg-gray-50/50 hover:bg-gray-100"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest">Classic Manifest</span>
                    {homepageLayout === 'classic' && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <p className={cn("text-[10px] uppercase leading-relaxed font-medium opacity-70", homepageLayout === 'classic' ? 'text-zinc-400' : 'text-zinc-500')}>Simplified, full-width single column hero with centralized focus.</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg uppercase tracking-tight">Featured Selection</CardTitle>
              </div>
              <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Manage which collections appear in the primary navigation and spotlight sections.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-auto max-h-[400px]">
                <div className="divide-y">
                  {categories?.map((cat: any) => (
                    <div key={cat.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-gray-100 rounded-sm overflow-hidden border shadow-sm relative shrink-0">
                          {cat.imageUrl && <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight">{cat.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-medium mt-0.5">Order: {cat.order + 1}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-[9px] font-bold uppercase tracking-widest hover:underline h-8">
                        <a href="/admin/categories">Edit Metadata <ArrowRight className="ml-2 h-3 w-3" /></a>
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Preview Column */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none bg-zinc-900 text-white overflow-hidden">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5" /> High Fidelity Preview
                </CardTitle>
                <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-400 text-[8px] font-bold uppercase">Ready</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="aspect-[16/10] bg-zinc-800 rounded-sm overflow-hidden border border-white/5 relative flex items-center justify-center p-4 text-center">
                {heroImageUrl ? (
                  <Image src={heroImageUrl} alt="Hero Preview" fill className="object-cover opacity-20" />
                ) : (
                  <div className="absolute inset-0 bg-white/5" />
                )}
                <div className="relative z-10 space-y-2">
                  <p className="text-[7px] uppercase tracking-[0.4em] text-zinc-500">{heroSubheadline || 'MODERN SILHOUETTES'}</p>
                  <h3 className="text-lg font-headline font-bold uppercase tracking-tight leading-none">{heroHeadline || 'THE ARCHIVE SELECTION'}</h3>
                  <div className="mx-auto w-24 h-7 bg-white/10 border border-white/20 flex items-center justify-center text-[7px] font-bold uppercase tracking-widest mt-4">
                    {heroButtonText || 'SHOP NOW'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-sm space-y-2">
                  <Smartphone className="h-3.5 w-3.5 text-zinc-500" />
                  <p className="text-[8px] font-bold uppercase text-zinc-400">Mobile Integrity</p>
                  <Progress value={100} className="h-1 bg-zinc-800 rounded-none" />
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-sm space-y-2">
                  <Eye className="h-3.5 w-3.5 text-zinc-500" />
                  <p className="text-[8px] font-bold uppercase text-zinc-400">Live Traffic</p>
                  <Progress value={42} className="h-1 bg-zinc-800 rounded-none" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none bg-gray-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5" /> Engine Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-600">
                <span>Sticky Nav Protocol</span>
                <Badge variant="outline" className="text-[8px] border-none bg-green-50 text-green-700">ACTIVE</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-600">
                <span>Responsive Scaling</span>
                <Badge variant="outline" className="text-[8px] border-none bg-green-50 text-green-700">AUTOMATIC</Badge>
              </div>
              <Separator />
              <p className="text-[9px] text-zinc-400 leading-relaxed uppercase font-medium italic">
                Storefront content changes apply Authoritatively to the home page manifest. Ensure all editorial assets are forensic-ready before committing.
              </p>
            </CardContent>
          </Card>

          <div className="bg-black text-white p-6 shadow-2xl rounded-none space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-blue-400">
              <Sparkles className="h-3.5 w-3.5" /> Quick Actions
            </h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 text-white text-[9px] font-bold uppercase h-10 px-4" asChild>
                <Link href="/admin/theme">Theme Styles <ExternalLink className="h-3 w-3" /></Link>
              </Button>
              <Button variant="outline" className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 text-white text-[9px] font-bold uppercase h-10 px-4" asChild>
                <Link href="/admin/categories">Organize Categories <ExternalLink className="h-3 w-3" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
