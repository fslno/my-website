'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, 
  Save, 
  Plus, 
  Trash2, 
  Instagram, 
  Twitter, 
  MessageCircle,
  Menu as MenuIcon,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Mail,
  Clock,
  CreditCard,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LinkItem {
  label: string;
  url: string;
}

const PAYMENT_METHODS = [
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'amex', label: 'American Express' },
  { id: 'applepay', label: 'Apple Pay' },
  { id: 'googlepay', label: 'Google Pay' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'klarna', label: 'Klarna' },
  { id: 'afterpay', label: 'Afterpay' }
];

export default function FooterEditorPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const poweredByLogoRef = useRef<HTMLInputElement>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: config, isLoading: loading } = useDoc(configRef);

  const [isSaving, setIsSaving] = useState(false);
  
  // Local Form State
  const [description, setDescription] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [supportLinks, setSupportLinks] = useState<LinkItem[]>([]);
  const [legalLinks, setLegalLinks] = useState<LinkItem[]>([]);
  const [copyrightText, setCopyrightText] = useState('');
  const [systemVersion, setSystemVersion] = useState('');

  // Newsletter State
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);
  const [newsletterHeadline, setNewsletterHeadline] = useState('JOIN THE ARCHIVE');
  const [newsletterSubtext, setNewsletterSubtext] = useState('Sign up for early access to high-velocity drops.');

  // Store Hours & Maps
  const [openingHours, setOpeningHours] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Payment Icons
  const [visiblePaymentIcons, setVisiblePaymentIcons] = useState<string[]>([]);

  // Powered By State
  const [poweredByEnabled, setPoweredByEnabled] = useState(true);
  const [poweredByLabel, setPoweredByLabel] = useState('Powered by');
  const [poweredByStudioName, setPoweredByStudioName] = useState('FSLNO STUDIO');
  const [poweredByLogoUrl, setPoweredByLogoUrl] = useState('');

  useEffect(() => {
    if (config) {
      setDescription(config.footerDescription || '');
      setInstagramUrl(config.instagramUrl || '');
      setTiktokUrl(config.tiktokUrl || '');
      setTwitterUrl(config.twitterUrl || '');
      setSupportLinks(config.footerSupportLinks || []);
      setLegalLinks(config.footerLegalLinks || []);
      setCopyrightText(config.copyrightText || `© ${new Date().getFullYear()} ${config.businessName || 'FSLNO'}. ALL RIGHTS RESERVED.`);
      setSystemVersion(config.systemVersion || 'ARCHIVE SYSTEM V1.0');
      setPoweredByEnabled(config.poweredByEnabled ?? true);
      setPoweredByLabel(config.poweredByLabel || 'Powered by');
      setPoweredByStudioName(config.poweredByStudioName || 'FSLNO STUDIO');
      setPoweredByLogoUrl(config.poweredByLogoUrl || '');
      
      setNewsletterEnabled(config.newsletterEnabled ?? true);
      setNewsletterHeadline(config.newsletterHeadline || 'JOIN THE ARCHIVE');
      setNewsletterSubtext(config.newsletterSubtext || 'Sign up for early access to high-velocity drops.');
      setOpeningHours(config.openingHours || '');
      setGoogleMapsUrl(config.googleMapsUrl || '');
      setVisiblePaymentIcons(config.paymentIconsVisible || []);
    }
  }, [config]);

  const handleSave = async () => {
    if (!configRef) return;
    setIsSaving(true);
    const updates = { 
      footerDescription: description,
      instagramUrl,
      tiktokUrl,
      twitterUrl,
      footerSupportLinks: supportLinks,
      footerLegalLinks: legalLinks,
      copyrightText,
      systemVersion,
      poweredByEnabled,
      poweredByLabel,
      poweredByStudioName,
      poweredByLogoUrl,
      newsletterEnabled,
      newsletterHeadline,
      newsletterSubtext,
      openingHours,
      googleMapsUrl,
      paymentIconsVisible: visiblePaymentIcons,
      updatedAt: new Date().toISOString() 
    };

    setDoc(configRef, updates, { merge: true })
      .then(() => {
        toast({ title: "Footer Updated", description: "Storefront branding has been synchronized." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'write',
          requestResourceData: updates
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPoweredByLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addLink = (type: 'support' | 'legal') => {
    const setter = type === 'support' ? setSupportLinks : setLegalLinks;
    setter(prev => [...prev, { label: '', url: '' }]);
  };

  const updateLink = (type: 'support' | 'legal', index: number, field: keyof LinkItem, value: string) => {
    const setter = type === 'support' ? setSupportLinks : setLegalLinks;
    setter(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeLink = (type: 'support' | 'legal', index: number) => {
    const setter = type === 'support' ? setSupportLinks : setLegalLinks;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const togglePaymentIcon = (id: string) => {
    setVisiblePaymentIcons(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Footer Editor</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Synchronize global support paths, newsletter dispatches, and archival identity.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-black text-white h-10 px-8 font-bold uppercase tracking-widest text-[10px] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Commit Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" /> Newsletter Integration
                </CardTitle>
                <CardDescription>Configure the archival email capture module.</CardDescription>
              </div>
              <Switch checked={newsletterEnabled} onCheckedChange={setNewsletterEnabled} />
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Headline</Label>
                <Input 
                  value={newsletterHeadline} 
                  onChange={(e) => setNewsletterHeadline(e.target.value.toUpperCase())}
                  placeholder="JOIN THE ARCHIVE"
                  className="h-11 font-bold tracking-tighter"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Subtext</Label>
                <Input 
                  value={newsletterSubtext} 
                  onChange={(e) => setNewsletterSubtext(e.target.value)}
                  placeholder="Sign up for early access..."
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Brand Narrative</CardTitle>
              <CardDescription>A concise statement defining your archive's identity.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Redefining luxury through minimalist design..."
                className="min-h-[120px] resize-none text-sm uppercase tracking-tight"
              />
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Support Links</CardTitle>
                <CardDescription>Customer service and utility paths.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => addLink('support')} className="h-8 text-[9px] font-bold uppercase border-black">
                <Plus className="h-3 w-3 mr-1" /> Add Path
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportLinks.map((link, idx) => (
                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Input 
                    value={link.label} 
                    onChange={(e) => updateLink('support', idx, 'label', e.target.value)}
                    placeholder="Label (e.g. FAQ)" 
                    className="h-10 text-xs font-bold uppercase"
                  />
                  <Input 
                    value={link.url} 
                    onChange={(e) => updateLink('support', idx, 'url', e.target.value)}
                    placeholder="/shipping" 
                    className="h-10 text-xs font-mono"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeLink('support', idx)} className="h-10 w-10 text-red-500 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {supportLinks.length === 0 && <p className="text-center py-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">No support links configured.</p>}
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Legal & Compliance</CardTitle>
                <CardDescription>Privacy, terms, and regulatory content.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => addLink('legal')} className="h-8 text-[9px] font-bold uppercase border-black">
                <Plus className="h-3 w-3 mr-1" /> Add Path
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {legalLinks.map((link, idx) => (
                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Input 
                    value={link.label} 
                    onChange={(e) => updateLink('legal', idx, 'label', e.target.value)}
                    placeholder="Label (e.g. Terms)" 
                    className="h-10 text-xs font-bold uppercase"
                  />
                  <Input 
                    value={link.url} 
                    onChange={(e) => updateLink('legal', idx, 'url', e.target.value)}
                    placeholder="/privacy" 
                    className="h-10 text-xs font-mono"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeLink('legal', idx)} className="h-10 w-10 text-red-500 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {legalLinks.length === 0 && <p className="text-center py-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">No legal links configured.</p>}
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader className="border-b bg-gray-50/30">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-500" /> Payment Visual Visibility
              </CardTitle>
              <CardDescription>Select which gateway icons are Authoritatively surfaced in the footer.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => togglePaymentIcon(method.id)}
                    className={cn(
                      "p-3 border rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all",
                      visiblePaymentIcons.includes(method.id)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-[#e1e3e5] shadow-none bg-gray-50/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" /> Operational Hours
              </CardTitle>
              <CardDescription>Display your "Spot" hours and Map link in the footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Opening Hours</Label>
                <Textarea 
                  value={openingHours} 
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="e.g. MON-FRI: 10AM - 6PM"
                  className="min-h-[100px] resize-none text-[10px] font-bold uppercase tracking-widest"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                  <Navigation className="h-3 w-3" /> Location Link (Google Maps)
                </Label>
                <Input 
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="h-10 text-[10px] font-bold uppercase"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none bg-gray-50/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Powered By</CardTitle>
                <CardDescription>Studio attribution module.</CardDescription>
              </div>
              <Switch checked={poweredByEnabled} onCheckedChange={setPoweredByEnabled} />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Logo / Icon</Label>
                <input type="file" ref={poweredByLogoRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <div 
                  onClick={() => poweredByLogoRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-white hover:border-black transition-all cursor-pointer group h-24"
                >
                  {poweredByLogoUrl ? (
                    <div className="relative w-10 h-10">
                      <Image src={poweredByLogoUrl} alt="Powered By Logo" fill className="object-contain" />
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Upload Icon</p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Attribution Label</Label>
                <Input 
                  value={poweredByLabel} 
                  onChange={(e) => setPoweredByLabel(e.target.value)} 
                  placeholder="Powered by"
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Studio Name</Label>
                <Input 
                  value={poweredByStudioName} 
                  onChange={(e) => setPoweredByStudioName(e.target.value)} 
                  placeholder="FSLNO STUDIO"
                  className="h-10 text-xs font-headline font-bold"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none bg-gray-50/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Social Discovery</CardTitle>
              <CardDescription>Channel connectivity URLs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="pl-10 h-11 text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">TikTok</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@..." className="pl-10 h-11 text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Twitter / X</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/..." className="pl-10 h-11 text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none bg-gray-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Compliance & Versioning</CardTitle>
              </div>
              <CardDescription>Curate the global footer fine print.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Copyright Notice</Label>
                <Input 
                  value={copyrightText} 
                  onChange={(e) => setCopyrightText(e.target.value)} 
                  placeholder="e.g. © 2026 FSLNO. ALL RIGHTS RESERVED."
                  className="h-11 text-xs uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">System Version Identifier</Label>
                <div className="relative">
                  <FileCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={systemVersion} 
                    onChange={(e) => setSystemVersion(e.target.value)} 
                    placeholder="e.g. ARCHIVE SYSTEM V1.0"
                    className="pl-10 h-11 text-xs uppercase font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-black text-white p-6 rounded-xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-blue-400" /> Administrative Logic
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Footer links use relative paths (e.g. <code className="text-white">/shipping</code>) for internal store pages or absolute URLs for external domains.
            </p>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
              <span>Status</span>
              <span className="text-green-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Real-time Sync Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}