'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  Monitor,
  Smartphone,
  Loader2,
  MousePointer2,
  ChevronRight,
  Search as SearchIcon,
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Layers,
  Settings2,
  MessageSquareMore,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const sportsFonts = [
  "Anton", "Bebas Neue", "Oswald", "Teko", "Kanit", 
  "Roboto Condensed", "Chakra Petch", "Rajdhani", "Titillium Web", "Exo 2", 
  "Michroma", "Orbitron", "Montserrat", "Squada One", "Racing Sans One", 
  "Archivo Black", "Russo One", "Black Ops One", "Stardos Stencil", "Syncopate", 
  "Inter", "Playfair Display", "Cinzel", "Syne", "Space Mono", "Bodoni Moda", 
  "Unbounded", "Italiana", "Tenor Sans", "Cormorant Garamond", "Fraunces", 
  "Outfit", "DM Sans", "Host Grotesk", "Bricolage Grotesque"
];

const DEFAULT_THEME = {
  primaryColor: '#000000',
  accentColor: '#FFFFFF',
  headlineFont: 'Anton',
  bodyFont: 'Inter',
  borderRadius: '0',
  bannerEnabled: true,
  bannerText: 'Free global shipping on orders over $500',
  bannerBgColor: '#000000',
  bannerFont: 'Inter',
  bannerFontSize: '10',
  homepageLayout: 'bento',
  heroImageUrl: '',
  heroHeadline: 'The Archive Selection',
  heroSubheadline: 'Modern Silhouettes',
  heroButtonText: 'Shop the Drops',
  heroButtonBgColor: '#FFFFFF',
  heroButtonTextColor: '#000000',
  heroTextAlign: 'center',
  heroVerticalAlign: 'center',
  heroHeadlineSize: '72',
  categoryTextAlign: 'center',
  categoryVerticalAlign: 'center',
  categoryTitleSize: '40',
  featuredTextAlign: 'left',
  featuredTitleSize: '40',
  productTitleSize: '14',
  productPriceSize: '14',
  productTextAlign: 'left',
  stickyHeader: true,
  adminPrimaryColor: '#000000',
  adminAccentColor: '#f6f6f7',
  adminHeadlineFont: 'Inter',
  adminBodyFont: 'Inter',
  adminHeaderHeight: '64'
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
  const [bannerFont, setBannerFont] = useState(DEFAULT_THEME.bannerFont);
  const [bannerFontSize, setBannerFontSize] = useState(DEFAULT_THEME.bannerFontSize);
  const [homepageLayout, setHomepageLayout] = useState(DEFAULT_THEME.homepageLayout);
  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_THEME.heroImageUrl);
  const [heroHeadline, setHeroHeadline] = useState(DEFAULT_THEME.heroHeadline);
  const [heroSubheadline, setHeroSubheadline] = useState(DEFAULT_THEME.heroSubheadline);
  const [heroButtonText, setHeroButtonText] = useState(DEFAULT_THEME.heroButtonText);
  const [heroButtonBgColor, setHeroButtonBgColor] = useState(DEFAULT_THEME.heroButtonBgColor);
  const [heroButtonTextColor, setHeroButtonTextColor] = useState(DEFAULT_THEME.heroButtonTextColor);
  const [heroTextAlign, setHeroTextAlign] = useState(DEFAULT_THEME.heroTextAlign);
  const [heroVerticalAlign, setHeroVerticalAlign] = useState(DEFAULT_THEME.heroVerticalAlign);
  const [heroHeadlineSize, setHeroHeadlineSize] = useState(DEFAULT_THEME.heroHeadlineSize);
  const [categoryTextAlign, setCategoryTextAlign] = useState(DEFAULT_THEME.categoryTextAlign);
  const [categoryVerticalAlign, setCategoryVerticalAlign] = useState(DEFAULT_THEME.categoryVerticalAlign);
  const [categoryTitleSize, setCategoryTitleSize] = useState(DEFAULT_THEME.categoryTitleSize);
  const [featuredTextAlign, setFeaturedTextAlign] = useState(DEFAULT_THEME.featuredTextAlign);
  const [featuredTitleSize, setFeaturedTitleSize] = useState(DEFAULT_THEME.featuredTitleSize);
  const [productTitleSize, setProductTitleSize] = useState(DEFAULT_THEME.productTitleSize);
  const [productPriceSize, setProductPriceSize] = useState(DEFAULT_THEME.productPriceSize);
  const [productTextAlign, setProductTextAlign] = useState(DEFAULT_THEME.productTextAlign);
  const [stickyHeader, setStickyHeader] = useState(DEFAULT_THEME.stickyHeader);

  // Admin Theme State
  const [adminPrimaryColor, setAdminPrimaryColor] = useState(DEFAULT_THEME.adminPrimaryColor);
  const [adminAccentColor, setAdminAccentColor] = useState(DEFAULT_THEME.adminAccentColor);
  const [adminHeadlineFont, setAdminHeadlineFont] = useState(DEFAULT_THEME.adminHeadlineFont);
  const [adminBodyFont, setAdminBodyFont] = useState(DEFAULT_THEME.adminBodyFont);
  const [adminHeaderHeight, setAdminHeaderHeight] = useState(DEFAULT_THEME.adminHeaderHeight);

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
      setBannerFont(themeData.bannerFont || DEFAULT_THEME.bannerFont);
      setBannerFontSize(themeData.bannerFontSize?.toString() || DEFAULT_THEME.bannerFontSize);
      setHomepageLayout(themeData.homepageLayout || DEFAULT_THEME.homepageLayout);
      setHeroImageUrl(themeData.heroImageUrl || DEFAULT_THEME.heroImageUrl);
      setHeroHeadline(themeData.heroHeadline || DEFAULT_THEME.heroHeadline);
      setHeroSubheadline(themeData.heroSubheadline || DEFAULT_THEME.heroSubheadline);
      setHeroButtonText(themeData.heroButtonText || DEFAULT_THEME.heroButtonText);
      setHeroButtonBgColor(themeData.heroButtonBgColor || DEFAULT_THEME.heroButtonBgColor);
      setHeroButtonTextColor(themeData.heroButtonTextColor || DEFAULT_THEME.heroButtonTextColor);
      setHeroTextAlign(themeData.heroTextAlign || DEFAULT_THEME.heroTextAlign);
      setHeroVerticalAlign(themeData.heroVerticalAlign || DEFAULT_THEME.heroVerticalAlign);
      setHeroHeadlineSize(themeData.heroHeadlineSize?.toString() || DEFAULT_THEME.heroHeadlineSize);
      setCategoryTextAlign(themeData.categoryTextAlign || DEFAULT_THEME.categoryTextAlign);
      setCategoryVerticalAlign(themeData.categoryVerticalAlign || DEFAULT_THEME.categoryVerticalAlign);
      setCategoryTitleSize(themeData.categoryTitleSize?.toString() || DEFAULT_THEME.categoryTitleSize);
      setFeaturedTextAlign(themeData.featuredTextAlign || DEFAULT_THEME.featuredTextAlign);
      setFeaturedTitleSize(themeData.featuredTitleSize?.toString() || DEFAULT_THEME.featuredTitleSize);
      setProductTitleSize(themeData.productTitleSize?.toString() || DEFAULT_THEME.productTitleSize);
      setProductPriceSize(themeData.productPriceSize?.toString() || DEFAULT_THEME.productPriceSize);
      setProductTextAlign(themeData.productTextAlign || DEFAULT_THEME.productTextAlign);
      setStickyHeader(themeData.stickyHeader ?? DEFAULT_THEME.stickyHeader);
      setAdminPrimaryColor(themeData.adminPrimaryColor || DEFAULT_THEME.adminPrimaryColor);
      setAdminAccentColor(themeData.adminAccentColor || DEFAULT_THEME.adminAccentColor);
      setAdminHeadlineFont(themeData.adminHeadlineFont || DEFAULT_THEME.adminHeadlineFont);
      setAdminBodyFont(themeData.adminBodyFont || DEFAULT_THEME.adminBodyFont);
      setAdminHeaderHeight(themeData.adminHeaderHeight?.toString() || DEFAULT_THEME.adminHeaderHeight);
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
      bannerFont,
      bannerFontSize: Number(bannerFontSize),
      homepageLayout,
      heroImageUrl,
      heroHeadline,
      heroSubheadline,
      heroButtonText,
      heroButtonBgColor,
      heroButtonTextColor,
      heroTextAlign,
      heroVerticalAlign,
      heroHeadlineSize: Number(heroHeadlineSize),
      categoryTextAlign,
      categoryVerticalAlign,
      categoryTitleSize: Number(categoryTitleSize),
      featuredTextAlign,
      featuredTitleSize: Number(featuredTitleSize),
      productTitleSize: Number(productTitleSize),
      productPriceSize: Number(productPriceSize),
      productTextAlign,
      stickyHeader,
      adminPrimaryColor,
      adminAccentColor,
      adminHeadlineFont,
      adminBodyFont,
      adminHeaderHeight: Number(adminHeaderHeight),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full pb-20">
      <style>{`
        #theme-preview-root {
          --preview-primary: ${primaryColor};
          --preview-accent: ${accentColor};
          --preview-radius: ${borderRadius}px;
          --preview-headline: "${headlineFont}", serif;
          --preview-body: "${bodyFont}", sans-serif;
          --preview-banner-font: "${bannerFont}", sans-serif;
          --preview-banner-font-size: ${bannerFontSize}px;
          --preview-hero-align: ${heroTextAlign};
          --preview-hero-vertical: ${heroVerticalAlign === 'bottom' ? 'flex-end' : heroVerticalAlign === 'top' ? 'flex-start' : 'center'};
          --preview-hero-size: ${heroHeadlineSize}px;
          --preview-cat-align: ${categoryTextAlign};
          --preview-cat-vertical: ${categoryVerticalAlign === 'bottom' ? 'flex-end' : categoryVerticalAlign === 'top' ? 'flex-start' : 'center'};
          --preview-cat-size: ${categoryTitleSize}px;
          --preview-feat-align: ${featuredTextAlign};
          --preview-feat-size: ${featuredTitleSize}px;
          --preview-prod-align: ${productTextAlign};
          --preview-prod-size: ${productTitleSize}px;
          --preview-price-size: ${productPriceSize}px;
          --preview-hero-button-bg: ${heroButtonBgColor};
          --preview-hero-button-text: ${heroButtonTextColor};
        }
        #theme-preview-root .font-headline {
          font-family: var(--preview-headline) !important;
        }
        #theme-preview-root .font-body {
          font-family: var(--preview-body) !important;
        }
        #theme-preview-root .preview-banner {
          font-family: var(--preview-banner-font) !important;
          font-size: var(--preview-banner-font-size) !important;
        }
        #theme-preview-root .preview-hero-headline {
          text-align: var(--preview-hero-align) !important;
          font-size: var(--preview-hero-size) !important;
        }
        #theme-preview-root .preview-cat-title {
          text-align: var(--preview-cat-align) !important;
          font-size: var(--preview-cat-size) !important;
        }
        #theme-preview-root .preview-feat-title {
          text-align: var(--preview-feat-align) !important;
          font-size: var(--preview-feat-size) !important;
        }
        #theme-preview-root .preview-prod-card {
          text-align: var(--preview-prod-align) !important;
        }
        #theme-preview-root .preview-prod-title {
          font-size: var(--preview-prod-size) !important;
        }
        #theme-preview-root .preview-price {
          font-size: var(--preview-price-size) !important;
        }
        #theme-preview-root .hero-button-preview {
          background-color: var(--preview-hero-button-bg) !important;
          color: var(--preview-hero-button-text) !important;
        }
      `}</style>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Theme Engine</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Live-edit your storefront's global identity and luxury layouts.</p>
        </div>
        <Button className="h-10 gap-2 bg-black text-white font-bold uppercase tracking-widest text-[10px] px-8 hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Styles
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
        <div className="xl:col-span-4 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
          <Tabs defaultValue="styles" className="w-full">
            <TabsList className="w-full bg-white border border-[#e1e3e5] h-14 p-1 flex flex-nowrap overflow-hidden justify-between">
              <TabsTrigger value="styles" className="flex-1 gap-1 font-bold uppercase tracking-widest text-[9px] px-1"><Palette className="h-3 w-3" /> Global Styles</TabsTrigger>
              <TabsTrigger value="catalog" className="flex-1 gap-1 font-bold uppercase tracking-widest text-[9px] px-1"><Layers className="h-3 w-3" /> Navigation</TabsTrigger>
              <TabsTrigger value="hero" className="flex-1 gap-1 font-bold uppercase tracking-widest text-[9px] px-1"><Sparkles className="h-3 w-3" /> Hero</TabsTrigger>
              <TabsTrigger value="layout" className="flex-1 gap-1 font-bold uppercase tracking-widest text-[9px] px-1"><Layout className="h-3 w-3" /> Layout</TabsTrigger>
              <TabsTrigger value="admin" className="flex-1 gap-1 font-bold uppercase tracking-widest text-[9px] px-1"><Settings2 className="h-3 w-3" /> Backend</TabsTrigger>
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
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Primary Color</Label>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 rounded border p-1 bg-white shadow-sm overflow-hidden">
                        <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                      </div>
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-12 font-mono text-xs uppercase" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Accent Color</Label>
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
                    <Type className="h-3.5 w-3.5" /> Performance Typography
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Headline Identity</Label>
                    <Select value={headlineFont} onValueChange={setHeadlineFont}>
                      <SelectTrigger className="h-14 bg-white border-2 border-primary/10 rounded-none">
                        <SelectValue placeholder="CHOOSE HEADLINE FONT" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {sportsFonts.map(font => (
                          <SelectItem key={font} value={font} className="text-sm font-bold uppercase py-3 cursor-pointer">
                            <span style={{ fontFamily: font }}>{font}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Descriptor Identity</Label>
                    <Select value={bodyFont} onValueChange={setBodyFont}>
                      <SelectTrigger className="h-14 bg-white border-2 border-primary/10 rounded-none">
                        <SelectValue placeholder="CHOOSE DESCRIPTION FONT" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {sportsFonts.map(font => (
                          <SelectItem key={font} value={font} className="text-sm font-medium py-3 cursor-pointer">
                            <span style={{ fontFamily: font }}>{font}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Border Radius</Label>
                      <span className="text-[10px] font-mono font-bold">{borderRadius}PX</span>
                    </div>
                    <input 
                      type="range" min="0" max="40" value={borderRadius} 
                      onChange={(e) => setBorderRadius(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog" className="mt-6 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Header Interaction</CardTitle>
                    <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Lock navigation to viewport.</CardDescription>
                  </div>
                  <Switch checked={stickyHeader} onCheckedChange={setStickyHeader} />
                </CardHeader>
              </Card>
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30">
                  <div>
                    <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                      <Megaphone className="h-3.5 w-3.5" /> Announcement Bar
                    </CardTitle>
                    <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Promotional banner at top.</CardDescription>
                  </div>
                  <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Banner Text</Label>
                    <Input value={bannerText} onChange={(e) => setBannerText(e.target.value)} className="h-12 uppercase font-bold text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Background</Label>
                      <Input type="color" value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Font Size</Label>
                      <Input type="number" value={bannerFontSize} onChange={(e) => setBannerFontSize(e.target.value)} className="h-10" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hero" className="mt-6 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Hero Visuals</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Editorial Cover</Label>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleHeroImageUpload} />
                    <div onClick={() => !heroImageUrl && fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-gray-50 cursor-pointer min-h-[150px]">
                      {heroImageUrl ? (
                        <div className="relative w-full aspect-video rounded overflow-hidden"><Image src={heroImageUrl} alt="Hero" fill className="object-cover" /><Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={(e) => { e.stopPropagation(); setHeroImageUrl(''); }}><Trash2 className="h-4 w-4" /></Button></div>
                      ) : (
                        <><ImageIcon className="h-6 w-6 text-gray-400" /><p className="text-[10px] font-bold uppercase text-gray-500">Upload visual</p></>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Headline</Label><Input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className="h-12 font-headline" /></div>
                    <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Subheadline</Label><Input value={heroSubheadline} onChange={(e) => setHeroSubheadline(e.target.value)} className="h-12 uppercase tracking-widest" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Hero Button Styles</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Button Text</Label><Input value={heroButtonText} onChange={(e) => setHeroButtonText(e.target.value)} className="h-12 uppercase font-bold text-xs" /></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Background</Label><Input type="color" value={heroButtonBgColor} onChange={(e) => setHeroButtonBgColor(e.target.value)} className="h-10 p-1" /></div>
                    <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Text Color</Label><Input type="color" value={heroButtonTextColor} onChange={(e) => setHeroButtonTextColor(e.target.value)} className="h-10 p-1" /></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="mt-6 space-y-6">
               <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="pb-4"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Homepage Layout Mode</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setHomepageLayout('bento')} className={cn("p-4 rounded flex flex-col items-center gap-3 transition-all", homepageLayout === 'bento' ? "bg-black text-white shadow-xl" : "bg-gray-100/50 text-gray-400 hover:bg-gray-100")}><span className="text-[9px] font-bold uppercase tracking-widest">Bento Grid</span></button>
                      <button onClick={() => setHomepageLayout('classic')} className={cn("p-4 rounded flex flex-col items-center gap-3 transition-all", homepageLayout === 'classic' ? "bg-black text-white shadow-xl" : "bg-gray-100/50 text-gray-400 hover:bg-gray-100")}><span className="text-[9px] font-bold uppercase tracking-widest">Classic Full</span></button>
                   </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                    <Type className="h-3.5 w-3.5" /> Catalog Typography Scales
                  </CardTitle>
                  <CardDescription className="text-[9px] uppercase font-bold tracking-tight text-blue-600">Scaling is handled Authoritatively for mobile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Category Heading Size</Label>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">{categoryTitleSize}PX</Badge>
                    </div>
                    <input 
                      type="range" min="12" max="120" value={categoryTitleSize} 
                      onChange={(e) => setCategoryTitleSize(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Product Title Size</Label>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">{productTitleSize}PX</Badge>
                    </div>
                    <input 
                      type="range" min="10" max="40" value={productTitleSize} 
                      onChange={(e) => setProductTitleSize(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Product Price Size</Label>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold">{productPriceSize}PX</Badge>
                    </div>
                    <input 
                      type="range" min="10" max="40" value={productPriceSize} 
                      onChange={(e) => setProductPriceSize(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="mt-6 space-y-6">
              <Card className="border-blue-100 bg-blue-50/10 shadow-none">
                <CardHeader className="pb-4"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-blue-600 flex items-center gap-2"><Settings2 className="h-3.5 w-3.5" /> Backend Architecture</CardTitle></CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-primary">Backend Brand Color</Label>
                      <Input type="color" value={adminPrimaryColor} onChange={(e) => setAdminPrimaryColor(e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-primary">Backend Interface Color</Label>
                      <Input type="color" value={adminAccentColor} onChange={(e) => setAdminAccentColor(e.target.value)} className="h-10 p-1" />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-bold text-primary">Backend Headline Font</Label>
                      <Select value={adminHeadlineFont} onValueChange={setAdminHeadlineFont}>
                        <SelectTrigger className="h-14 bg-white border border-blue-100 rounded-none"><SelectValue /></SelectTrigger>
                        <SelectContent>{sportsFonts.map(font => (<SelectItem key={font} value={font} className="text-sm font-bold uppercase py-3"><span style={{ fontFamily: font }}>{font}</span></SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-bold text-primary">Backend Body Font</Label>
                      <Select value={adminBodyFont} onValueChange={setAdminBodyFont}>
                        <SelectTrigger className="h-14 bg-white border border-blue-100 rounded-none"><SelectValue /></SelectTrigger>
                        <SelectContent>{sportsFonts.map(font => (<SelectItem key={font} value={font} className="text-sm font-medium py-3"><span style={{ fontFamily: font }}>{font}</span></SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div id="theme-preview-root" className="xl:col-span-8 bg-[#f6f6f7] rounded-xl flex flex-col border border-[#e1e3e5] overflow-hidden">
          <div className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div><div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200"></div><div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div></div>
            <div className="flex gap-1 border bg-gray-50 p-1 rounded-lg">
              <button onClick={() => setDevice('desktop')} className={cn("p-2 rounded transition-all", device === 'desktop' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}><Monitor className="h-4 w-4" /></button>
              <button onClick={() => setDevice('mobile')} className={cn("p-2 rounded transition-all", device === 'mobile' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}><Smartphone className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-green-600 uppercase font-bold tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live Sync Active</div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 flex justify-center bg-[radial-gradient(#e1e3e5_1px,transparent_1px)] [background-size:24px_24px]">
            <div className={cn("bg-white transition-all duration-500 shadow-2xl overflow-hidden relative flex flex-col", device === 'desktop' ? "w-full max-w-4xl aspect-[16/10]" : "w-[375px] h-[667px]")}>
              {bannerEnabled && (<div className="preview-banner h-8 flex items-center justify-center uppercase tracking-[0.3em] font-bold text-white shrink-0 px-4 text-center" style={{ backgroundColor: bannerBgColor }}>{bannerText}</div>)}
              <div className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0"><span className="font-bold text-xl tracking-tighter font-headline" style={{ color: primaryColor }}>FSLNO</span><div className="flex items-center gap-3"><SearchIcon className="h-4 w-4 text-gray-300" /><ShoppingBag className="h-4 w-4 text-gray-300" /><div className="w-10 h-10 rounded-full border bg-gray-50 flex items-center justify-center"><MousePointer2 className="h-4 w-4 text-gray-300" /></div></div></div>
              <div className="flex-1 overflow-y-auto p-8 space-y-12 font-body">
                <div className="aspect-video bg-gray-50 flex flex-col p-12 border shadow-sm relative" style={{ borderRadius: `${borderRadius}px`, alignItems: heroTextAlign === 'left' ? 'flex-start' : heroTextAlign === 'right' ? 'flex-end' : 'center', textAlign: heroTextAlign as any }}>
                  {heroImageUrl ? <Image src={heroImageUrl} alt="Hero" fill className="object-cover opacity-20" /> : <div className="absolute inset-0 bg-gray-100" />}
                  <div className="relative z-10 w-full"><span className="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 mb-4 block">{heroSubheadline}</span><h2 className="preview-hero-headline font-bold uppercase tracking-tight leading-none font-headline" style={{ color: primaryColor }}>{heroHeadline}</h2><div className="mt-8 flex justify-center" style={{ justifyContent: heroTextAlign === 'left' ? 'flex-start' : heroTextAlign === 'right' ? 'flex-end' : 'center' }}><div className="hero-button-preview px-8 h-12 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg">{heroButtonText}</div></div></div>
                </div>
                <div className="space-y-8"><h3 className="preview-cat-title font-headline font-bold uppercase tracking-tight" style={{ color: primaryColor }}>Catalog Selection</h3><div className="grid grid-cols-2 gap-8">{[1, 2].map(i => (<div key={i} className="preview-prod-card space-y-4"><div className="aspect-[3/4] bg-gray-100 border shadow-sm" style={{ borderRadius: `${borderRadius}px` }}></div><div className="space-y-1"><p className="preview-prod-title font-bold uppercase tracking-tight leading-none" style={{ color: primaryColor }}>Piece</p><p className="preview-price font-bold opacity-60">$890.00 CAD</p></div></div>))}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
