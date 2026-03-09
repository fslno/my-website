'use client';

import React, { useState } from 'react';
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
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sportsFonts = [
  "Gameday", "Hyper Oxide", "Quarterback", "Rushblade", "Cricket", 
  "Crossfly", "Bancher", "Racing", "Zonex", "Microsport", 
  "Promesh", "Reach Sports", "Aguante", "MADE Soulmaze", "Backed", 
  "Claymale", "Slam Dunk", "Holigan", "Jaguar", "New Varsity"
];

export default function ThemeEnginePage() {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="space-y-8 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Theme Engine</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Live-edit your storefront's global styles and layouts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 gap-2">
            <RefreshCcw className="h-4 w-4" /> Reset Defaults
          </Button>
          <Button className="h-9 gap-2 bg-black text-white font-bold">
            <Save className="h-4 w-4" /> Save Changes
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
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Primary (Pitch Black)</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="w-12 h-10 p-1" defaultValue="#000000" />
                      <Input defaultValue="#000000" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Accent (Pure White)</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="w-12 h-10 p-1" defaultValue="#FFFFFF" />
                      <Input defaultValue="#FFFFFF" />
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
                    <Select defaultValue="New Varsity">
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
                    <Select defaultValue="Inter">
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
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Global Border Radius</Label>
                    <Input type="number" defaultValue="0" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banner" className="mt-6">
              <Card className="border-[#e1e3e5] shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold">Promo Announcement</CardTitle>
                  <Switch defaultChecked />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Banner Text</Label>
                    <Input defaultValue="Free global shipping on orders over $500" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Background Color</Label>
                    <Input type="color" defaultValue="#000000" className="w-12 h-10 p-1" />
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
                      <button className="p-4 border-2 border-black rounded flex flex-col items-center gap-2">
                        <div className="w-full h-20 bg-gray-200 grid grid-cols-2 gap-1 p-1">
                          <div className="bg-gray-400 col-span-2"></div>
                          <div className="bg-gray-400"></div>
                          <div className="bg-gray-400"></div>
                        </div>
                        <span className="text-xs font-bold">Bento Grid</span>
                      </button>
                      <button className="p-4 border-2 border-transparent hover:border-gray-200 rounded flex flex-col items-center gap-2">
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
              {/* Fake Storefront Header */}
              <div className="h-14 bg-white border-b flex items-center justify-between px-6">
                <span className="font-headline font-bold">FSLNO</span>
                <div className="flex gap-4">
                  <div className="w-10 h-1 bg-gray-100 rounded"></div>
                  <div className="w-10 h-1 bg-gray-100 rounded"></div>
                </div>
              </div>
              {/* Fake Storefront Hero */}
              <div className="p-4 grid grid-cols-2 gap-2 h-full">
                <div className="bg-gray-200 col-span-2 h-40 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest opacity-30">Hero Image</span>
                </div>
                <div className="bg-gray-200 h-24"></div>
                <div className="bg-gray-200 h-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
