'use client';

import React, { useState } from 'react';
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
  CheckCircle2, 
  XCircle,
  Zap,
  Gift
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
  const { data: coupons, isLoading } = useCollection(couponsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const handleSave = () => {
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Archive Rewards & Promotions</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage dynamic discounts, threshold rewards, and automated BOGO logic.</p>
        </div>
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
                onClick={handleSave} 
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#e1e3e5] shadow-none bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-blue-600 flex items-center gap-2">
              <Zap className="h-3 w-3" /> System Automation: Threshold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold">Spend $1,000, Get $100 Off</p>
            <p className="text-xs text-gray-500 mt-1">Automatic deduction applied at subtotal verification. Includes progress tracking UI in user bag.</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none bg-orange-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-orange-600 flex items-center gap-2">
              <Gift className="h-3 w-3" /> System Automation: BOGO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold">2+ Jerseys = Free Archive Scarf</p>
            <p className="text-xs text-gray-500 mt-1">Dynamic category detection. Promotional item injected at $0.00 valuation upon criteria match.</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6">Archive Code</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Benefit</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Usage</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
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
