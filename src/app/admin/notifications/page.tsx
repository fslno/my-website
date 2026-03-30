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
  Smartphone,
  AlertCircle,
  User
} from 'lucide-react';
import {
  useSearchParams
} from 'next/navigation';
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
import { useFirebaseApp, useFirestore, useDoc, useMemoFirebase, useUser, useCollection, useStorage, useIsAdmin } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    description: "Sent after purchase. Confirms order and begins prep.",
    enabled: true,
    subject: "Order Confirmed: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} from Feiselino (FSLNO) Sport Jerseys is confirmed. We're getting your items ready.\n\nYOUR SELECTION:\n{{product_list}}\n\nPayment Method: {{payment_method}}\nTotal: {{order_total}}\n\nSTUDIO:\n{{business_address}}\n{{business_phone}}\n\nWe'll let you know when it ships!"
  },
  statusChanged: {
    label: "Status Update",
    description: "Sent when order status changes (e.g. Processing, Packed).",
    enabled: true,
    subject: "Update: Order #{{order_id}} is {{status}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} has been updated.\n\nNEW STATUS: {{status}}\n\nRegards,\nFeiselino (FSLNO) Sport Jerseys"
  },
  shipped: {
    label: "Order Shipped",
    description: "Sent when tracking is assigned.",
    enabled: true,
    subject: "Shipped: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order has shipped.\n\nCARRIER: {{courier}}\nTRACKING: {{tracking_number}}\n\nTrack here: https://fslno.ca/track/{{tracking_number}}\n\nThanks for shopping."
  },
  readyForPickup: {
    label: "Ready for Pickup",
    description: "Sent when items are ready at store.",
    enabled: false,
    subject: "Ready for Pickup: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} is ready for pickup.\n\nADDRESS:\n{{business_address}}\n\nHOURS:\nMon-Fri: 10AM - 6PM\n\nBring order ID for validation."
  },
  refunded: {
    label: "Order Refunded",
    description: "Sent after refund processing.",
    enabled: true,
    subject: "Refund: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nRefund processed for order #{{order_id}}. Funds will return to your payment method within 3-5 days.\n\nContact support at {{business_phone}} with questions."
  },
  invoice: {
    label: "Invoice Delivery",
    description: "Sent when an invoice is manually triggered from Invoice Maker.",
    enabled: true,
    subject: "{{invoice_number}} - Your Invoice from Feiselino (FSLNO) Sport Jerseys",
    body: "Hi {{customer_name}},\n\nPlease find your invoice {{invoice_number}} for {{order_total}} below.\n\nItems:\n{{product_list}}\n\nPayment Method: {{payment_method}}\nTotal: {{order_total}}\n\nRegards,\nFeiselino (FSLNO) Sport Jerseys"
  }
};

const DEFAULT_MARKETING: Record<string, NotificationConfig> = {
  newsletterWelcome: {
    label: "Welcome Email",
    description: "Sent immediately after someone joins the group.",
    enabled: true,
    subject: "Welcome to Feiselino (FSLNO) Sport Jerseys",
    body: "Hi {{customer_name}},\n\nYou've joined Feiselino (FSLNO) Sport Jerseys. You'll be the first to see new arrivals and exclusive drops.\n\nRegards,\nFeiselino (FSLNO) Sport Jerseys"
  },
  cartRecovery: {
    label: "Abandoned Cart",
    description: "Reminds shoppers about unfinished orders.",
    enabled: true,
    subject: "Incomplete order at {{business_name}}",
    body: "Hi {{customer_name}},\n\nYou left items in your cart. Resume checkout now to secure these pieces.\n\nCHECKOUT:\nhttps://fslno.ca/checkout\n\nYour cart:\n{{product_list}}"
  },
  browseRecovery: {
    label: "Browse Abandonment",
    description: "Sent to users who viewed products but didn't buy.",
    enabled: true,
    subject: "Still thinking about these?",
    body: "Hi {{customer_name}},\n\nWe noticed you were checking out some items. They're still available if you're interested!"
  },
  winback: {
    label: "Win-back Campaign",
    description: "Sent to customers who haven't ordered in 60 days.",
    enabled: true,
    subject: "We miss you at {{business_name}}",
    body: "Hi {{customer_name}},\n\nIt's been a while! Use code MISSYOU10 for 10% off your next order."
  },
  loyaltyAppreciation: {
    label: "Loyalty Reward",
    description: "Sent to repeat customers as a thank you.",
    enabled: true,
    subject: "A special thank you from {{business_name}}",
    body: "Hi {{customer_name}},\n\nThank you for being a loyal customer! Here's a special reward just for you."
  },
  feedbackRequest: {
    label: "Feedback Request",
    description: "Requests reviews after delivery.",
    enabled: true,
    subject: "Review your {{business_name}} order",
    body: "Hi {{customer_name}},\n\nHow is the fit? Share your thoughts on order #{{order_id}}.\n\n[LEAVE A REVIEW]\n\nYour feedback helps us improve."
  },
  promotion: {
    label: "Promotion / Discount",
    description: "Manual promotional transmission.",
    enabled: true,
    subject: "Exclusive Archive Access: {{promo_code}}",
    body: "Hi {{customer_name}},\n\nWe're offering exclusive access to our latest archival pieces. Use code {{promo_code}} for {{discount_percent}}% off.\n\nSHOP NOW:\nhttps://fslno.ca/shop\n\nRegards,\n{{business_name}} Studio"
  }
};

export default function NotificationsPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
      <NotificationsContent />
    </React.Suspense>
  );
}

function NotificationsContent() {
  const app = useFirebaseApp();
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const isAdminUser = useIsAdmin();
  const { toast } = useToast();
  const ringtoneInputRef = useRef<HTMLInputElement>(null);
  const testAudioRef = useRef<HTMLAudioElement>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'notifications') : null, [db]);
  const staffQuery = useMemoFirebase(() => db ? collection(db, 'staff') : null, [db]);
  const { data: config, isLoading: loading } = useDoc(configRef);
  const { data: staffMembers } = useCollection(staffQuery);

  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isRegisteringDevice, setIsRegisteringDevice] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isMarketingEdit, setIsMarketingEdit] = useState(false);

  const [editSubject, setEditingSubject] = useState('');
  const [editBody, setEditingBody] = useState('');

  const [logoUrl, setLogoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#000000');
  const [footerContent, setFooterContent] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [attachInvoice, setAttachInvoice] = useState(true);

  const [orderAlarmEnabled, setOrderAlarmEnabled] = useState(true);
  const [orderAlarmUrl, setOrderAlarmUrl] = useState('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  const [reviewAlarmEnabled, setReviewAlarmEnabled] = useState(true);
  const [reviewAlarmUrl, setReviewAlarmUrl] = useState('https://assets.mixkit.co/active_storage/sfx/2210/2210-preview.mp3');

  const ringtoneReviewInputRef = useRef<HTMLInputElement>(null);
  const testReviewAudioRef = useRef<HTMLAudioElement>(null);

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');

  useEffect(() => {
    if (config?.global) {
      setLogoUrl(config.global.logoUrl || '');
      setAccentColor(config.global.accentColor || '#000000');
      setFooterContent(config.global.footer || '');
      setBusinessPhone(config.global.business_phone || '');
      setBusinessEmail(config.global.business_email || '');
      setAttachInvoice(config.global.attachInvoice ?? true);
    }
    if (config) {
      setOrderAlarmEnabled(config.orderAlarmEnabled ?? true);
      setOrderAlarmUrl(config.orderAlarmUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      setReviewAlarmEnabled(config.reviewAlarmEnabled ?? true);
      setReviewAlarmUrl(config.reviewAlarmUrl || 'https://assets.mixkit.co/active_storage/sfx/2210/2210-preview.mp3');
      setSenderEmail(config.senderEmail || 'goal@feiselinosportjerseys.ca');
      setSenderName(config.senderName || 'FSLNO Store');
    }
  }, [config]);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !configRef) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an audio file (MP3, WAV, M4A, etc.)"
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const storageRef = ref(storage, `config/order_alarm_${Date.now()}.${fileExt}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setOrderAlarmUrl(downloadURL);
      await setDoc(configRef, { orderAlarmUrl: downloadURL }, { merge: true });
      toast({ title: "Alarm updated", description: "New sound uploaded successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRegisterDevice = async () => {
    if (!app || isRegisteringDevice) return;
    setIsRegisteringDevice(true);
    try {
      const messaging = await getMessagingInstance(app);
      if (!messaging) throw new Error("Push not supported.");
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
      const token = await getToken(messaging, { vapidKey }).catch(err => {
        if (err.message?.includes('applicationServerKey') || err.code === 'messaging/invalid-vapid-key') {
          throw new Error("Invalid VAPID key.");
        }
        if (err.code === 'messaging/permission-blocked') {
          throw new Error("Notification permission denied. Follow the Mobile Setup Guide below.");
        }
        throw err;
      });
      if (!token) throw new Error("Could not get token.");
      const functions = getFunctions(app);
      const subscribeFunc = httpsCallable(functions, 'subscribeAdminToOrders');
      const result: any = await subscribeFunc({ token });
      if (result.data?.success) {
        toast({ title: "Device registered", description: "Alarms active on this device." });
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Registration failed", 
        description: error.message,
        action: (
          <Button variant="outline" size="sm" className="bg-white text-black border-none hover:bg-gray-100 font-bold uppercase text-[9px]" onClick={() => {
            setActiveTab('alarms');
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}>
            View Guide
          </Button>
        )
      });
    } finally {
      setIsRegisteringDevice(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!app) return;
    const functions = getFunctions(app);
    const sendTest = httpsCallable(functions, 'sendTestNotification');
    try {
      const result: any = await sendTest();
      if (result.data?.success) {
        toast({ title: "Test sent", description: "Check device for notification." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to send", description: error.message });
    }
  };

  const handleTestUIAlarm = () => {
    // Play test audio
    if (testAudioRef.current) {
      testAudioRef.current.currentTime = 0;
      testAudioRef.current.play().catch(e => console.warn("Audio test failed", e));
    }

    // Trigger toast
    toast({ 
      variant: "destructive",
      title: "🚨 TEST ORDER ALARM", 
      description: "This is a diagnostic alert. If you hear sound and see this at the top, your setup is correct.", 
      duration: 10000 
    });

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("FSLNO Alarm Test", {
        body: "Diagnostic alarm triggered successfully.",
        icon: "/logo.png"
      });
    }
  };

  const handleSendTestEmail = async () => {
    if (!db || !user?.email) return;
    const fromField = senderEmail ? `${senderName || 'FSLNO'} <${senderEmail}>` : undefined;
    const testOrder = {
      to: user.email,
      ...(fromField ? { from: fromField, replyTo: senderEmail } : {}),
      message: {
        subject: "[TEST] FSLNO Confirmation",
        html: `<p>Diagnostic email from FSLNO.</p><p>Sender: ${fromField || 'default'}</p>`
      },
      createdAt: serverTimestamp()
    };
    try {
      await addDoc(collection(db, 'mail'), testOrder);
      toast({ title: "Email sent", description: `Sent to ${user.email}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to queue email." });
    }
  };

  const handleToggle = (key: string, enabled: boolean, isMarketing = false) => {
    if (!configRef) return;
    const base = isMarketing ? (config?.[key] || DEFAULT_MARKETING[key]) : (config?.[key] || DEFAULT_NOTIFICATIONS[key]);
    const updates = { [key]: { ...base, enabled } };
    setDoc(configRef, updates, { merge: true }).catch(err => console.error(err));
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
    const updates = { [editingKey]: { ...base, subject: editSubject, body: editBody } };
    setDoc(configRef, updates, { merge: true }).then(() => {
      setEditingKey(null);
      toast({ title: "Template saved", description: "Email content updated." });
    });
  };

  const handleSaveGlobal = () => {
    if (!configRef) return;
    setIsSaving(true);
    const payload = {
      global: { 
        logoUrl, 
        accentColor, 
        footer: footerContent, 
        business_phone: businessPhone,
        business_email: businessEmail,
        attachInvoice 
      },
      orderAlarmEnabled,
      orderAlarmUrl,
      senderEmail,
      senderName,
      updatedAt: serverTimestamp()
    };
    setDoc(configRef, payload, { merge: true })
      .then(() => toast({ title: "Settings saved", description: "Global configs updated." }))
      .finally(() => setIsSaving(false));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-8 sm:space-y-12 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Notifications</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Manage emails, alarms, and branding.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {isAdminUser && (
            <Button
              className="flex-1 sm:flex-none h-10 gap-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl"
              onClick={handleRegisterDevice}
              disabled={isRegisteringDevice}
            >
              {isRegisteringDevice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              Enable Alarms
            </Button>
          )}
          <Dialog open={isSendingTest} onOpenChange={setIsSendingTest}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none h-10 gap-2 font-bold uppercase tracking-widest text-[10px] border-black">
                <Send className="h-4 w-4" /> Send Test
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border-none rounded-none shadow-2xl">
              <DialogHeader className="pt-6">
                <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Test Diagnostics</DialogTitle>
                <DialogDescription className="text-xs uppercase font-bold text-muted-foreground mt-1">Select channel to verify.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-8">
                <Button onClick={handleSendTestNotification} className="h-14 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-[10px] gap-3">
                  <ShieldAlert className="h-4 w-4" /> Test Alarm (FCM)
                </Button>
                <Button onClick={handleTestUIAlarm} className="h-14 bg-zinc-900 hover:bg-black text-white font-bold uppercase tracking-widest text-[10px] gap-3">
                  <Volume2 className="h-4 w-4" /> Test UI Alarm (Sound + Toast)
                </Button>
                <Button onClick={handleSendTestEmail} variant="outline" className="h-14 border-black font-bold uppercase tracking-widest text-[10px] gap-3">
                  <Mail className="h-4 w-4" /> Test Email (Template)
                </Button>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSendingTest(false)} className="w-full text-[10px] font-bold uppercase tracking-widest">Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-14 p-0 mb-8 overflow-x-auto scrollbar-hide">
          <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-14 px-4 sm:px-8 font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">Order Emails</TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-14 px-4 sm:px-8 font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">Marketing</TabsTrigger>
          <TabsTrigger value="sender" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-14 px-4 sm:px-8 font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">Sender Details</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-14 px-4 sm:px-8 font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">Branding</TabsTrigger>
          <TabsTrigger value="alarms" className="rounded-none border-b-2 border-transparent data:[state=active]:border-black data-[state=active]:bg-transparent h-14 px-4 sm:px-8 font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">Alarms</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Post-Purchase Flow</h2>
                </div>
                <div className="bg-white border rounded-none overflow-hidden shadow-sm">
                  {/* Desktop Table View */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6 text-gray-500">Email Type</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.keys(DEFAULT_NOTIFICATIONS).map((key) => {
                          const data = config?.[key] || DEFAULT_NOTIFICATIONS[key];
                          return (
                            <TableRow key={key} className="hover:bg-gray-50/30 transition-colors border-black/5">
                              <TableCell className="p-6">
                                <div className="space-y-1">
                                  <span className="font-bold text-sm tracking-tight uppercase">{data.label}</span>
                                  <p className="text-[10px] text-gray-500 font-medium uppercase">{data.description}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Switch checked={data.enabled} onCheckedChange={(checked) => handleToggle(key, checked, false)} />
                              </TableCell>
                              <TableCell className="pr-6 text-right">
                                <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-[10px]" onClick={() => handleEdit(key, false)}>Edit</Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile List View */}
                  <div className="block sm:hidden divide-y">
                    {Object.keys(DEFAULT_NOTIFICATIONS).map((key) => {
                      const data = config?.[key] || DEFAULT_NOTIFICATIONS[key];
                      return (
                        <div key={key} className="p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="font-bold text-xs tracking-tight uppercase">{data.label}</span>
                              <p className="text-[9px] text-gray-500 font-medium uppercase">{data.description}</p>
                            </div>
                            <Switch checked={data.enabled} onCheckedChange={(checked) => handleToggle(key, checked, false)} />
                          </div>
                          <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px] h-9 border-black" onClick={() => handleEdit(key, false)}>Edit Template</Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
            <div className="xl:col-span-4">
              <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-blue-400" /> Template Legend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4 font-mono text-[10px]">
                    <p><span className="text-zinc-500">{"{{customer_name}}"}</span> - Recipient</p>
                    <p><span className="text-zinc-500">{"{{order_id}}"}</span> - Order ID</p>
                    <p><span className="text-zinc-500">{"{{order_total}}"}</span> - Value</p>
                    <p><span className="text-zinc-500">{"{{product_list}}"}</span> - Items</p>
                    <p><span className="text-zinc-500">{"{{business_name}}"}</span> - Store Title</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="mt-0">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Growth & Retention Campaigns</h2>
                </div>
                <div className="bg-white border rounded-none overflow-hidden shadow-sm">
                  {/* Desktop Table View */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6 text-gray-500">Campaign</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.keys(DEFAULT_MARKETING).map((key) => {
                          const data = config?.[key] || DEFAULT_MARKETING[key];
                          return (
                            <TableRow key={key} className="hover:bg-gray-50/30 transition-colors border-black/5">
                              <TableCell className="p-6">
                                <div className="space-y-1">
                                  <span className="font-bold text-sm tracking-tight uppercase">{data.label}</span>
                                  <p className="text-[10px] text-gray-500 font-medium uppercase">{data.description}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Switch checked={data.enabled} onCheckedChange={(checked) => handleToggle(key, checked, true)} />
                              </TableCell>
                              <TableCell className="pr-6 text-right">
                                <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-[10px]" onClick={() => handleEdit(key, true)}>Edit</Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile List View */}
                  <div className="block sm:hidden divide-y">
                    {Object.keys(DEFAULT_MARKETING).map((key) => {
                      const data = config?.[key] || DEFAULT_MARKETING[key];
                      return (
                        <div key={key} className="p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="font-bold text-xs tracking-tight uppercase">{data.label}</span>
                              <p className="text-[9px] text-gray-500 font-medium uppercase">{data.description}</p>
                            </div>
                            <Switch checked={data.enabled} onCheckedChange={(checked) => handleToggle(key, checked, true)} />
                          </div>
                          <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px] h-9 border-black" onClick={() => handleEdit(key, true)}>Edit Template</Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sender" className="mt-0">
          <div className="max-w-2xl">
            <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-black flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Primary Sender</CardTitle>
                    <CardDescription className="text-[9px] uppercase font-bold tracking-tight mt-1">Authorized communication handle.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Select Staff Member</Label>
                  <Select
                    value={senderEmail}
                    onValueChange={(val) => {
                      setSenderEmail(val);
                      const member = staffMembers?.find((m: any) => m.email === val);
                      setSenderName(member?.fullName || val.split('@')[0]);
                    }}
                  >
                    <SelectTrigger className="h-12 text-[10px] font-bold uppercase rounded-none border-black">
                      <SelectValue placeholder="Authorized Sender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-black shadow-2xl">
                      {staffMembers?.filter((m: any) => m.email && m.status !== 'Inactive').map((m: any) => (
                        <SelectItem key={m.id} value={m.email} className="text-[10px] font-bold uppercase p-3">
                          {m.fullName} — {m.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-zinc-900 text-white font-mono text-[10px] border border-black space-y-2">
                  <div className="flex justify-between text-zinc-500 uppercase">
                    <span>Branding Identity</span>
                    <span>Verified</span>
                  </div>
                  <div className="text-[11px] font-bold">
                    "{senderName}" &lt;{senderEmail}&gt;
                  </div>
                </div>
                <Button onClick={handleSaveGlobal} disabled={isSaving} className="w-full bg-black text-white h-12 uppercase tracking-widest text-[10px] font-bold shadow-xl">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Update Sender
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="mt-0">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b p-6">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5" /> Email Design
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Brand Logo URL</Label>
                      <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://" className="h-12 rounded-none border-black font-mono text-[10px]" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Accent Identity</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-12 p-1 rounded-none border-black cursor-pointer" />
                        <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-12 flex-1 rounded-none border-black font-mono text-[10px]" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Business Phone</Label>
                      <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="+1 (XXX) XXX-XXXX" className="h-12 rounded-none border-black font-mono text-[10px]" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Business Email</Label>
                      <Input value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="hello@yourstore.ca" className="h-12 rounded-none border-black font-mono text-[10px]" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Email Footer Signature</Label>
                    <Textarea value={footerContent} onChange={(e) => setFooterContent(e.target.value)} placeholder="Studio details..." className="min-h-[100px] rounded-none border-black font-medium text-[11px]" />
                  </div>
                  <Button onClick={handleSaveGlobal} disabled={isSaving} className="bg-black text-white h-12 uppercase tracking-widest text-[10px] font-bold px-12 shadow-xl">
                    Apply Branding
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alarms" className="mt-0">
          <div className="max-w-3xl space-y-8">
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-5 w-5" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Notification Sounds</h2>
              </div>
              <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden border-l-4 border-l-border mb-8">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-zinc-50/10 p-6">
                  <div className="space-y-1">
                    <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-black">New Review Alerts</CardTitle>
                    <CardDescription className="text-[9px] uppercase font-bold text-zinc-500 mt-1">Acoustic feedback for customer reviews.</CardDescription>
                  </div>
                  <Switch checked={reviewAlarmEnabled} onCheckedChange={setReviewAlarmEnabled} className="data-[state=checked]:bg-black" />
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Tone Source</Label>
                      <div className="flex gap-2">
                        <Input value={reviewAlarmUrl} onChange={(e) => setReviewAlarmUrl(e.target.value)} className="h-12 text-[10px] font-mono border-black rounded-none" />
                        <input type="file" ref={ringtoneReviewInputRef} onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !storage || !configRef) return;
                          setIsUploading(true);
                          try {
                            const fileExt = file.name.split('.').pop();
                            const storageRef = ref(storage, `config/review_alarm_${Date.now()}.${fileExt}`);
                            const snapshot = await uploadBytes(storageRef, file);
                            const downloadURL = await getDownloadURL(snapshot.ref);
                            setReviewAlarmUrl(downloadURL);
                            await setDoc(configRef, { reviewAlarmUrl: downloadURL }, { merge: true });
                            toast({ title: "Alarm updated", description: "Review sound uploaded successfully." });
                          } catch (error: any) {
                            toast({ variant: "destructive", title: "Upload failed", description: error.message });
                          } finally {
                            setIsUploading(false);
                          }
                        }} accept="audio/*" className="hidden" />
                        <Button variant="outline" size="icon" className="h-12 w-12 border-black rounded-none" onClick={() => ringtoneReviewInputRef.current?.click()}>
                          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                        </Button>
                        <Button variant="outline" size="icon" className="h-12 w-12 border-black rounded-none" onClick={() => testReviewAudioRef.current?.play()}>
                          <PlayCircle className="h-5 w-5" />
                        </Button>
                      </div>
                      <audio ref={testReviewAudioRef} src={reviewAlarmUrl} preload="none" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden border-l-4 border-l-red-600">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-red-50/10 p-6">
                  <div className="space-y-1">
                    <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-red-600">Order Alerts</CardTitle>
                    <CardDescription className="text-[9px] uppercase font-bold text-zinc-500 mt-1">Real-time alerts for new orders.</CardDescription>
                  </div>
                  <Switch checked={orderAlarmEnabled} onCheckedChange={setOrderAlarmEnabled} className="data-[state=checked]:bg-red-600" />
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Tone Source</Label>
                      <div className="flex gap-2">
                        <Input value={orderAlarmUrl} onChange={(e) => setOrderAlarmUrl(e.target.value)} className="h-12 text-[10px] font-mono border-black rounded-none" />
                        <input type="file" ref={ringtoneInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />
                        <Button variant="outline" size="icon" className="h-12 w-12 border-black rounded-none" onClick={() => ringtoneInputRef.current?.click()}>
                          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                        </Button>
                        <Button variant="outline" size="icon" className="h-12 w-12 border-black rounded-none" onClick={() => testAudioRef.current?.play()}>
                          <PlayCircle className="h-5 w-5" />
                        </Button>
                      </div>
                      <audio ref={testAudioRef} src={orderAlarmUrl} preload="none" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/30 rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-600" /> Mobile Setup Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase text-blue-900 leading-relaxed">
                      To receive alarms reliably on mobile:
                    </p>
                    <ol className="list-decimal list-inside text-[10px] font-medium text-blue-800 space-y-2 uppercase">
                      <li>Use Safari (iOS) or Chrome (Android).</li>
                      <li>Tap <span className="font-bold">"Add to Home Screen"</span> in your browser menu.</li>
                      <li>Open the app from your Home Screen.</li>
                      <li>Tap the pulsing <span className="font-bold text-red-600">"ENABLE ALERTS"</span> button in the top bar.</li>
                      <li>Grant notification permissions when prompted.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="max-w-[100vw] w-screen h-screen sm:max-w-2xl sm:h-auto m-0 rounded-none bg-white border-none p-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
            <DialogHeader className="p-0 border-none">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Edit Template</DialogTitle>
              </div>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Subject</Label>
                <Input value={editSubject} onChange={(e) => setEditingSubject(e.target.value)} className="h-13 bg-gray-50 border-black font-bold uppercase text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Body</Label>
                <Textarea value={editBody} onChange={(e) => setEditingBody(e.target.value)} className="min-h-[400px] text-xs leading-relaxed p-6 bg-gray-50 border-black resize-none font-medium uppercase" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 sm:p-10 border-t bg-black">
            <Button className="w-full bg-white text-black h-14 font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-200" onClick={saveNotificationEdit}>Save Protocol Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
