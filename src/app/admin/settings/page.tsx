
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Upload, 
  Loader2, 
  Save, 
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function SettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: config, loading } = useDoc(configRef);

  const [isSaving, setIsSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Initialize form when data loads
  useEffect(() => {
    if (config) {
      setBusinessName(config.businessName || '');
      setAddress(config.address || '');
      setPhone(config.phone || '');
      setLogoUrl(config.logoUrl || '');
    }
  }, [config]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!configRef) return;
    setIsSaving(true);
    
    const updates = {
      businessName,
      address,
      phone,
      logoUrl,
      updatedAt: new Date().toISOString()
    };

    // Use setDoc with merge: true to initialize if it doesn't exist
    setDoc(configRef, updates, { merge: true })
      .then(() => {
        toast({ title: "Settings Saved", description: "Business identity has been updated." });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Global Settings</h1>
        <p className="text-[#5c5f62] mt-1 text-sm">Configure your store's general information and operational identity.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle className="text-lg">Business Identity</CardTitle>
            </div>
            <CardDescription>
              These details appear on invoices, emails, and in your store footer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="e.g. FSLNO Studio" 
                      value={businessName} 
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="+1 (555) 000-0000" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                    <Textarea 
                      placeholder="123 Archive Way, London, UK" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10 min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Store Logo</Label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  <div 
                    onClick={() => !logoUrl && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-gray-50 group hover:border-black transition-all min-h-[200px] ${!logoUrl ? 'cursor-pointer' : ''}`}
                  >
                    {logoUrl ? (
                      <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden bg-white border shadow-sm">
                        <Image src={logoUrl} alt="Store Logo" fill className="object-contain p-4" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoUrl('');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Upload Store Logo</p>
                          <p className="text-[8px] text-gray-400 mt-1">Recommended: PNG or SVG with transparency</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!logoUrl && (
                    <div className="relative mt-2">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <LinkIcon className="h-3 w-3" />
                      </div>
                      <Input 
                        placeholder="Or paste logo URL..." 
                        value={logoUrl} 
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="h-8 text-[10px] pl-8 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-black text-white h-12 px-10 font-bold uppercase tracking-[0.2em] text-[10px]"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
