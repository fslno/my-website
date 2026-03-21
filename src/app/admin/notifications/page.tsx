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
  UserCheck
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useFirebaseApp, useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, setDoc, collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
    description: "Sent after purchase. Confirms order and studio prep.",
    enabled: true,
    subject: "Order Confirmed: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour archive order #{{order_id}} is confirmed. Our studio is preparing your pieces.\n\nYOUR SELECTION:\n{{product_list}}\n\nTotal: {{order_total}}\n\nSTUDIO:\n{{business_address}}\n{{business_phone}}\n\nWe will notify you when items ship."
  },
  statusChanged: {
    label: "Status Update",
    description: "Sent when order status changes.",
    enabled: true,
    subject: "Update: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} status updated to: {{status}}.\n\nRegards,\n{{business_name}} Team"
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
    description: "Sent to notify customers that their items are waiting at your physical location.",
    enabled: false,
    subject: "Ready for Pickup: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} is ready for pickup.\n\nADDRESS:\n{{business_address}}\n\nHOURS:\nMon-Fri: 10AM - 6PM\n\nBring order ID for validation."
  },
  delivered: {
    label: "Order Delivered",
    description: "Sent after delivery confirmation.",
    enabled: true,
    subject: "Delivered: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nOrder #{{order_id}} was delivered. We hope you enjoy the pieces.\n\nReply to this email with feedback.\n\nBest,\n{{business_name}}"
  },
  refunded: {
    label: "Order Refunded",
    description: "Sent after refund processing.",
    enabled: true,
    subject: "Refund: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nRefund processed for order #{{order_id}}. Funds will return to your payment method within 3-5 days.\n\nContact support at {{business_phone}} with questions."
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

  const staffQuery = useMemoFirebase(() => db ? collection(db, 'staff') : null, [db]);
  const { data: staffMembers } = useCollection(staffQuery);

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
  const [senderEmail, setSenderEmail] = useState('');

  const [orderAlarmEnabled, setOrderAlarmEnabled] = useState(true);
  const [orderAlarmUrl, setOrderAlarmUrl] = useState('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  useEffect(() => {
    if (config?.global) {
      setLogoUrl(config.global.logoUrl || '');
      setAccentColor(config.global.accentColor || '#000000');
      setFooterContent(config.global.footer || '');
      setAttachInvoice(config.global.attachInvoice ?? true);
      setSenderEmail(config.global.senderEmail || '');
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
      if (!messaging) throw new Error("Push not supported.");

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
      
      const token = await getToken(messaging, { vapidKey }).catch(err => {
        if (err.message?.includes('applicationServerKey') || err.code === 'messaging/invalid-vapid-key') {
          throw new Error("Invalid VAPID key.");
        }
        throw err;
      });

      if (!token) throw new Error("Could not get token.");

      const functions = getFunctions(app);
      const subscribeFunc = httpsCallable(functions, 'subscribeAdminToOrders');
      
      try {
        const result: any = await subscribeFunc({ token });
        if (result.data?.success) {
          toast({
            title: "Device registered",
            description: "Alarms active on this device."
          });
        }
      } catch (funcError: any) {
        toast({
          variant: "destructive",
          title: "Sync error",
          description: funcError.message || "Failed to subscribe."
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Failed to register device."
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
        toast({
          title: "Test sent",
          description: "Check device for notification."
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: error.message
      });
    }
  };

  const handleSendTestEmail = async () => {
    if (!db || !user?.email) return;
    const testOrder = {
      to: user.email,
      from: senderEmail || 'studio@fslno.ca',
      message: {
        subject: "[TEST] FSLNO Confirmation",
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h1 style="text-transform: uppercase;">Diagnostic Test</h1>
          <p>This is a test email sent from the <strong>${senderEmail || 'default'}</strong> identity.</p>
        </div>`
      },
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'mail'), testOrder);
      toast({
        title: "Email sent",
        description: `Sent to ${user.email} from ${senderEmail || 'default'}.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to queue email."
      });
    }
  };

  const handleToggle = (key: string, enabled: boolean) => {
    if (!configRef) return;
    const base = config?.[key] || DEFAULT_NOTIFICATIONS[key];
    const updates = { [key]: { ...base, enabled } };
    setDoc(configRef, updates, { merge: true }).catch(() => {
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
    setIsMarketingEdit(false);
    setEditingSubject(data.subject);
    setEditingBody(data.body);
  };

  const saveNotificationEdit = () => {
    if (!configRef || !editingKey) return;
    const base = config?.[editingKey] || DEFAULT_NOTIFICATIONS[editingKey];
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
        toast({ title: "Template saved", description: "Email content updated." });
      });
  };

  const handleSaveGlobal = () => {
    if (!configRef) return;
    setIsSaving(true);
    const payload = { 
      global: { logoUrl, accentColor, footer: footerContent, attachInvoice, senderEmail },
      orderAlarmEnabled,
      orderAlarmUrl,
      updatedAt: serverTimestamp()
    };

    setDoc(configRef, payload, { merge: true })
      .then(() => toast({ title: "Settings saved", description: "Global configs updated." }))
      .finally(() => setIsSaving(false));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  const activeNotification = editingKey 
    ? (config?.[editingKey] || DEFAULT_NOTIFICATIONS[editingKey]) 
    : null;

  const isAdminUser = user?.email === 'fslno.dev@gmail.com' || user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';

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
                <Button 
                  onClick={handleSendTestNotification}
                  className="h-14 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-[10px] gap-3"
                >
                  <ShieldAlert className="h-4 w-4" /> Test Alarm (FCM)
                </Button>
                <Button 
                  onClick={handleSendTestEmail}
                  variant="outline"
                  className="h-14 border-black font-bold uppercase tracking-widest text-[10px] gap-3"
                >
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-12">
          
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Order Alarms</h2>
            </div>
            
            <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden border-l-4 border-l-red-600">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-red-50/10 p-4 sm:p-6">
                <div className="space-y-1">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-red-600 flex items-center gap-2">
                    <Music className="h-3.5 w-3.5" /> Alarm Protocol
                  </CardTitle>
                  <CardDescription className="text-[9px] uppercase font-bold text-zinc-500 mt-1">FCM triggers for acoustic awareness.</CardDescription>
                </div>
                <Switch checked={orderAlarmEnabled} onCheckedChange={setOrderAlarmEnabled} className="data-[state=checked]:bg-red-600" />
              </CardHeader>
              <CardContent className="pt-6 p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Alarm Sound URL</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="PASTE URL" 
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
                        <ShieldAlert className="h-3 w-3" /> System Note
                      </p>
                      <p className="text-[10px] text-gray-600 leading-relaxed uppercase font-medium">
                        Ensure browser interaction is allowed for persistent audio alerts.
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
              <h2 className="text-sm font-bold uppercase tracking-widest">Emails</h2>
            </div>

            <Card className="border-[#e1e3e5] shadow-none bg-blue-50/10 border-blue-100 rounded-none">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-blue-600">Transactional Identity</CardTitle>
                </div>
                <CardDescription className="text-[9px] uppercase font-bold text-blue-800/60">Select the registered staff email for all transactional dispatches.</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={senderEmail} onValueChange={setSenderEmail}>
                  <SelectTrigger className="h-12 bg-white border-blue-200 uppercase font-bold text-[10px]">
                    <SelectValue placeholder="SELECT SENDER EMAIL" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers?.map((staff: any) => (
                      <SelectItem key={staff.id} value={staff.email} className="font-bold uppercase text-[10px]">
                        {staff.fullName} ({staff.email})
                      </SelectItem>
                    ))}
                    {(!staffMembers || staffMembers.length === 0) && (
                      <SelectItem value="none" disabled>No staff registered</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="bg-white border rounded-none overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6 text-gray-500">Touchpoint</TableHead>
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
                          <Switch checked={data.enabled} onCheckedChange={(checked) => handleToggle(key, checked)} />
                        </TableCell>
                        <TableCell className="pr-6">
                          <Button variant="ghost" size="sm" className="font-bold uppercase tracking-widest text-[10px]" onClick={() => handleEdit(key)}>Edit</Button>
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
                <Terminal className="h-3.5 w-3.5 text-blue-400" /> Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 font-mono text-[10px]">
                <p><span className="text-zinc-500">{"{{customer_name}}"}</span> - Recipient</p>
                <p><span className="text-zinc-500">{"{{order_id}}"}</span> - Order ID</p>
                <p><span className="text-zinc-500">{"{{order_total}}"}</span> - Value</p>
                <p><span className="text-zinc-500">{"{{product_list}}"}</span> - Items</p>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300" 
            onClick={handleSaveGlobal} 
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All
          </Button>
        </div>
      </div>

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
                <Input value={editSubject} onChange={(e) => setEditingSubject(e.target.value)} className="h-12 font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Body</Label>
                <Textarea value={editBody} onChange={(e) => setEditingBody(e.target.value)} className="min-h-[300px] text-sm leading-relaxed p-6 bg-gray-50 resize-none font-medium" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 sm:p-10 border-t bg-gray-50/50">
            <Button className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]" onClick={saveNotificationEdit}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
