'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  MessageCircle, 
  Instagram, 
  ShieldCheck, 
  Users, 
  Zap,
  BarChart3,
  Plus,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function SocialCommercePage() {
  const [customIntegrations, setCustomIntegrations] = useState<{id: string, name: string, description: string}[]>([]);
  const [newIntegration, setNewIntegration] = useState({ name: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddIntegration = () => {
    if (!newIntegration.name) return;
    setCustomIntegrations([
      ...customIntegrations, 
      { ...newIntegration, id: Math.random().toString(36).substr(2, 9) }
    ]);
    setNewIntegration({ name: '', description: '' });
    setIsDialogOpen(false);
  };

  const removeIntegration = (id: string) => {
    setCustomIntegrations(customIntegrations.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Social Commerce</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Sync your FSLNO inventory with TikTok and Meta platforms for cross-channel sales.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-9 gap-2">
              <Plus className="h-4 w-4" /> Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sales Channel</DialogTitle>
              <DialogDescription>
                Configure a new platform or custom tool for social commerce.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input 
                  id="channel-name" 
                  placeholder="e.g. Pinterest Shopping" 
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="channel-desc">Description</Label>
                <Input 
                  id="channel-desc" 
                  placeholder="e.g. Sync product catalog for visual search" 
                  value={newIntegration.description}
                  onChange={(e) => setNewIntegration({...newIntegration, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddIntegration}>Add Channel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {/* TikTok Section */}
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#ff0050]" />
                <CardTitle className="text-lg">TikTok Shop Seller API</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-100 bg-green-50">Active</Badge>
            </div>
            <CardDescription>
              Enable in-app checkout and affiliate creator management for viral drops.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border">
                <div className="space-y-1">
                  <p className="text-sm font-bold">In-App Checkout</p>
                  <p className="text-xs text-[#5c5f62]">Allow customers to buy FSLNO gear without leaving TikTok.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#f6f6f7] rounded-md border">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Affiliate Sample Management</p>
                  <p className="text-xs text-[#5c5f62]">Automated dashboard to send samples to creators and track ROI.</p>
                </div>
                <Button variant="outline" size="sm" className="h-8">Configure</Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">TikTok Shop Access Token</Label>
              <Input type="password" value="u5w9XtYeVTmceUfOZLZwDQxF2" readOnly className="bg-[#f1f2f3]" />
            </div>
          </CardContent>
        </Card>

        {/* Meta Conversions API Section */}
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#0668E1]" />
              <CardTitle className="text-lg">Meta Conversions API (CAPI)</CardTitle>
            </div>
            <CardDescription>
              High-performance server-to-server tracking for Facebook and Instagram ads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex gap-3">
                <Zap className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900">Bypass iOS Privacy Restrictions</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    CAPI sends "Purchase" data directly from your Firebase server to Meta, bypassing browser ad-blockers and cookie restrictions.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Pixel ID</Label>
                <Input defaultValue="9283746501293" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-[#5c5f62]">Access Token</Label>
                <Input type="password" placeholder="Enter your system user token" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1">
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>Event Match Quality (EMQ)</span>
                  <Badge variant="secondary" className="text-[10px] h-4">Advanced</Badge>
                </div>
                <p className="text-xs text-[#5c5f62]">Sends hashed email/phone data to help Meta find "Spot Closing" buyers.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Instagram Shopping Section */}
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-[#E1306C]" />
              <CardTitle className="text-lg">Instagram Shopping & Reels</CardTitle>
            </div>
            <CardDescription>
              Sync your Bento Grid categories directly into shoppable visual content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-md flex flex-col gap-3">
                <BarChart3 className="h-5 w-5 text-[#5c5f62]" />
                <h4 className="text-sm font-bold">Product Tagging</h4>
                <p className="text-xs text-[#5c5f62]">Real-time sync of categories into Instagram "Guides" and Reels.</p>
                <Button variant="link" className="p-0 h-auto text-xs justify-start font-bold">Sync Now</Button>
              </div>
              <div className="p-4 border rounded-md flex flex-col gap-3">
                <Users className="h-5 w-5 text-[#5c5f62]" />
                <h4 className="text-sm font-bold">Creator Marketplace</h4>
                <p className="text-xs text-[#5c5f62]">Enable white-listed ads for FSLNO partner influencers.</p>
                <Button variant="link" className="p-0 h-auto text-xs justify-start font-bold">View Partners</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Integrations */}
        {customIntegrations.map((integration) => (
          <Card key={integration.id} className="border-[#e1e3e5] shadow-none border-dashed border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-[#5c5f62]" />
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeIntegration(integration.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-[#f6f6f7] rounded-md border text-center text-xs text-[#5c5f62]">
                Integration configuration pending API key validation.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button className="bg-black text-white h-11 px-8 font-bold">Save Channel Settings</Button>
      </div>
    </div>
  );
}
