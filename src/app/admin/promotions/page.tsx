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
  Settings2,
  Star,
  Share2,
  Clock,
  CheckCircle2,
  X,
  Target,
  Sparkles,
  MousePointer2,
  RefreshCw,
  Mail,
  Activity,
  ChevronRight,
  ChevronDown
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
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, setDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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

  // FLASH SALE STATE
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashValue, setFlashValue] = useState(15);
  const [flashLabel, setFlashValueLabel] = useState('ARCHIVAL DISPATCH');

  // THRESHOLD STATE
  const [thresholdEnabled, setThresholdEnabled] = useState(false);
  const [thresholdValue, setThresholdValue] = useState(1000);
  const [thresholdDiscount, setThresholdDiscount] = useState(100);
  
  // BOGO STATE
  const [bogoEnabled, setBogoEnabled] = useState(false);
  const [bogoMinQty, setBogoMinQty] = useState(2);
  const [bogoCategoryIds, setBogoCategoryIds] = useState<string[]>([]);
  const [bogoItemName, setBogoItemName] = useState('Technical Archive Scarf');
  const [bogoMode, setBogoMode] = useState<'fixed' | 'choice'>('fixed');

  // LOYALTY STATE
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyMinOrders, setLoyaltyMinOrders] = useState(2);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(10);

  // REFERRAL STATE
  const [referralEnabled, setReferralEnabled] = useState(false);
  const [referralValue, setReferralValue] = useState(20);

  // Coupon Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    if (config) {
      setFlashEnabled(config.flashEnabled ?? false);
      setFlashValue(config.flashValue ?? 15);
      setFlashLabel(config.flashLabel ?? 'ARCHIVAL DISPATCH');

      setThresholdEnabled(config.thresholdEnabled ?? false);
      setThresholdValue(config.thresholdValue ?? 1000);
      setThresholdDiscount(config.thresholdDiscount ?? 100);

      setBogoEnabled(config.bogoEnabled ?? false);
      setBogoMinQty(config.bogoMinQty ?? 2);
      
      // Support legacy bogoCategoryId or new bogoCategoryIds array
      const legacyId = config.bogoCategoryId;
      const pluralIds = config.bogoCategoryIds;
      setBogoCategoryIds(Array.isArray(pluralIds) ? pluralIds : (legacyId ? [legacyId] : []));
      
      setBogoItemName(config.bogoItemName ?? 'Technical Archive Scarf');
      setBogoMode(config.bogoMode ?? 'fixed');

      setLoyaltyEnabled(config.loyaltyEnabled ?? false);
      setLoyaltyMinOrders(config.loyaltyMinOrders ?? 2);
      setLoyaltyDiscount(config.loyaltyDiscount ?? 10);

      setReferralEnabled(config.referralEnabled ?? false);
      setReferralValue(config.referralValue ?? 20);
    }
  }, [config]);

  const handleSaveConfig = () => {
    if (!configRef) return;
    setIsUpdatingConfig(true);
    const payload = {
      flashEnabled,
      flashValue: Number(flashValue),
      flashLabel,
      thresholdEnabled,
      thresholdValue: Number(thresholdValue),
      thresholdDiscount: Number(thresholdDiscount),
      bogoEnabled,
      bogoMinQty: Number(bogoMinQty),
      bogoCategoryIds,
      bogoItemName,
      bogoMode,
      loyaltyEnabled,
      loyaltyMinOrders: Number(loyaltyMinOrders),
      loyaltyDiscount: Number(loyaltyDiscount),
      referralEnabled,
      referralValue: Number(referralValue),
      updatedAt: serverTimestamp()
    };

    setDoc(configRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Automation Synchronized", description: "Global growth protocols are now Authoritatively live." });
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
      updatedAt: serverTimestamp()
    };

    setDoc(doc(db, 'coupons', couponData.code), couponData)
      .then(() => {
        setIsDialogOpen(false);
        resetForm();
        toast({ title: "Coupon Authorized", description: `Archive code ${couponData.code} is now live.` });
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

  const recoveryCampaigns = [
    { id: 'cartRecovery', label: 'Abandoned Cart Recovery', description: 'Triggered 4h after last archival session.', status: 'Live', conversion: '12.4%' },
    { id: 'browseRecovery', label: 'Browse Abandonment', description: 'Target high-intent silhouettes recently viewed.', status: 'Testing', conversion: '4.8%' },
    { id: 'winback', label: 'Win-back Dispatch', description: 'Sent 60 days after last drop participation.', status: 'Inactive', conversion: '--' },
    { id: 'loyaltyAppreciation', label: 'Loyalty Appreciation', description: 'Personalized reward for repeat archive members.', status: 'Live', conversion: '22.1%' }
  ];

  const getCategoryDisplay = () => {
    if (bogoCategoryIds.length === 0) return "SELECT COLLECTIONS";
    if (bogoCategoryIds.length === 1) {
      return categories?.find(c => c.id === bogoCategoryIds[0])?.name || "1 COLLECTION";
    }
    return `${bogoCategoryIds.length} COLLECTIONS SELECTED`;
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Growth & Rewards Orchestration</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Orchestrate automated discounts, loyalty handshakes, and technical promo logic.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveConfig} disabled={isUpdatingConfig} className="h-10 gap-2 font-bold uppercase tracking-widest text-[10px] border-black">
            {isUpdatingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Protocols
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white font-bold h-10 gap-2">
                <Plus className="h-4 w-4" /> Create Archive Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border-none rounded-none shadow-2xl">
              <DialogHeader className="pt-8">
                <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">New Deduction Manifest</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Archive Code String</Label>
                  <Input 
                    placeholder="e.g. DROP777" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    className="h-12 uppercase font-bold text-sm tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Discount Protocol</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent" className="font-bold text-[10px] uppercase">Percentage (%)</SelectItem>
                        <SelectItem value="fixed" className="font-bold text-[10px] uppercase">Fixed Amount ($)</SelectItem>
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
                      className="h-12 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Redemption Limit (Optional)</Label>
                  <Input 
                    type="number" 
                    placeholder="Unlimited" 
                    value={usageLimit} 
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSaveCoupon} 
                  disabled={isSaving || !code || !value}
                  className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px]"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Authorize Manifest
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={cn("border-[#e1e3e5] shadow-none transition-all duration-500", flashEnabled ? 'bg-black text-white ring-2 ring-black' : 'bg-gray-50/50')}>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle className={cn("text-xs uppercase tracking-widest flex items-center gap-2", flashEnabled ? 'text-orange-400' : 'text-gray-400')}>
                    <Zap className="h-3.5 w-3.5" /> Flash Dispatch
                  </CardTitle>
                  <CardDescription className={cn("text-[9px] uppercase font-bold", flashEnabled ? 'text-zinc-500' : '')}>Sitewide percentage deduction.</CardDescription>
                </div>
                <Switch checked={flashEnabled} onCheckedChange={setFlashEnabled} className="data-[state=checked]:bg-orange-500" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn("text-[9px] uppercase font-bold", flashEnabled ? 'text-zinc-400' : 'text-gray-500')}>Deduction (%)</Label>
                    <Input 
                      type="number" 
                      value={flashValue} 
                      onChange={(e) => setFlashValue(Number(e.target.value))}
                      className="h-10 bg-white text-black"
                      disabled={!flashEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn("text-[9px] uppercase font-bold", flashEnabled ? 'text-zinc-400' : 'text-gray-500')}>Sale Label</Label>
                    <Input 
                      value={flashLabel} 
                      onChange={(e) => setFlashValueLabel(e.target.value.toUpperCase())}
                      className="h-10 bg-white text-black text-[9px] font-bold tracking-widest"
                      disabled={!flashEnabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn("border-[#e1e3e5] shadow-none transition-all duration-500", thresholdEnabled ? 'bg-blue-50/30 border-blue-200' : 'bg-gray-50/50')}>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle className={cn("text-xs uppercase tracking-widest flex items-center gap-2", thresholdEnabled ? 'text-blue-600' : 'text-gray-400')}>
                    <Clock className="h-3.5 w-3.5" /> Spend Threshold
                  </CardTitle>
                  <CardDescription className="text-[9px] uppercase font-bold">Reward high-value selections.</CardDescription>
                </div>
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
                      className="h-10 bg-white"
                      disabled={!thresholdEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-bold text-gray-500">Discount ($)</Label>
                    <Input 
                      type="number" 
                      value={thresholdDiscount} 
                      onChange={(e) => setThresholdDiscount(Number(e.target.value))}
                      className="h-10 bg-white"
                      disabled={!thresholdEnabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={cn("border-[#e1e3e5] shadow-none transition-all duration-500", bogoEnabled ? 'bg-emerald-50/20 border-emerald-200' : 'bg-gray-50/50')}>
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
              <div className="space-y-1">
                <CardTitle className={cn("text-xs uppercase tracking-widest flex items-center gap-2", bogoEnabled ? 'text-emerald-600' : 'text-gray-400')}>
                  <Gift className="h-4 w-4" /> Archival BOGO Protocol
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-tight">Configure buy-one-get-one logic with customer choices.</CardDescription>
              </div>
              <Switch checked={bogoEnabled} onCheckedChange={setBogoEnabled} className="data-[state=checked]:bg-emerald-600" />
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500">Trigger Quantity</Label>
                  <Input 
                    type="number" 
                    value={bogoMinQty} 
                    onChange={(e) => setBogoMinQty(Number(e.target.value))}
                    className="h-11 bg-white"
                    disabled={!bogoEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500">Target Categories</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full h-11 bg-white justify-between text-[10px] font-bold uppercase tracking-widest px-3 border-[#e1e3e5]"
                        disabled={!bogoEnabled}
                      >
                        <span className="truncate">{getCategoryDisplay()}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-white border rounded-sm shadow-xl" align="start">
                      <ScrollArea className="h-[250px] p-4">
                        <div className="space-y-4">
                          {categories?.map((cat: any) => (
                            <div key={cat.id} className="flex items-center space-x-3 group">
                              <Checkbox 
                                id={`bogo-cat-${cat.id}`} 
                                checked={bogoCategoryIds.includes(cat.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setBogoCategoryIds([...bogoCategoryIds, cat.id]);
                                  } else {
                                    setBogoCategoryIds(bogoCategoryIds.filter(id => id !== cat.id));
                                  }
                                }}
                                className="border-[#e1e3e5]"
                              />
                              <Label 
                                htmlFor={`bogo-cat-${cat.id}`} 
                                className="text-[10px] font-bold uppercase tracking-widest cursor-pointer text-primary group-hover:text-primary/70 transition-colors"
                              >
                                {cat.name}
                              </Label>
                            </div>
                          ))}
                          {(!categories || categories.length === 0) && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-8">No collections cataloged.</p>
                          )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500">BOGO Mode</Label>
                  <Select value={bogoMode} onValueChange={(v: any) => setBogoMode(v)} disabled={!bogoEnabled}>
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed" className="text-[10px] font-bold uppercase">Fixed Gift</SelectItem>
                      <SelectItem value="choice" className="text-[10px] font-bold uppercase">Customer Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-gray-500">Reward Item Descriptor</Label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <Input 
                    value={bogoItemName} 
                    onChange={(e) => setBogoItemName(e.target.value)}
                    className="h-12 bg-white pl-10 font-bold uppercase text-[10px] tracking-widest"
                    disabled={!bogoEnabled}
                    placeholder="e.g. COMPLIMENTARY TECHNICAL SCARF"
                  />
                </div>
                {bogoMode === 'choice' && (
                  <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-tight mt-2 flex items-center gap-1.5">
                    <MousePointer2 className="h-3 w-3" /> Customer will pick one free item from the target category at checkout.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Recovery & Retention Campaigns</h3>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[9px] font-bold px-3 py-1">AUTOMATED</Badge>
            </div>
            
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b border-black/5">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6 text-gray-500">Campaign Logic</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Automated Dispatch</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center text-gray-500">Conversion</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center text-gray-500">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recoveryCampaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="hover:bg-gray-50/30 transition-all border-b border-black/5 last:border-0 group">
                      <TableCell className="p-6">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded border flex items-center justify-center shadow-sm bg-white", campaign.status === 'Live' ? 'border-green-100' : 'border-gray-100')}>
                            <Mail className={cn("h-5 w-5", campaign.status === 'Live' ? 'text-green-600' : 'text-gray-400')} />
                          </div>
                          <span className="font-bold text-sm tracking-tight text-primary uppercase">{campaign.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-medium text-gray-500 uppercase leading-relaxed">{campaign.description}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-primary">{campaign.conversion}</span>
                          <Activity className="h-3 w-3 text-gray-300 mt-1" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-widest border-none", 
                            campaign.status === 'Live' ? "bg-green-50 text-green-700" : 
                            campaign.status === 'Testing' ? "bg-blue-50 text-blue-700" : 
                            "bg-gray-100 text-gray-400")}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-6">
            <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                <TicketPercent className="h-4 w-4 text-purple-500" /> Authorized Deduction Manifest
              </h3>
              <Badge variant="secondary" className="bg-black text-white text-[9px] font-bold px-3 py-1">{coupons?.length || 0} TOTAL</Badge>
            </div>
            <div className="bg-white border rounded-b-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50/20">
                  <TableRow className="border-b border-black/5">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6 text-gray-500">Manifest ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Protocol</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Redemptions</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center text-gray-500">Auth Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
                  ) : !coupons || coupons.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">No deductive handshakes cataloged.</TableCell></TableRow>
                  ) : (
                    coupons.map((coupon: any) => (
                      <TableRow key={coupon.id} className="hover:bg-gray-50/30 transition-all border-b border-black/5 last:border-0 group">
                        <TableCell className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded border bg-white flex items-center justify-center shadow-sm">
                              <TicketPercent className="h-5 w-5 text-gray-400" />
                            </div>
                            <span className="font-bold text-sm tracking-widest text-primary uppercase">{coupon.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border-purple-100">
                            {coupon.type === 'percent' ? `${coupon.value}% DEDUCTION` : `$${coupon.value} DEDUCTION`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary">{coupon.usedCount || 0} REDEEMED</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">LIMIT: {coupon.usageLimit || '∞'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Switch 
                              checked={coupon.active} 
                              onCheckedChange={() => handleToggleActive(coupon)}
                              className="data-[state=checked]:bg-black"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end pr-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(coupon.id)}
                              className="h-9 w-9 hover:bg-red-50 text-red-500"
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
          </section>
        </div>

        <div className="xl:col-span-4 space-y-8">
          <Card className={cn("border-[#e1e3e5] shadow-none transition-all duration-500", loyaltyEnabled ? 'bg-purple-50/30 border-purple-200' : 'bg-gray-50/50')}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-[10px] uppercase tracking-widest font-bold flex items-center gap-2", loyaltyEnabled ? 'text-purple-600' : 'text-gray-400')}>
                  <Star className="h-3.5 w-3.5" /> Archive Loyalty
                </CardTitle>
                <Switch checked={loyaltyEnabled} onCheckedChange={setLoyaltyEnabled} className="data-[state=checked]:bg-purple-600" />
              </div>
              <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Auto-rewards for repeat participants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500">Unlock on Order #</Label>
                  <Input 
                    type="number" 
                    value={loyaltyMinOrders} 
                    onChange={(e) => setLoyaltyMinOrders(Number(e.target.value))}
                    className="h-10 bg-white"
                    disabled={!loyaltyEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-500">Loyalty Discount (%)</Label>
                  <Input 
                    type="number" 
                    value={loyaltyDiscount} 
                    onChange={(e) => setLoyaltyDiscount(Number(e.target.value))}
                    className="h-10 bg-white"
                    disabled={!loyaltyEnabled}
                  />
                </div>
              </div>
              <p className="text-[9px] text-zinc-500 uppercase leading-relaxed font-medium">
                Verified members Authoritatively receive this deduction on their {loyaltyMinOrders === 2 ? 'second' : `${loyaltyMinOrders}th`} order manifest.
              </p>
            </CardContent>
          </Card>

          <Card className={cn("border-[#e1e3e5] shadow-none transition-all duration-500", referralEnabled ? 'bg-pink-50/30 border-pink-200' : 'bg-gray-50/50')}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-[10px] uppercase tracking-widest font-bold flex items-center gap-2", referralEnabled ? 'text-pink-600' : 'text-gray-400')}>
                  <Share2 className="h-3.5 w-3.5" /> Referral Handshake
                </CardTitle>
                <Switch checked={referralEnabled} onCheckedChange={setReferralEnabled} className="data-[state=checked]:bg-pink-600" />
              </div>
              <CardDescription className="text-[9px] uppercase font-bold tracking-tight">Incentivize archival sharing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-gray-500">Referee Credit ($)</Label>
                <Input 
                  type="number" 
                  value={referralValue} 
                  onChange={(e) => setReferralValue(Number(e.target.value))}
                  className="h-10 bg-white"
                  disabled={!referralEnabled}
                />
              </div>
              <div className="p-4 bg-white/50 border border-dashed rounded-sm">
                <p className="text-[9px] text-zinc-500 uppercase leading-relaxed font-bold">
                  REFERRER BONUS: 500 STUDIO POINTS
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-black text-white space-y-4 shadow-xl">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-zinc-400">
              <Target className="h-3.5 w-3.5 text-blue-400" /> Promotion Integrity
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase font-medium">
              Promotion protocol changes Authoritatively synchronize with the bag calculation engine in real-time.
            </p>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
              <span>Status</span>
              <span className="text-green-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Real-time Sync Active
              </span>
            </div>
          </div>

          <Button 
            className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300" 
            onClick={handleSaveConfig} 
            disabled={isUpdatingConfig}
          >
            {isUpdatingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Authorize All Protocols
          </Button>
        </div>
      </div>
    </div>
  );
}
