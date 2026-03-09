'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  ShoppingBag, 
  Youtube, 
  MapPin, 
  Zap, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings2
} from 'lucide-react';

export default function GoogleSyncPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Google Merchant Center Sync</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage your Merchant API (V1) integration and real-time product feeds.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 gap-2">
            <Settings2 className="h-4 w-4" /> API Settings
          </Button>
          <Button className="h-9 bg-black text-white font-bold gap-2">
            <RefreshCw className="h-4 w-4" /> Force Full Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Feed Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.4%</div>
            <p className="text-xs text-[#8c9196] mt-1">492/500 items approved</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Sync Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">~2.4 min</div>
            <p className="text-xs text-[#8c9196] mt-1">On-Demand API average</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62]">Active Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">4</div>
            <p className="text-xs text-[#8c9196] mt-1">Search, Shop, YT, Ads</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {/* Merchant API Section */}
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Merchant API (V1) Integration</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-100 bg-green-50">API Connected</Badge>
            </div>
            <CardDescription>
              Unlike standard feeds that update once a day, the API pushes price or stock changes to Google in minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">On-Demand Updates</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-[#5c5f62]">Real-time synchronization of critical attributes (Price, Inventory).</p>
              </div>
              <div className="p-4 border rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Partial Sync</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-[#5c5f62]">Only update specific fields without re-sending the entire catalog.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Product Studio Section */}
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Google Product Studio (AI Enhancement)</CardTitle>
            </div>
            <CardDescription>
              Remove backgrounds or upscale FSLNO lifestyle photos directly before they hit Google Shopping.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border">
              <div className="space-y-1">
                <p className="text-sm font-bold">Auto-Background Removal</p>
                <p className="text-xs text-[#5c5f62]">Ensures all main product images meet Google's strict clean background policy.</p>
              </div>
              <Button variant="outline" size="sm" className="h-8">Manage AI Rules</Button>
            </div>
          </CardContent>
        </Card>

        {/* YouTube & Local Ads Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">YouTube Shopping</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#5c5f62]">
                Automatically syncs your FSLNO catalog so you can tag products in YouTube videos or during live streams.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-2 rounded border border-green-100">
                <CheckCircle2 className="h-3 w-3" />
                Catalog is ready for product tagging
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Local Inventory Ads</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#5c5f62]">
                Tell Google users exactly what is in stock at your physical "Spot" locations.
              </p>
              <Button variant="outline" size="sm" className="h-8 gap-2 w-full">
                <MapPin className="h-3 w-3" /> Link Store Address
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-red-100 bg-red-50 shadow-none border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <CardTitle className="text-sm font-bold">Issues Requiring Attention (8)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-red-100 last:border-0">
                <span className="text-red-900 font-medium">Missing 'Material' attribute on product SKU-098{i}</span>
                <Button variant="link" className="h-auto p-0 text-[10px] font-bold text-red-800 underline">Fix Now</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
