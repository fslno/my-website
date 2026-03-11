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
  Sparkles,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Layers,
  Heading
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const sportsFonts = [
  "Anton", "Bebas Neue", "Oswald", "Teko", "Kanit", 
  "Roboto Condensed", "Chakra Petch", "Rajdhani", "Titillium Web", "Exo 2", 
  "Michroma", "Orbitron", "Montserrat", "Squada One", "Racing Sans One", 
  "Archivo Black", "Russo One", "Black Ops One", "Stardos Stencil", "Syncopate"
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
  stickyHeader: true
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
    return null;
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
      `}</style>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Theme Engine</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Live-edit your storefront's global identity and luxury layouts.</p>
        </div>
        <div className="flex gap-2">
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
              <TabsTrigger value="catalog" className="flex-1 gap-2 font-bold uppercase tracking-widest text-[10px]"><Layers className="h-3 w-3" /> Navigation</TabsTrigger>
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
                    <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Promotional banner at the top of the viewport.</CardDescription>
                  </div>
                  <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Banner Text</Label>
                    <Input 
                      value={bannerText} 
                      onChange={(e) => setBannerText(e.target.value)} 
                      placeholder="e.g. FREE SHIPPING ON ALL ORDERS"
                      className="h-12 uppercase font-bold text-xs"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Background Color</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                          <Input 
                            type="color" 
                            className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" 
                            value={bannerBgColor} 
                            onChange={(e) => setBannerBgColor(e.target.value)} 
                          />
                        </div>
                        <Input 
                          value={bannerBgColor} 
                          onChange={(e) => setBannerBgColor(e.target.value)} 
                          className="h-10 font-mono text-[10px] uppercase" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Font Size</Label>
                        <span className="text-[9px] font-mono font-bold">{bannerFontSize}PX</span>
                      </div>
                      <input 
                        type="range" min="8" max="16" value={bannerFontSize} 
                        onChange={(e) => setBannerFontSize(e.target.value)} 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hero" className="mt-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader>
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Hero Visuals & Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Editorial Cover</Label>
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
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Upload Covering Visual</p>
                            <p className="text-[8px] text-gray-400 mt-1 uppercase">1920x1080 Recommended</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Headline</Label>
                      <Input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className="h-12 font-headline" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Subheadline</Label>
                      <Input value={heroSubheadline} onChange={(e) => setHeroSubheadline(e.target.value)} className="h-12 uppercase tracking-widest" />
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Horizontal Alignment</Label>
                      <div className="flex gap-2">
                        {['left', 'center', 'right'].map((align) => (
                          <Button 
                            key={align}
                            variant={heroTextAlign === align ? 'default' : 'outline'} 
                            size="icon" 
                            onClick={() => setHeroTextAlign(align)}
                            className="flex-1 h-12 rounded-none border-gray-200"
                          >
                            {align === 'left' && <AlignLeft className="h-4 w-4" />}
                            {align === 'center' && <AlignCenter className="h-4 w-4" />}
                            {align === 'right' && <AlignRight className="h-4 w-4" />}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Vertical Alignment</Label>
                      <div className="flex gap-2">
                        {['top', 'center', 'bottom'].map((vAlign) => (
                          <Button 
                            key={vAlign}
                            variant={heroVerticalAlign === vAlign ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => setHeroVerticalAlign(vAlign)}
                            className="flex-1 h-10 rounded-none border-gray-200 text-[9px] font-bold uppercase tracking-widest"
                          >
                            {vAlign === 'top' ? 'Upper' : vAlign === 'center' ? 'Middle' : 'Lower'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Headline Scale</Label>
                        <span className="text-[10px] font-mono font-bold">{heroHeadlineSize}PX</span>
                      </div>
                      <input 
                        type="range" min="40" max="120" value={heroHeadlineSize} 
                        onChange={(e) => setHeroHeadlineSize(e.target.value)} 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="mt-6 space-y-6">
               <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Homepage Structural Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setHomepageLayout('bento')}
                        className={cn(
                          "p-4 rounded flex flex-col items-center gap-3 transition-all border-none",
                          homepageLayout === 'bento' ? "bg-black text-white shadow-xl scale-[1.02]" : "bg-gray-100/50 text-gray-400 hover:bg-gray-100"
                        )}
                      >
                        <div className={cn(
                          "w-full h-24 grid grid-cols-2 gap-1 p-1 rounded shadow-sm",
                          homepageLayout === 'bento' ? "bg-white/10" : "bg-white border"
                        )}>
                          <div className={cn("col-span-2 rounded-sm", homepageLayout === 'bento' ? "bg-white/40" : "bg-gray-200")}></div>
                          <div className={cn("rounded-sm", homepageLayout === 'bento' ? "bg-white/20" : "bg-gray-100")}></div>
                          <div className={cn("rounded-sm", homepageLayout === 'bento' ? "bg-white/20" : "bg-gray-100")}></div>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Bento Grid</span>
                      </button>
                      <button 
                        onClick={() => setHomepageLayout('classic')}
                        className={cn(
                          "p-4 rounded flex flex-col items-center gap-3 transition-all border-none",
                          homepageLayout === 'classic' ? "bg-black text-white shadow-xl scale-[1.02]" : "bg-gray-100/50 text-gray-400 hover:bg-gray-100"
                        )}
                      >
                        <div className={cn(
                          "w-full h-24 grid grid-cols-1 gap-1 p-1 rounded shadow-sm",
                          homepageLayout === 'classic' ? "bg-white/10" : "bg-white border"
                        )}>
                          <div className={cn("h-full rounded-sm", homepageLayout === 'classic' ? "bg-white/40" : "bg-gray-200")}></div>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Classic Full</span>
                      </button>
                   </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader>
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Section Typography</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2">Category Titles</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Header Scale</Label>
                        <span className="text-[10px] font-mono font-bold">{categoryTitleSize}PX</span>
                      </div>
                      <input 
                        type="range" min="20" max="80" value={categoryTitleSize} 
                        onChange={(e) => setCategoryTitleSize(e.target.value)} 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Horizontal Alignment</Label>
                      <div className="flex gap-2">
                        {['left', 'center', 'right'].map((align) => (
                          <Button 
                            key={align}
                            variant={categoryTextAlign === align ? 'default' : 'outline'} 
                            size="icon" 
                            onClick={() => setCategoryTextAlign(align)}
                            className="flex-1 h-10 rounded-none border-gray-200"
                          >
                            {align === 'left' && <AlignLeft className="h-4 w-4" />}
                            {align === 'center' && <AlignCenter className="h-4 w-4" />}
                            {align === 'right' && <AlignRight className="h-4 w-4" />}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Vertical Alignment</Label>
                      <div className="flex gap-2">
                        {['top', 'center', 'bottom'].map((vAlign) => (
                          <Button 
                            key={vAlign}
                            variant={categoryVerticalAlign === vAlign ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => setCategoryVerticalAlign(vAlign)}
                            className="flex-1 h-10 rounded-none border-gray-200 text-[9px] font-bold uppercase tracking-widest"
                          >
                            {vAlign === 'top' ? 'Upper' : vAlign === 'center' ? 'Middle' : 'Lower'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 pt-4 border-t">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2">Featured Titles</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Header Scale</Label>
                        <span className="text-[10px] font-mono font-bold">{featuredTitleSize}PX</span>
                      </div>
                      <input 
                        type="range" min="20" max="80" value={featuredTitleSize} 
                        onChange={(e) => setFeaturedTitleSize(e.target.value)} 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-4 border-t">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2">Product Catalog Typography</h3>
                    <div className="space-y-4">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Global Alignment</Label>
                      <div className="flex gap-2">
                        {['left', 'center', 'right'].map((align) => (
                          <button 
                            key={align}
                            onClick={() => setProductTextAlign(align)}
                            className={cn(
                              "flex-1 h-10 flex items-center justify-center border transition-all",
                              productTextAlign === align ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                            )}
                          >
                            {align === 'left' && <AlignLeft className="h-4 w-4" />}
                            {align === 'center' && <AlignCenter className="h-4 w-4" />}
                            {align === 'right' && <AlignRight className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Title Scale</Label>
                          <span className="text-[10px] font-mono font-bold">{productTitleSize}PX</span>
                        </div>
                        <input 
                          type="range" min="10" max="32" value={productTitleSize} 
                          onChange={(e) => setProductTitleSize(e.target.value)} 
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Price Scale</Label>
                          <span className="text-[10px] font-mono font-bold">{productPriceSize}PX</span>
                        </div>
                        <input 
                          type="range" min="10" max="32" value={productPriceSize} 
                          onChange={(e) => setProductPriceSize(e.target.value)} 
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                        />
                      </div>
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
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200"></div>
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div>
            </div>
            <div className="flex gap-1 border bg-gray-50 p-1 rounded-lg">
              <button onClick={() => setDevice('desktop')} className={cn("p-2 rounded transition-all", device === 'desktop' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}><Monitor className="h-4 w-4" /></button>
              <button onClick={() => setDevice('mobile')} className={cn("p-2 rounded transition-all", device === 'mobile' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}><Smartphone className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-green-600 uppercase font-bold tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Real-time Frontend Sync Active
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 flex justify-center bg-[radial-gradient(#e1e3e5_1px,transparent_1px)] [background-size:24px_24px]">
            <div className={cn(
              "bg-white transition-all duration-500 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden relative flex flex-col",
              device === 'desktop' ? "w-full max-w-4xl aspect-[16/10]" : "w-[375px] h-[667px]"
            )}>
              {bannerEnabled && (
                <div className="preview-banner h-8 flex items-center justify-center uppercase tracking-[0.3em] font-bold text-white shrink-0 px-4 text-center" style={{ backgroundColor: bannerBgColor }}>{bannerText}</div>
              )}
              <div className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
                <span className="font-bold text-xl tracking-tighter font-headline" style={{ color: primaryColor }}>FSLNO</span>
                <div className="flex items-center gap-3">
                  <SearchIcon className="h-4 w-4 text-gray-300" />
                  <ShoppingBag className="h-4 w-4 text-gray-300" />
                  <div className="w-10 h-10 rounded-full border bg-gray-50 flex items-center justify-center"><MousePointer2 className="h-4 w-4 text-gray-300" /></div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-12 font-body">
                <div className="aspect-video bg-gray-50 flex flex-col p-12 border shadow-sm relative" style={{ borderRadius: `${borderRadius}px`, alignItems: heroTextAlign === 'left' ? 'flex-start' : heroTextAlign === 'right' ? 'flex-end' : 'center', justifyContent: heroVerticalAlign === 'bottom' ? 'flex-end' : heroVerticalAlign === 'top' ? 'flex-start' : 'center', textAlign: heroTextAlign as any }}>
                  {heroImageUrl ? <Image src={heroImageUrl} alt="Hero" fill className="object-cover opacity-20" /> : <div className="absolute inset-0 bg-gray-100" />}
                  <div className="relative z-10 w-full">
                    <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 mb-4 block">{heroSubheadline}</span>
                    <h2 className="preview-hero-headline font-bold uppercase tracking-tight leading-none font-headline" style={{ color: primaryColor }}>{heroHeadline}</h2>
                  </div>
                </div>
                <div className="space-y-8">
                  <h3 className="preview-cat-title font-headline font-bold uppercase tracking-tight" style={{ color: primaryColor }}>Catalog Selection</h3>
                  <div className="grid grid-cols-2 gap-8">
                    {[1, 2].map(i => (
                      <div key={i} className="preview-prod-card space-y-4">
                        <div className="aspect-[3/4] bg-gray-50 border shadow-sm" style={{ borderRadius: `${borderRadius}px` }}></div>
                        <div className="space-y-1">
                          <p className="preview-prod-title font-bold uppercase tracking-tight leading-none" style={{ color: primaryColor }}>Sculpted Piece</p>
                          <p className="preview-price font-bold opacity-60">$890.00 CAD</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
