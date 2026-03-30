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
  TabsTrigger } from '@/components/ui/tabs';
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
  AlignCenter,
  AlignRight,
  Maximize2,
  Mail,
  Plus,
  Globe,
  Instagram,
  Twitter,
  MessageCircle,
  Facebook,
  MoreHorizontal,
  Clock,
  ShieldCheck,
  Monitor,
  ShoppingBag,
  ArrowRightLeft,
  CheckCircle2,
  Scale,
  Languages,
  DollarSign,
  Lock,
  ShieldCheck as ShieldIcon,
  KeyRound,
  AlertTriangle,
  Construction
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  updatePassword, 
  sendPasswordResetEmail, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  getAuth
} from 'firebase/auth';

interface ContactItem {
  label: string;
  value: string;
}

interface SocialItem {
  platform: string;
  url: string;
}

interface TaxNexus {
  region: string;
  rate: number;
}

export default function SettingsPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    setHasMounted(true);
  }, []);
  const storage = useStorage();
  const { toast } = useToast();
  const storefrontLogoRef = useRef<HTMLInputElement>(null);
  const adminLogoRef = useRef<HTMLInputElement>(null);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const staffQuery = useMemoFirebase(() => db ? collection(db, 'staff') : null, [db]);
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);

  const { data: storeConfig, isLoading: storeLoading } = useDoc(storeConfigRef);
  const { data: staffMembers, isLoading: staffLoading } = useCollection(staffQuery);
  const { data: themeData, isLoading: themeLoading } = useDoc(themeRef);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Storefront Identity
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Admin Identity
  const [adminBusinessName, setAdminBusinessName] = useState('');
  const [adminLogoUrl, setAdminLogoUrl] = useState('');

  // Social Sales Channels
  const [metaPixelId, setMetaPixelId] = useState('');
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [instagramBusinessId, setInstagramBusinessId] = useState('');

  // Contact & Logistics
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  
  const [phoneNumbers, setPhoneNumbers] = useState<ContactItem[]>([]);
  const [emailAddresses, setEmailAddresses] = useState<ContactItem[]>([]);
  const [socialChannels, setSocialChannels] = useState<SocialItem[]>([]);
  const [whatsAppNumber, setWhatsAppNumber] = useState('');

  // Structured Logistics
  const [originCity, setOriginCity] = useState('');
  const [originProvince, setOriginProvince] = useState('');
  const [originPostalCode, setOriginPostalCode] = useState('');
  const [originCountryCode, setOriginCountryCode] = useState('CA');
  const [handlingFee, setHandlingFee] = useState('0.00');

  // Compliance & Language
  const [taxNexus, setTaxNexus] = useState<TaxNexus[]>([]);
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [multiLanguageEnabled, setMultiLanguageEnabled] = useState(false);
  const [newRegion, setNewRegion] = useState('');
  const [newRate, setNewRate] = useState('');
  const [globalLowStockThreshold, setGlobalLowStockThreshold] = useState('10');
  const [globalVariantLowStockThreshold, setGlobalVariantLowStockThreshold] = useState('5');

  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffTimezone, setStaffTimezone] = useState('(UTC-05:00) Eastern Time');
  const [staffStatus, setStaffStatus] = useState<'Active' | 'Inactive'>('Active');

  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotPosition, setChatbotPosition] = useState<'left' | 'right'>('right');
  const [chatbotColor, setChatbotColor] = useState('#000000');
  const [chatbotSize, setChatbotSize] = useState('60');
  const [chatbotEffect, setChatbotEffect] = useState('pulsate');
  const [chatbotDuration, setChatbotDuration] = useState('3');
  const [chatbotGapBottom, setChatbotGapBottom] = useState('32');
  const [chatbotGapSide, setChatbotGapSide] = useState('32');

  // Security State
  const { user } = useUser();
  const auth = typeof window !== 'undefined' ? getAuth() : null;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');

  // Branding Features
  const [showBrand, setShowBrand] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    if (storeConfig) {
      setBusinessName(storeConfig.businessName || '');
      setLogoUrl(storeConfig.logoUrl || '');
      setAdminBusinessName(storeConfig.adminBusinessName || storeConfig.businessName || '');
      setAdminLogoUrl(storeConfig.adminLogoUrl || storeConfig.logoUrl || '');
      
      setAddress(storeConfig.address || '');
      setGoogleMapsUrl(storeConfig.googleMapsUrl || '');
      setPhone(storeConfig.phone || '');
      setBusinessEmail(storeConfig.email || '');
      setPhoneNumbers(storeConfig.phoneNumbers || []);
      setEmailAddresses(storeConfig.emailAddresses || []);
      setSocialChannels(storeConfig.socialChannels || []);
      setWhatsAppNumber(storeConfig.whatsAppNumber || '');

      // Logistics Sync
      setOriginCity(storeConfig.originCity || '');
      setOriginProvince(storeConfig.originProvince || '');
      setOriginPostalCode(storeConfig.originPostalCode || '');
      setOriginCountryCode(storeConfig.originCountryCode || 'CA');
      setHandlingFee((storeConfig.handlingFee ?? 0).toString());

      // Compliance Sync
      setTaxNexus(storeConfig.taxNexus || []);
      setPrimaryLanguage(storeConfig.primaryLanguage || 'English');
      setMultiLanguageEnabled(storeConfig.multiLanguageEnabled ?? false);
      setGlobalLowStockThreshold((storeConfig.globalLowStockThreshold ?? 10).toString());
      setGlobalVariantLowStockThreshold((storeConfig.globalVariantLowStockThreshold ?? 5).toString());
      
      // Social Sales Channels Sync
      setMetaPixelId(storeConfig.metaPixelId || '');
      setTiktokPixelId(storeConfig.tiktokPixelId || '');
      setInstagramBusinessId(storeConfig.instagramBusinessId || '');
    }
    if (themeData) {
      setChatbotEnabled(themeData.chatbotEnabled ?? true);
      setChatbotPosition(themeData.chatbotPosition || 'right');
      setChatbotColor(themeData.chatbotColor || '#000000');
      setChatbotSize(themeData.chatbotSize?.toString() || '60');
      setChatbotEffect(themeData.chatbotEffect || 'pulsate');
      setChatbotDuration(themeData.chatbotDuration?.toString() || '3');
      setChatbotGapBottom(themeData.chatbotGapBottom?.toString() || '32');
      setChatbotGapSide(themeData.chatbotGapSide?.toString() || '32');
      setShowBrand(themeData.showBrand !== false);
      setMaintenanceMode(themeData.maintenanceMode ?? false);
      setMaintenanceMessage(themeData.maintenanceMessage || 'Store Maintenance. We are currently updating the store. We will be back online shortly.');
    }
  }, [storeConfig, themeData]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'storefront' | 'admin') => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsSaving(true);
    const toastId = toast({
      title: "Uploading Logo...",
      description: `Synchronizing ${target} identity with cloud storage.`,
    });

    try {
      const storageRef = ref(storage, `settings/logos/${target}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (target === 'storefront') setLogoUrl(downloadURL);
      else setAdminLogoUrl(downloadURL);

      toast({
        title: "Logo Synthesized",
        description: `${target.charAt(0).toUpperCase() + target.slice(1)} branding has been projected to storage.`,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: "Encountered a deviation in the storage uplink.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncAdminBranding = () => {
    setAdminBusinessName(businessName);
    setAdminLogoUrl(logoUrl);
    toast({
      title: "Identity Synced",
      description: "Admin branding now matches storefront manifest."
    });
  };

  const handleSaveStore = async () => {
    if (!storeConfigRef) return;
    setIsSaving(true);
    const updates = { 
      businessName, 
      logoUrl,
      adminBusinessName,
      adminLogoUrl,
      address, 
      googleMapsUrl, 
      phone, 
      email: businessEmail,
      phoneNumbers,
      emailAddresses,
      socialChannels,
      whatsAppNumber,
      originCity,
      originProvince,
      originPostalCode,
      originCountryCode,
      handlingFee: parseFloat(handlingFee) || 0,
      taxNexus,
      primaryLanguage,
      multiLanguageEnabled,
      globalLowStockThreshold: parseInt(globalLowStockThreshold),
      globalVariantLowStockThreshold: parseInt(globalVariantLowStockThreshold),
      metaPixelId,
      tiktokPixelId,
      instagramBusinessId,
      updatedAt: serverTimestamp()
    };
    setDoc(storeConfigRef, updates, { merge: true })
      .then(() => toast({ title: "Identity Synchronized", description: "Global settings have been Authoritatively updated." }))
      .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: storeConfigRef.path, operation: 'write', requestResourceData: updates })))
      .finally(() => setIsSaving(false));
  };

  const handleAddNexus = () => {
    if (!newRegion || !newRate) return;
    const updated = [...taxNexus, { region: newRegion.toUpperCase(), rate: parseFloat(newRate) }];
    setTaxNexus(updated);
    setNewRegion('');
    setNewRate('');
    toast({ title: "Nexus Added", description: `Tax rate for ${newRegion.toUpperCase()} staged.` });
  };

  const handleRemoveNexus = (idx: number) => {
    setTaxNexus(taxNexus.filter((_, i) => i !== idx));
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
      chatbotDuration: Number(chatbotDuration),
      chatbotGapBottom: Number(chatbotGapBottom),
      chatbotGapSide: Number(chatbotGapSide),
      showBrand,
      updatedAt: serverTimestamp() 
    };
    handleSaveStore();
    setDoc(themeRef, updates, { merge: true })
      .then(() => toast({ title: "Saved", description: "Chat and support settings updated." }))
      .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: themeRef.path, operation: 'write', requestResourceData: updates })))
      .finally(() => setIsSaving(false));
  };

  const handleSaveMaintenance = async () => {
    if (!themeRef) return;
    setIsSaving(true);
    const updates = { 
      maintenanceMode,
      maintenanceMessage,
      updatedAt: serverTimestamp() 
    };
    setDoc(themeRef, updates, { merge: true })
      .then(() => toast({ title: "Status Synchronized", description: "Store visibility state has been projected." }))
      .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: themeRef.path, operation: 'write', requestResourceData: updates })))
      .finally(() => setIsSaving(false));
  };

  const handleUpdatePassword = async () => {
    if (!auth?.currentUser || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Insecure", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast({ title: "Success", description: "Password updated successfully." });
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setIsReauthOpen(true);
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReauthenticate = async () => {
    if (!auth?.currentUser || !reauthPassword) return;
    setIsSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, reauthPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setIsReauthOpen(false);
      setReauthPassword('');
      toast({ title: "Verified", description: "You are now re-authenticated. Please try updating your password again." });
    } catch (error: any) {
      toast({ title: "Failed", description: "Incorrect password.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestResetEmail = async () => {
    if (!auth || !user?.email) return;
    setIsSaving(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: "Sent", description: `Password reset email dispatched to ${user.email}.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
          toast({ title: "Success", description: "Staff member updated." });
        })
        .finally(() => setIsSaving(false));
    } else {
      addDoc(collection(db, 'staff'), { ...staffData, createdAt: serverTimestamp() })
        .then(() => {
          setIsStaffDialogOpen(false);
          resetStaffForm();
          toast({ title: "Success", description: "New staff member added." });
        })
        .finally(() => setIsSaving(false));
    }
  };

  const deleteStaff = (id: string) => {
    if (!db || !confirm("Are you sure you want to remove this staff member?")) return;
    deleteDoc(doc(db, 'staff', id)).then(() => {
      toast({ title: "Removed", description: "Staff member has been removed." });
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

  const addPhoneNumber = () => setPhoneNumbers([...phoneNumbers, { label: 'Phone', value: '' }]);
  const updatePhoneNumber = (idx: number, field: keyof ContactItem, val: string) => {
    const updated = [...phoneNumbers];
    updated[idx][field] = val;
    setPhoneNumbers(updated);
  };
  const removePhoneNumber = (idx: number) => setPhoneNumbers(phoneNumbers.filter((_, i) => i !== idx));

  const addEmailAddress = () => setEmailAddresses([...emailAddresses, { label: 'Email', value: '' }]);
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

  if (!hasMounted || storeLoading || themeLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <img src="/icon.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Settings</h1>
        <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Update your store's info and manage your team.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-[#e1e3e5] h-auto flex-wrap p-1 mb-8 gap-2 rounded-none">
          <TabsTrigger value="store" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <Building2 className="h-3.5 w-3.5" /> Identity & Logistics
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <User className="h-3.5 w-3.5" /> Staff Members
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <Lock className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="support" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <MessageSquareMore className="h-3.5 w-3.5" /> Chat & Contact
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <Scale className="h-3.5 w-3.5" /> Compliance & Language
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-12 animate-in fade-in duration-300">
          
          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="border-b bg-gray-50/30">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-lg font-headline uppercase tracking-tight">Contact & Logistics</CardTitle>
              </div>
              <CardDescription className="text-xs font-bold uppercase tracking-tight">Operational data for shipments and support.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 p-4 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="FSLNO" 
                        value={businessName} 
                        onChange={(e) => setBusinessName(e.target.value)} 
                        className="pl-10 h-11 uppercase font-bold text-xs" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Main Logistics Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Business Email (Internal)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="admin@example.com" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-blue-600">Global Handling Fee (C$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        value={handlingFee} 
                        onChange={(e) => setHandlingFee(e.target.value)} 
                        className="pl-10 h-11 border-blue-100 font-bold" 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Public/Store Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                      <Textarea placeholder="12 Brant Ave #13, Guelph, ON N1E 1E7" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10 min-h-[80px] resize-none" />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50/50 border border-dashed border-gray-200 space-y-4">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Logistics Origin (For Shipping API)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[8px] uppercase text-gray-400">City</Label>
                        <Input placeholder="Guelph" value={originCity} onChange={(e) => setOriginCity(e.target.value)} className="h-9 text-xs uppercase font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] uppercase text-gray-400">Prov/State</Label>
                        <Input placeholder="ON" value={originProvince} onChange={(e) => setOriginProvince(e.target.value)} className="h-9 text-xs uppercase font-bold" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[8px] uppercase text-gray-400">Postal/Zip</Label>
                        <Input placeholder="N1E 1E7" value={originPostalCode} onChange={(e) => setOriginPostalCode(e.target.value)} className="h-9 text-xs uppercase font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] uppercase text-gray-400">Country Code</Label>
                        <Input placeholder="CA" value={originCountryCode} onChange={(e) => setOriginCountryCode(e.target.value)} className="h-9 text-xs uppercase font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50/10 border border-dashed border-orange-100/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-orange-400">Default Inventory Alert Levels</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[8px] uppercase text-gray-400">Total Threshold</Label>
                        <Input type="number" value={globalLowStockThreshold} onChange={(e) => setGlobalLowStockThreshold(e.target.value)} className="h-9 text-xs font-bold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] uppercase text-gray-400">Size Threshold</Label>
                        <Input type="number" value={globalVariantLowStockThreshold} onChange={(e) => setGlobalVariantLowStockThreshold(e.target.value)} className="h-9 text-xs font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Google Maps Coordination</Label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="https://maps.google.com/..." value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t mt-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-dashed rounded-none">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Global Brand Visibility</Label>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Toggle brand names on the public storefront and search results.</p>
                  </div>
                  <Switch 
                    checked={showBrand} 
                    onCheckedChange={setShowBrand}
                  />
                </div>

                <div className="p-4 bg-blue-50/10 border border-dashed border-blue-100/30 space-y-6 mt-6">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-blue-400">Social Sales Channels & Tracking</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[8px] uppercase text-gray-400">Meta (Facebook/Instagram) Pixel ID</Label>
                      <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input placeholder="1234567890..." value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)} className="pl-9 h-9 text-xs font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] uppercase text-gray-400">Instagram Business ID</Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input placeholder="INSTA_BIZ_123..." value={instagramBusinessId} onChange={(e) => setInstagramBusinessId(e.target.value)} className="pl-9 h-9 text-xs font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] uppercase text-gray-400">TikTok Pixel ID</Label>
                      <div className="relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input placeholder="TIKTOK_PIXEL_123..." value={tiktokPixelId} onChange={(e) => setTiktokPixelId(e.target.value)} className="pl-9 h-9 text-xs font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[8px] uppercase text-gray-400">Product Feed URL (Facebook/Instagram)</Label>
                        <Badge variant="outline" className="text-[7px] uppercase tracking-tighter h-3.5 border-blue-200 text-blue-500">Auto Generated</Badge>
                      </div>
                      <div className="relative">
                        <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input 
                          readOnly 
                          value={typeof window !== 'undefined' ? `${window.location.origin}/api/feeds/facebook` : ''} 
                          className="pl-9 h-9 text-[10px] font-mono bg-gray-50 text-gray-500 cursor-help" 
                          onClick={(e) => {
                            (e.target as HTMLInputElement).select();
                            navigator.clipboard.writeText((e.target as HTMLInputElement).value);
                            toast({ title: "Copied to Clipboard", description: "Product feed URL updated for catalog synchronization." });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 p-4 sm:p-6 bg-black text-white border border-white/10 rounded-none shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Construction className="h-4 w-4 text-green-500" />
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Store Maintenance Mode</Label>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Lock the storefront for scheduled maintenance or updates.</p>
                    </div>
                    <Switch 
                      checked={maintenanceMode} 
                      onCheckedChange={(val) => {
                        setMaintenanceMode(val);
                        // Auto-save logic if user prefers, but for now we'll rely on the main sync
                      }}
                    />
                  </div>
                  
                  {maintenanceMode && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                       <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Maintenance Broadcast Message</Label>
                       <Textarea 
                        value={maintenanceMessage} 
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        className="bg-white/5 border-white/10 text-white min-h-[100px] text-xs placeholder:text-gray-600 focus-visible:ring-white/20"
                        placeholder="Describe the maintenance status..."
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSaveMaintenance} 
                    disabled={isSaving}
                    size="sm"
                    className="w-full bg-white text-black h-10 font-bold uppercase tracking-widest text-[9px] hover:bg-green-500 hover:text-white transition-all shadow-lg"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                    Save Maintenance Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-gray-400" />
                    <CardTitle className="text-lg font-headline uppercase tracking-tight">Brand Identity Manifest</CardTitle>
                  </div>
                  <CardDescription className="text-xs font-bold uppercase tracking-tight">Manage public storefront and backend administrative profiles.</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSyncAdminBranding}
                  className="h-9 gap-2 font-bold uppercase tracking-widest text-[10px] border-black bg-white"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Sync Admin from Store
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-8 p-4 sm:p-8 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-2 border-b pb-4">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Public Storefront</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Business Name</Label>
                      <Input 
                        placeholder="FSLNO" 
                        value={businessName} 
                        onChange={(e) => setBusinessName(e.target.value)} 
                        className="h-12 uppercase font-bold text-xs" 
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Storefront Logo</Label>
                      <input type="file" ref={storefrontLogoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'storefront')} />
                      <div 
                        onClick={() => storefrontLogoRef.current?.click()}
                        className="border-2 border-dashed rounded-none p-6 flex flex-col items-center justify-center gap-3 bg-gray-50 group hover:border-black transition-all cursor-pointer relative min-h-[180px]"
                      >
                        {logoUrl ? (
                          <div className="relative w-full max-w-[140px] aspect-square overflow-hidden bg-white border shadow-sm">
                            <NextImage src={logoUrl} alt="Storefront Logo" fill className="object-contain p-4" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="secondary" size="icon" className="h-8 w-8"><Upload className="h-4 w-4 text-black" /></Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="h-6 w-6 text-gray-300" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Upload Public Logo</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 bg-blue-50/5 p-6 border border-blue-100/50 rounded-sm">
                  <div className="flex items-center gap-2 border-b border-blue-100 pb-4">
                    <Monitor className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900">Admin Command</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-blue-800">Admin Display Name</Label>
                      <Input 
                        placeholder="FSLNO Command" 
                        value={adminBusinessName} 
                        onChange={(e) => setAdminBusinessName(e.target.value)} 
                        className="h-12 uppercase font-bold text-xs bg-white border-blue-100" 
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-blue-800">Dashboard Logo</Label>
                      <input type="file" ref={adminLogoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'admin')} />
                      <div 
                        onClick={() => adminLogoRef.current?.click()}
                        className="border-2 border-dashed rounded-none p-6 flex flex-col items-center justify-center gap-3 bg-white group hover:border-blue-600 transition-all cursor-pointer relative min-h-[180px]"
                      >
                        {adminLogoUrl ? (
                          <div className="relative w-full max-w-[140px] aspect-square overflow-hidden bg-white border border-blue-50 shadow-sm">
                            <NextImage src={adminLogoUrl} alt="Admin Logo" fill className="object-contain p-4" />
                            <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="secondary" size="icon" className="h-8 w-8"><Upload className="h-4 w-4 text-blue-600" /></Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="h-6 w-6 text-blue-200" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Upload Admin Logo</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveStore} disabled={isSaving} className="w-full sm:w-auto bg-black text-white h-14 px-16 font-bold uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-[#D3D3D3] transition-all">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <ShieldCheck className="h-4 w-4 mr-3" />}
              Synchronize Identity Manifest
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30 px-4 sm:px-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Team Members</CardTitle>
                </div>
                <CardDescription className="text-[9px] uppercase font-bold tracking-tight hidden xs:block">People who can access this admin panel.</CardDescription>
              </div>
              <Dialog open={isStaffDialogOpen} onOpenChange={(open) => { setIsStaffDialogOpen(open); if (!open) resetStaffForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white h-9 px-4 font-bold uppercase tracking-widest text-[9px] gap-2">
                    <PlusCircle className="h-3.5 w-3.5" /> Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                  <DialogHeader className="pt-6">
                    <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Add Staff Member</DialogTitle>
                    <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Add a new person to your store team.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Full Name</Label>
                      <Input placeholder="e.g. Alex McQueen" value={staffName} onChange={(e) => setStaffName(e.target.value)} className="h-12 uppercase font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Email</Label>
                      <Input type="email" placeholder="staff@fslno.ca" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} className="h-12 lowercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-500">Phone</Label>
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
                      Save Member
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-[#e1e3e5]">
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest py-4 pl-6 text-gray-500">Team Member</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Contact</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Timezone</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-center text-gray-500">Status</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
                    ) : !staffMembers || staffMembers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-[10px] font-bold uppercase text-gray-400 tracking-widest">No staff members found.</TableCell></TableRow>
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
                              <span className="text-[9px] text-gray-400 font-mono">{staff.phone || 'No Phone'}</span>
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

              <div className="md:hidden divide-y">
                {staffLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
                ) : !staffMembers || staffMembers.length === 0 ? (
                  <div className="py-12 text-center text-[10px] font-bold uppercase text-gray-400">No team members.</div>
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
                          <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Email</p>
                          <p className="text-[10px] font-bold lowercase truncate">{staff.email}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Timezone</p>
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

        <TabsContent value="security" className="space-y-8 animate-in fade-in duration-300">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="bg-gray-50/30 border-b">
              <div className="flex items-center gap-2">
                <ShieldIcon className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Password Management</CardTitle>
              </div>
              <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Secure your administrative access.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 p-4 sm:p-8 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b pb-4">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Direct Update</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">New Password</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 border-[#e1e3e5]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Confirm New Password</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 border-[#e1e3e5]"
                      />
                    </div>
                    <Button 
                      onClick={handleUpdatePassword} 
                      disabled={isSaving || !newPassword}
                      className="w-full bg-black text-white h-11 font-bold uppercase tracking-widest text-[9px]"
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Lock className="h-3.5 w-3.5 mr-2" />}
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 bg-gray-50/50 p-6 border rounded-sm">
                  <div className="flex items-center gap-2 border-b pb-4">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Remote Reset</h3>
                  </div>
                  
                  <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
                    Prefer a secure recovery link? We can send a password reset protocol directly to your registered email address.
                  </p>

                  <div className="pt-4">
                    <Button 
                      variant="outline"
                      onClick={handleRequestResetEmail}
                      disabled={isSaving}
                      className="w-full h-11 border-black font-bold uppercase tracking-widest text-[9px] gap-2 hover:bg-black hover:text-white transition-all"
                    >
                      <Zap className="h-3.5 w-3.5" /> Request Reset Email
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/50 border border-red-100 p-4 flex gap-3 items-start">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase text-red-800 tracking-tight">Security Protocol Advisory</p>
                  <p className="text-[8px] font-bold text-red-600 uppercase leading-relaxed">
                    For sensitive operations like password changes, Google requires a recent sign-in session. 
                    If prompted, you must re-verify your identity with your current credentials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isReauthOpen} onOpenChange={setIsReauthOpen}>
            <DialogContent className="sm:max-w-md bg-white border-none rounded-none shadow-2xl">
              <DialogHeader className="pt-6">
                <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Security Verification</DialogTitle>
                <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                  Your session has expired for sensitive updates. Please enter your CURRENT password to continue.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500">Current Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    className="h-12 border-[#e1e3e5]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleReauthenticate} 
                  disabled={isSaving || !reauthPassword} 
                  className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px]"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify Identity
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="support" className="space-y-12 animate-in fade-in duration-300">
          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquareMore className="h-5 w-5 text-gray-400" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Chat & Contact Widget</CardTitle>
                </div>
                <CardDescription className="text-[9px] uppercase font-bold tracking-tight">The floating support button on your website.</CardDescription>
              </div>
              <Switch checked={chatbotEnabled} onCheckedChange={setChatbotEnabled} />
            </CardHeader>
            <CardContent className="pt-6 p-4 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Position</Label>
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
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Widget Color</Label>
                    <div className="flex gap-2">
                      <div className="w-11 h-11 rounded border p-1 bg-white shadow-sm overflow-hidden"><Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={chatbotColor} onChange={(e) => setChatbotColor(e.target.value)} /></div>
                      <Input value={chatbotColor} onChange={(e) => setChatbotColor(e.target.value)} className="h-11 font-mono text-xs uppercase" />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> Motion Speed
                      </Label>
                      <span className="text-[9px] font-mono font-bold text-primary">{chatbotDuration}S CYCLE</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="10" step="0.5" value={chatbotDuration} 
                      onChange={(e) => setChatbotDuration(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                    <div className="flex justify-between text-[7px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>High Velocity (0.5s)</span>
                      <span>Ambient (10s)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Size</Label>
                      <span className="text-[9px] font-mono font-bold text-primary">{chatbotSize}PX</span>
                    </div>
                    <input 
                      type="range" min="40" max="100" value={chatbotSize} 
                      onChange={(e) => setChatbotSize(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Bottom Gap</Label>
                      <span className="text-[9px] font-mono font-bold text-primary">{chatbotGapBottom}PX</span>
                    </div>
                    <input 
                      type="range" min="8" max="80" value={chatbotGapBottom} 
                      onChange={(e) => setChatbotGapBottom(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                    <div className="flex justify-between text-[7px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>8px</span>
                      <span>80px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Side Gap</Label>
                      <span className="text-[9px] font-mono font-bold text-primary">{chatbotGapSide}PX</span>
                    </div>
                    <input 
                      type="range" min="8" max="80" value={chatbotGapSide} 
                      onChange={(e) => setChatbotGapSide(e.target.value)} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                    />
                    <div className="flex justify-between text-[7px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>8px</span>
                      <span>80px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Animation Effect</Label>
                    <Select value={chatbotEffect} onValueChange={setChatbotEffect}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pulsate" className="text-[10px] font-bold uppercase">Pulsate</SelectItem>
                        <SelectItem value="breathe" className="text-[10px] font-bold uppercase">Breathe</SelectItem>
                        <SelectItem value="bounce" className="text-[10px] font-bold uppercase">Bounce</SelectItem>
                        <SelectItem value="glow" className="text-[10px] font-bold uppercase">Glow (Slow Mo)</SelectItem>
                        <SelectItem value="float" className="text-[10px] font-bold uppercase">Float (Slow Mo)</SelectItem>
                        <SelectItem value="orbit" className="text-[10px] font-bold uppercase">Orbit (Slow Mo)</SelectItem>
                        <SelectItem value="drift" className="text-[10px] font-bold uppercase">Drift (Slow Mo)</SelectItem>
                        <SelectItem value="expand" className="text-[10px] font-bold uppercase">Expand (Slow Mo)</SelectItem>
                        <SelectItem value="none" className="text-[10px] font-bold uppercase">None</SelectItem>
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
                  <Phone className="h-3.5 w-3.5" /> Support Phones
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={addPhoneNumber} className="h-8 text-[8px] font-bold uppercase tracking-widest px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest font-bold text-green-600 flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Number
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
                        placeholder="Label (e.g. Sales)" 
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
                  {phoneNumbers.length === 0 && <p className="text-center py-4 text-[9px] text-gray-400 font-bold uppercase">No phones added.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e1e3e5] shadow-none rounded-none">
              <CardHeader className="border-b bg-gray-50/30 flex flex-row items-center justify-between px-4 sm:px-6">
                <CardTitle className="text-[9px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Support Emails
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={addEmailAddress} className="h-8 text-[8px] font-bold uppercase tracking-widest px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {emailAddresses.map((e, idx) => (
                  <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Input 
                      placeholder="Label (e.g. Help)" 
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
                {emailAddresses.length === 0 && <p className="text-center py-4 text-[9px] text-gray-400 font-bold uppercase">No emails added.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="bg-black text-white p-6 sm:p-8 rounded-none space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-400" />
              <div>
                <h3 className="text-sm font-headline font-bold uppercase tracking-tight">Save Chat & Contact Settings</h3>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Updates will be applied to your website immediately.</p>
              </div>
            </div>
            <Separator className="bg-white/10" />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest">System Ready</span>
              </div>
              <Button onClick={handleSaveChatbot} disabled={isSaving} className="w-full sm:w-auto bg-white text-black h-12 px-12 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#D3D3D3] transition-all">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Widget Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-12 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
              <CardHeader className="border-b bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-headline uppercase tracking-tight">Taxation Protocols</CardTitle>
                </div>
                <CardDescription className="text-xs font-bold uppercase tracking-tight">Manage regional tax nexus and manual overrides.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 p-4 sm:p-8 space-y-8">
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-none space-y-2">
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5" /> Nexus Orchestration
                    </p>
                    <p className="text-[10px] text-blue-700 leading-relaxed uppercase font-medium">
                      Define the regions where your archive has established tax obligations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Add Region</Label>
                      <Input 
                        placeholder="e.g. ONTARIO" 
                        value={newRegion} 
                        onChange={(e) => setNewRegion(e.target.value)} 
                        className="h-11 uppercase font-bold text-xs" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Tax Rate (%)</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          placeholder="13" 
                          value={newRate} 
                          onChange={(e) => setNewRate(e.target.value)} 
                          className="h-11 font-mono" 
                        />
                        <Button 
                          onClick={handleAddNexus}
                          disabled={!newRegion || !newRate}
                          className="h-11 bg-black text-white px-4 rounded-none"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-none overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-[9px] font-bold uppercase p-3">Region</TableHead>
                          <TableHead className="text-[9px] font-bold uppercase text-center p-3">Rate</TableHead>
                          <TableHead className="w-[50px] p-3"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxNexus.map((nexus, idx) => (
                          <TableRow key={idx} className="border-b last:border-0">
                            <TableCell className="text-[10px] font-bold uppercase p-3">{nexus.region}</TableCell>
                            <TableCell className="text-center font-mono text-[10px] p-3">{nexus.rate}%</TableCell>
                            <TableCell className="p-3 text-right">
                              <button onClick={() => handleRemoveNexus(idx)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {taxNexus.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-[9px] font-bold uppercase text-gray-400 italic">No nexus staged.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
              <CardHeader className="border-b bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-headline uppercase tracking-tight">Localization Engine</CardTitle>
                </div>
                <CardDescription className="text-xs font-bold uppercase tracking-tight">Configure the archival storefront language modes.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 p-4 sm:p-8 space-y-8">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Primary System Language</Label>
                    <Select value={primaryLanguage} onValueChange={setPrimaryLanguage}>
                      <SelectTrigger className="h-12 bg-white border-2 border-primary/5 rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English" className="text-[10px] font-bold uppercase">English (Default)</SelectItem>
                        <SelectItem value="US English" className="text-[10px] font-bold uppercase">US English</SelectItem>
                        <SelectItem value="French" className="text-[10px] font-bold uppercase">French</SelectItem>
                        <SelectItem value="Spanish" className="text-[10px] font-bold uppercase">Spanish</SelectItem>
                        <SelectItem value="German" className="text-[10px] font-bold uppercase">German</SelectItem>
                        <SelectItem value="Japanese" className="text-[10px] font-bold uppercase">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-6 bg-gray-50 border border-dashed rounded-none">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-tight flex items-center gap-2">
                        Multi-Language Support
                      </p>
                      <p className="text-[9px] text-[#5c5f62] uppercase leading-tight font-medium opacity-70">
                        Enable participant language switching.
                      </p>
                    </div>
                    <Switch 
                      checked={multiLanguageEnabled} 
                      onCheckedChange={setMultiLanguageEnabled}
                    />
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-none flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-[9px] text-emerald-800 uppercase font-bold leading-relaxed">
                      Archive translation protocols are forensicly cached for zero-latency switching.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveStore} disabled={isSaving} className="w-full sm:w-auto bg-black text-white h-14 px-16 font-bold uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-[#D3D3D3] transition-all">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}
              Synchronize Compliance Manifest
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
