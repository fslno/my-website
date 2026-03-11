
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Building2, 
  MapPin, 
  Phone, 
  Upload, 
  Loader2, 
  Save, 
  Trash2,
  Image as ImageIcon,
  User,
  Mail,
  Clock,
  ShieldCheck,
  Globe,
  Navigation
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input Refs for "Edit" functionality
  const staffNameRef = useRef<HTMLInputElement>(null);
  const staffEmailRef = useRef<HTMLInputElement>(null);
  const staffPhoneRef = useRef<HTMLInputElement>(null);
  const staffTimezoneRef = useRef<HTMLInputElement>(null);

  // Firestore References
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const staffConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'staff') : null, [db]);

  const { data: storeConfig, loading: storeLoading } = useDoc(storeConfigRef);
  const { data: staffConfig, loading: staffLoading } = useDoc(staffConfigRef);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Store Form State
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Staff Form State
  const [staffName, setStaffName] = useState('Admin Name');
  const [staffEmail, setStaffEmail] = useState('admin@yourstore.com');
  const [staffPhone, setStaffPhone] = useState('+1 (000) 000-0000');
  const [timezone, setTimezone] = useState('(UTC-05:00) Eastern Time');

  // Initialize forms when data loads
  useEffect(() => {
    if (storeConfig) {
      setBusinessName(storeConfig.businessName || '');
      setAddress(storeConfig.address || '');
      setGoogleMapsUrl(storeConfig.googleMapsUrl || '');
      setPhone(storeConfig.phone || '');
      setLogoUrl(storeConfig.logoUrl || '');
    }
  }, [storeConfig]);

  useEffect(() => {
    if (staffConfig) {
      setStaffName(staffConfig.fullName || 'Admin Name');
      setStaffEmail(staffConfig.email || 'admin@yourstore.com');
      setStaffPhone(staffConfig.phone || '+1 (000) 000-0000');
      setTimezone(staffConfig.timezone || '(UTC-05:00) Eastern Time');
    }
  }, [staffConfig]);

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
      updatedAt: new Date().toISOString() 
    };
    setDoc(storeConfigRef, updates, { merge: true })
      .then(() => toast({ title: "Store Settings Saved", description: "Business identity has been updated." }))
      .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: storeConfigRef.path, operation: 'write', requestResourceData: updates })))
      .finally(() => setIsSaving(false));
  };

  const handleSaveStaff = async () => {
    if (!staffConfigRef) return;
    setIsSaving(true);
    const updates = { fullName: staffName, email: staffEmail, phone: staffPhone, timezone, updatedAt: new Date().toISOString() };
    setDoc(staffConfigRef, updates, { merge: true })
      .then(() => toast({ title: "Staff Profile Saved", description: "Personal administrative identity updated." }))
      .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: staffConfigRef.path, operation: 'write', requestResourceData: updates })))
      .finally(() => setIsSaving(false));
  };

  const focusInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.focus();
  };

  if (storeLoading || staffLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Global Settings</h1>
        <p className="text-[#5c5f62] mt-1 text-sm">Configure your store's general information and operational identity.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-[#e1e3e5] h-12 p-1 mb-8 gap-2">
          <TabsTrigger value="store" className="gap-2 px-6 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-black data-[state=active]:text-white transition-all">
            <Building2 className="h-3.5 w-3.5" /> Store Profile
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2 px-6 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-black data-[state=active]:text-white transition-all">
            <User className="h-3.5 w-3.5" /> Staff Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle className="text-lg font-headline uppercase tracking-tight">Business Identity</CardTitle>
              </div>
              <CardDescription>
                These details appear on invoices, emails, and in your store footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="e.g. FSLNO Studio" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Business Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                      <Textarea placeholder="123 Archive Way, London, UK" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10 min-h-[100px]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Google Maps URL</Label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="https://maps.google.com/..." value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Store Logo</Label>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <div 
                      onClick={() => !logoUrl && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-gray-50 group hover:border-black transition-all min-h-[200px] ${!logoUrl ? 'cursor-pointer' : ''}`}
                    >
                      {logoUrl ? (
                        <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden bg-white border shadow-sm">
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
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Upload Store Logo</p>
                            <p className="text-[8px] text-gray-400 mt-1">Recommended: PNG or SVG with transparency</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveStore} disabled={isSaving} className="bg-black text-white h-12 px-10 font-bold uppercase tracking-[0.2em] text-[10px]">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Store Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card className="border-[#e1e3e5] shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle className="text-lg font-headline uppercase tracking-tight">Staff Profile</CardTitle>
              </div>
              <CardDescription>Manage your personal administrative identity and accessibility.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-[#e1e3e5]">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 pl-6">Field Name</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest">Current Value / Setting</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-transparent border-[#e1e3e5]">
                    <TableCell className="pl-6 font-bold text-sm flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" /> Full Name
                    </TableCell>
                    <TableCell className="py-4">
                      <Input 
                        ref={staffNameRef}
                        value={staffName} 
                        onChange={(e) => setStaffName(e.target.value)} 
                        className="h-10 text-xs font-medium max-w-xs bg-white" 
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold border-black uppercase bg-black text-white">Public</Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] font-bold uppercase tracking-widest"
                        onClick={() => focusInput(staffNameRef)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-[#e1e3e5]">
                    <TableCell className="pl-6 font-bold text-sm flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" /> Email Address
                    </TableCell>
                    <TableCell className="py-4">
                      <Input 
                        ref={staffEmailRef}
                        value={staffEmail} 
                        onChange={(e) => setStaffEmail(e.target.value)} 
                        className="h-10 text-xs font-medium max-w-xs bg-white" 
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold border-green-200 text-green-700 bg-green-50 uppercase flex items-center gap-1 w-fit">
                        <ShieldCheck className="h-2.5 w-2.5" /> Verified
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] font-bold uppercase tracking-widest"
                        onClick={() => focusInput(staffEmailRef)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-[#e1e3e5]">
                    <TableCell className="pl-6 font-bold text-sm flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" /> Phone Number
                    </TableCell>
                    <TableCell className="py-4">
                      <Input 
                        ref={staffPhoneRef}
                        value={staffPhone} 
                        onChange={(e) => setStaffPhone(e.target.value)} 
                        className="h-10 text-xs font-medium max-w-xs bg-white" 
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold border-gray-200 text-gray-500 uppercase">Private</Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] font-bold uppercase tracking-widest"
                        onClick={() => focusInput(staffPhoneRef)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell className="pl-6 font-bold text-sm flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-400" /> Timezone
                    </TableCell>
                    <TableCell className="py-4">
                      <Input 
                        ref={staffTimezoneRef}
                        value={timezone} 
                        onChange={(e) => setTimezone(e.target.value)} 
                        className="h-10 text-xs font-medium max-w-xs bg-white" 
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold border-blue-200 text-blue-700 bg-blue-50 uppercase flex items-center gap-1 w-fit">
                        <Clock className="h-2.5 w-2.5" /> ON
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] font-bold uppercase tracking-widest"
                        onClick={() => focusInput(staffTimezoneRef)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveStaff} disabled={isSaving} className="bg-black text-white h-12 px-10 font-bold uppercase tracking-[0.2em] text-[10px]">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Commit Staff Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
