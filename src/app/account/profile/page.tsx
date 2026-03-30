'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, MapPin, Phone, Mail, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountLoadingCover } from '@/components/storefront/AccountLoadingCover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function ProfilePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: userLoading } = useDoc(userDocRef);

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    shippingAddress: {
      address: '',
      city: '',
      postalCode: '',
      province: '',
      country: 'Canada'
    }
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || user?.displayName || '',
        phone: userData.phone || '',
        shippingAddress: {
          address: userData.shippingAddress?.address || '',
          city: userData.shippingAddress?.city || '',
          postalCode: userData.shippingAddress?.postalCode || '',
          province: userData.shippingAddress?.province || '',
          country: userData.shippingAddress?.country || 'Canada'
        }
      });
    } else if (user) {
       setFormData(prev => ({
         ...prev,
         displayName: user.displayName || '',
       }));
    }
  }, [userData, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [field]: value.toUpperCase()
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        email: user.email,
        updatedAt: serverTimestamp(),
        // Ensure id exists for backend.json compliance
        id: user.uid,
        role: userData?.role || 'customer',
        createdAt: userData?.createdAt || serverTimestamp()
      }, { merge: true });

      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading) {
    return <AccountLoadingCover />;
  }

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">Profile & Address</h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Update your personal details and default shipping address.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        <Card className="rounded-none border shadow-none">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Full Name</Label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="h-12 rounded-none border-gray-200 uppercase text-xs font-bold"
                  placeholder="YOUR NAME"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-12 pl-10 rounded-none border-gray-200 text-xs font-bold"
                    placeholder="PHONE NUMBER"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2 opacity-60">
                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Email Address (Read-only)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input 
                    value={user?.email || ''} 
                    readOnly
                    className="h-12 pl-10 rounded-none bg-gray-50 border-gray-100 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border shadow-none">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Default Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Street Address</Label>
                <Input 
                  value={formData.shippingAddress.address} 
                  onChange={(e) => handleAddressChange('address', e.target.value)}
                  className="h-12 rounded-none border-gray-200 uppercase text-xs font-bold"
                  placeholder="STREET ADDRESS"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">City</Label>
                  <Input 
                    value={formData.shippingAddress.city} 
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="h-12 rounded-none border-gray-200 uppercase text-xs font-bold"
                    placeholder="CITY"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Postal Code</Label>
                  <Input 
                    value={formData.shippingAddress.postalCode} 
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="h-12 rounded-none border-gray-200 uppercase text-xs font-bold"
                    placeholder="POSTAL CODE"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Province</Label>
                  <Input 
                    value={formData.shippingAddress.province} 
                    onChange={(e) => handleAddressChange('province', e.target.value)}
                    className="h-12 rounded-none border-gray-200 uppercase text-xs font-bold"
                    placeholder="PROVINCE"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Country</Label>
                  <Select 
                    value={formData.shippingAddress.country} 
                    onValueChange={(val) => handleAddressChange('country', val)}
                  >
                    <SelectTrigger className="h-12 rounded-none border-gray-200 uppercase text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border">
                      <SelectItem value="Canada" className="text-xs font-bold uppercase">Canada</SelectItem>
                      <SelectItem value="United States" className="text-xs font-bold uppercase">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-start">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="h-14 px-12 bg-black text-white font-bold uppercase tracking-[0.3em] text-[10px] rounded-none hover:bg-black/90 transition-all shadow-xl"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <Save className="h-4 w-4 mr-3" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
