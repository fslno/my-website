'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Truck,
  Package,
  MapPin,
  ShieldCheck,
  Globe,
  Zap,
  CheckCircle2,
  Loader2,
  Leaf,
  Navigation,
  Lock,
  Plus,
  Trash2,
  ExternalLink,
  Settings2,
  History,
  RotateCcw,
  ShieldAlert,
  Activity,
  Terminal,
  Clock,
  Info,
  Save,
  Layers,
  Scale,
  RefreshCw,
  DollarSign,
  Trophy,
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function ShippingPage() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'shipping') : null, [db]);
  const storeRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  
  const { data: config, isLoading: loading } = useDoc(configRef);
  const { data: storeConfig, isLoading: storeLoading } = useDoc(storeRef);
  
  const { toast } = useToast();

  const [isAddCarrierOpen, setIsAddCarrierOpen] = useState(false);
  const [editingCarrierIdx, setEditingCarrierIdx] = useState<number | null>(null);
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierType, setNewCarrierType] = useState<'API' | 'SFTP'>('API');
  const [newCarrierApiKey, setNewCarrierApiKey] = useState('');
  const [newCarrierSftp, setNewCarrierSftp] = useState({
    host: '',
    username: '',
    password: '',
    hostKey: '',
    uploadDir: '/upload',
    downloadDir: '/download'
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSftp, setIsTestingSftp] = useState(false);

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupHours, setPickupHours] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [pickupLocationUrl, setPickupLocationUrl] = useState('');

  const [defaultWeight, setDefaultWeight] = useState('');
  const [defaultLength, setDefaultLength] = useState('');
  const [defaultWidth, setDefaultWidth] = useState('');
  const [defaultHeight, setDefaultHeight] = useState('');

  // Origin Address State
  const [originPostalCode, setOriginPostalCode] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originProvince, setOriginProvince] = useState('');
  const [originCountryCode, setOriginCountryCode] = useState('CA');

  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');
  const [baseShippingRate, setBaseShippingRate] = useState('');

  const [provinceRates, setProvinceRates] = useState<any[]>([]);
  const [newProvName, setNewProvName] = useState('');
  const [newProvRate, setNewProvRate] = useState('');
  const [newProvExpressRate, setNewProvExpressRate] = useState('');
  const [newProvExpressActive, setNewProvExpressActive] = useState(false);
  const [newProvCarrier, setNewProvCarrier] = useState('');
  const [newProvEstimate, setNewProvEstimate] = useState('');
  const [newProvExpressEstimate, setNewProvExpressEstimate] = useState('');
  const [newProvNotes, setNewProvNotes] = useState('');
  const [newProvHandlingFee, setNewProvHandlingFee] = useState('');
  const [isProvDialogOpen, setIsProvDialogOpen] = useState(false);
  const [editingProvIdx, setEditingProvIdx] = useState<number | null>(null);
  const [provinceRatesEnabled, setProvinceRatesEnabled] = useState(false);


  useEffect(() => {
    if (config) {
      setPickupAddress(config.pickupAddress || '');
      setPickupHours(config.pickupHours || '');
      setPickupInstructions(config.pickupInstructions || '');
      setPickupLocationUrl(config.pickupLocationUrl || '');
      setDefaultWeight(String(config.defaultWeight || ''));
      setDefaultLength(String(config.defaultLength || ''));
      setDefaultWidth(String(config.defaultWidth || ''));
      setDefaultHeight(String(config.defaultHeight || ''));

      setProvinceRates(config.provinceRates || []);
      setProvinceRatesEnabled(config.provinceRatesEnabled ?? false);

      setFreeShippingEnabled(config.freeShippingEnabled ?? true);
      setFreeShippingThreshold(String(config.freeShippingThreshold ?? '500'));
      setBaseShippingRate(String(config.baseShippingRate ?? config.standardRate ?? '12.99'));
    }
  }, [config]);

  useEffect(() => {
    if (storeConfig) {
      setOriginPostalCode(storeConfig.originPostalCode || '');
      setOriginCity(storeConfig.originCity || '');
      setOriginProvince(storeConfig.originProvince || '');
      setOriginCountryCode(storeConfig.originCountryCode || 'CA');
    }
  }, [storeConfig]);

  const handleInitialize = () => {
    if (!configRef) return;
    const initialData = {
      carriers: [],
      provinceRates: [],
      goGreenPlus: true,
      localPickup: true,
      lockerIntegration: false,
      addressValidation: true,
      ddpEnabled: true,
      returnsEnabled: true,
      restockLogicEnabled: true,
      signatureRequired: true,
      insuranceAutoEnroll: true,
      realTimeTracking: true,
      pickupAddress: '123 Archive Way, London, UK',
      pickupHours: 'Mon-Fri: 10AM - 6PM\nSat: 11AM - 4PM',
      pickupInstructions: 'Please show your order confirmation ID and a ID upon arrival.',
      pickupLocationUrl: '',
      defaultWeight: 0.6,
      defaultLength: 35,
      defaultWidth: 25,
      defaultHeight: 10,
      freeShippingEnabled: true,
      freeShippingThreshold: 500,
      baseShippingRate: 15,
      provinceRatesEnabled: false,
      updatedAt: serverTimestamp()
    };
    setDoc(configRef, initialData).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'create',
        requestResourceData: initialData
      }));
    });
  };

  const handleUpdate = (updates: any) => {
    if (!configRef) return;
    updateDoc(configRef, { ...updates, updatedAt: serverTimestamp() }).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: configRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  const handleTestSftp = async () => {
    if (!newCarrierSftp.host || !newCarrierSftp.username) {
      toast({ 
        title: "Configuration Missing", 
        description: "SFTP Host and Username are required for testing.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingSftp(true);
    try {
      const response = await fetch('/api/shipping/clickship/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCarrierSftp)
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: "Handshake Successful", description: "Secure SFTP connection established." });
      } else {
        toast({ 
          title: "Handshake Failed", 
          description: result.error || "Verify credentials and host keys.",
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({ title: "Network Error", description: "Failed to communicate with synchronization service.", variant: "destructive" });
    } finally {
      setIsTestingSftp(false);
    }
  };

  const handleSaveRates = () => {
    if (!configRef) return;
    setIsSaving(true);
    const updates = {
      freeShippingEnabled,
      freeShippingThreshold: parseFloat(freeShippingThreshold) || 0,
      baseShippingRate: parseFloat(baseShippingRate) || 0,
      updatedAt: serverTimestamp()
    };
    updateDoc(configRef, updates)
      .then(() => {
        setIsSaving(false);
        toast({ title: "Rates Saved", description: "Global shipping cost and threshold updated." });
      })
      .catch((error) => {
        setIsSaving(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: updates
        }));
      });
  };

  const handleSaveProvinceRate = () => {
    if (!newProvName || !configRef) return;
    const rateData = {
      province: newProvName.toUpperCase().trim(),
      rate: parseFloat(newProvRate) || 0,
      express: parseFloat(newProvExpressRate) || 0,
      expressActive: newProvExpressActive,
      carrier: newProvCarrier.trim(),
      estimate: newProvEstimate.trim(),
      expressEstimate: newProvExpressEstimate.trim(),
      notes: newProvNotes.trim(),
      handlingFee: parseFloat(newProvHandlingFee) || 0,
      active: editingProvIdx !== null ? (provinceRates[editingProvIdx].active ?? true) : true
    };

    let updated;
    if (editingProvIdx !== null) {
      updated = [...provinceRates];
      updated[editingProvIdx] = rateData;
    } else {
      updated = [...provinceRates, rateData];
    }

    handleUpdate({ provinceRates: updated });
    setNewProvName('');
    setNewProvRate('');
    setNewProvExpressRate('');
    setNewProvExpressActive(false);
    setNewProvCarrier('');
    setNewProvEstimate('');
    setNewProvExpressEstimate('');
    setNewProvNotes('');
    setNewProvHandlingFee('');
    setEditingProvIdx(null);
    setIsProvDialogOpen(false);
    toast({
      title: editingProvIdx !== null ? "Region Updated" : "Region Ingested",
      description: `${newProvName.toUpperCase()} rates saved.`
    });
  };

  const handleOpenEditProv = (rate: any, idx: number) => {
    setNewProvName(rate.province);
    setNewProvRate(String(rate.rate ?? rate.standard));
    setNewProvExpressRate(String(rate.express || ''));
    setNewProvExpressActive(rate.expressActive ?? false);
    setNewProvCarrier(rate.carrier || '');
    setNewProvEstimate(rate.estimate || '');
    setNewProvExpressEstimate(rate.expressEstimate || '');
    setNewProvNotes(rate.notes || '');
    setNewProvHandlingFee(String(rate.handlingFee || ''));
    setEditingProvIdx(idx);
    setIsProvDialogOpen(true);
  };

  const handleSavePickupDetails = () => {
    if (!configRef) return;
    setIsSaving(true);
    const updates = {
      pickupAddress,
      pickupHours,
      pickupInstructions,
      pickupLocationUrl,
      updatedAt: serverTimestamp()
    };
    updateDoc(configRef, updates)
      .then(() => {
        setIsSaving(false);
        toast({ title: "Saved", description: "Pickup location details updated." });
      })
      .catch((error) => {
        setIsSaving(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: updates
        }));
      });
  };

  const handleSaveGlobalLogistics = () => {
    if (!configRef || !storeRef) return;
    setIsSaving(true);
    
    const shippingUpdates = {
      defaultWeight: parseFloat(defaultWeight) || 0.6,
      defaultLength: parseFloat(defaultLength) || 35,
      defaultWidth: parseFloat(defaultWidth) || 25,
      defaultHeight: parseFloat(defaultHeight) || 10,
      updatedAt: serverTimestamp()
    };

    const storeUpdates = {
      originPostalCode: originPostalCode.toUpperCase().trim(),
      originCity: originCity.toUpperCase().trim(),
      originProvince: originProvince.toUpperCase().trim(),
      originCountryCode: originCountryCode.toUpperCase().trim(),
      updatedAt: serverTimestamp()
    };

    Promise.all([
      updateDoc(configRef, shippingUpdates),
      updateDoc(storeRef, storeUpdates)
    ])
      .then(() => {
        setIsSaving(false);
        toast({ title: "Logistics Synchronized", description: "Default package sizes and origin address updated across manifests." });
      })
      .catch((error) => {
        setIsSaving(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'update',
          requestResourceData: { shippingUpdates, storeUpdates }
        }));
      });
  };

  const handleBatchSyncProducts = async () => {
    if (!db || !config) return;
    setIsSaving(true);

    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);

      const batch = writeBatch(db);
      let updatedCount = 0;

      snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, {
          'logistics.weight': parseFloat(defaultWeight) || 0.6,
          'logistics.length': parseFloat(defaultLength) || 35,
          'logistics.width': parseFloat(defaultWidth) || 25,
          'logistics.height': parseFloat(defaultHeight) || 10,
          'updatedAt': serverTimestamp()
        });
        updatedCount++;
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast({ title: "Success", description: `${updatedCount} products updated with new sizes.` });
      } else {
        toast({ title: "No Action Needed", description: "All products already have size details." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong during the update." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCarrier = () => {
    if (!newCarrierName || !config) return;
    const currentCarriers = Array.isArray(config.carriers) ? [...config.carriers] : [];

    if (editingCarrierIdx !== null) {
      const existing = currentCarriers[editingCarrierIdx];
      currentCarriers[editingCarrierIdx] = {
        ...existing,
        name: newCarrierName,
        type: newCarrierType,
        apiKey: newCarrierType === 'API' ? (newCarrierApiKey || existing.apiKey || 'pending') : undefined,
        sftp: newCarrierType === 'SFTP' ? newCarrierSftp : undefined
      };
      handleUpdate({ carriers: currentCarriers });
      toast({ title: "Carrier Updated", description: `${newCarrierName} protocol synchronized.` });
    } else {
      const exists = currentCarriers.some((c: any) =>
        (typeof c === 'string' ? c === newCarrierName : c.name === newCarrierName)
      );

      if (exists) {
        toast({ variant: "destructive", title: "Already Added", description: "This carrier is already in your manifest." });
        return;
      }

      const updatedCarriers = [
        ...currentCarriers,
        { 
          name: newCarrierName, 
          active: true, 
          type: newCarrierType,
          apiKey: newCarrierType === 'API' ? (newCarrierApiKey || 'pending') : undefined,
          sftp: newCarrierType === 'SFTP' ? newCarrierSftp : undefined
        }
      ];
      handleUpdate({ carriers: updatedCarriers });
      toast({ title: "Success", description: `${newCarrierName} has been added.` });
    }

    setNewCarrierName('');
    setNewCarrierApiKey('');
    setNewCarrierType('API');
    setNewCarrierSftp({
      host: '',
      username: '',
      password: '',
      hostKey: '',
      uploadDir: '/upload',
      downloadDir: '/download'
    });
    setEditingCarrierIdx(null);
    setIsAddCarrierOpen(false);
    setShowApiKey(false);
  };

  const handleOpenEdit = (carrier: any, idx: number) => {
    const name = typeof carrier === 'string' ? carrier : carrier.name;
    const type = typeof carrier === 'string' ? 'API' : (carrier.type || 'API');
    const apiKey = typeof carrier === 'string' ? '' : (carrier.apiKey || '');
    
    setNewCarrierName(name);
    setNewCarrierType(type);
    setNewCarrierApiKey(apiKey === 'pending' ? '' : apiKey);
    if (carrier.sftp) {
      setNewCarrierSftp(carrier.sftp);
    }
    setEditingCarrierIdx(idx);
    setIsAddCarrierOpen(true);
    setShowApiKey(false);
  };

  const handleRemoveCarrier = (name: string) => {
    if (!config) return;
    const updatedCarriers = config.carriers.filter((c: any) =>
      (typeof c === 'string' ? c !== name : c.name !== name)
    );
    handleUpdate({ carriers: updatedCarriers });
    toast({ title: "Removed", description: "Carrier removed from your list." });
  };

  const handleToggleCarrier = (name: string, active: boolean) => {
    if (!config) return;
    const updatedCarriers = config.carriers.map((c: any) => {
      if (typeof c === 'string') return c === name ? { name: c, active } : { name: c, active: true };
      if (c.name === name) return { ...c, active };
      return c;
    });
    handleUpdate({ carriers: updatedCarriers });
  };

  if (loading || storeLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <img src="/icon.png" alt="Loading" className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-pulse" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <Truck className="h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Shipping & Pickup Not Initialized</h2>
        <p className="text-gray-500 max-w-sm">Configure your global carriers, green shipping, and pickup locations to start fulfilling archival orders.</p>
        <Button onClick={handleInitialize} className="bg-black text-white px-8 h-10 font-bold uppercase tracking-widest text-[10px]">Initialize Shipping Core</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Shipping & Pickup</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Manage carriers, green shipping, and pickup locations.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 py-1 px-3 flex items-center gap-2 font-bold uppercase text-[9px] tracking-widest whitespace-nowrap">
            <Zap className="h-3 w-3" /> Rates Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none border-blue-100 bg-blue-50/10">
            <CardHeader className="border-b bg-blue-50/30 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Default Shipping Sizes</CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleBatchSyncProducts}
                    disabled={isSaving}
                    variant="outline"
                    className="h-9 px-4 border-blue-200 text-blue-700 bg-white hover:bg-blue-50 font-bold uppercase tracking-widest text-[9px] gap-2 w-full sm:w-auto"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} <span className="truncate">Apply to All Products</span>
                  </Button>
                  <Button
                    onClick={handleSaveGlobalLogistics}
                    disabled={isSaving}
                    className="h-9 px-6 bg-blue-600 text-white font-bold uppercase tracking-widest text-[9px] gap-2 hover:bg-blue-700 transition-colors w-full sm:w-auto"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Defaults
                  </Button>
                </div>
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight text-blue-800/60 mt-1">Used as fallback for all products and new archival selections.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                    <Scale className="h-3 w-3" /> Weight (kg)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.6"
                    value={defaultWeight}
                    onChange={(e) => setDefaultWeight(e.target.value)}
                    className="h-11 sm:h-12 font-mono bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500">Length (cm)</Label>
                  <Input
                    type="number"
                    placeholder="35"
                    value={defaultLength}
                    onChange={(e) => setDefaultLength(e.target.value)}
                    className="h-11 sm:h-12 font-mono bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500">Width (cm)</Label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={defaultWidth}
                    onChange={(e) => setDefaultWidth(e.target.value)}
                    className="h-11 sm:h-12 font-mono bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500">Height (cm)</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={defaultHeight}
                    onChange={(e) => setDefaultHeight(e.target.value)}
                    className="h-11 sm:h-12 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <h4 className="text-[10px] uppercase font-bold text-blue-800 tracking-widest">Shipping Origin (API Data)</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500">Postal Code</Label>
                    <Input
                      placeholder="M5V 2H1"
                      value={originPostalCode}
                      onChange={(e) => setOriginPostalCode(e.target.value.toUpperCase())}
                      className="h-11 sm:h-12 font-mono bg-white uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500">City</Label>
                    <Input
                      placeholder="TORONTO"
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value.toUpperCase())}
                      className="h-11 sm:h-12 font-bold uppercase bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500">Province (e.g. ON)</Label>
                    <Input
                      placeholder="ON"
                      value={originProvince}
                      onChange={(e) => setOriginProvince(e.target.value.toUpperCase())}
                      className="h-11 sm:h-12 font-bold uppercase bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500">Country Code (e.g. CA)</Label>
                    <Input
                      placeholder="CA"
                      value={originCountryCode}
                      onChange={(e) => setOriginCountryCode(e.target.value.toUpperCase())}
                      className="h-11 sm:h-12 font-bold uppercase bg-white"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none border-emerald-100 bg-emerald-50/5">
            <CardHeader className="border-b bg-emerald-50/30 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Shipping Rate Protocols</CardTitle>
                </div>
                <Button
                  onClick={handleSaveRates}
                  disabled={isSaving}
                  className="h-9 px-6 bg-emerald-600 text-white font-bold uppercase tracking-widest text-[9px] gap-2 hover:bg-emerald-700 transition-colors w-full sm:w-auto"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Protocols
                </Button>
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight text-emerald-800/60 mt-1">Configure global pricing and purchase-triggered free shipping.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] uppercase font-bold text-primary">Free Shipping Trigger</Label>
                      <p className="text-[8px] text-muted-foreground uppercase font-bold">Waive fees based on purchase limit</p>
                    </div>
                    <Switch
                      checked={freeShippingEnabled}
                      onCheckedChange={setFreeShippingEnabled}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                  {freeShippingEnabled && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-[9px] uppercase font-bold text-emerald-700 flex items-center gap-2">
                        <Trophy className="h-3 w-3" /> Min Purchase for Free Shipping ($)
                      </Label>
                      <Input
                        type="number"
                        placeholder="500"
                        value={freeShippingThreshold}
                        onChange={(e) => setFreeShippingThreshold(e.target.value)}
                        className="h-11 sm:h-12 font-mono bg-white border-emerald-200"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Base Shipping Rate ($)</Label>
                      <Input
                        type="number"
                        placeholder="15"
                        value={baseShippingRate}
                        onChange={(e) => setBaseShippingRate(e.target.value)}
                        className="h-11 sm:h-12 font-mono bg-white border-2 border-black/5"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium uppercase tracking-tight italic">
                    This rate applies to all regions unless a manual override or free shipping threshold is met.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none border-purple-100 bg-purple-50/5">
            <CardHeader className="border-b bg-purple-50/30 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Regional Manual Rates</CardTitle>
                  <Switch
                    checked={provinceRatesEnabled}
                    onCheckedChange={(checked) => {
                      setProvinceRatesEnabled(checked);
                      handleUpdate({ provinceRatesEnabled: checked });
                    }}
                    className="ml-2 data-[state=checked]:bg-purple-600"
                  />
                </div>
                <Dialog open={isProvDialogOpen} onOpenChange={(open) => { setIsProvDialogOpen(open); if (!open) { setEditingProvIdx(null); setNewProvName(''); setNewProvRate(''); setNewProvExpressRate(''); setNewProvExpressActive(false); setNewProvCarrier(''); setNewProvEstimate(''); setNewProvExpressEstimate(''); setNewProvNotes(''); setNewProvHandlingFee(''); } }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 font-bold uppercase tracking-widest text-[10px] border-black bg-white w-full sm:w-auto">
                      <Plus className="h-3.5 w-3.5" /> Add Region
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                    <DialogHeader className="pt-8">
                      <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Regional Rate Protocol</DialogTitle>
                      <DialogDescription className="text-xs uppercase font-bold text-muted-foreground mt-1">Define static rates for specific provinces or states.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Province/State Code</Label>
                        <Input placeholder="e.g. ON, QC, NY" value={newProvName} onChange={(e) => setNewProvName(e.target.value.toUpperCase())} className="h-12 uppercase font-bold" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-blue-600">Standard Rate ($)</Label>
                          <Input type="number" placeholder="15" value={newProvRate} onChange={(e) => setNewProvRate(e.target.value)} className="h-12 font-mono border-blue-100" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold text-purple-600">Express Rate ($)</Label>
                            <Switch checked={newProvExpressActive} onCheckedChange={setNewProvExpressActive} />
                          </div>
                  <Input type="number" placeholder="25" value={newProvExpressRate} onChange={(e) => setNewProvExpressRate(e.target.value)} disabled={!newProvExpressActive} className="h-12 font-mono border-purple-100" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-gray-400">Standard Estimate</Label>
                          <Input placeholder="e.g. 5-7 Business Days" value={newProvEstimate} onChange={(e) => setNewProvEstimate(e.target.value)} className="h-12 font-bold text-[10px] uppercase" />
                        </div>
                        <div className="space-y-2">
                          <Label className={cn("text-[10px] uppercase font-bold", newProvExpressActive ? "text-gray-400" : "text-gray-200")}>Express Estimate</Label>
                          <Input placeholder="e.g. 1-2 Business Days" value={newProvExpressEstimate} onChange={(e) => setNewProvExpressEstimate(e.target.value)} disabled={!newProvExpressActive} className="h-12 font-bold text-[10px] uppercase" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-gray-500">Carrier</Label>
                          <Input placeholder="e.g. Canada Post" value={newProvCarrier} onChange={(e) => setNewProvCarrier(e.target.value)} className="h-12 uppercase font-bold text-[10px]" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-gray-500">Handling Fee ($)</Label>
                          <Input type="number" placeholder="0" value={newProvHandlingFee} onChange={(e) => setNewProvHandlingFee(e.target.value)} className="h-12 font-mono" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Description / Notes</Label>
                        <Textarea placeholder="Details about this regional override..." value={newProvNotes} onChange={(e) => setNewProvNotes(e.target.value)} className="min-h-[80px] text-[10px] uppercase font-medium" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveProvinceRate} disabled={!newProvName} className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px]">
                        {editingProvIdx !== null ? 'Update Region' : 'Ingest Region'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight text-purple-800/60 mt-1">Override global rates for specific geographic zones. Click any row to edit.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {provinceRates.map((rate, idx) => (
                  <div
                    key={idx}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer border-b last:border-0"
                    onClick={() => handleOpenEditProv(rate, idx)}
                  >
                    <div className="flex items-start justify-between p-4 sm:p-5 gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={cn("w-10 h-10 rounded border flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-0.5 transition-all", (rate.active ?? true) ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-200')}>
                          {rate.province?.substring(0, 3)}
                        </div>
                        <div className="space-y-2.5 min-w-0 flex-1">
                          {/* Rates */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div className="flex flex-col">
                              <span className={cn("text-[11px] font-bold uppercase text-blue-700", !(rate.active ?? true) && 'text-gray-400')}>STD: ${rate.rate ?? rate.standard}</span>
                              {rate.estimate && <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{rate.estimate}</span>}
                            </div>
                            {rate.expressActive && (
                              <div className="flex flex-col border-l pl-4 border-gray-100">
                                <span className={cn("text-[11px] font-bold uppercase text-purple-700", !(rate.active ?? true) && 'text-gray-400')}>EXP: ${rate.express}</span>
                                {rate.expressEstimate && <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{rate.expressEstimate}</span>}
                              </div>
                            )}
                            {rate.handlingFee > 0 && (
                              <Badge variant="outline" className="text-[8px] font-bold bg-amber-50 text-amber-600 border-amber-100 px-1 py-0 self-start mt-1">+{rate.handlingFee} FEE</Badge>
                            )}
                          </div>
                          {/* Carrier – always visible */}
                          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Truck className="h-3 w-3 shrink-0 text-gray-400" />
                              {rate.carrier ? (
                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{rate.carrier}</span>
                              ) : (
                                <span className="text-[9px] font-medium text-gray-300 uppercase tracking-widest italic">Carrier not set</span>
                              )}
                            </div>
                          </div>
                          {/* Notes / Description – always visible */}
                          {rate.notes ? (
                            <p className="text-[9px] text-gray-500 font-medium leading-relaxed">{rate.notes}</p>
                          ) : (
                            <p className="text-[9px] text-gray-300 font-medium italic">No description — click to add details</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">{(rate.active ?? true) ? 'Active' : 'Off'}</span>
                        <Switch
                          checked={rate.active ?? true}
                          onCheckedChange={(checked) => {
                            const updated = [...provinceRates];
                            updated[idx] = { ...rate, active: checked };
                            handleUpdate({ provinceRates: updated });
                          }}
                          className="data-[state=checked]:bg-purple-600"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-black transition-colors" onClick={() => handleOpenEditProv(rate, idx)}><Edit2 className="h-4 w-4" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = provinceRates.filter((_, i) => i !== idx);
                            handleUpdate({ provinceRates: updated });
                            toast({ title: "Removed", description: "Regional override de-indexed." });
                          }}
                          className="h-9 w-9 text-gray-300 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {provinceRates.length === 0 && (
                  <div className="py-12 text-center bg-gray-50/30">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 italic">No regional overrides manifested.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


          <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-gray-50/50 p-4 sm:p-6 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Shipping Carriers</CardTitle>
                </div>
                <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight text-muted-foreground">Integrate with carriers for live rates.</CardDescription>
              </div>
              <Dialog open={isAddCarrierOpen} onOpenChange={(open) => { setIsAddCarrierOpen(open); if (!open) { setEditingCarrierIdx(null); setNewCarrierName(''); setNewCarrierApiKey(''); setShowApiKey(false); } }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 font-bold uppercase tracking-widest text-[10px] border-black hover:bg-black hover:text-white transition-all w-full sm:w-auto">
                    <Plus className="h-3.5 w-3.5" /> Add Carrier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                  <DialogHeader className="pt-8">
                    <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">
                      {editingCarrierIdx !== null ? 'Edit Carrier' : 'Add Carrier'}
                    </DialogTitle>
                    <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                      {editingCarrierIdx !== null ? 'Update carrier credentials.' : 'Connect a new carrier to your store.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6 max-h-[60vh] overflow-y-auto px-1">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Integration Architecture</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant={newCarrierType === 'API' ? 'default' : 'outline'}
                          onClick={() => setNewCarrierType('API')}
                          className="flex-1 h-11 text-[9px] font-bold uppercase tracking-widest transition-all"
                        >
                          API Protocol
                        </Button>
                        <Button 
                          variant={newCarrierType === 'SFTP' ? 'default' : 'outline'}
                          onClick={() => setNewCarrierType('SFTP')}
                          className="flex-1 h-11 text-[9px] font-bold uppercase tracking-widest transition-all"
                        >
                          SFTP / XML (Clicksip)
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Carrier Label</Label>
                      <Input
                        placeholder="e.g. CLICKSIP GLOBAL"
                        value={newCarrierName}
                        onChange={(e) => setNewCarrierName(e.target.value.toUpperCase())}
                        className="h-12 uppercase font-bold"
                      />
                    </div>
                    
                    {newCarrierType === 'API' ? (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Authoritative API Token</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type={showApiKey ? "text" : "password"}
                            placeholder={editingCarrierIdx !== null ? "••••••••••••••••" : "ENTER API TOKEN"}
                            value={newCarrierApiKey}
                            onChange={(e) => setNewCarrierApiKey(e.target.value)}
                            className="pl-10 pr-10 h-12 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                        <div className="p-4 bg-blue-50 border border-blue-100/50 space-y-4">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-blue-600" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-800">Secure Remote Configuration</p>
                          </div>
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-blue-700">SFTP Server Host / IP</Label>
                              <Input 
                                placeholder="sftp.clickship.com" 
                                value={newCarrierSftp.host}
                                onChange={(e) => setNewCarrierSftp({...newCarrierSftp, host: e.target.value})}
                                className="h-11 bg-white border-blue-100" 
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[9px] uppercase font-bold text-blue-700">Username</Label>
                                <Input 
                                  placeholder="admin_fslno" 
                                  value={newCarrierSftp.username}
                                  onChange={(e) => setNewCarrierSftp({...newCarrierSftp, username: e.target.value})}
                                  className="h-11 bg-white border-blue-100" 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[9px] uppercase font-bold text-blue-700">Password</Label>
                                <Input 
                                  type="password"
                                  placeholder="••••••••" 
                                  value={newCarrierSftp.password}
                                  onChange={(e) => setNewCarrierSftp({...newCarrierSftp, password: e.target.value})}
                                  className="h-11 bg-white border-blue-100" 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-blue-700">Server Host Key</Label>
                              <Input 
                                placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..." 
                                value={newCarrierSftp.hostKey}
                                onChange={(e) => setNewCarrierSftp({...newCarrierSftp, hostKey: e.target.value})}
                                className="h-11 bg-white border-blue-100 font-mono text-[10px]" 
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[9px] uppercase font-bold text-blue-700">Remote Upload Dir</Label>
                                <Input 
                                  placeholder="/upload" 
                                  value={newCarrierSftp.uploadDir}
                                  onChange={(e) => setNewCarrierSftp({...newCarrierSftp, uploadDir: e.target.value})}
                                  className="h-11 bg-white border-blue-100" 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[9px] uppercase font-bold text-blue-700">Remote Download Dir</Label>
                                <Input 
                                  placeholder="/download" 
                                  value={newCarrierSftp.downloadDir}
                                  onChange={(e) => setNewCarrierSftp({...newCarrierSftp, downloadDir: e.target.value})}
                                  className="h-11 bg-white border-blue-100" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={handleTestSftp}
                          disabled={isTestingSftp}
                          className="w-full h-12 border-dashed border-2 border-blue-200 text-blue-600 font-bold uppercase tracking-widest text-[9px] hover:bg-blue-50"
                        >
                          {isTestingSftp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Perform SFTP Handshake Test
                        </Button>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveCarrier} disabled={!newCarrierName} className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px]">
                      {editingCarrierIdx !== null ? 'Update Protocol' : 'Connect Carrier'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {config?.carriers?.map((carrier: any, idx: number) => {
                  const name = typeof carrier === 'string' ? carrier : carrier.name;
                  const active = typeof carrier === 'string' ? true : carrier.active;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors group gap-4 cursor-pointer"
                      onClick={() => handleOpenEdit(carrier, idx)}
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded border flex items-center justify-center font-bold text-xs sm:text-sm transition-all shrink-0", active ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-200')}>
                          {name.substring(0, 2)}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className={cn("text-xs sm:text-sm font-bold uppercase tracking-tight truncate", !active && 'text-gray-400')}>{name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={cn("text-[7px] sm:text-[8px] h-4 font-bold uppercase border-none px-1.5", active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400")}>
                              {active ? 'Active' : 'Disabled'}
                            </Badge>
                            <span className="text-[8px] sm:text-[9px] text-gray-400 font-mono whitespace-nowrap">SYNC: OK</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-3 sm:pt-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(carrier, idx)}
                            className="h-9 w-9 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest sm:hidden">Active</span>
                            <Switch
                              checked={active}
                              onCheckedChange={(checked) => handleToggleCarrier(name, checked)}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCarrier(name)}
                          className="h-9 w-9 text-gray-300 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {(!config?.carriers || config.carriers.length === 0) && (
                  <div className="py-12 text-center bg-gray-50/50 border-dashed border-2 m-4 sm:m-6">
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">No carriers added yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#e1e3e5] shadow-none bg-green-50/30 border-green-100 rounded-none">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Green Shipping</CardTitle>
                  </div>
                  <Switch
                    checked={config.goGreenPlus}
                    onCheckedChange={(checked) => handleUpdate({ goGreenPlus: checked })}
                  />
                </div>
                <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-green-800/60">Offset Carbon Emissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] sm:text-[11px] text-green-800 leading-relaxed uppercase font-medium">
                  Automatically calculate and offset the carbon footprint of your deliveries. Displays a green badge at checkout.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#e1e3e5] shadow-none rounded-none bg-orange-50/20 border-orange-100">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Store Pickup</CardTitle>
                  </div>
                  <Switch
                    checked={config.localPickup}
                    onCheckedChange={(checked) => handleUpdate({ localPickup: checked })}
                  />
                </div>
                <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-orange-800/60">Allow Local Pickup</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] sm:text-[11px] text-orange-800 leading-relaxed uppercase font-medium">
                  Allow customers to pick up their orders in-person. Checkout will only offer this if items are in stock at your location.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="border-b bg-gray-50/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Pickup Location Details</CardTitle>
                </div>
                <Button
                  onClick={handleSavePickupDetails}
                  disabled={isSaving}
                  className="h-10 px-6 bg-black text-white font-bold uppercase tracking-widest text-[10px] gap-2 w-full sm:w-auto"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Info
                </Button>
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight mt-1">Information for customers picking up orders.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6 space-y-8">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                      <Navigation className="h-3 w-3" /> Address
                    </Label>
                    <Input
                      placeholder="Full store address"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="h-11 sm:h-12 uppercase font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" /> Google Maps Link
                    </Label>
                    <Input
                      placeholder="https://maps.google.com/..."
                      value={pickupLocationUrl}
                      onChange={(e) => setPickupLocationUrl(e.target.value)}
                      className="h-11 sm:h-12 text-[10px] font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Opening Hours
                    </Label>
                    <Textarea
                      placeholder="e.g. Mon-Fri: 10AM - 6PM"
                      value={pickupHours}
                      onChange={(e) => setPickupHours(e.target.value)}
                      className="min-h-[100px] uppercase font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                      <Info className="h-3 w-3" /> Special Instructions
                    </Label>
                    <Textarea
                      placeholder="e.g. Bring your order number..."
                      value={pickupInstructions}
                      onChange={(e) => setPickupInstructions(e.target.value)}
                      className="min-h-[100px] uppercase font-medium"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="border-b bg-gray-50/50 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base sm:text-lg uppercase tracking-tight">Returns Management</CardTitle>
                </div>
                <Switch
                  checked={config.returnsEnabled}
                  onCheckedChange={(checked) => handleUpdate({ returnsEnabled: checked })}
                />
              </div>
              <CardDescription className="text-[10px] sm:text-xs uppercase font-bold tracking-tight">Handle customer returns and stock updates.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-sm space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Truck className="h-3 w-3" /> Automated Labels
                    </span>
                    <Badge variant="secondary" className="text-[7px] sm:text-[8px] h-4 font-bold uppercase bg-purple-100 text-purple-700">PRO</Badge>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase leading-relaxed font-medium">Let customers generate their own return labels from their order page.</p>
                </div>
                <div className="p-4 border rounded-sm space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Auto-Restock
                    </span>
                    <Switch
                      checked={config.restockLogicEnabled ?? true}
                      onCheckedChange={(checked) => handleUpdate({ restockLogicEnabled: checked })}
                    />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase leading-relaxed font-medium">Add items back to stock automatically once a return is completed.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#e1e3e5] shadow-none bg-black text-white rounded-none">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" /> Protection
                </CardTitle>
                <Badge variant="outline" className="text-red-400 border-red-400/20 bg-red-400/10 uppercase text-[8px] font-bold">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase">Signature on Delivery</p>
                  <p className="text-[8px] text-gray-500 uppercase font-bold">Extra Security</p>
                </div>
                <Switch
                  checked={config.signatureRequired}
                  onCheckedChange={(checked) => handleUpdate({ signatureRequired: checked })}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase">Shipping Insurance</p>
                  <p className="text-[8px] text-gray-500 uppercase font-bold">Auto-cover high value</p>
                </div>
                <Switch
                  checked={config.insuranceAutoEnroll}
                  onCheckedChange={(checked) => handleUpdate({ insuranceAutoEnroll: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-gray-50 border rounded-sm space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Save Settings
            </h3>
            <p className="text-[9px] sm:text-[10px] text-gray-500 leading-relaxed uppercase font-bold opacity-70">
              Changes saved here will affect live shipping rates and customer pickup options immediately.
            </p>
          </div>

          <Button
            className="w-full bg-black text-white h-14 px-12 font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300"
            onClick={() => toast({ title: "Logistics Synchronized", description: "Global shipping and pickup protocols have been Authoritatively updated." })}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save All Logistics
          </Button>
        </div>
      </div>
    </div>
  );
}
