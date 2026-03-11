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
  CheckCircle2,
  FileText,
  Zap,
  Sparkles,
  TicketPercent,
  MessageSquare,
  Info,
  Terminal,
  ChevronRight
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
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    description: "Sent immediately after successful placement. Confirms pieces and studio preparation.",
    enabled: true,
    subject: "Confirmed: Your {{business_name}} Archive Selection #{{order_id}}",
    body: "Hi {{customer_name}},\n\nWe're thrilled to confirm your archive selection! Our studio team has received order #{{order_id}} and is now preparing your pieces with absolute precision.\n\nYOUR ARCHIVE SELECTION:\n{{product_list}}\n\nOrder Total: {{order_total}}\n\nSTUDIO DETAILS:\n{{business_address}}\n{{business_phone}}\n\nWe'll notify you as soon as your items are dispatched. Thank you for your trust."
  },
  statusChanged: {
    label: "Order Status Changed",
    description: "Sent whenever you manually update the progress of an order fulfillment.",
    enabled: true,
    subject: "Update: The status of order #{{order_id}} has evolved",
    body: "Hi {{customer_name}},\n\nJust a quick update from the {{business_name}} studio. The status of your archive order #{{order_id}} has been updated to: {{status}}.\n\nWe are moving through the fulfillment stages to ensure your pieces reach you in perfect condition.\n\nRegards,\n{{business_name}} Team"
  },
  shipped: {
    label: "Order Shipped",
    description: "Triggered when a tracking number is assigned or status moves to 'Shipped.'",
    enabled: true,
    subject: "In Transit: Your {{business_name}} order #{{order_id}} is on the move",
    body: "Excellent news, {{customer_name}}!\n\nYour archive selection has been Authoritatively dispatched from our studio. \n\nCARRIER: {{courier}}\nLOGISTICS ID: {{tracking_number}}\n\nYou can track the journey of your pieces using the link below:\nhttps://fslno.com/track/{{tracking_number}}\n\nThank you for shopping the archive."
  },
  readyForPickup: {
    label: "Order Ready for Pickup",
    description: "Sent to notify customers that their items are waiting at your physical location.",
    enabled: false,
    subject: "Ready for Pickup: Your selection is waiting at the Spot",
    body: "Hi {{customer_name}},\n\nYour archive pieces for order #{{order_id}} are ready for collection at our physical location.\n\nPICKUP ADDRESS:\n{{business_address}}\n\nHOURS:\nMon-Fri: 10AM - 6PM\n\nPlease ensure you bring a valid government-issued photo ID and your order confirmation ID for biometric validation."
  },
  delivered: {
    label: "Order Delivered",
    description: "Sent once the carrier confirms delivery or status is updated to 'Delivered.'",
    enabled: true,
    subject: "Arrived: Your {{business_name}} pieces have been delivered",
    body: "Hi {{customer_name}},\n\nAccording to our records, order #{{order_id}} has arrived at its destination. We hope these archive pieces become a cornerstone of your wardrobe.\n\nWe'd love to hear your thoughts on the silhouette and fit. Feel free to reply to this email or tag us on Instagram.\n\nEnjoy the drop,\n{{business_name}}"
  },
  refunded: {
    label: "Order Refunded",
    description: "Notifies the customer of a processed refund and expected payment return.",
    enabled: true,
    subject: "Refund Processed: Order #{{order_id}} Reconciliation",
    body: "Hi {{customer_name}},\n\nThis email confirms that a refund has been processed for your order #{{order_id}}. The funds should return to your original payment method within 3-5 business days, depending on your bank's protocol.\n\nIf you have any questions regarding this reconciliation, please contact our support team at {{business_phone}}."
  }
};

const DEFAULT_MARKETING: Record<string, NotificationConfig> = {
  favReminder: {
    label: "Wishlist Reminder",
    description: "Sent 3 days after a customer adds items to their favorites.",
    enabled: false,
    subject: "Still on your mind? Your archive favorites",
    body: "Hi {{customer_name}},\n\nWe noticed you saved some architectural pieces to your wishlist recently. Items in the archive move quickly—don't miss the chance to secure your size before the spot closes.\n\nREVISIT YOUR FAVORITES:\n{{product_list}}\n\n{{business_name}}"
  },
  cartRecovery: {
    label: "Abandoned Cart Recovery",
    description: "Automatically reminds shoppers about unfinished orders left in their cart.",
    enabled: true,
    subject: "Incomplete selection: Finish your order at {{business_name}}",
    body: "Hi {{customer_name}},\n\nYou left some high-fidelity pieces in your bag! We've reserved them for a limited time, but we can't guarantee stock forever.\n\nRESUME CHECKOUT:\nhttps://fslno.com/checkout\n\nYour pending selection:\n{{product_list}}\n\nComplete your purchase now to secure these archive drops."
  },
  feedbackRequest: {
    label: "Feedback Request",
    description: "Sent after an order is marked 'Delivered' to gather reviews.",
    enabled: true,
    subject: "How is the fit? Share your thoughts on {{business_name}}",
    body: "Hi {{customer_name}},\n\nNow that you've had a few days with your archive pieces from order #{{order_id}}, we'd love to know what you think. \n\nWas the silhouette as expected? How was the logistics experience?\n\n[LEAVE A REVIEW]\n\nYour feedback helps us refine the archive experience."
  },
  loyaltyAppreciation: {
    label: "Loyalty Appreciation",
    description: "Sent 1 day after a customer’s 2nd order to say thanks.",
    enabled: true,
    subject: "A special thank you from the {{business_name}} studio",
    body: "Hi {{customer_name}},\n\nAs a recurring participant in our archive drops, we wanted to reach out and express our appreciation. Use the code LOYALTY10 at your next checkout for an Authoritative 10% off.\n\nThank you for being part of the FSLNO journey."
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
  const [isMarketingEdit, setIsMarketingEdit] = useState(false);
  
  // Local form state for editing a specific notification
  const [editSubject, setEditingSubject] = useState('');
  const [editBody, setEditingBody] = useState('');

  // Global branding state
  const [logoUrl, setLogoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#000000');
  const [footerContent, setFooterContent] = useState('');
  const [attachInvoice, setAttachInvoice] = useState(true);

  useEffect(() => {
    if (config?.global) {
      setLogoUrl(config.global.logoUrl || '');
      setAccentColor(config.global.accentColor || '#000000');
      setFooterContent(config.global.footer || '');
      setAttachInvoice(config.global.attachInvoice ?? true);
    }
  }, [config]);

  const handleToggle = (key: string, enabled: boolean, isMarketing = false) => {
    if (!configRef) return;
    const base = isMarketing ? (config?.[key] || DEFAULT_MARKETING[key]) : (config?.[key] || DEFAULT_NOTIFICATIONS[key]);
    const updates = { [key]: { ...base, enabled } };
    setDoc(configRef, updates, { merge: true }).catch(() => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  const handleEdit = (key: string, isMarketing = false) => {
    const data = isMarketing ? (config?.[key] || DEFAULT_MARKETING[key]) : (config?.[key] || DEFAULT_NOTIFICATIONS[key]);
    setEditingKey(key);
    setIsMarketingEdit(isMarketing);
    setEditingSubject(data.subject);
    setEditingBody(data.body);
  };

  const saveNotificationEdit = () => {
    if (!configRef || !editingKey) return;
    const base = isMarketingEdit ? (config?.[editingKey] || DEFAULT_MARKETING[editingKey]) : (config?.[editingKey] || DEFAULT_NOTIFICATIONS[editingKey]);
    const updates = { 
      [editingKey]: { 
        ...base,
        subject: editSubject, 
        body: editBody 
      } 
    };
    setDoc(configRef, updates, { merge: true })
      .then(() => {
        setEditingKey(null);
        toast({ title: "Template Saved", description: "Email content has been Authoritatively updated." });
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
      attachInvoice,
      updatedAt: new Date().toISOString()
    };

    setDoc(configRef, { global: globalData }, { merge: true })
      .then(() => {
        toast({ title: "Branding Finalized", description: "Global notification settings are now live." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: { global: globalData }
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleSendTest = () => {
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      toast({ 
        title: "Test Sent", 
        description: "A friendly high-fidelity preview has been sent to your staff email.",
        variant: "default"
      });
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

  const activeNotification = editingKey 
    ? (isMarketingEdit ? (config?.[editingKey] || DEFAULT_MARKETING[editingKey]) : (config?.[editingKey] || DEFAULT_NOTIFICATIONS[editingKey])) 
    : null;

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Notifications & Automation</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage friendly automated emails, marketing recovery, and global branding.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 gap-2 font-bold uppercase tracking-widest text-[10px] border-black" onClick={handleSendTest} disabled={isSendingTest}>
            {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Live Preview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Fulfillment Notifications</h2>
            </div>
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500 py-4 pl-6">Touchpoint</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Logistical Trigger</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(DEFAULT_NOTIFICATIONS).map((key) => {
                    const data = config?.[key] || DEFAULT_NOTIFICATIONS[key];
                    return (
                      <TableRow key={key} className="hover:bg-gray-50/30 transition-colors">
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
                              onCheckedChange={(checked) => handleToggle(key, checked, false)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="pr-6">
                          <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-[10px] hover:underline" onClick={() => handleEdit(key, false)}>
                            Refine
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Growth & Recovery Campaigns</h2>
            </div>
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500 py-4 pl-6">Campaign</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Automated Logic</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(DEFAULT_MARKETING).map((key) => {
                    const data = config?.[key] || DEFAULT_MARKETING[key];
                    return (
                      <TableRow key={key} className="hover:bg-gray-50/30 transition-colors">
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
                              onCheckedChange={(checked) => handleToggle(key, checked, true)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="pr-6">
                          <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-[10px] hover:underline" onClick={() => handleEdit(key, true)}>
                            Refine
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>

        <div className="xl:col-span-4 space-y-8">
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-blue-400" /> Placeholder Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase text-blue-400">Customer Identity</p>
                    <div className="space-y-1 text-[10px] font-mono">
                      <p><span className="text-zinc-500">{"{{customer_name}}"}</span> - Full Name</p>
                      <p><span className="text-zinc-500">{"{{order_id}}"}</span> - Confirmation ID</p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <p className="text-[9px] font-bold uppercase text-orange-400">Archival Data</p>
                    <div className="space-y-1 text-[10px] font-mono">
                      <p><span className="text-zinc-500">{"{{product_list}}"}</span> - Formatted items</p>
                      <p><span className="text-zinc-500">{"{{order_total}}"}</span> - Grand total</p>
                      <p><span className="text-zinc-500">{"{{status}}"}</span> - Fulfillment stage</p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <p className="text-[9px] font-bold uppercase text-emerald-400">Business Context</p>
                    <div className="space-y-1 text-[10px] font-mono">
                      <p><span className="text-zinc-500">{"{{business_name}}"}</span> - Store Identity</p>
                      <p><span className="text-zinc-500">{"{{business_address}}"}</span> - Physical Spot</p>
                      <p><span className="text-zinc-500">{"{{business_phone}}"}</span> - Contact line</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="bg-gray-50/50 border-b">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle className="text-[10px] uppercase tracking-widest font-bold">Global Email Styles</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Brand Accent Color</Label>
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
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Brand Visual (Logo)</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-4 bg-gray-50 hover:border-black transition-all cursor-pointer group h-24"
                >
                  {logoUrl ? (
                    <div className="relative w-full max-w-[150px] h-12">
                      <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Upload Visual</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <Label className="text-[10px] font-bold uppercase">Attach Invoices</Label>
                  </div>
                  <Switch 
                    checked={attachInvoice} 
                    onCheckedChange={setAttachInvoice}
                  />
                </div>
                <p className="text-[9px] text-gray-400 uppercase leading-relaxed italic">Automatically attach forensic PDF invoices to confirmation emails.</p>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all" 
            onClick={handleSaveGlobal} 
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Styles
          </Button>
        </div>
      </div>

      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="sm:max-w-2xl bg-white border-none rounded-none shadow-2xl p-0 overflow-hidden">
          <div className="p-10 space-y-8">
            <DialogHeader className="p-0 border-none space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <DialogTitle className="text-2xl font-headline font-bold uppercase tracking-tight">
                  Refining: {activeNotification?.label}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Ensure templates contain essential business and product placeholders for high-fidelity communication.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Linguistic Identity (Subject Line)</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={editSubject} 
                    onChange={(e) => setEditingSubject(e.target.value)} 
                    className="h-12 pl-10 text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Dispatch Content (Body Copy)</Label>
                <Textarea 
                  value={editBody} 
                  onChange={(e) => setEditingBody(e.target.value)} 
                  className="min-h-[350px] text-sm leading-relaxed p-6 bg-gray-50 border-gray-200 resize-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-blue-800 uppercase font-medium leading-relaxed">
                Use <code className="bg-blue-100 px-1 rounded text-blue-900 font-bold">{"{{product_list}}"}</code> to Authoritatively inject ordered items and <code className="bg-blue-100 px-1 rounded text-blue-900 font-bold">{"{{business_address}}"}</code> for the studio Spot.
              </p>
            </div>

            <DialogFooter className="flex-row items-center justify-between pt-4">
              <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" onClick={handleSendTest}>Preview in Inbox</Button>
              <Button className="bg-black text-white h-12 px-10 font-bold uppercase tracking-widest text-[10px]" onClick={saveNotificationEdit}>
                Finalize Template
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
