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
  ChevronRight,
  X,
  Volume2,
  Music,
  Activity,
  PlayCircle,
  ShieldAlert,
  Smartphone
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
import { Badge } from '@/components/ui/badge';
import { useFirebaseApp, useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getMessagingInstance } from '@/firebase';
import { getToken } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
    body: "Excellent news, {{customer_name}}!\n\nYour archive selection has been Authoritatively dispatched from our studio. \n\nCARRIER: {{courier}}\nLOGISTICS ID: {{tracking_number}}\n\nYou can track the journey of your pieces using the link below:\nhttps://fslno.ca/track/{{tracking_number}}\n\nThank you for shopping the archive."
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
  cartRecovery: {
    label: "Abandoned Cart Recovery",
    description: "Automatically reminds shoppers about unfinished orders left in their cart.",
    enabled: true,
    subject: "Incomplete selection: Finish your order at {{business_name}}",
    body: "Hi {{customer_name}},\n\nYou left some high-fidelity pieces in your bag! We've reserved them for a limited time, but we can't guarantee stock forever.\n\nRESUME CHECKOUT:\nhttps://fslno.ca/checkout\n\nYour pending selection:\n{{product_list}}\n\nComplete your purchase now to secure these archive drops."
  },
  feedbackRequest: {
    label: "Feedback Request",
    description: "Sent after an order is marked 'Delivered' to gather reviews.",
    enabled: true,
    subject: "How is the fit? Share your thoughts on {{business_name}}",
    body: "Hi {{customer_name}},\n\nNow that you've had a few days with your archive pieces from order #{{order_id}}, we'd love to know what you think. \n\nWas the silhouette as expected? How was the logistics experience?\n\n[LEAVE A REVIEW]\n\nYour feedback helps us refine the archive experience."
  }
};

export default function NotificationsPage() {
  const app = useFirebaseApp();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const ringtoneInputRef = useRef<HTMLInputElement>(null);
  const testAudioRef = useRef<HTMLAudioElement>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'notifications') : null, [db]);
  const { data: config, isLoading: loading } = useDoc(configRef);

  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isRegisteringDevice, setIsRegisteringDevice] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isMarketingEdit, setIsMarketingEdit] = useState(false);
  
  const [editSubject, setEditingSubject] = useState('');
  const [editBody, setEditingBody] = useState('');

  const [logoUrl, setLogoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#000000');
  const [footerContent, setFooterContent] = useState('');
  const [attachInvoice, setAttachInvoice] = useState(true);

  const [orderAlarmEnabled, setOrderAlarmEnabled] = useState(true);
  const [orderAlarmUrl, setOrderAlarmUrl] = useState('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  useEffect(() => {
    if (config?.global) {
      setLogoUrl(config.global.logoUrl || '');
      setAccentColor(config.global.accentColor || '#000000');
      setFooterContent(config.global.footer || '');
      setAttachInvoice(config.global.attachInvoice ?? true);
    }
    if (config) {
      setOrderAlarmEnabled(config.orderAlarmEnabled ?? true);
      setOrderAlarmUrl(config.orderAlarmUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }
  }, [config]);

  const handleRegisterDevice = async () => {
    if (!app || isRegisteringDevice) return;
    setIsRegisteringDevice(true);
    
    try {
      const messaging = await getMessagingInstance(app);
      if (!messaging) throw new Error("Messaging not supported in this environment.");

      // Authoritative Handshake: Attempt to retrieve token with VAPID protection
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
      
      const token = await getToken(messaging, { vapidKey }).catch(err => {
        if (err.message.includes('applicationServerKey') || err.code === 'messaging/invalid-vapid-key') {
          throw new Error("Invalid VAPID Key. Please configure NEXT_PUBLIC_FIREBASE_VAPID_KEY in your environment with the key from Firebase Console > Cloud Messaging.");
        }
        throw err;
      });

      if (!token) throw new Error("Could not manifest an identity token for this device.");

      const functions = getFunctions(app);
      const subscribeFunc = httpsCallable(functions, 'subscribeAdminToOrders');
      await subscribeFunc({ token });

      toast({
        title: "Device Bound",
        description: "This device is Authoritatively subscribed to High-Priority Alarms."
      });
    } catch (error: any) {
      console.error("[ALARM] Device registration failure:", error);
      toast({
        variant: "destructive",
        title: "Protocol Failure",
        description: error.message || "Failed to bind device to the alarm protocol."
      });
    } finally {
      setIsRegisteringDevice(false);
    }
  };

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
      });
  };

  const handleSaveGlobal = () => {
    if (!configRef) return;
    setIsSaving(true);
    const payload = { 
      global: { logoUrl, accentColor, footer: footerContent, attachInvoice },
      orderAlarmEnabled,
      orderAlarmUrl,
      updatedAt: new Date().toISOString() 
    };

    setDoc(configRef, payload, { merge: true })
      .then(() => toast({ title: "Branding Finalized", description: "Global notification settings are live." }))
      .finally(() => setIsSaving(false));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  const activeNotification = editingKey 
    ? (isMarketingEdit ? (config?.[editingKey] || DEFAULT_MARKETING[editingKey]) : (config?.[editingKey] || DEFAULT_NOTIFICATIONS[editingKey])) 
    : null;

  const isAdminUser = user?.email === 'fslno.dev@gmail.com' || user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';

  return (
    <div className="space-y-8 sm:space-y-12 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Notifications & Automation</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Manage automated emails, high-priority alarms, and branding.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {isAdminUser && (
            <Button 
              className="flex-1 sm:flex-none h-10 gap-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl"
              onClick={handleRegisterDevice}
              disabled={isRegisteringDevice}
            >
              {isRegisteringDevice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              Bind Device to Alarms
            </Button>
          )}
          <Button variant="outline" className="flex-1 sm:flex-none h-10 gap-2 font-bold uppercase tracking-widest text-[10px] border-black" onClick={() => setIsSendingTest(true)}>
            <Send className="h-4 w-4" /> Send Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-12">
          
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">High-Priority Order Alarms</h2>
            </div>
            
            <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden border-l-4 border-l-red-600">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-red-50/10 p-4 sm:p-6">
                <div className="space-y-1">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-red-600 flex items-center gap-2">
                    <Music className="h-3.5 w-3.5" /> PWA Order Alarm Protocol
                  </CardTitle>
                  <CardDescription className="text-[9px] uppercase font-bold text-zinc-500 mt-1">High-priority FCM triggers for instant acoustic awareness.</CardDescription>
                </div>
                <Switch checked={orderAlarmEnabled} onCheckedChange={setOrderAlarmEnabled} className="data-[state=checked]:bg-red-600" />
              </CardHeader>
              <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Ringtone Identity</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="PASTE SONIC URL" 
                          value={orderAlarmUrl} 
                          onChange={(e) => setOrderAlarmUrl(e.target.value)}
                          className="h-12 text-[10px] font-mono pr-10 uppercase"
                        />
                        <Music className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                      </div>
                      <Button variant="outline" size="icon" className="h-12 w-12 border-black rounded-none" onClick={() => testAudioRef.current?.play()}>
                        <PlayCircle className="h-5 w-5" />
                      </Button>
                    </div>
                    <audio ref={testAudioRef} src={orderAlarmUrl} preload="none" />
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border rounded-none">
                      <p className="text-[9px] font-bold text-red-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-3 w-3" /> System Integrity Note
                      </p>
                      <p className="text-[10px] text-gray-600 leading-relaxed uppercase font-medium">
                        Order alarms bypass deep sleep on Android and manifest as high-priority heads-up notifications. Ensure "Require Interaction" is enabled in browser settings for maximum persistence.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Email Touchpoints</h2>
            </div>
            <div className="bg-white border rounded-none overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6">Touchpoint</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(DEFAULT_NOTIFICATIONS).map((key) => {
                    const data = config?.[key] || DEFAULT_NOTIFICATIONS[key];
                    return (
                      <TableRow key={key} className="hover:bg-gray-50/30 transition-colors">
                        <TableCell className="p-6">
                          <div className="space-y-1">
                            <span className="font-bold text-sm tracking-tight uppercase">{data.label}</span>
                            <p className="text-[10px] text-gray-500 font-medium">{data.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch checked={data.enabled} onCheckedChange={(checked) => handleToggle(key, checked, false)} />
                        </TableCell>
                        <TableCell className="pr-6">
                          <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-[10px]" onClick={() => handleEdit(key, false)}>Refine</Button>
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
                <Terminal className="h-3.5 w-3.5 text-blue-400" /> System Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 font-mono text-[10px]">
                <p><span className="text-zinc-500">{"{{customer_name}}"}</span> - Recipient</p>
                <p><span className="text-zinc-500">{"{{order_id}}"}</span> - Transaction ID</p>
                <p><span className="text-zinc-500">{"{{order_total}}"}</span> - Financial Value</p>
                <p><span className="text-zinc-500">{"{{product_list}}"}</span> - Itemized Manifest</p>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300" 
            onClick={handleSaveGlobal} 
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Settings
          </Button>
        </div>
      </div>

      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="max-w-[100vw] w-screen h-screen sm:max-w-2xl sm:h-auto m-0 rounded-none bg-white border-none p-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
            <DialogHeader className="p-0 border-none">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Refining Template</DialogTitle>
              </div>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Subject Identity</Label>
                <Input value={editSubject} onChange={(e) => setEditingSubject(e.target.value)} className="h-12 font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Copy Content</Label>
                <Textarea value={editBody} onChange={(e) => setEditingBody(e.target.value)} className="min-h-[300px] text-sm leading-relaxed p-6 bg-gray-50 resize-none font-medium" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 sm:p-10 border-t bg-gray-50/50">
            <Button className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]" onClick={saveNotificationEdit}>Finalize Protocol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
