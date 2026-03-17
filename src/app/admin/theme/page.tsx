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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  Settings2,
  ShoppingBag,
  Search,
  FileText,
  Type as TypeIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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
  categoryTextAlign: 'left',
  categoryVerticalAlign: 'center',
  categoryTitleSize: '40',
  categoryTitleColor: '#000000',
  categoryCardTextAlign: 'left',
  categoryCardVerticalAlign: 'bottom',
  categoryCardTitleSize: '24',
  categoryCardTitleColor: '#FFFFFF',
  archiveTextAlign: 'left',
  archiveTitleSize: '40',
  archiveTitleColor: '#000000',
  featuredTextAlign: 'left',
  featuredTitleSize: '40',
  featuredTitleColor: '#000000',
  productTitleSize: '14',
  productTitleColor: '#000000',
  productPriceSize: '14',
  productPriceColor: '#000000',
  productTextAlign: 'left',
  stickyHeader: true,
  adminPrimaryColor: '#000000',
  adminAccentColor: '#f6f6f7',
  adminTextColor: '#1a1c1e',
  adminBaseFontSize: '14',
  adminHeadlineFont: 'Inter',
  adminBodyFont: 'Inter',
  adminHeaderHeight: '64',
  categorySectionTitle: 'Shop by Drop',
  categorySectionSubtitle: 'The Collections',
  archiveSectionTitle: 'All Studio Pieces',
  archiveSectionSubtitle: 'The Archive'
};

export default function ThemeEnginePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);

  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: themeData, isLoading: loading } = useDoc(themeRef);

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
  
  const [categoryTextAlign, setCategoryTextAlign] = useState(DEFAULT_THEME.categoryTextAlign);
  const [categoryVerticalAlign, setCategoryVerticalAlign] = useState(DEFAULT_THEME.categoryVerticalAlign);
  const [categoryTitleSize, setCategoryTitleSize] = useState(DEFAULT_THEME.categoryTitleSize);
  const [categoryTitleColor, setCategoryTitleColor] = useState(DEFAULT_THEME.categoryTitleColor);

  const [categoryCardTextAlign, setCategoryCardTextAlign] = useState(DEFAULT_THEME.categoryCardTextAlign);
  const [categoryCardVerticalAlign, setCategoryCardVerticalAlign] = useState(DEFAULT_THEME.categoryCardVerticalAlign);
  const [categoryCardTitleSize, setCategoryCardTitleSize] = useState(DEFAULT_THEME.categoryCardTitleSize);
  const [categoryCardTitleColor, setCategoryCardTitleColor] = useState(DEFAULT_THEME.categoryCardTitleColor);

  const [archiveTextAlign, setArchiveTextAlign] = useState(DEFAULT_THEME.archiveTextAlign);
  const [archiveTitleSize, setArchiveTitleSize] = useState(DEFAULT_THEME.archiveTitleSize);
  const [archiveTitleColor, setArchiveTitleColor] = useState(DEFAULT_THEME.archiveTitleColor);
  
  const [featuredTextAlign, setFeaturedTextAlign] = useState(DEFAULT_THEME.featuredTextAlign);
  const [featuredTitleSize, setFeaturedTitleSize] = useState(DEFAULT_THEME.featuredTitleSize);
  const [featuredTitleColor, setFeaturedTitleColor] = useState(DEFAULT_THEME.featuredTitleColor);
  
  const [productTitleSize, setProductTitleSize] = useState(DEFAULT_THEME.productTitleSize);
  const [productTitleColor, setProductTitleColor] = useState(DEFAULT_THEME.productTitleColor);
  const [productPriceSize, setProductPriceSize] = useState(DEFAULT_THEME.productPriceSize);
  const [productPriceColor, setProductPriceColor] = useState(DEFAULT_THEME.productPriceColor);
  const [productTextAlign, setProductTextAlign] = useState(DEFAULT_THEME.productTextAlign);
  const [stickyHeader, setStickyHeader] = useState(DEFAULT_THEME.stickyHeader);

  // Content Labels State
  const [categorySectionTitle, setCategorySectionTitle] = useState(DEFAULT_THEME.categorySectionTitle);
  const [categorySectionSubtitle, setCategorySectionSubtitle] = useState(DEFAULT_THEME.categorySectionSubtitle);
  const [archiveSectionTitle, setArchiveSectionTitle] = useState(DEFAULT_THEME.archiveSectionTitle);
  const [archiveSectionSubtitle, setArchiveSectionSubtitle] = useState(DEFAULT_THEME.archiveSectionSubtitle);

  // Admin Theme State
  const [adminPrimaryColor, setAdminPrimaryColor] = useState(DEFAULT_THEME.adminPrimaryColor);
  const [adminAccentColor, setAdminAccentColor] = useState(DEFAULT_THEME.adminAccentColor);
  const [adminTextColor, setAdminTextColor] = useState(DEFAULT_THEME.adminTextColor);
  const [adminBaseFontSize, setAdminBaseFontSize] = useState(DEFAULT_THEME.adminBaseFontSize);
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
      setCategoryTextAlign(themeData.categoryTextAlign || DEFAULT_THEME.categoryTextAlign);
      setCategoryVerticalAlign(themeData.categoryVerticalAlign || DEFAULT_THEME.categoryVerticalAlign);
      setCategoryTitleSize(themeData.categoryTitleSize?.toString() || DEFAULT_THEME.categoryTitleSize);
      setCategoryTitleColor(themeData.categoryTitleColor || DEFAULT_THEME.categoryTitleColor);
      
      setCategoryCardTextAlign(themeData.categoryCardTextAlign || DEFAULT_THEME.categoryCardTextAlign);
      setCategoryCardVerticalAlign(themeData.categoryCardVerticalAlign || DEFAULT_THEME.categoryCardVerticalAlign);
      setCategoryCardTitleSize(themeData.categoryCardTitleSize?.toString() || DEFAULT_THEME.categoryCardTitleSize);
      setCategoryCardTitleColor(themeData.categoryCardTitleColor || DEFAULT_THEME.categoryCardTitleColor);

      setArchiveTextAlign(themeData.archiveTextAlign || DEFAULT_THEME.archiveTextAlign);
      setArchiveTitleSize(themeData.archiveTitleSize?.toString() || DEFAULT_THEME.archiveTitleSize);
      setArchiveTitleColor(themeData.archiveTitleColor || DEFAULT_THEME.archiveTitleColor);
      setFeaturedTextAlign(themeData.featuredTextAlign || DEFAULT_THEME.featuredTextAlign);
      setFeaturedTitleSize(themeData.featuredTitleSize?.toString() || DEFAULT_THEME.featuredTitleSize);
      setFeaturedTitleColor(themeData.featuredTitleColor || DEFAULT_THEME.featuredTitleColor);
      setProductTitleSize(themeData.productTitleSize?.toString() || DEFAULT_THEME.productTitleSize);
      setProductTitleColor(themeData.productTitleColor || DEFAULT_THEME.productTitleColor);
      setProductPriceSize(themeData.productPriceSize?.toString() || DEFAULT_THEME.productPriceSize);
      setProductPriceColor(themeData.productPriceColor || DEFAULT_THEME.productPriceColor);
      setProductTextAlign(themeData.productTextAlign || DEFAULT_THEME.productTextAlign);
      setStickyHeader(themeData.stickyHeader ?? DEFAULT_THEME.stickyHeader);
      
      setCategorySectionTitle(themeData.categorySectionTitle || DEFAULT_THEME.categorySectionTitle);
      setCategorySectionSubtitle(themeData.categorySectionSubtitle || DEFAULT_THEME.categorySectionSubtitle);
      setArchiveSectionTitle(themeData.archiveSectionTitle || DEFAULT_THEME.archiveSectionTitle);
      setArchiveSectionSubtitle(themeData.archiveSectionSubtitle || DEFAULT_THEME.archiveSectionSubtitle);

      setAdminPrimaryColor(themeData.adminPrimaryColor || DEFAULT_THEME.adminPrimaryColor);
      setAdminAccentColor(themeData.adminAccentColor || DEFAULT_THEME.adminAccentColor);
      setAdminTextColor(themeData.adminTextColor || DEFAULT_THEME.adminTextColor);
      setAdminBaseFontSize(themeData.adminBaseFontSize?.toString() || DEFAULT_THEME.adminBaseFontSize);
      setAdminHeadlineFont(themeData.adminHeadlineFont || DEFAULT_THEME.adminHeadlineFont);
      setAdminBodyFont(themeData.adminBodyFont || DEFAULT_THEME.adminBodyFont);
      setAdminHeaderHeight(themeData.adminHeaderHeight?.toString() || DEFAULT_THEME.adminHeaderHeight);
    }
  }, [themeData]);

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
      categoryTextAlign,
      categoryVerticalAlign,
      categoryTitleSize: Number(categoryTitleSize),
      categoryTitleColor,
      categoryCardTextAlign,
      categoryCardVerticalAlign,
      categoryCardTitleSize: Number(categoryCardTitleSize),
      categoryCardTitleColor,
      archiveTextAlign,
      archiveTitleSize: Number(archiveTitleSize),
      archiveTitleColor,
      featuredTextAlign,
      featuredTitleSize: Number(featuredTitleSize),
      featuredTitleColor,
      productTitleSize: Number(productTitleSize),
      productTitleColor,
      productPriceSize: Number(productPriceSize),
      productPriceColor,
      productTextAlign,
      stickyHeader,
      categorySectionTitle,
      categorySectionSubtitle,
      archiveSectionTitle,
      archiveSectionSubtitle,
      adminPrimaryColor,
      adminAccentColor,
      adminTextColor,
      adminBaseFontSize: Number(adminBaseFontSize),
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
    <div className="space-y-8 min-h-screen pb-20 overflow-x-hidden">
      <style>{`
        #theme-preview-root {
          --preview-primary: ${primaryColor};
          --preview-accent: ${accentColor};
          --preview-radius: ${borderRadius}px;
          --preview-headline: "${headlineFont}", serif;
          --preview-body: "${bodyFont}", sans-serif;
          --preview-banner-font: "${bannerFont}", sans-serif;
          --preview-banner-font-size: ${bannerFontSize}px;
          --preview-cat-align: ${categoryTextAlign};
          --preview-cat-vertical: ${categoryVerticalAlign === 'bottom' ? 'flex-end' : categoryVerticalAlign === 'top' ? 'flex-start' : 'center'};
          --preview-cat-size: ${categoryTitleSize}px;
          --preview-cat-color: ${categoryTitleColor};
          --preview-cat-card-align: ${categoryCardTextAlign};
          --preview-cat-card-vertical: ${categoryCardVerticalAlign === 'bottom' ? 'flex-end' : categoryCardVerticalAlign === 'top' ? 'flex-start' : 'center'};
          --preview-cat-card-size: ${categoryCardTitleSize}px;
          --preview-cat-card-color: ${categoryCardTitleColor};
          --preview-archive-align: ${archiveTextAlign};
          --preview-archive-size: ${archiveTitleSize}px;
          --preview-archive-color: ${archiveTitleColor};
          --preview-feat-align: ${featuredTextAlign};
          --preview-feat-size: ${featuredTitleSize}px;
          --preview-feat-color: ${featuredTitleColor};
          --preview-prod-align: ${productTextAlign};
          --preview-prod-size: ${productTitleSize}px;
          --preview-prod-color: ${productTitleColor};
          --preview-price-size: ${productPriceSize}px;
          --preview-price-color: ${productPriceColor};
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
        #theme-preview-root .preview-cat-title {
          text-align: var(--preview-cat-align) !important;
          font-size: var(--preview-cat-size) !important;
          color: var(--preview-cat-color) !important;
        }
        #theme-preview-root .preview-cat-card-title {
          text-align: var(--preview-cat-card-align) !important;
          font-size: var(--preview-cat-card-size) !important;
          color: var(--preview-cat-card-color) !important;
        }
        #theme-preview-root .preview-archive-title {
          text-align: var(--preview-archive-align) !important;
          font-size: var(--preview-archive-size) !important;
          color: var(--preview-archive-color) !important;
        }
        #theme-preview-root .preview-feat-title {
          text-align: var(--preview-feat-align) !important;
          font-size: var(--preview-feat-size) !important;
          color: var(--preview-feat-color) !important;
        }
        #theme-preview-root .preview-prod-card {
          text-align: var(--preview-prod-align) !important;
        }
        #theme-preview-root .preview-prod-title {
          font-size: var(--preview-prod-size) !important;
          color: var(--preview-prod-color) !important;
        }
        #theme-preview-root .preview-price {
          font-size: var(--preview-price-size) !important;
          color: var(--preview-price-color) !important;
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Theme Engine</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Live-edit your storefront's global identity.</p>
        </div>
        <Button className="w-full sm:w-auto h-10 gap-2 bg-black text-white font-bold uppercase tracking-widest text-[10px] px-8 hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 shadow-lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Styles
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:h-[calc(100vh-250px)] h-auto">
        <div className="xl:col-span-4 xl:overflow-y-auto pr-0 xl:pr-4 space-y-6 scrollbar-hide h-full">
          <Tabs defaultValue="styles" className="w-full">
            <TabsList className="w-full bg-white border border-[#e1e3e5] h-auto xl:h-14 p-1 flex flex-wrap xl:flex-nowrap justify-start xl:justify-between rounded-none overflow-hidden">
              {[
                { id: 'styles', label: 'Styles', icon: Palette },
                { id: 'catalog', label: 'Nav', icon: Layers },
                { id: 'layout', label: 'Layout', icon: Layout },
                { id: 'admin', label: 'Admin', icon: Settings2 },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex-grow basis-[30%] xl:basis-auto min-w-[80px] gap-1.5 font-bold uppercase tracking-widest text-[9px] px-2 h-12 xl:h-full rounded-none"
                >
                  <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="styles" className="mt-6 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
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

              <Card className="border-[#e1e3e5] shadow-none rounded-none">
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
                        <SelectValue />
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
                        <SelectValue />
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

            <TabsContent value="catalog" className="mt-6 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Header Interaction</CardTitle>
                    <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Lock navigation to viewport.</CardDescription>
                  </div>
                  <Switch checked={stickyHeader} onCheckedChange={setStickyHeader} />
                </CardHeader>
              </Card>
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
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

            <TabsContent value="layout" className="mt-6 space-y-6 animate-in fade-in duration-300">
              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Homepage Architecture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setHomepageLayout('bento')} className={cn("p-4 rounded-sm flex flex-col items-center gap-3 transition-all", homepageLayout === 'bento' ? "bg-black text-white shadow-xl" : "bg-gray-100/50 text-gray-400 hover:bg-gray-100")}><span className="text-[9px] font-bold uppercase tracking-widest">Bento Grid</span></button>
                      <button onClick={() => setHomepageLayout('classic')} className={cn("p-4 rounded-sm flex flex-col items-center gap-3 transition-all", homepageLayout === 'classic' ? "bg-black text-white shadow-xl" : "bg-gray-100/50 text-gray-400 hover:bg-gray-100")}><span className="text-[9px] font-bold uppercase tracking-widest">Classic Full</span></button>
                   </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="pb-4 border-b bg-gray-50/30">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                    <TypeIcon className="h-3.5 w-3.5" /> Content Orchestration
                  </CardTitle>
                  <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Modify storefront section labels.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary" />
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Category Section</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-400">Main Title</Label>
                        <Input value={categorySectionTitle} onChange={(e) => setCategorySectionTitle(e.target.value)} className="h-11 font-bold uppercase text-[10px]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-400">Subtitle</Label>
                        <Input value={categorySectionSubtitle} onChange={(e) => setCategorySectionSubtitle(e.target.value)} className="h-11 uppercase text-[10px] tracking-widest" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary" />
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Global Archive</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-400">Main Title</Label>
                        <Input value={archiveSectionTitle} onChange={(e) => setArchiveSectionTitle(e.target.value)} className="h-11 font-bold uppercase text-[10px]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-400">Subtitle</Label>
                        <Input value={archiveSectionSubtitle} onChange={(e) => setArchiveSectionSubtitle(e.target.value)} className="h-11 uppercase text-[10px] tracking-widest" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Category Card Protocol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Label Scale</Label>
                        <Badge variant="outline" className="text-[10px] font-mono font-bold">{categoryCardTitleSize}PX</Badge>
                      </div>
                      <input type="range" min="12" max="120" value={categoryCardTitleSize} onChange={(e) => setCategoryCardTitleSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-bold text-gray-400">Horizontal Alignment</Label>
                      <div className="flex border p-1 rounded-sm bg-gray-50">
                        <Button variant={categoryCardTextAlign === 'left' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setCategoryCardTextAlign('left')}><AlignLeft className="h-4 w-4" /></Button>
                        <Button variant={categoryCardTextAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setCategoryCardTextAlign('center')}><AlignCenter className="h-4 w-4" /></Button>
                        <Button variant={categoryCardTextAlign === 'right' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setCategoryCardTextAlign('right')}><AlignRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-bold text-gray-400">Vertical Alignment</Label>
                      <div className="flex border p-1 rounded-sm bg-gray-50">
                        <Button variant={categoryCardVerticalAlign === 'top' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setCategoryCardVerticalAlign('top')} title="Top"><AlignLeft className="h-4 w-4 rotate-90" /></Button>
                        <Button variant={categoryCardVerticalAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setCategoryCardVerticalAlign('center')} title="Center"><AlignCenter className="h-4 w-4 rotate-90" /></Button>
                        <Button variant={categoryCardVerticalAlign === 'bottom' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setCategoryCardVerticalAlign('bottom')} title="Bottom"><AlignRight className="h-4 w-4 rotate-90" /></Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Label Color</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                          <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={categoryCardTitleColor} onChange={(e) => setCategoryCardTitleColor(e.target.value)} />
                        </div>
                        <Input value={categoryCardTitleColor} onChange={(e) => setCategoryCardTitleColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Archive Heading Protocol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Heading Scale</Label>
                        <Badge variant="outline" className="text-[10px] font-mono font-bold">{archiveTitleSize}PX</Badge>
                      </div>
                      <input type="range" min="12" max="120" value={archiveTitleSize} onChange={(e) => setArchiveTitleSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-bold text-gray-400">Alignment</Label>
                      <div className="flex border p-1 rounded-sm bg-gray-50">
                        <Button variant={archiveTextAlign === 'left' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setArchiveTextAlign('left')}><AlignLeft className="h-4 w-4" /></Button>
                        <Button variant={archiveTextAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setArchiveTextAlign('center')}><AlignCenter className="h-4 w-4" /></Button>
                        <Button variant={archiveTextAlign === 'right' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setArchiveTextAlign('right')}><AlignRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 max-w-sm">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Heading Color</Label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                        <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={archiveTitleColor} onChange={(e) => setArchiveTitleColor(e.target.value)} />
                      </div>
                      <Input value={archiveTitleColor} onChange={(e) => setArchiveTitleColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none rounded-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5" /> Product Card Protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Title Scale</Label>
                          <Badge variant="outline" className="text-[10px] font-mono font-bold">{productTitleSize}PX</Badge>
                        </div>
                        <input type="range" min="10" max="40" value={productTitleSize} onChange={(e) => setProductTitleSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Title Color</Label>
                        <div className="flex gap-2">
                          <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                            <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={productTitleColor} onChange={(e) => setProductTitleColor(e.target.value)} />
                          </div>
                          <Input value={productTitleColor} onChange={(e) => setProductTitleColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Price Scale</Label>
                          <Badge variant="outline" className="text-[10px] font-mono font-bold">{productPriceSize}PX</Badge>
                        </div>
                        <input type="range" min="10" max="40" value={productPriceSize} onChange={(e) => setProductPriceSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Price Color</Label>
                        <div className="flex gap-2">
                          <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                            <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={productPriceColor} onChange={(e) => setProductPriceColor(e.target.value)} />
                          </div>
                          <Input value={productPriceColor} onChange={(e) => setProductPriceColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t max-w-sm">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Content Alignment</Label>
                    <div className="flex border p-1 rounded-sm bg-gray-50 mt-2">
                      <Button variant={productTextAlign === 'left' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setProductTextAlign('left')}><AlignLeft className="h-4 w-4" /></Button>
                      <Button variant={productTextAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setProductTextAlign('center')}><AlignCenter className="h-4 w-4" /></Button>
                      <Button variant={productTextAlign === 'right' ? 'default' : 'ghost'} size="icon" className="flex-1 h-9 rounded-none" onClick={() => setProductTextAlign('right')}><AlignRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="mt-6 space-y-6 animate-in fade-in duration-300">
              <Card className="border-blue-100 bg-blue-50/10 shadow-none rounded-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-blue-600 flex items-center gap-2">
                    <Settings2 className="h-3.5 w-3.5" /> Backend Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-primary">Backend Brand Color</Label>
                      <Input type="color" value={adminPrimaryColor} onChange={(e) => setAdminPrimaryColor(e.target.value)} className="h-10 p-1" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-primary">Backend Text Color</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border p-1 bg-white shadow-sm overflow-hidden">
                          <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={adminTextColor} onChange={(e) => setAdminTextColor(e.target.value)} />
                        </div>
                        <Input value={adminTextColor} onChange={(e) => setAdminTextColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold text-primary">Backend Font Scale</Label>
                        <Badge variant="outline" className="text-[10px] font-mono font-bold">{adminBaseFontSize}PX</Badge>
                      </div>
                      <input 
                        type="range" min="10" max="24" value={adminBaseFontSize} 
                        onChange={(e) => setAdminBaseFontSize(e.target.value)} 
                        className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                      />
                    </div>

                    <Separator />
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-bold text-primary">Backend Headline Font</Label>
                      <Select value={adminHeadlineFont} onValueChange={setAdminHeadlineFont}>
                        <SelectTrigger className="h-14 bg-white border border-blue-100 rounded-none"><SelectValue /></SelectTrigger>
                        <SelectContent>{sportsFonts.map(font => (<SelectItem key={font} value={font} className="text-sm font-bold uppercase py-3"><span style={{ fontFamily: font }}>{font}</span></SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Column */}
        <div id="theme-preview-root" className="xl:col-span-8 bg-[#f6f6f7] rounded-none flex flex-col border border-[#e1e3e5] overflow-hidden xl:h-full h-[600px] min-w-0">
          <div className="h-14 bg-white border-b flex items-center justify-between px-4 sm:px-6 shrink-0">
            <div className="hidden sm:flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div><div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200"></div><div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div></div>
            <div className="flex gap-1 border bg-gray-50 p-1 rounded-sm">
              <button onClick={() => setDevice('desktop')} className={cn("p-2 rounded-sm transition-all", device === 'desktop' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}><Monitor className="h-4 w-4" /></button>
              <button onClick={() => setDevice('mobile')} className={cn("p-2 rounded-sm transition-all", device === 'mobile' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}><Smartphone className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-green-600 uppercase font-bold tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live Sync</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 xl:p-12 flex justify-center bg-[radial-gradient(#e1e3e5_1px,transparent_1px)] [background-size:24px_24px]">
            <div className={cn(
              "bg-white transition-all duration-500 shadow-2xl overflow-hidden relative flex flex-col border border-black/5",
              device === 'desktop' ? "w-full max-w-4xl aspect-[16/10]" : "w-[320px] h-[568px] sm:w-[375px] sm:h-[667px]"
            )}>
              {bannerEnabled && (<div className="preview-banner h-8 flex items-center justify-center uppercase tracking-[0.3em] font-bold text-white shrink-0 px-4 text-center" style={{ backgroundColor: bannerBgColor }}>{bannerText}</div>)}
              <div className="h-16 bg-white border-b flex items-center justify-between px-6 sm:px-8 shrink-0"><span className="font-bold text-lg sm:text-xl tracking-tighter font-headline" style={{ color: primaryColor }}>FSLNO</span><div className="flex items-center gap-3"><Search className="h-4 w-4 text-gray-200" /><ShoppingBag className="h-4 w-4 text-gray-200" /><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border bg-gray-50 flex items-center justify-center"><MousePointer2 className="h-4 w-4 text-gray-200" /></div></div></div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-12 font-body">
                <div className="aspect-video bg-gray-50 flex flex-col p-6 sm:p-12 border shadow-sm relative overflow-hidden" style={{ borderRadius: `${borderRadius}px`, alignItems: 'center', textAlign: 'center' }}>
                  <div className="relative z-10 w-full"><span className="text-[8px] sm:text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 mb-2 sm:mb-4 block">MODERN SILHOUETTES</span><h2 className="font-bold uppercase tracking-tight leading-none font-headline text-3xl">THE ARCHIVE SELECTION</h2><div className="mt-6 sm:mt-8 flex justify-center"><div className="bg-black text-white px-6 sm:px-8 h-10 sm:h-12 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[9px] sm:text-[10px] shadow-lg">SHOP NOW</div></div></div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400">{categorySectionSubtitle}</p>
                    <h3 className="preview-cat-title font-headline font-bold uppercase tracking-tight">{categorySectionTitle}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    {[1, 2].map(i => (
                      <div key={i} className="preview-prod-card space-y-3 relative group aspect-square bg-gray-100 border overflow-hidden" style={{ borderRadius: `${borderRadius}px` }}>
                        <div className="absolute inset-0 flex flex-col p-4 preview-cat-card-content" style={{ justifyContent: 'var(--preview-cat-card-vertical)' }}>
                          <p className="preview-cat-card-title font-headline font-bold uppercase tracking-tight leading-none">Drop {i}</p>
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
