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
  Save, 
  Loader2, 
  Image as ImageIcon,
  Trash2,
  Plus,
  ArrowRight,
  Smartphone,
  Eye,
  Settings2,
  Layout,
  Globe,
  FileText,
  Terminal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckCircle2,
  Type,
  Palette,
  ShoppingBag,
  PlusCircle,
  X
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

export default function StorefrontAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme, isLoading: themeLoading } = useDoc(themeRef);

  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubheadline, setHeroSubheadline] = useState('');
  const [heroButtonText, setHeroButtonText] = useState('');
  const [homepageLayout, setHomepageLayout] = useState('bento');
  const [homepageDescription, setHomepageDescription] = useState('');
  
  // Hero Styling State
  const [heroHeadlineColor, setHeroHeadlineColor] = useState('#000000');
  const [heroSubheadlineColor, setHeroSubheadlineColor] = useState('#8c9196');
  const [heroHeadlineSize, setHeroHeadlineSize] = useState('72');
  const [heroSubheadlineSize, setHeroSubheadlineSize] = useState('10');
  const [heroTextAlign, setHeroTextAlign] = useState('center');
  const [heroVerticalAlign, setHeroVerticalAlign] = useState('center');
  const [heroButtonBgColor, setHeroButtonBgColor] = useState('#FFFFFF');
  const [heroButtonTextColor, setHeroButtonTextColor] = useState('#000000');

  // SEO State
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoHandle, setSeoHandle] = useState('');

  useEffect(() => {
    if (theme) {
      if (theme.heroImages) {
        setHeroImages(theme.heroImages);
      } else if (theme.heroImageUrl) {
        setHeroImages([theme.heroImageUrl]);
      }
      
      setHeroHeadline(theme.heroHeadline || '');
      setHeroSubheadline(theme.heroSubheadline || '');
      setHeroButtonText(theme.heroButtonText || 'Shop the Drops');
      setHomepageLayout(theme.homepageLayout || 'bento');
      setHomepageDescription(theme.homepageDescription || '');
      setSeoTitle(theme.homepageSeo?.title || '');
      setSeoDescription(theme.homepageSeo?.description || '');
      setSeoHandle(theme.homepageSeo?.handle || '');
      
      // Load styling from theme
      setHeroHeadlineColor(theme.heroHeadlineColor || '#000000');
      setHeroSubheadlineColor(theme.heroSubheadlineColor || '#8c9196');
      setHeroHeadlineSize(theme.heroHeadlineSize?.toString() || '72');
      setHeroSubheadlineSize(theme.heroSubheadlineSize?.toString() || '10');
      setHeroTextAlign(theme.heroTextAlign || 'center');
      setHeroVerticalAlign(theme.heroVerticalAlign || 'center');
      setHeroButtonBgColor(theme.heroButtonBgColor || '#FFFFFF');
      setHeroButtonTextColor(theme.heroButtonTextColor || '#000000');
    }
  }, [theme]);

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeHeroImage = (index: number) => {
    setHeroImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!themeRef) return;
    setIsSaving(true);

    const payload = {
      heroImages,
      heroHeadline,
      heroSubheadline,
      heroButtonText,
      homepageLayout,
      homepageDescription,
      homepageSeo: {
        title: seoTitle,
        description: seoDescription,
        handle: seoHandle
      },
      // Styling payload
      heroHeadlineColor,
      heroSubheadlineColor,
      heroHeadlineSize: Number(heroHeadlineSize),
      heroSubheadlineSize: Number(heroSubheadlineSize),
      heroTextAlign,
      heroVerticalAlign,
      heroButtonBgColor,
      heroButtonTextColor,
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
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Storefront Command</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Orchestrate your archival home page content, SEO, and visual narrative.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full sm:w-auto h-10 px-10 bg-black text-white font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#D3D3D3] transition-all"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Commit All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white border h-auto xl:h-14 p-1 flex flex-wrap xl:flex-nowrap justify-start rounded-none mb-8 overflow-hidden">
              <TabsTrigger value="general" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white rounded-none h-12 xl:h-full">
                <FileText className="h-3.5 w-3.5" /> General Info
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white rounded-none h-12 xl:h-full">
                <Globe className="h-3.5 w-3.5" /> Home SEO
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white rounded-none h-12 xl:h-full">
                <Layout className="h-3.5 w-3.5" /> Architecture
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="m-0 space-y-8 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
                <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg uppercase tracking-tight">Hero Narrative</CardTitle>
                  </div>
                  <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground">The primary editorial focus of your storefront.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 space-y-12">
                  <div className="space-y-8">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {heroImages.map((url, idx) => (
                            <div key={idx} className="relative aspect-video rounded border overflow-hidden group shadow-sm">
                              <Image src={url} alt={`Hero ${idx}`} fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  onClick={() => removeHeroImage(idx)} 
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">
                                {idx === 0 ? 'Primary' : (idx + 1).toString().padStart(2, '0')}
                              </div>
                            </div>
                          ))}
                          <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="aspect-video border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors group"
                          >
                            <PlusCircle className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black">Add Image</span>
                          </button>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          multiple 
                          accept="image/*" 
                          onChange={handleHeroImageUpload} 
                        />
                        <p className="text-[8px] text-gray-400 uppercase font-bold">Recommended: 16:9 aspect ratio. Multiple images will Authoritatively manifest a slider.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-gray-400" />
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Hero Color Protocol</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Headline Color</Label>
                          <div className="flex gap-2">
                            <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                              <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={heroHeadlineColor} onChange={(e) => setHeroHeadlineColor(e.target.value)} />
                            </div>
                            <Input value={heroHeadlineColor} onChange={(e) => setHeroHeadlineColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Subheadline Color</Label>
                          <div className="flex gap-2">
                            <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                              <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={heroSubheadlineColor} onChange={(e) => setHeroSubheadlineColor(e.target.value)} />
                            </div>
                            <Input value={heroSubheadlineColor} onChange={(e) => setHeroSubheadlineColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Button Background</Label>
                          <div className="flex gap-2">
                            <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                              <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={heroButtonBgColor} onChange={(e) => setHeroButtonBgColor(e.target.value)} />
                            </div>
                            <Input value={heroButtonBgColor} onChange={(e) => setHeroButtonBgColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Button Text Color</Label>
                          <div className="flex gap-2">
                            <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                              <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={heroButtonTextColor} onChange={(e) => setHeroButtonTextColor(e.target.value)} />
                            </div>
                            <Input value={heroButtonTextColor} onChange={(e) => setHeroButtonTextColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-gray-400" />
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Headline Geometry</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Headline Scale</Label>
                          <Badge variant="outline" className="text-[10px] font-mono font-bold">{heroHeadlineSize}PX</Badge>
                        </div>
                        <input 
                          type="range" min="32" max="160" value={heroHeadlineSize} 
                          onChange={(e) => setHeroHeadlineSize(e.target.value)} 
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                        />
                      </div>
                      <div className="space-y-4 pt-4 border-t border-dashed">
                        <div className="flex justify-between items-center">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Subheadline Scale</Label>
                          <Badge variant="outline" className="text-[10px] font-mono font-bold">{heroSubheadlineSize}PX</Badge>
                        </div>
                        <input 
                          type="range" min="8" max="40" value={heroSubheadlineSize} 
                          onChange={(e) => setHeroSubheadlineSize(e.target.value)} 
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <AlignLeft className="h-4 w-4 text-gray-400" />
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Alignment Orchestration</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Horizontal</Label>
                        <div className="flex border p-1 rounded-sm bg-gray-50">
                          <Button variant={heroTextAlign === 'left' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setHeroTextAlign('left')}><AlignLeft className="h-4 w-4" /></Button>
                          <Button variant={heroTextAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setHeroTextAlign('center')}><AlignCenter className="h-4 w-4" /></Button>
                          <Button variant={heroTextAlign === 'right' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setHeroTextAlign('right')}><AlignRight className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Vertical</Label>
                        <div className="flex border p-1 rounded-sm bg-gray-50">
                          <Button variant={heroVerticalAlign === 'top' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setHeroVerticalAlign('top')} title="Top"><AlignLeft className="h-4 w-4 rotate-90" /></Button>
                          <Button variant={heroVerticalAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setHeroVerticalAlign('center')} title="Center"><AlignCenter className="h-4 w-4 rotate-90" /></Button>
                          <Button variant={heroVerticalAlign === 'bottom' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setHeroVerticalAlign('bottom')} title="Bottom"><AlignRight className="h-4 w-4 rotate-90" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg uppercase tracking-tight">Studio Description</CardTitle>
                  </div>
                  <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground">The narrative description Authoritatively manifested on the home page.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">General Description</Label>
                    <Textarea 
                      value={homepageDescription} 
                      onChange={(e) => setHomepageDescription(e.target.value)}
                      placeholder="Tell the story of your archive drops..."
                      className="min-h-[150px] resize-none uppercase text-xs font-medium leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="m-0 space-y-8 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="border-b bg-gray-50/30 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-500" />
                    <CardTitle className="text-lg uppercase tracking-tight">Home Page SEO Manifest</CardTitle>
                  </div>
                  <CardDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground">How your studio manifests in search results.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 p-4 sm:p-6 space-y-8">
                  <div className="bg-blue-50/50 p-6 rounded-none border border-blue-100 border-dashed">
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-4 flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" /> Google Preview
                    </p>
                    <div className="space-y-1">
                      <p className="text-blue-700 text-lg hover:underline cursor-pointer font-medium truncate">{seoTitle || (theme?.heroHeadline || 'Store Name')}</p>
                      <p className="text-green-800 text-xs truncate">https://fslno.ca/</p>
                      <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">{seoDescription || 'The curated home of luxury archive pieces.'}</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Meta Title</Label>
                      <Input 
                        value={seoTitle} 
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder="FSLNO | The Archive Selection"
                        className="h-12 font-bold uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Meta Description</Label>
                      <Textarea 
                        value={seoDescription} 
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder="High-fidelity silhouettes meticulously cataloged for the studio selection..."
                        className="min-h-[100px] resize-none uppercase text-[10px] font-medium leading-relaxed"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="m-0 space-y-8 animate-in fade-in duration-300">
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
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none bg-zinc-900 text-white overflow-hidden sticky top-24">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5" /> High Fidelity Preview
                </CardTitle>
                <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-400 text-[8px] font-bold uppercase">Ready</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div 
                className="aspect-[16/10] bg-zinc-800 rounded-sm overflow-hidden border border-white/5 relative flex p-4 text-center"
                style={{
                  alignItems: heroVerticalAlign === 'bottom' ? 'flex-end' : heroVerticalAlign === 'top' ? 'flex-start' : 'center',
                  justifyContent: heroTextAlign === 'left' ? 'flex-start' : heroTextAlign === 'right' ? 'flex-end' : 'center',
                  textAlign: heroTextAlign as any
                }}
              >
                {heroImages.length > 0 ? (
                  <Image src={heroImages[0]} alt="Hero Preview" fill className="object-cover opacity-20" />
                ) : (
                  <div className="absolute inset-0 bg-white/5" />
                )}
                <div className="relative z-10 space-y-2 w-full">
                  <p className="uppercase tracking-[0.4em]" style={{ color: heroSubheadlineColor, fontSize: `${Math.max(6, Number(heroSubheadlineSize) / 4)}px` }}>{heroSubheadline || 'MODERN SILHOUETTES'}</p>
                  <h3 className="font-headline font-bold uppercase tracking-tight leading-none"
                    style={{
                      color: heroHeadlineColor,
                      fontSize: `${Math.max(12, Number(heroHeadlineSize) / 4)}px`
                    }}
                  >
                    {heroHeadline || 'THE ARCHIVE SELECTION'}
                  </h3>
                  <div 
                    className="w-24 h-7 flex items-center justify-center text-[7px] font-bold uppercase tracking-widest mt-4"
                    style={{
                      backgroundColor: heroButtonBgColor,
                      color: heroButtonTextColor,
                      marginLeft: heroTextAlign === 'left' ? '0' : heroTextAlign === 'right' ? 'auto' : 'auto',
                      marginRight: heroTextAlign === 'right' ? '0' : heroTextAlign === 'left' ? 'auto' : 'auto',
                    }}
                  >
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

              <Separator className="bg-white/10" />

              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                  <div className="h-3.5 w-3.5 text-blue-400"><Terminal className="h-full w-full" /></div> Engine Status
                </h4>
                <div className="space-y-2 text-[9px] font-mono uppercase">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">PROTOCOL:</span>
                    <span className="text-white">{homepageLayout}_GRID</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">SEO_STATUS:</span>
                    <span className={cn(seoTitle && seoDescription ? 'text-green-400' : 'text-orange-400')}>
                      {seoTitle && seoDescription ? 'OPTIMIZED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-gray-50 border rounded-none space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <Settings2 className="h-3.5 w-3.5" /> Administrative Logic
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold opacity-70">
              Changes apply Authoritatively to the live storefront. Ensure all visuals are high-fidelity before saving.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
