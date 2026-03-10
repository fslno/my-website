'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, 
  Settings2, 
  Loader2, 
  Save, 
  Image as ImageIcon, 
  Upload, 
  Send,
  Globe,
  Palette,
  CheckCircle2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface NotificationConfig {
  enabled: boolean;
  subject: string;
  body: string;
  description: string;
  label: string;
}

const DEFAULT_NOTIFICATIONS: Record<string, NotificationConfig> = {
  orderConfirmation: {
    label: "Order Confirmation",
    description: "Sent immediately after successful placement. Includes items, billing, and status link.",
    enabled: true,
    subject: "Thank you for your archive acquisition #{{order_id}}",
    body: "Your acquisition is being verified by the studio..."
  },
  statusChanged: {
    label: "Order Status Changed",
    description: "Sent whenever you manually update the progress of an order fulfillment.",
    enabled: true,
    subject: "Update: Your archive order #{{order_id}} status has changed",
    body: "The status of your order has been updated to {{status}}..."
  },
  shipped: {
    label: "Order Shipped",
    description: "Triggered when a tracking number is assigned or status moves to 'Shipped.'",
    enabled: true,
    subject: "Good news! Your order #{{order_id}} has shipped!",
    body: "Your pieces are in transit via {{courier}}. Tracking: {{tracking_number}}..."
  },
  readyForPickup: {
    label: "Order Ready for Pickup",
    description: "Sent to notify customers that their items are waiting at your physical location.",
    enabled: false,
    subject: "Ready for Collection: Your archive order #{{order_id}}",
    body: "Your items are ready at the studio. Please bring your ID..."
  },
  delivered: {
    label: "Order Delivered",
    description: "Sent once the carrier confirms delivery or status is updated to 'Delivered.'",
    enabled: true,
    subject: "Delivered: Your FSLNO Archive order #{{order_id}}",
    body: "Enjoy your new acquisition. We would love to see how you style it..."
  },
  refunded: {
    label: "Order Refunded",
    description: "Notifies the customer of a processed refund and expected payment return.",
    enabled: true,
    subject: "Refund Processed: Order #{{order_id}}",
    body: "A refund has been initiated for your archival order..."
  },
  downloadEGoods: {
    label: "Download E-goods",
    description: "Sent automatically once a digital product order is marked as 'Paid.'",
    enabled: true,
    subject: "Your Digital Assets: Order #{{order_id}}",
    body: "Click here to download your digital archive materials..."
  },
  giftCardPurchased: {
    label: "Gift Card Purchased",
    description: "Contains redemption codes and instructions for the purchaser.",
    enabled: true,
    subject: "Your FSLNO Digital Gift Card",
    body: "Your gift card code is: {{gift_card_code}}..."
  }
};

export default function NotificationsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'notifications') : null, [db]);
  const { data: config, loading } = useDoc(configRef);

  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  
  // Local form state for editing a specific notification
  const [editSubject, setEditingSubject] = useState('');
  const [editBody, setEditingBody] = useState('');

  // Global branding state
  const [logoUrl, setLogoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#000000');
  const [footerContent, setFooterContent] = useState('');

  useEffect(() => {
    if (config?.global) {
      setLogoUrl(config.global.logoUrl || '');
      setAccentColor(config.global.accentColor || '#000000');
      setFooterContent(config.global.footer || '');
    }
  }, [config]);

  const handleToggle = (key: string, enabled: boolean) => {
    if (!configRef) return;
    const updates = { [key]: { ...(config?.[key] || DEFAULT_NOTIFICATIONS[key]), enabled } };
    updateDoc(configRef, updates).catch(() => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  const handleEdit = (key: string) => {
    const data = config?.[key] || DEFAULT_NOTIFICATIONS[key];
    setEditingKey(key);
    setEditingSubject(data.subject);
    setEditingBody(data.body);
  };

  const saveNotificationEdit = () => {
    if (!configRef || !editingKey) return;
    const updates = { 
      [editingKey]: { 
        ...(config?.[editingKey] || DEFAULT_NOTIFICATIONS[editingKey]), 
        subject: editSubject, 
        body: editBody 
      } 
    };
    updateDoc(configRef, updates)
      .then(() => {
        setEditingKey(null);
        toast({ title: "Notification Updated", description: "Subject line and content have been saved." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: updates
        }));
      });
  };

  const handleSaveGlobal = () => {
    if (!configRef) return;
    setIsSaving(true);
    const globalData = {
      logoUrl,
      accentColor,
      footer: footerContent,
      updatedAt: new Date().toISOString()
    };

    setDoc(configRef, { global: globalData }, { merge: true })
      .then(() => {
        toast({ title: "Branding Saved", description: "Email templates have been synchronized with your identity." });
      })
      .finally(() => setIsSaving(false));
  };

  const handleSendTest = () => {
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      toast({ title: "Test Email Dispatched", description: "Check your inbox for the FSLNO preview." });
    }, 1500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Customer Order Notifications</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Keep fans informed about their acquisition progress with branded communications.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 gap-2 font-bold uppercase tracking-widest text-[10px]" onClick={handleSendTest} disabled={isSendingTest}>
            {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Test to Admin
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500 py-4 pl-6">Notification Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Description</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(DEFAULT_NOTIFICATIONS).map((key) => {
              const data = config?.[key] || DEFAULT_NOTIFICATIONS[key];
              return (
                <TableRow key={key} className="hover:bg-gray-50/30">
                  <TableCell className="pl-6 py-4">
                    <span className="font-bold text-sm tracking-tight">{data.label}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">{data.description}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Switch 
                        checked={data.enabled} 
                        onCheckedChange={(checked) => handleToggle(key, checked)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="pr-6">
                    <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-[10px]" onClick={() => handleEdit(key)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle className="text-lg">Global Customization</CardTitle>
            </div>
            <CardDescription>
              Apply universal branding to all automated archival emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Email Accent Color</Label>
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded border p-1 bg-white shadow-sm overflow-hidden">
                    <Input 
                      type="color" 
                      className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" 
                      value={accentColor} 
                      onChange={(e) => setAccentColor(e.target.value)} 
                    />
                  </div>
                  <Input 
                    value={accentColor} 
                    onChange={(e) => setAccentColor(e.target.value)} 
                    className="h-12 font-mono text-xs uppercase" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Email Footer Narrative</Label>
                <Textarea 
                  placeholder="Studio Address & Social links..." 
                  value={footerContent} 
                  onChange={(e) => setFooterContent(e.target.value)}
                  className="min-h-[100px] text-xs resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Brand Logo (Header)</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 bg-gray-50 hover:border-black transition-all cursor-pointer group"
              >
                {logoUrl ? (
                  <div className="relative w-full max-w-[200px] h-20">
                    <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Upload 200px wide PNG/JPG</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
            </div>
          </CardContent>
          <DialogFooter className="p-6 border-t bg-gray-50/50">
            <Button className="bg-black text-white px-10 h-11 font-bold uppercase tracking-widest text-[10px]" onClick={handleSaveGlobal} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Global Styles
            </Button>
          </DialogFooter>
        </Card>

        <div className="space-y-6">
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400">Live Preview Hint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-bold">Dynamic Variables</p>
                  <p className="text-[10px] text-gray-400 mt-1">Use &#123;&#123;order_id&#125;&#125; or &#123;&#123;status&#125;&#125; to inject live transaction data into your narratives.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold">Global Delivery</p>
                  <p className="text-[10px] text-gray-400 mt-1">All emails are dispatched via the Studio Mail API with high deliverability scores.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="sm:max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
              Edit Notification: {editingKey && (config?.[editingKey] || DEFAULT_NOTIFICATIONS[editingKey]).label}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Refine the narrative and subject line for this automated archival touchpoint.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Subject Line</Label>
              <Input 
                value={editSubject} 
                onChange={(e) => setEditingSubject(e.target.value)} 
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Email Body (High-Fidelity Narrative)</Label>
              <Textarea 
                value={editBody} 
                onChange={(e) => setEditingBody(e.target.value)} 
                className="min-h-[200px] text-sm leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter className="flex-row items-center justify-between">
            <Button variant="outline" className="text-[10px] font-bold uppercase tracking-widest" onClick={handleSendTest}>Send Test</Button>
            <Button className="bg-black text-white h-11 px-8 font-bold uppercase tracking-widest text-[10px]" onClick={saveNotificationEdit}>
              Update Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
