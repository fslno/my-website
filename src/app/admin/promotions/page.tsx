'use client';

import React, { useState, useEffect } from 'react';
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
import { 
  Plus, 
  TicketPercent, 
  Trash2, 
  Loader2, 
  Zap,
  Gift,
  Save,
  Settings2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PromotionsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const couponsQuery = useMemoFirebase(() => db ? collection(db, 'coupons') : null, [db]);
  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'promotions') : null, [db]);

  const { data: coupons, isLoading: couponsLoading } = useCollection(couponsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: config, loading: configLoading } = useDoc(configRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  // Automation Form State
  const [thresholdEnabled, setThresholdEnabled] = useState(false);
  const [thresholdValue, setThresholdValue] = useState(1000);
  const [thresholdDiscount, setThresholdDiscount] = useState(100);
  
  const [bogoEnabled, setBogoEnabled] = useState(false);
  const [bogoMinQty, setBogoMinQty] = useState(2);
  const [bogoCategoryId, setBogoCategoryId] = useState('');
  const [bogoItemName, setBogoItemName] = useState('Technical Archive Scarf');

  // Coupon Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    if (config) {
      setThresholdEnabled(config.thresholdEnabled ?? false);
      setThresholdValue(config.thresholdValue ?? 1000);
      setThresholdDiscount(config.thresholdDiscount ?? 100);
      setBogoEnabled(config.bogoEnabled ?? false);
      setBogoMinQty(config.bogoMinQty ?? 2);
      setBogoCategoryId(config.bogoCategoryId ?? '');
      setBogoItemName(config.bogoItemName ?? 'Technical Archive Scarf');
    }
  }, [config]);

  const handleSaveConfig = () => {
    if (!configRef) return;
    setIsUpdatingConfig(true);
    const payload = {
      thresholdEnabled,
      thresholdValue: Number(thresholdValue),
      thresholdDiscount: Number(thresholdDiscount),
      bogoEnabled,
      bogoMinQty: Number(bogoMinQty),
      bogoCategoryId,
      bogoItemName,
      updatedAt: new Date().toISOString()
    };

    setDoc(configRef, payload, { merge: true })
      .then(() => {
        toast({ title: "System Updated", description: "Automation logic is now synchronized with the storefront." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configRef.path,
          operation: 'write',
          requestResourceData: payload
        }));
      })
      .finally(() => setIsUpdatingConfig(false));
  };

  const handleSaveCoupon = () => {
    if (!db || !code || !value) return;
    setIsSaving(true);

    const couponData = {
      code: code.toUpperCase().trim(),
      type,
      value: parseFloat(value),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      usedCount: 0,
      active: true,
      updatedAt: new Date().toISOString()
    };

    setDoc(doc(db, 'coupons', couponData.code), couponData)
      .then(() => {
        setIsDialogOpen(false);
        resetForm();
        toast({ title: "Coupon Created", description: `Code ${couponData.code} is now live.` });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `coupons/${couponData.code}`,
          operation: 'write',
          requestResourceData: couponData
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleToggleActive = (coupon: any) => {
    if (!db) return;
    updateDoc(doc(db, 'coupons', coupon.id), { active: !coupon.active })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `coupons/${coupon.id}`,
          operation: 'update',
          requestResourceData: { active: !coupon.active }
        }));
      });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'coupons', id)).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `coupons/${id}`,
        operation: 'delete'
      }));
    });
  };

  const resetForm = () => {
    setCode('');
    setType('percent');
    setValue('');
    setUsageLimit('');
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Rewards & Promotions</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage dynamic discounts, threshold rewards, and automated BOGO logic.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveConfig} disabled={isUpdatingConfig} className="h-10 gap-2 font-bold uppercase tracking-widest text-[10px]">
            {isUpdatingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Automations
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white font-bold h-10 gap-2">
                <Plus className="h-4 w-4" /> Create Archive Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight">New Discount Code</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Code String</Label>
                  <Input 
                    placeholder="e.g. ARCHIVE20" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    className="h-11 uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Discount Type</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Value</Label>
                    <Input 
                      type="number" 
                      placeholder={type === 'percent' ? '20' : '50'} 
                      value={value} 
                      onChange={(e) => setValue(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Usage Limit (Optional)</Label>
                  <Input 
                    type="number" 
                    placeholder="Unlimited" 
                    value={usageLimit} 
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSaveCoupon} 
                  disabled={isSaving || !code || !value}
                  className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Authorize Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`border-[#e1e3e5] shadow-none transition-colors ${thresholdEnabled ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50/50'}`}>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className={`text-xs uppercase tracking-widest flex items-center gap-2 ${thresholdEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
              <Zap className="h-3 w-3" /> System Automation: Threshold
            </CardTitle>
            <Switch checked={thresholdEnabled} onCheckedChange={setThresholdEnabled} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-gray-500">Spend Goal ($)</Label>
                <Input 
                  type="number" 
                  value={thresholdValue} 
                  onChange={(e) => setThresholdValue(Number(e.target.value))}
                  className="h-9 bg-white"
                  disabled={!thresholdEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-gray-500">Instant Discount ($)</Label>
                <Input 
                  type="number" 
                  value={thresholdDiscount} 
                  onChange={(e) => setThresholdDiscount(Number(e.target.value))}
                  className="h-9 bg-white"
                  disabled={!thresholdEnabled}
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed italic">
              When ON, subtotal logic triggers deduction at the target value. The bag progress bar will adjust automatically.
            </p>
          </CardContent>
        </Card>

        <Card className={`border-[#e1e3e5] shadow-none transition-colors ${bogoEnabled ? 'bg-orange-50/30 border-orange-100' : 'bg-gray-50/50'}`}>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className={`text-xs uppercase tracking-widest flex items-center gap-2 ${bogoEnabled ? 'text-orange-600' : 'text-gray-400'}`}>
              <Gift className="h-3 w-3" /> System Automation: BOGO
            </CardTitle>
            <Switch checked={bogoEnabled} onCheckedChange={setBogoEnabled} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-gray-500">Trigger Quantity</Label>
                <Input 
                  type="number" 
                  value={bogoMinQty} 
                  onChange={(e) => setBogoMinQty(Number(e.target.value))}
                  className="h-9 bg-white"
                  disabled={!bogoEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-gray-500">Target Collection</Label>
                <Select value={bogoCategoryId} onValueChange={setBogoCategoryId} disabled={!bogoEnabled}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue placeholder="Select Collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] uppercase font-bold text-gray-500">Reward Item Descriptor</Label>
              <Input 
                value={bogoItemName} 
                onChange={(e) => setBogoItemName(e.target.value)}
                className="h-9 bg-white"
                disabled={!bogoEnabled}
                placeholder="e.g. Free Technical Scarf"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <TicketPercent className="h-4 w-4" /> Active Archive Codes
          </h3>
          <span className="text-[10px] font-bold text-gray-400">{coupons?.length || 0} TOTAL</span>
        </div>
        <Table>
          <TableHeader className="bg-gray-50/20">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6">Archive Code</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Benefit</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Usage</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {couponsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                </TableCell>
              </TableRow>
            ) : !coupons || coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-gray-400 font-medium">No archive codes found.</TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon: any) => (
                <TableRow key={coupon.id} className="hover:bg-gray-50/30">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                        <TicketPercent className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="font-bold text-sm tracking-tight">{coupon.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">
                      {coupon.type === 'percent' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{coupon.usedCount || 0} REDEEMED</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-tighter">LIMIT: {coupon.usageLimit || 'UNLIMITED'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Switch 
                        checked={coupon.active} 
                        onCheckedChange={() => handleToggleActive(coupon)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2 pr-6">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(coupon.id)}
                        className="h-8 w-8 hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
