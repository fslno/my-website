'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

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
  homepageLayout: 'bento'
};

export default function ThemeEnginePage() {
  const db = useFirestore();
  const { toast } = useToast();
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

  useEffect(() => {
    if (themeData) {
      setPrimaryColor(themeData.primaryColor || DEFAULT_THEME.primaryColor);
      setAccentColor(themeData.accentColor || DEFAULT_THEME.accentColor);
      setHeadlineFont(themeData.headlineFont || DEFAULT_THEME.headlineFont);
      setBodyFont(themeData.bodyFont || DEFAULT_THEME.bodyFont);
      setBorderRadius(themeData.borderRadius || DEFAULT_THEME.borderRadius);
      setBannerEnabled(themeData.bannerEnabled ?? DEFAULT_THEME.bannerEnabled);
      setBannerText(themeData.bannerText || DEFAULT_THEME.bannerText);
      setBannerBgColor(themeData.bannerBgColor || DEFAULT_THEME.bannerBgColor);
      setHomepageLayout(themeData.homepageLayout || DEFAULT_THEME.homepageLayout);
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
      borderRadius,
      bannerEnabled,
      bannerText,
      bannerBgColor,
      homepageLayout,
      updatedAt: new Date().toISOString()
    };

    setDoc(themeRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Theme Updated", description: "Global styles have been synchronized." });
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
    toast({ title: "Defaults Restored", description: "Save to commit these changes permanently." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Theme Engine</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Live-edit your storefront's global styles and layouts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 gap-2" onClick={handleReset}>
            <RefreshCcw className="h-4 w-4" /> Reset Defaults
          </Button>
          <Button className="h-9 gap-2 bg-black text-white font-bold" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
        {/* Editor sidebar */}
        <div className="xl:col-span-4 overflow-y-auto pr-2 space-y-6">
          <Tabs defaultValue="styles" className="w-full">
            <TabsList className="w-full bg-white border border-[#e1e3e5] h-12">
              <TabsTrigger value="styles" className="flex-1 gap-2"><Palette className="h-4 w-4" /> Global</TabsTrigger>
              <TabsTrigger value="banner" className="flex-1 gap-2"><Megaphone className="h-4 w-4" /> Banners</TabsTrigger>
              <TabsTrigger value="layout" className="flex-1 gap-2"><Layout className="h-4 w-4" /> Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="styles" className="mt-6 space-y-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Brand Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Primary (Main Identity)</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="w-12 h-10 p-1" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Accent (Interactive)</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="w-12 h-10 p-1" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                      <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Type className="h-4 w-4" /> Typography
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Headline Font</Label>
                    <Select value={headlineFont} onValueChange={setHeadlineFont}>
                      <SelectTrigger className="bg-white h-10">
                        <SelectValue placeholder="Select headline font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Playfair Display">Playfair Display (Standard)</SelectItem>
                        {sportsFonts.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Body Font</Label>
                    <Select value={bodyFont} onValueChange={setBodyFont}>
                      <SelectTrigger className="bg-white h-10">
                        <SelectValue placeholder="Select body font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter (Standard)</SelectItem>
                        {sportsFonts.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Global Border Radius (px)</Label>
                    <Input type="number" value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banner" className="mt-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold">Promo Announcement</CardTitle>
                  <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Banner Text</Label>
                    <Input value={bannerText} onChange={(e) => setBannerText(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Background Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="w-12 h-10 p-1" />
                      <Input value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="mt-6">
               <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Homepage Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setHomepageLayout('bento')}
                        className={cn(
                          "p-4 border-2 rounded flex flex-col items-center gap-2 transition-all",
                          homepageLayout === 'bento' ? "border-black bg-black/5" : "border-transparent hover:border-gray-200"
                        )}
                      >
                        <div className="w-full h-20 bg-gray-200 grid grid-cols-2 gap-1 p-1">
                          <div className="bg-gray-400 col-span-2"></div>
                          <div className="bg-gray-400"></div>
                          <div className="bg-gray-400"></div>
                        </div>
                        <span className="text-xs font-bold">Bento Grid</span>
                      </button>
                      <button 
                        onClick={() => setHomepageLayout('classic')}
                        className={cn(
                          "p-4 border-2 rounded flex flex-col items-center gap-2 transition-all",
                          homepageLayout === 'classic' ? "border-black bg-black/5" : "border-transparent hover:border-gray-200"
                        )}
                      >
                        <div className="w-full h-20 bg-gray-200 grid grid-cols-1 gap-1 p-1">
                          <div className="bg-gray-400 h-full"></div>
                        </div>
                        <span className="text-xs font-bold">Classic Full</span>
                      </button>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="xl:col-span-8 bg-[#f1f2f3] rounded-xl flex flex-col border border-[#e1e3e5] overflow-hidden">
          <div className="h-12 bg-white border-b flex items-center justify-between px-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex gap-2 border bg-[#f1f2f3] p-1 rounded-lg">
              <button 
                onClick={() => setDevice('desktop')}
                className={cn("p-1.5 rounded transition-all", device === 'desktop' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setDevice('mobile')}
                className={cn("p-1.5 rounded transition-all", device === 'mobile' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
            <div className="text-[10px] text-[#8c9196] uppercase font-bold tracking-widest">Storefront Preview</div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 flex justify-center">
            <div className={cn(
              "bg-[#f4f4f4] transition-all duration-500 shadow-2xl overflow-hidden relative",
              device === 'desktop' ? "w-full aspect-video" : "w-[375px] h-[667px]"
            )}>
              {/* Fake Storefront Banner */}
              {bannerEnabled && (
                <div 
                  className="h-8 flex items-center justify-center text-[10px] uppercase tracking-widest text-white"
                  style={{ backgroundColor: bannerBgColor }}
                >
                  {bannerText}
                </div>
              )}
              {/* Fake Storefront Header */}
              <div className="h-14 bg-white border-b flex items-center justify-between px-6">
                <span className="font-bold text-lg" style={{ fontFamily: headlineFont }}>FSLNO</span>
                <div className="flex gap-4">
                  <div className="w-10 h-1 bg-gray-100 rounded"></div>
                  <div className="w-10 h-1 bg-gray-100 rounded"></div>
                </div>
              </div>
              {/* Fake Storefront Content */}
              <div className="p-4 flex flex-col gap-4">
                <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center" style={{ borderRadius: `${borderRadius}px` }}>
                  <span className="text-[10px] uppercase tracking-widest opacity-30">Hero Feature</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-white border" style={{ borderRadius: `${borderRadius}px` }}></div>
                  <div className="aspect-square bg-white border" style={{ borderRadius: `${borderRadius}px` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
