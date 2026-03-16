'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Truck, 
  Store, 
  ChevronLeft, 
  Package,
  AlertCircle,
  Loader2,
  Tag,
  X,
  CreditCard,
  CheckCircle2,
  Calendar,
  Sparkles,
  MessageSquare,
  Globe,
  ShieldCheck,
  MapPin,
  Search
} from 'lucide-react';
import { useCart, type Coupon } from '@/context/CartContext';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { PayPalPayment } from '@/components/storefront/PayPalPayment';
import { StallionRates } from '@/components/storefront/StallionRates';

type DeliveryMethod = 'shipping' | 'pickup';

const TAX_RATES: Record<string, number> = {
  'ON': 0.13, 'BC': 0.12, 'QC': 0.14975, 'AB': 0.05, 'MB': 0.12, 'NB': 0.15, 'NL': 0.15, 'NS': 0.15, 'PE': 0.15, 'SK': 0.11, 'NY': 0.08875, 'CA': 0.0725, 'TX': 0.0625, 'FL': 0.06, 'DEFAULT': 0.10
};

export default function CheckoutPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { cart, cartSubtotal, cartCount, clearCart, updateCartItem, discountTotal, totalBeforeTax, appliedCoupon, applyCoupon } = useCart();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const paymentConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: paymentConfig } = useDoc(paymentConfigRef);

  const shippingConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'shipping') : null, [db]);
  const { data: shippingConfig } = useDoc(shippingConfigRef);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [selectedPayment, setSelectedPayment] = useState<string>('paypal');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingRate, setShippingRate] = useState<number>(0);
  const [stallionRateId, setStallionRateId] = useState<string>('');
  const [couponInput, setCouponInput] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: '', phone: '', name: '', address: '', city: '', postalCode: '', province: '', country: 'Canada',
    billingAddress: '', billingCity: '', billingPostalCode: '', billingProvince: '', billingCountry: 'Canada',
    courier: '', referral: '', pickupDate: '', pickupTime: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const isFreeShippingEligible = useMemo(() => {
    if (!shippingConfig?.freeShippingEnabled) return false;
    const threshold = Number(shippingConfig.freeShippingThreshold) || 500;
    return cartSubtotal >= threshold;
  }, [shippingConfig, cartSubtotal]);

  const handleRateSelect = (rate: any) => {
    setShippingRate(isFreeShippingEligible ? 0 : rate.totalCost);
    setStallionRateId(rate.id);
    setFormData(prev => ({ ...prev, courier: rate.service }));
  };

  const isTaxReady = useMemo(() => {
    if (deliveryMethod === 'shipping') return billingSameAsShipping ? !!formData.province : !!formData.billingProvince;
    return !!formData.billingProvince;
  }, [deliveryMethod, billingSameAsShipping, formData.province, formData.billingProvince]);

  const isShippingReady = useMemo(() => {
    if (deliveryMethod === 'shipping') return !!formData.courier || isFreeShippingEligible;
    return true; 
  }, [deliveryMethod, formData.courier, isFreeShippingEligible]);

  const isSummaryReady = isTaxReady && isShippingReady;

  const calculatedTax = useMemo(() => {
    if (!isTaxReady) return 0;
    const province = deliveryMethod === 'shipping' ? (billingSameAsShipping ? formData.province : formData.billingProvince) : formData.billingProvince;
    const rate = TAX_RATES[province.toUpperCase()] || TAX_RATES['DEFAULT'];
    return totalBeforeTax * rate;
  }, [totalBeforeTax, formData.province, formData.billingProvince, deliveryMethod, billingSameAsShipping, isTaxReady]);

  const finalTotal = useMemo(() => totalBeforeTax + calculatedTax + shippingRate, [totalBeforeTax, calculatedTax, shippingRate]);

  const currentOrderData = useMemo(() => ({
    userId: user?.uid || 'guest', email: formData.email,
    customer: {
      name: formData.name, phone: formData.phone,
      shipping: deliveryMethod === 'shipping' ? { address: formData.address, city: formData.city, postalCode: formData.postalCode, province: formData.province, country: formData.country } : null,
      billing: {
        address: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.address : formData.billingAddress,
        city: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.city : formData.billingCity,
        postalCode: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.postalCode : formData.billingPostalCode,
        province: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.province : formData.billingProvince,
        country: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.country : formData.billingCountry,
      }
    },
    items: cart, subtotal: cartSubtotal, discountTotal: discountTotal, couponCode: appliedCoupon?.code || null,
    tax: calculatedTax, shipping: shippingRate, total: finalTotal, deliveryMethod, courier: formData.courier,
    stallionRateId: stallionRateId, paymentMethod: selectedPayment || 'paypal', referral: formData.referral, note: orderNote,
    pickupDate: deliveryMethod === 'pickup' ? formData.pickupDate : null, pickupTime: deliveryMethod === 'pickup' ? formData.pickupTime : null,
  }), [user, formData, deliveryMethod, cart, cartSubtotal, discountTotal, appliedCoupon, calculatedTax, shippingRate, finalTotal, selectedPayment, orderNote, billingSameAsShipping, stallionRateId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleUppercaseInput = (field: string, value: string) => handleInputChange(field, value.toUpperCase());

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.email) newErrors.email = true;
    if (!formData.phone) newErrors.phone = true;
    if (!formData.name) newErrors.name = true;
    if (!formData.referral) newErrors.referral = true;
    
    if (deliveryMethod === 'shipping') {
      if (!formData.address) newErrors.address = true;
      if (!formData.city) newErrors.city = true;
      if (!formData.postalCode) newErrors.postalCode = true;
      if (!formData.province) newErrors.province = true;
      if (!formData.courier && !isFreeShippingEligible) newErrors.courier = true;
      
      if (!billingSameAsShipping) {
        if (!formData.billingAddress) newErrors.billingAddress = true;
        if (!formData.billingCity) newErrors.billingCity = true;
        if (!formData.billingPostalCode) newErrors.billingPostalCode = true;
        if (!formData.billingProvince) newErrors.billingProvince = true;
      }
    } else {
      if (!formData.billingAddress) newErrors.billingAddress = true;
      if (!formData.billingCity) newErrors.billingCity = true;
      if (!formData.billingPostalCode) newErrors.billingPostalCode = true;
      if (!formData.billingProvince) newErrors.billingProvince = true;
      if (!formData.pickupDate) newErrors.pickupDate = true;
      if (!formData.pickupTime) newErrors.pickupTime = true;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidateCoupon = async () => {
    if (!db || !couponInput) return;
    setIsValidatingCoupon(true);
    try {
      const couponDoc = await getDoc(doc(db, 'coupons', couponInput.toUpperCase()));
      if (couponDoc.exists()) {
        const data = couponDoc.data() as Coupon;
        if (data.active) { applyCoupon(data); toast({ title: "Applied", description: `Discount verified.` }); setCouponInput(''); }
        else toast({ variant: "destructive", title: "Error", description: "Code inactive." });
      } else toast({ variant: "destructive", title: "Error", description: "Invalid code." });
    } catch (e) { toast({ variant: "destructive", title: "Error", description: "Verification failed." }); }
    finally { setIsValidatingCoupon(false); }
  };

  const handlePayPalSuccess = (firestoreId: string) => {
    setConfirmedOrder({ ...currentOrderData, id: firestoreId });
    setShowSuccessDialog(true);
    clearCart();
  };

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 py-12 px-4">
      <div className="lg:col-span-7 space-y-12">
        <section className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">01. Delivery</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setDeliveryMethod('shipping'); setShippingRate(0); setErrors({}); }} className={cn("p-6 border-2 text-left flex flex-col gap-3 transition-all duration-300", deliveryMethod === 'shipping' ? "border-primary bg-white shadow-lg" : "border-gray-200 bg-gray-50/50")}>
              <Truck className={cn("h-6 w-6", deliveryMethod === 'shipping' ? "text-primary" : "text-muted-foreground")} />
              <div><p className={cn("text-[11px] font-bold uppercase tracking-widest", deliveryMethod === 'shipping' ? "text-primary" : "text-muted-foreground")}>Shipping</p><p className="text-[10px] text-muted-foreground mt-1">Deliver to address</p></div>
            </button>
            <button onClick={() => { setDeliveryMethod('pickup'); setShippingRate(0); setErrors({}); }} className={cn("p-6 border-2 text-left flex flex-col gap-3 transition-all duration-300", deliveryMethod === 'pickup' ? "border-primary bg-white shadow-lg" : "border-gray-200 bg-gray-50/50")}>
              <Store className={cn("h-6 w-6", deliveryMethod === 'pickup' ? "text-primary" : "text-muted-foreground")} />
              <div><p className={cn("text-[11px] font-bold uppercase tracking-widest", deliveryMethod === 'pickup' ? "text-primary" : "text-muted-foreground")}>Pickup</p><p className="text-[10px] text-muted-foreground mt-1">Pick up in-person</p></div>
            </button>
          </div>
        </section>
        
        <section className="space-y-8 bg-white p-8 border shadow-sm rounded-none">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">02. Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="email" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.email ? "text-destructive" : "text-muted-foreground")}>Email</Label><Input id="email" className="h-12 bg-[#F9F9F9] uppercase rounded-none" value={formData.email} onChange={(e) => handleUppercaseInput('email', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="tel" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.phone ? "text-destructive" : "text-muted-foreground")}>Phone</Label><Input id="tel" className="h-12 bg-[#F9F9F9] rounded-none" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
            <div className="md:col-span-2 space-y-2"><Label htmlFor="name" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.name ? "text-destructive" : "text-muted-foreground")}>Full Name</Label><Input id="name" className="h-12 bg-[#F9F9F9] uppercase rounded-none" value={formData.name} onChange={(e) => handleUppercaseInput('name', e.target.value)} /></div>
          </div>

          {deliveryMethod === 'shipping' ? (
            <div className="space-y-10 pt-4 border-t">
              <div className="grid gap-4">
                <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.address ? "text-destructive" : "text-muted-foreground")}>Shipping Address</Label><Input value={formData.address} onChange={(e) => handleUppercaseInput('address', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.city ? "text-destructive" : "text-muted-foreground")}>City</Label><Input value={formData.city} onChange={(e) => handleUppercaseInput('city', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                  <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.postalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input value={formData.postalCode} onChange={(e) => handleUppercaseInput('postalCode', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.province ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input value={formData.province} onChange={(e) => handleUppercaseInput('province', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                  <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Country</Label><Select value={formData.country} onValueChange={(val) => handleInputChange('country', val)}><SelectTrigger className="h-12 rounded-none bg-[#F9F9F9] uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox id="billing-same" checked={billingSameAsShipping} onCheckedChange={(checked) => setBillingSameAsShipping(checked === true)} />
                <Label htmlFor="billing-same" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Billing same as shipping</Label>
              </div>

              {!billingSameAsShipping && (
                <div className="space-y-6 pt-10 border-t mt-10 animate-in fade-in slide-in-from-top-2 duration-500">
                  <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Billing Address</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingAddress ? "text-destructive" : "text-muted-foreground")}>Address</Label><Input value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCity ? "text-destructive" : "text-muted-foreground")}>City</Label><Input value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                      <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingPostalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingProvince ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                      <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Country</Label><Select value={formData.billingCountry} onValueChange={(val) => handleInputChange('billingCountry', val)}><SelectTrigger className="h-12 rounded-none bg-[#F9F9F9] uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t"><StallionRates address={{ city: formData.city, postalCode: formData.postalCode, province: formData.province, country: formData.country }} cartItems={cart} onRateSelect={handleRateSelect} selectedRateId={stallionRateId} manualRates={shippingConfig?.provinceRates} /></div>
            </div>
          ) : (
            <div className="space-y-10 pt-4 border-t">
              <div className="space-y-6">
                <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Billing Address</h3>
                <div className="grid gap-4">
                  <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingAddress ? "text-destructive" : "text-muted-foreground")}>Address</Label><Input value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCity ? "text-destructive" : "text-muted-foreground")}>City</Label><Input value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                    <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingPostalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingProvince ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                    <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Country</Label><Select value={formData.billingCountry} onValueChange={(val) => handleInputChange('billingCountry', val)}><SelectTrigger className="h-12 rounded-none bg-[#F9F9F9] uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t mt-10">
                <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Pickup Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className={cn("text-[9px] uppercase font-bold", errors.pickupDate ? "text-destructive" : "")}>Date</Label><Input type="date" className="h-12 rounded-none" value={formData.pickupDate} onChange={(e) => handleInputChange('pickupDate', e.target.value)} /></div>
                  <div className="space-y-2"><Label className={cn("text-[9px] uppercase font-bold", errors.pickupTime ? "text-destructive" : "")}>Time</Label><Input type="time" className="h-12 rounded-none" value={formData.pickupTime} onChange={(e) => handleInputChange('pickupTime', e.target.value)} /></div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="lg:col-span-5 bg-white border-l p-8 space-y-8">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b pb-4 text-primary">Summary ({cartCount})</h2>
        <div className="space-y-6">
          {cart.map((item) => (
            <div key={item.variantId} className="flex gap-4">
              <div className="w-20 h-20 relative bg-gray-50 border shrink-0"><Image src={item.image} alt={item.name} fill className="object-cover" /></div>
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div className="space-y-1">
                  <div className="flex justify-between"><h3 className="text-[10px] font-bold uppercase tracking-tight text-primary">{item.name}</h3><p className="text-[11px] font-bold text-primary">{`C$${formatCurrency(item.price * item.quantity)}`}</p></div>
                  <div className="text-[9px] text-muted-foreground font-bold uppercase">Size: {item.size} • Qty: {item.quantity}</div>
                  {(item.customName || item.customNumber || item.specialNote) && (
                    <div className="pt-1.5 space-y-0.5 border-t border-dashed border-gray-100 mt-1.5">
                      {(item.customName || item.customNumber) && (<p className="text-[8px] font-bold text-blue-600 uppercase flex items-center gap-1"><Sparkles className="h-2 w-2" /> {item.customName} {item.customNumber && `#${item.customNumber}`}</p>)}
                      {item.specialNote && (<p className="text-[8px] text-gray-400 italic">"{item.specialNote}"</p>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><Search className="h-3.5 w-3.5" /> Discovery Protocol</h3>
          <div className="space-y-2">
            <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.referral ? "text-destructive" : "text-muted-foreground")}>How did you hear about us?</Label>
            <Select value={formData.referral} onValueChange={(val) => handleInputChange('referral', val)}>
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 uppercase font-bold text-[10px] rounded-none">
                <SelectValue placeholder="SELECT SOURCE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOOGLE/PINTEREST" className="uppercase font-bold text-[10px]">Google / Pinterest</SelectItem>
                <SelectItem value="FACEBOOK/INSTAGRAM" className="uppercase font-bold text-[10px]">Facebook / Instagram</SelectItem>
                <SelectItem value="FROM FRIENDS" className="uppercase font-bold text-[10px]">From Friends</SelectItem>
                <SelectItem value="REPEAT CUSTOMER" className="uppercase font-bold text-[10px]">Repeat Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Order Notes (Optional)</h3>
          <Textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value.toUpperCase())} placeholder="ANY SPECIAL REQUESTS OR INSTRUCTIONS..." className="min-h-[100px] resize-none uppercase text-xs rounded-none border-gray-200" />
        </div>

        <div className="space-y-4 pt-6 border-t">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Discount Code</Label>
          <div className="flex gap-2">
            <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="COUPON" className="h-12 bg-gray-50 uppercase font-bold text-xs rounded-none border-gray-200" />
            <Button onClick={handleValidateCoupon} disabled={!couponInput || isValidatingCoupon} variant="outline" className="h-12 px-6 border-black font-bold uppercase tracking-widest text-[10px] rounded-none">{isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}</Button>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-none animate-in fade-in slide-in-from-top-1"><span className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-2"><Tag className="h-3 w-3" /> {appliedCoupon.code}</span><button onClick={() => applyCoupon(null)} className="text-emerald-700 hover:text-emerald-900"><X className="h-3.5 w-3.5" /></button></div>
          )}
        </div>

        <div className="pt-8 border-t space-y-3">
          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>Subtotal</span><span className="text-primary">{`C$${formatCurrency(cartSubtotal)}`}</span></div>
          {discountTotal > 0 && (<div className="flex justify-between text-[10px] font-bold uppercase text-destructive"><span>Discount</span><span className="text-destructive">{`-C$${formatCurrency(discountTotal)}`}</span></div>)}
          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>{deliveryMethod === 'shipping' ? 'Shipping' : 'Pickup'}</span><span className="text-primary">{isShippingReady ? (shippingRate > 0 ? `C$${formatCurrency(shippingRate)}` : 'FREE') : '--'}</span></div>
          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>Tax</span><span className="text-primary">{isTaxReady ? `C$${formatCurrency(calculatedTax)}` : '--'}</span></div>
          <Separator />
          <div className="flex justify-between items-end pt-2"><span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">Total</span><p className="text-2xl font-bold font-headline tracking-tighter text-primary">{isSummaryReady ? `C$${formatCurrency(finalTotal)}` : '--'}</p></div>
        </div>

        <div className="pt-8 space-y-4">
          <div className="pt-4 relative z-0 isolate">
            {paymentConfig?.paypalEnabled && selectedPayment === 'paypal' && (
              <PayPalPayment amount={finalTotal} orderData={currentOrderData} onSuccess={handlePayPalSuccess} validate={validate} clientId={paymentConfig.paypalClientId} />
            )}
          </div>

          <div className="flex flex-col items-center gap-4 pt-6">
            <div className="flex items-center gap-6 grayscale opacity-40"><ShieldCheck className="h-5 w-5" /><div className="h-4 w-px bg-gray-200" /><div className="flex items-center gap-2"><div className="w-8 h-5 bg-gray-200 rounded-sm" /><div className="w-8 h-5 bg-gray-200 rounded-sm" /><div className="w-8 h-5 bg-gray-200 rounded-sm" /></div></div>
            <p className="text-[8px] text-center text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">Forensic Transaction Protocol Active.<br />Secure 256-bit Archival Encryption.</p>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-2xl bg-white border-none rounded-none p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 className="h-10 w-10 text-emerald-600" /></div>
          <DialogHeader className="space-y-4"><DialogTitle className="text-3xl font-headline font-bold uppercase tracking-tight text-primary text-center">Order Confirmed</DialogTitle><p className="text-sm text-muted-foreground uppercase tracking-[0.2em] font-medium">Transaction ID: #{confirmedOrder?.id?.substring(0, 8).toUpperCase()}</p></DialogHeader>
          <div className="py-10 space-y-6"><div className="p-6 bg-gray-50 border rounded-none text-left space-y-4"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logistics Manifest</p><div className="space-y-2"><p className="text-xs font-bold uppercase">Recipient: {confirmedOrder?.customer?.name}</p><p className="text-xs font-bold uppercase">Destination: {confirmedOrder?.deliveryMethod}</p></div></div><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">A forensic confirmation manifest has been dispatched to {confirmedOrder?.email}.</p></div>
          <Button asChild className="w-full h-16 bg-black text-white font-bold uppercase tracking-[0.3em] text-[11px] rounded-none shadow-xl"><Link href="/">Return to Studio</Link></Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
