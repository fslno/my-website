'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ShieldCheck, FileText, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function DomainPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Domain & Site Visibility</h1>
        <p className="text-[#5c5f62] mt-1 text-sm">Manage your store's primary address and search engine settings.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle className="text-lg">Domain Name & Site Address</CardTitle>
            </div>
            <CardDescription>
              The primary URL for your store (e.g., fslno.com). Connect a custom domain to ensure your brand is secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input placeholder="Enter your domain (e.g. fslno.com)" defaultValue="fslno.com" className="h-10" />
              </div>
              <Button className="bg-black text-white h-10 font-bold px-8">Connect</Button>
            </div>
            <div className="p-3 bg-green-50 border border-green-100 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Primary domain is connected and secured via HTTPS.</span>
              </div>
              <Button variant="link" className="text-xs h-auto p-0 text-green-800 font-bold underline">View Certificate</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <CardTitle className="text-lg">Header Meta Tags & Site Verification</CardTitle>
            </div>
            <CardDescription>
              Inject custom code into the &lt;head&gt; of your site for Google Search Console, Pinterest, and Facebook verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Verification Codes</Label>
              <Input placeholder="Paste your verification snippet here..." className="h-10" />
            </div>
            <Button variant="outline" className="text-xs border-[#babfc3]">Add Another Verification Tag</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-lg">Sitemap</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#5c5f62]">
                Your sitemap.xml is automatically generated to help Google index your new drops instantly.
              </p>
              <div className="flex items-center justify-between p-3 bg-[#f6f6f7] rounded-md border">
                <span className="text-xs font-mono">https://fslno.com/sitemap.xml</span>
                <Button variant="ghost" size="sm" className="h-8 gap-2">
                  <ExternalLink className="h-3 w-3" /> View
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <CardTitle className="text-lg">Search Engine Indexing</CardTitle>
              </div>
              <Switch defaultChecked />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#5c5f62]">
                Visibility Toggle: When ON, Google and Bing can find your store. Turn OFF for "Maintenance Mode" or private "Spot Closing" drops.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}