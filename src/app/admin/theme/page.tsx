'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Palette, 
  Layout, 
  Megaphone, 
  Type, 
  Save, 
  RefreshCcw,
  Monitor,
  Smartphone,
  Loader2,
  MousePointer2,
  ChevronRight,
  ShoppingBag,
  Search as SearchIcon,
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const sportsFonts = [
  "Gameday", "Hyper Oxide", "Quarterback", "Rushblade", "Cricket", 
  "Crossfly", "Bancher", "Racing", "Zonex", "Microsport", 
  "Promesh", "Reach Sports", "Aguante", "MADE Soulmaze", "Backed", 
  "Claymale", "Slam Dunk", "Holigan", "Jaguar", "New Varsity"
];

const DEFAULT_THEME = {
  primaryColor: '#000000',
  accentColor: '#FFFFFF',
  headlineFont: 'Playfair Display',
  bodyFont: 'Inter',
  borderRadius: '0',
  bannerEnabled: true,
  bannerText: 'Free global shipping on orders over $500',
  bannerBgColor: '#000000',
  homepageLayout: 'bento',
  heroImageUrl: '',
  heroHeadline: 'The Archive Selection',
  heroSubheadline: 'Modern Silhouettes'
};

export default function ThemeEnginePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);

  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: themeData, loading } = useDoc(themeRef);

  // Form State
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_THEME.primaryColor);
  const [accentColor, setAccentColor] = useState(DEFAULT_THEME.accentColor);
  const [headlineFont, setHeadlineFont] = useState(DEFAULT_THEME.headlineFont);
  const [bodyFont, setBodyFont] = useState(DEFAULT_THEME.bodyFont);
  const [borderRadius, setBorderRadius] = useState(DEFAULT_THEME.borderRadius);
  const [bannerEnabled, setBannerEnabled] = useState(DEFAULT_THEME.bannerEnabled);
  const [bannerText, setBannerText] = useState(DEFAULT_THEME.bannerText);
  const [bannerBgColor, setBannerBgColor] = useState(DEFAULT_THEME.bannerBgColor);
  const [homepageLayout, setHomepageLayout] = useState(DEFAULT_THEME.homepageLayout);
  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_THEME.heroImageUrl);
  const [heroHeadline, setHeroHeadline] = useState(DEFAULT_THEME.heroHeadline);
  const [heroSubheadline, setHeroSubheadline] = useState(DEFAULT_THEME.heroSubheadline);

  useEffect(() => {
    if (themeData) {
      setPrimaryColor(themeData.primaryColor || DEFAULT_THEME.primaryColor);
      setAccentColor(themeData.accentColor || DEFAULT_THEME.accentColor);
      setHeadlineFont(themeData.headlineFont || DEFAULT_THEME.headlineFont);
      setBodyFont(themeData.bodyFont || DEFAULT_THEME.bodyFont);
      setBorderRadius(themeData.borderRadius?.toString() || DEFAULT_THEME.borderRadius);
      setBannerEnabled(themeData.bannerEnabled ?? DEFAULT_THEME.bannerEnabled);
      setBannerText(themeData.bannerText || DEFAULT_THEME.bannerText);
      setBannerBgColor(themeData.bannerBgColor || DEFAULT_THEME.bannerBgColor);
      setHomepageLayout(themeData.homepageLayout || DEFAULT_THEME.homepageLayout);
      setHeroImageUrl(themeData.heroImageUrl || DEFAULT_THEME.heroImageUrl);
      setHeroHeadline(themeData.heroHeadline || DEFAULT_THEME.heroHeadline);
      setHeroSubheadline(themeData.heroSubheadline || DEFAULT_THEME.heroSubheadline);
    }
  }, [themeData]);

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setHeroImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!themeRef) return;
    setIsSaving(true);

    const payload = {
      primaryColor,
      accentColor,
      headlineFont,
      bodyFont,
      borderRadius: Number(borderRadius),
      bannerEnabled,
      bannerText,
      bannerBgColor,
      homepageLayout,
      heroImageUrl,
      heroHeadline,
      heroSubheadline,
      updatedAt: new Date().toISOString()
    };

    setDoc(themeRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Theme Updated", description: "Global styles have been synchronized with the archive." });
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

  const handleReset = () => {
    setPrimaryColor(DEFAULT_THEME.primaryColor);
    setAccentColor(DEFAULT_THEME.accentColor);
    setHeadlineFont(DEFAULT_THEME.headlineFont);
    setBodyFont(DEFAULT_THEME.bodyFont);
    setBorderRadius(DEFAULT_THEME.borderRadius);
    setBannerEnabled(DEFAULT_THEME.bannerEnabled);
    setBannerText(DEFAULT_THEME.bannerText);
    setBannerBgColor(DEFAULT_THEME.bannerBgColor);
    setHomepageLayout(DEFAULT_THEME.homepageLayout);
    setHeroImageUrl(DEFAULT_THEME.heroImageUrl);
    setHeroHeadline(DEFAULT_THEME.heroHeadline);
    setHeroSubheadline(DEFAULT_THEME.heroSubheadline);
    toast({ title: "Defaults Restored", description: "Save to commit these base styles permanently." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Initializing Theme Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full">
      <style>{`
        #theme-preview-root {
          --preview-primary: ${primaryColor};
          --preview-accent: ${accentColor};
          --preview-radius: ${borderRadius}px;
          --preview-headline: "${headlineFont}", serif;
          --preview-body: "${bodyFont}", sans-serif;
        }
        #theme-preview-root .font-headline {
          font-family: var(--preview-headline) !important;
        }
        #theme-preview-root .font-body {
          font-family: var(--preview-body) !important;
        }
      `}</style>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Theme Engine</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Live-edit your storefront's global identity and luxury layouts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 gap-2 font-bold uppercase tracking-widest text-[10px]" onClick={handleReset}>
            <RefreshCcw className="h-4 w-4" /> Reset
          </Button>
          <Button className="h-10 gap-2 bg-black text-white font-bold uppercase tracking-widest text-[10px] px-8 hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Styles
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
        {/* Editor sidebar */}
        <div className="xl:col-span-4 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
          <Tabs defaultValue="styles" className="w-full">
            <TabsList className="w-full bg-white border border-[#e1e3e5] h-12 p-1">
              <TabsTrigger value="styles" className="flex-1 gap-2 font-bold uppercase tracking-widest text-[10px]"><Palette className="h-3 w-3" /> Global</TabsTrigger>
              <TabsTrigger value="banner" className="flex-1 gap-2 font-bold uppercase tracking-widest text-[10px]"><Megaphone className="h-3 w-3" /> Banners</TabsTrigger>
              <TabsTrigger value="hero" className="flex-1 gap-2 font-bold uppercase tracking-widest text-[10px]"><Sparkles className="h-3 w-3" /> Hero</TabsTrigger>
              <TabsTrigger value="layout" className="flex-1 gap-2 font-bold uppercase tracking-widest text-[10px]"><Layout className="h-3 w-3" /> Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="styles" className="mt-6 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5" /> Brand Identity Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Primary Color (Typography & Main Elements)</Label>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 rounded border p-1 bg-white shadow-sm overflow-hidden">
                        <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                      </div>
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-12 font-mono text-xs uppercase" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Accent Color (Interactive & Overlays)</Label>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 rounded border p-1 bg-white shadow-sm overflow-hidden">
                        <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                      </div>
                      <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-12 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                    <Type className="h-3.5 w-3.5" /> Global Typography
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Headline Font (Athletic Selection)</Label>
                    <Select value={headlineFont} onValueChange={setHeadlineFont}>
                      <SelectTrigger className="bg-white h-12 text-xs font-bold">
                        <SelectValue placeholder="Select headline font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Playfair Display">Standard Serif</SelectItem>
                        {sportsFonts.map(font => (
                          <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Body Font (System Standard)</Label>
                    <Select value={bodyFont} onValueChange={setBodyFont}>
                      <SelectTrigger className="bg-white h-12 text-xs font-bold">
                        <SelectValue placeholder="Select body font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter UI</SelectItem>
                        {sportsFonts.map(font => (
                          <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Global Border Radius (px)</Label>
                    <Input type="number" value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)} className="h-12" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banner" className="mt-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Announcement Bar</CardTitle>
                  <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Banner Content</Label>
                    <Input value={bannerText} onChange={(e) => setBannerText(e.target.value)} className="h-12" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Bar Background Color</Label>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 rounded border p-1 bg-white shadow-sm overflow-hidden">
                        <Input type="color" value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" />
                      </div>
                      <Input value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="h-12 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hero" className="mt-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader>
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Hero Visuals & Content</CardTitle>
                  <CardDescription>Directly edit the primary entrance of your storefront.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Background Image</Label>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleHeroImageUpload} />
                    <div 
                      onClick={() => !heroImageUrl && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-gray-50 group hover:border-black transition-all min-h-[200px] ${!heroImageUrl ? 'cursor-pointer' : ''}`}
                    >
                      {heroImageUrl ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white border shadow-sm">
                          <Image src={heroImageUrl} alt="Hero" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                            <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setHeroImageUrl(''); }}><Trash2 className="h-4 w-4" /></Button>
                            <Button variant="secondary" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}><Upload className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors"><ImageIcon className="h-6 w-6" /></div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Upload Hero Visual</p>
                            <p className="text-[8px] text-gray-400 mt-1">Recommended: 1920x1080px (landscape)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Headline</Label>
                      <Input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className="h-12 font-headline text-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Subheadline (Collection Tag)</Label>
                      <Input value={heroSubheadline} onChange={(e) => setHeroSubheadline(e.target.value)} className="h-12 uppercase tracking-widest" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="mt-6">
               <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Homepage Structural Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setHomepageLayout('bento')}
                        className={cn(
                          "p-4 border-2 rounded flex flex-col items-center gap-3 transition-all",
                          homepageLayout === 'bento' ? "border-black bg-black/5" : "border-transparent bg-gray-50 hover:border-gray-200"
                        )}
                      >
                        <div className="w-full h-24 grid grid-cols-2 gap-1 p-1 bg-white border rounded shadow-sm">
                          <div className="bg-gray-200 col-span-2 rounded-sm"></div>
                          <div className="bg-gray-100 rounded-sm"></div>
                          <div className="bg-gray-100 rounded-sm"></div>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Bento Grid</span>
                      </button>
                      <button 
                        onClick={() => setHomepageLayout('classic')}
                        className={cn(
                          "p-4 border-2 rounded flex flex-col items-center gap-3 transition-all",
                          homepageLayout === 'classic' ? "border-black bg-black/5" : "border-transparent bg-gray-50 hover:border-gray-200"
                        )}
                      >
                        <div className="w-full h-24 grid grid-cols-1 gap-1 p-1 bg-white border rounded shadow-sm">
                          <div className="bg-gray-200 h-full rounded-sm"></div>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Classic Full</span>
                      </button>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div id="theme-preview-root" className="xl:col-span-8 bg-[#f6f6f7] rounded-xl flex flex-col border border-[#e1e3e5] overflow-hidden">
          <div className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200"></div>
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div>
            </div>
            <div className="flex gap-1 border bg-gray-50 p-1 rounded-lg">
              <button 
                onClick={() => setDevice('desktop')}
                className={cn("p-2 rounded transition-all", device === 'desktop' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setDevice('mobile')}
                className={cn("p-2 rounded transition-all", device === 'mobile' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-widest">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Real-time Full View
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 flex justify-center bg-[radial-gradient(#e1e3e5_1px,transparent_1px)] [background-size:24px_24px]">
            <div className={cn(
              "bg-white transition-all duration-500 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden relative flex flex-col",
              device === 'desktop' ? "w-full max-w-4xl aspect-[16/10]" : "w-[375px] h-[667px]"
            )}>
              {/* Fake Storefront Banner */}
              {bannerEnabled && (
                <div 
                  className="h-8 flex items-center justify-center text-[9px] uppercase tracking-[0.3em] font-bold text-white transition-all shrink-0"
                  style={{ backgroundColor: bannerBgColor }}
                >
                  {bannerText}
                </div>
              )}
              {/* Fake Storefront Header */}
              <div className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
                <span className="font-bold text-xl tracking-tighter font-headline" style={{ color: primaryColor }}>FSLNO</span>
                <div className="flex gap-6 items-center">
                  <div className="hidden md:flex gap-4">
                    <div className="w-8 h-0.5 bg-gray-100 rounded-full"></div>
                    <div className="w-8 h-0.5 bg-gray-100 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <SearchIcon className="h-4 w-4 text-gray-300" />
                    <ShoppingBag className="h-4 w-4 text-gray-300" />
                    <div className="w-10 h-10 rounded-full border bg-gray-50 flex items-center justify-center">
                      <MousePointer2 className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fake Storefront Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-12 font-body">
                {homepageLayout === 'bento' ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div 
                      className="col-span-2 aspect-[21/9] bg-gray-50 flex flex-col items-center justify-center text-center p-12 border shadow-sm transition-all duration-500 overflow-hidden relative" 
                      style={{ borderRadius: `${borderRadius}px` }}
                    >
                      {heroImageUrl ? (
                        <Image src={heroImageUrl} alt="Hero" fill className="object-cover opacity-20" />
                      ) : (
                        <div className="absolute inset-0 bg-gray-100" />
                      )}
                      <div className="relative z-10">
                        <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 mb-4 font-body block">{heroSubheadline}</span>
                        <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight leading-none font-headline" style={{ color: primaryColor }}>{heroHeadline}</h2>
                        <div className="mt-8 flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest group cursor-pointer font-body justify-center">
                          Shop the drops <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                    <div className="aspect-square bg-gray-50 border shadow-sm flex flex-col justify-end p-6" style={{ borderRadius: `${borderRadius}px` }}>
                       <div className="h-3 w-2/3 bg-gray-200 rounded-full mb-2"></div>
                       <div className="h-3 w-1/3 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="aspect-square bg-gray-100 border shadow-sm transition-all" style={{ borderRadius: `${borderRadius}px` }}></div>
                  </div>
                ) : (
                  <div className="space-y-12">
                    <div 
                      className="aspect-video w-full bg-gray-50 flex flex-col items-center justify-center text-center p-12 border shadow-sm transition-all duration-500 overflow-hidden relative" 
                      style={{ borderRadius: `${borderRadius}px` }}
                    >
                      {heroImageUrl ? (
                        <Image src={heroImageUrl} alt="Hero" fill className="object-cover opacity-20" />
                      ) : (
                        <div className="absolute inset-0 bg-gray-100" />
                      )}
                      <div className="relative z-10">
                        <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 mb-6 font-body block">{heroSubheadline}</span>
                        <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none font-headline" style={{ color: primaryColor }}>{heroHeadline}</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      {[1, 2].map(i => (
                        <div key={i} className="space-y-4">
                          <div className="aspect-[3/4] bg-gray-50 border shadow-sm" style={{ borderRadius: `${borderRadius}px` }}></div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                            <div className="h-3 bg-gray-100 rounded-full w-1/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-8">
                  <button 
                    className="h-16 px-16 font-bold uppercase tracking-[0.3em] text-[11px] transition-all shadow-xl hover:scale-[1.02] active:scale-95 font-body"
                    style={{ backgroundColor: primaryColor, color: accentColor, borderRadius: `${borderRadius}px` }}
                  >
                    Discover All Archive Drops
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
