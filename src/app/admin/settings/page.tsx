'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
  Building2, 
  MapPin, 
  Phone, 
  Upload, 
  Loader2, 
  Save, 
  Trash2,
  Image as ImageIcon,
  User,
  MessageSquareMore,
  Palette,
  Settings2,
  PlusCircle,
  X,
  Navigation,
  Sparkles,
  Zap,
  AlignLeft,
  AlignRight,
  Maximize2,
  Mail,
  Plus,
  Globe,
  Instagram,
  Twitter,
  MessageCircle,
  Facebook,
  MoreHorizontal
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ContactItem {
  label: string;
  value: string;
}

interface SocialItem {
  platform: string;
  url: string;
}

export default function SettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore References
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const staffQuery = useMemoFirebase(() => db ? collection(db, 'staff') : null, [db]);
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);

  const { data: storeConfig, loading: storeLoading } = useDoc(storeConfigRef);
  const { data: staffMembers, isLoading: staffLoading } = useCollection(staffQuery);
  const { data: themeData, loading: themeLoading } = useDoc(themeRef);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Store Form State
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Contact State
  const [phoneNumbers, setPhoneNumbers] = useState<ContactItem[]>([]);
  const [emailAddresses, setEmailAddresses] = useState<ContactItem[]>([]);
  const [socialChannels, setSocialChannels] = useState<SocialItem[]>([]);
  const [whatsAppNumber, setWhatsAppNumber] = useState('');

  // Staff Dialog State
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffTimezone, setStaffTimezone] = useState('(UTC-05:00) Eastern Time');
  const [staffStatus, setStaffStatus] = useState<'Active' | 'Inactive'>('Active');

  // Chatbot State
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotPosition, setChatbotPosition] = useState<'left' | 'right'>('right');
  const [chatbotColor, setChatbotColor] = useState('#000000');
  const [chatbotSize, setChatbotSize] = useState('60');
  const [chatbotEffect, setChatbotEffect] = useState('pulsate');

  // Initialize forms when data loads
  useEffect(() => {
    if (storeConfig) {
      setBusinessName(storeConfig.businessName || '');
      setAddress(storeConfig.address || '');
      setGoogleMapsUrl(storeConfig.googleMapsUrl || '');
      setPhone(storeConfig.phone || '');
      setLogoUrl(storeConfig.logoUrl || '');
      setPhoneNumbers(storeConfig.phoneNumbers || []);
      setEmailAddresses(storeConfig.emailAddresses || []);
      setSocialChannels(storeConfig.socialChannels || []);
      setWhatsAppNumber(storeConfig.whatsAppNumber || '');
    }
    if (themeData) {
      setChatbotEnabled(themeData.chatbotEnabled ?? true);
      setChatbotPosition(themeData.chatbotPosition || 'right');
      setChatbotColor(themeData.chatbotColor || '#000000');
      setChatbotSize(themeData.chatbotSize?.toString() || '60');
      setChatbotEffect(themeData.chatbotEffect || 'pulsate');
    }
  }, [storeConfig, themeData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStore = async () => {
    if (!storeConfigRef) return;
    setIsSaving(true);
    const updates = { 
      businessName, 
      address, 
      googleMapsUrl,
      phone, 
      logoUrl,
      phoneNumbers,
      emailAddresses,
      socialChannels,
      whatsAppNumber,
      updatedAt: new Date().toISOString() 
    };
    setDoc(storeConfigRef, updates, { merge: true })
      .then(() => toast({ title: "Store Settings Saved", description: "Business identity has been updated." }))
      .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: storeConfigRef.path, operation: 'write', requestResourceData: updates })))
      .finally(() => setIsSaving(false));
  };

  const handleSaveChatbot = async () => {
    if (!themeRef) return;
    setIsSaving(true);
    const updates = { 
      chatbotEnabled,
      chatbotPosition,
      chatbotColor,
      chatbotSize: Number(chatbotSize),
      chatbotEffect,
      updatedAt: new Date().toISOString() 
    };
    handleSaveStore();
    setDoc(themeRef, updates, { merge: true })
      .then(() => toast({ title: "Chat Settings Saved", description: "Support & Chat interface updated." }))
      .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: themeRef.path, operation: 'write', requestResourceData: updates })))
      .finally(() => setIsSaving(false));
  };

  const handleSaveStaff = async () => {
    if (!db || !staffName || !staffEmail) return;
    setIsSaving(true);
    
    const staffData = {
      fullName: staffName,
      email: staffEmail,
      phone: staffPhone,
      timezone: staffTimezone,
      status: staffStatus,
      updatedAt: serverTimestamp()
    };

    if (editingStaffId) {
      updateDoc(doc(db, 'staff', editingStaffId), staffData)
        .then(() => {
          setIsStaffDialogOpen(false);
          resetStaffForm();
          toast({ title: "Staff Member Updated", description: "Profile details synchronized." });
        })
        .finally(() => setIsSaving(false));
    } else {
      addDoc(collection(db, 'staff'), { ...staffData, createdAt: serverTimestamp() })
        .then(() => {
          setIsStaffDialogOpen(false);
          resetStaffForm();
          toast({ title: "Staff Member Added", description: "New identity registered in studio." });
        })
        .finally(() => setIsSaving(false));
    }
  };

  const deleteStaff = (id: string) => {
    if (!db || !confirm("Authoritatively decommission this staff access?")) return;
    deleteDoc(doc(db, 'staff', id)).then(() => {
      toast({ title: "Staff Removed", description: "Identity decommissioned." });
    });
  };

  const openStaffEdit = (staff: any) => {
    setStaffName(staff.fullName || '');
    setStaffEmail(staff.email || '');
    setStaffPhone(staff.phone || '');
    setStaffTimezone(staff.timezone || '(UTC-05:00) Eastern Time');
    setStaffStatus(staff.status || 'Active');
    setEditingStaffId(staff.id);
    setIsStaffDialogOpen(true);
  };

  const resetStaffForm = () => {
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffTimezone('(UTC-05:00) Eastern Time');
    setStaffStatus('Active');
    setEditingStaffId(null);
  };

  // Contact Array Helpers
  const addPhoneNumber = () => setPhoneNumbers([...phoneNumbers, { label: 'Voice', value: '' }]);
  const updatePhoneNumber = (idx: number, field: keyof ContactItem, val: string) => {
    const updated = [...phoneNumbers];
    updated[idx][field] = val;
    setPhoneNumbers(updated);
  };
  const removePhoneNumber = (idx: number) => setPhoneNumbers(phoneNumbers.filter((_, i) => i !== idx));

  const addEmailAddress = () => setEmailAddresses([...emailAddresses, { label: 'Dispatch', value: '' }]);
  const updateEmailAddress = (idx: number, field: keyof ContactItem, val: string) => {
    const updated = [...emailAddresses];
    updated[idx][field] = val;
    setEmailAddresses(updated);
  };
  const removeEmailAddress = (idx: number) => setEmailAddresses(emailAddresses.filter((_, i) => i !== idx));

  const addSocialChannel = () => setSocialChannels([...socialChannels, { platform: 'Instagram', url: '' }]);
  const updateSocialChannel = (idx: number, field: keyof SocialItem, val: string) => {
    const updated = [...socialChannels];
    (updated[idx] as any)[field] = val;
    setSocialChannels(updated);
  };
  const removeSocialChannel = (idx: number) => setSocialChannels(socialChannels.filter((_, i) => i !== idx));

  if (storeLoading || themeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Global Settings</h1>
        <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Configure your store's general information and operational identity.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-[#e1e3e5] h-auto flex-wrap p-1 mb-8 gap-2 rounded-none">
          <TabsTrigger value="store" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <Building2 className="h-3.5 w-3.5" /> Store Profile
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <User className="h-3.5 w-3.5" /> Staff Manifest
          </TabsTrigger>
          <TabsTrigger value="support" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <MessageSquareMore className="h-3.5 w-3.5" /> Support & Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-lg font-headline uppercase tracking-tight">Business Identity</CardTitle>
              </div>
              <CardDescription className="text-xs uppercase font-bold tracking-tight">These details appear on invoices, emails, and in your store footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="e.g. FSLNO Studio" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Primary Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Business Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                      <Textarea placeholder="123 Archive Way, London, UK" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10 min-h-[100px] resize-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Google Maps URL</Label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="https://maps.google.com/..." value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Store Visual (Logo)</Label>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <div 
                    onClick={() => !logoUrl && fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-gray-50 group hover:border-black transition-all min-h-[250px]",
                      !logoUrl && "cursor-pointer"
                    )}
                  >
                    {logoUrl ? (
                      <div className="relative w-full max-w-[250px] aspect-square rounded-lg overflow-hidden bg-white border shadow-sm">
                        <Image src={logoUrl} alt="Store Logo" fill className="object-contain p-4" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                          <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setLogoUrl(''); }}><Trash2 className="h-4 w-4" /></Button>
                          <Button variant="secondary" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}><Upload className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors"><ImageIcon className="h-6 w-6" /></div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Upload Visual Identity</p>
                          <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Recommended: PNG / SVG with transparency</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSaveStore} disabled={isSaving} className="w-full sm:w-auto bg-black text-white h-12 px-12 font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Commit Store Profile
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30 px-4 sm:px-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Staff Manifest</CardTitle>
                </div>
                <CardDescription className="text-[9px] uppercase font-bold tracking-tight hidden xs:block">Authoritative studio operators.</CardDescription>
              </div>
              <Dialog open={isStaffDialogOpen} onOpenChange={(open) => { setIsStaffDialogOpen(open); if (!open) resetStaffForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white h-9 px-4 font-bold uppercase tracking-widest text-[9px] gap-2">
                    <PlusCircle className="h-3.5 w-3.5" /> Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                  <DialogHeader className="pt-6">
                    <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Identity Provisioning</DialogTitle>
                    <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Register a new studio operator manifest.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Full Legal Name</Label>
                      <Input placeholder="e.g. Alexander McQueen" value={staffName} onChange={(e) => setStaffName(e.target.value)} className="h-12 uppercase font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Dispatch Email</Label>
                      <Input type="email" placeholder="staff@fslno.ca" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} className="h-12 lowercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-500">Voice Line</Label>
                        <Input placeholder="+1..." value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} className="h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-500">Status</Label>
                        <Select value={staffStatus} onValueChange={(v: any) => setStaffStatus(v)}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active" className="text-[10px] font-bold uppercase">Active</SelectItem>
                            <SelectItem value="Inactive" className="text-[10px] font-bold uppercase">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveStaff} disabled={isSaving || !staffName || !staffEmail} className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px]">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Commit Identity
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-[#e1e3e5]">
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest py-4 pl-6 text-gray-500">Operator Identity</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Dispatch Channels</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Temporal Zone</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-center text-gray-500">Status</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
                    ) : !staffMembers || staffMembers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-[10px] font-bold uppercase text-gray-400 tracking-widest">No staff identities cataloged.</TableCell></TableRow>
                    ) : (
                      staffMembers.map((staff) => (
                        <TableRow key={staff.id} className="hover:bg-gray-50/30 transition-all border-b last:border-0 group">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-[10px] border shadow-sm uppercase shrink-0">
                                {staff.fullName?.substring(0, 2)}
                              </div>
                              <span className="font-bold text-xs uppercase tracking-tight">{staff.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-primary lowercase">{staff.email}</span>
                              <span className="text-[9px] text-gray-400 font-mono">{staff.phone || 'NO-PHONE'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            {staff.timezone}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-[8px] font-bold uppercase tracking-widest border-none h-5", staff.status === 'Active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                              {staff.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black hover:text-white" onClick={() => openStaffEdit(staff)}>
                                <Settings2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => deleteStaff(staff.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y">
                {staffLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
                ) : !staffMembers || staffMembers.length === 0 ? (
                  <div className="py-12 text-center text-[10px] font-bold uppercase text-gray-400">No identities cataloged.</div>
                ) : (
                  staffMembers.map((staff) => (
                    <div key={staff.id} className="p-4 space-y-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center font-bold text-xs border shadow-sm uppercase shrink-0">
                            {staff.fullName?.substring(0, 2)}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm uppercase tracking-tight">{staff.fullName}</p>
                            <Badge variant="outline" className={cn("text-[7px] font-bold uppercase tracking-widest border-none h-4 px-1.5", staff.status === 'Active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                              {staff.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openStaffEdit(staff)}>
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteStaff(staff.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Dispatch</p>
                          <p className="text-[10px] font-bold lowercase truncate">{staff.email}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Temporal</p>
                          <p className="text-[10px] font-bold uppercase truncate">{staff.timezone.split(') ')[1] || staff.timezone}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-12 animate-in fade-in duration-300">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquareMore className="h-5 w-5 text-gray-400" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Dispatch Interface</CardTitle>
                </div>
                <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Floating high-fidelity support module.</CardDescription>
              </div>
              <Switch checked={chatbotEnabled} onCheckedChange={setChatbotEnabled} />
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Viewport Position</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setChatbotPosition('left')}
                        className={cn(
                          "h-11 border rounded-sm flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[9px] transition-all",
                          chatbotPosition === 'left' ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                        )}
                      >
                        <AlignLeft className="h-3.5 w-3.5" /> Left
                      </button>
                      <button 
                        onClick={() => setChatbotPosition('right')}
                        className={cn(
                          "h-11 border rounded-sm flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[9px] transition-all",
                          chatbotPosition === 'right' ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                        )}
                      >
                        <AlignRight className="h-3.5 w-3.5" /> Right
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Dispatch Accent</Label>
                    <div className="flex gap-2">
                      <div className="w-11 h-11 rounded border p-1 bg-white shadow-sm overflow-hidden">
                        <Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={chatbotColor} onChange={(e) => setChatbotColor(e.target.value)} />
                      </div>
                      <Input value={chatbotColor} onChange={(e) => setChatbotColor(e.target.value)} className="h-11 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Diameter (Size)</Label>
                      <span className="text-[9px] font-mono font-bold text-primary">{chatbotSize}PX</span>
                    </div>
                    <input 
                      type="range" min="40" max="100" value={chatbotSize} 
                      onChange={(e) => setChatbotSize(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Animation Protocol</Label>
                    <Select value={chatbotEffect} onValueChange={setChatbotEffect}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pulsate" className="text-[10px] font-bold uppercase">Pulsate</SelectItem>
                        <SelectItem value="breathe" className="text-[10px] font-bold uppercase">Breathe</SelectItem>
                        <SelectItem value="bounce" className="text-[10px] font-bold uppercase">Bounce</SelectItem>
                        <SelectItem value="none" className="text-[10px] font-bold uppercase">Static</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-[#e1e3e5] shadow-none rounded-none">
              <CardHeader className="border-b bg-gray-50/30 flex flex-row items-center justify-between px-4 sm:px-6">
                <CardTitle className="text-[9px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> Voice & WhatsApp
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={addPhoneNumber} className="h-8 text-[8px] font-bold uppercase tracking-widest px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest font-bold text-green-600 flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" /> Primary WhatsApp
                  </Label>
                  <Input 
                    placeholder="digits only..." 
                    value={whatsAppNumber} 
                    onChange={(e) => setWhatsAppNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-11 font-mono text-sm"
                  />
                </div>
                
                <Separator />

                <div className="space-y-4">
                  {phoneNumbers.map((p, idx) => (
                    <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Input 
                        placeholder="Label" 
                        value={p.label} 
                        onChange={(e) => updatePhoneNumber(idx, 'label', e.target.value)} 
                        className="w-[80px] h-10 text-[9px] font-bold uppercase px-2"
                      />
                      <Input 
                        placeholder="+1..." 
                        value={p.value} 
                        onChange={(e) => updatePhoneNumber(idx, 'value', e.target.value)} 
                        className="flex-1 h-10 text-xs font-mono"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removePhoneNumber(idx)} className="h-10 w-10 text-red-500 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {phoneNumbers.length === 0 && <p className="text-center py-4 text-[9px] text-gray-400 font-bold uppercase">No lines cataloged.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e1e3e5] shadow-none rounded-none">
              <CardHeader className="border-b bg-gray-50/30 flex flex-row items-center justify-between px-4 sm:px-6">
                <CardTitle className="text-[9px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Dispatch Emails
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={addEmailAddress} className="h-8 text-[8px] font-bold uppercase tracking-widest px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {emailAddresses.map((e, idx) => (
                  <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Input 
                      placeholder="Label" 
                      value={e.label} 
                      onChange={(e) => updateEmailAddress(idx, 'label', e.target.value)} 
                      className="w-[80px] h-10 text-[9px] font-bold uppercase px-2"
                    />
                    <Input 
                      placeholder="email@..." 
                      value={e.value} 
                      onChange={(e) => updateEmailAddress(idx, 'value', e.target.value)} 
                      className="flex-1 h-10 text-xs font-mono"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeEmailAddress(idx)} className="h-10 w-10 text-red-500 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {emailAddresses.length === 0 && <p className="text-center py-4 text-[9px] text-gray-400 font-bold uppercase">No dispatch cataloged.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="bg-black text-white p-6 sm:p-8 rounded-none space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-400" />
              <div>
                <h3 className="text-sm font-headline font-bold uppercase tracking-tight">Support Protocol Finalization</h3>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Changes are synchronized Authoritatively with the live Studio.</p>
              </div>
            </div>
            <Separator className="bg-white/10" />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Real-time Handshake Active</span>
              </div>
              <Button onClick={handleSaveChatbot} disabled={isSaving} className="w-full sm:w-auto bg-white text-black h-12 px-12 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#D3D3D3] transition-all">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Authorize Interface
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
