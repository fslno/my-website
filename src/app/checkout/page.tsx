'use client';

import React, { useState, useMemo, useEffect, use } from 'react';
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
  Coins,
  History,
  Banknote,
  Apple,
  Smartphone,
  ShieldCheck,
  Edit2,
  Trophy,
  MapPin
} from 'lucide-react';
import { useCart, type Coupon } from '@/context/CartContext';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
  
  const paymentConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: paymentConfig, isLoading: paymentsLoading } = useDoc(paymentConfigRef);

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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ name: '', number: '', note: '' });

  const [formData, setFormData] = useState({
    email: '', phone: '', name: '', address: '', city: '', postalCode: '', province: '', country: 'Canada',
    billingAddress: '', billingCity: '', billingPostalCode: '', billingProvince: '', billingCountry: 'Canada',
    courier: '', referral: '', pickupDate: '', pickupTime: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showErrorBanner, setShowErrors] = useState(false);

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
    const hasErrors = Object.keys(newErrors).length > 0;
    setShowErrors(hasErrors);
    return !hasErrors;
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

  const handleSaveEdit = (variantId: string) => {
    updateCartItem(variantId, { customName: editFields.name, customNumber: editFields.number, specialNote: editFields.note });
    setEditingVariantId(null);
    toast({ title: "Updated", description: "Customization saved." });
  };

  const handlePayPalSuccess = (firestoreId: string) => {
    setConfirmedOrder({ ...currentOrderData, id: firestoreId });
    setShowSuccessDialog(true);
    clearCart();
  };

  const handleSubmit = async () => {
    if (!db || isSubmitting) return;
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setIsSubmitting(true);
    const orderData = { ...currentOrderData, status: 'awaiting_processing', paymentStatus: 'paid', createdAt: serverTimestamp() };
    addDoc(collection(db, 'orders'), orderData)
      .then((docRef) => { setConfirmedOrder({ ...orderData, id: docRef.id }); setShowSuccessDialog(true); clearCart(); })
      .catch((serverError) => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'orders', operation: 'create', requestResourceData: orderData })); })
      .finally(() => setIsSubmitting(false));
  };

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
                <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Address</Label><Input value={formData.address} onChange={(e) => handleUppercaseInput('address', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">City</Label><Input value={formData.city} onChange={(e) => handleUppercaseInput('city', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                  <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Postal Code</Label><Input value={formData.postalCode} onChange={(e) => handleUppercaseInput('postalCode', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Province</Label><Input value={formData.province} onChange={(e) => handleUppercaseInput('province', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                  <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Country</Label><Select value={formData.country} onValueChange={(val) => handleInputChange('country', val)}><SelectTrigger className="h-12 rounded-none bg-[#F9F9F9] uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t"><StallionRates address={{ city: formData.city, postalCode: formData.postalCode, province: formData.province, country: formData.country }} cartItems={cart} onRateSelect={handleRateSelect} selectedRateId={stallionRateId} manualRates={shippingConfig?.provinceRates} /></div>
            </div>
          ) : (
            <div className="space-y-6 pt-4 border-t"><h3 className="text-[10px] uppercase font-bold">Pickup Schedule</h3><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[9px] uppercase font-bold">Date</Label><Input type="date" className="h-12 rounded-none" value={formData.pickupDate} onChange={(e) => handleInputChange('pickupDate', e.target.value)} /></div><div className="space-y-2"><Label className="text-[9px] uppercase font-bold">Time</Label><Input type="time" className="h-12 rounded-none" value={formData.pickupTime} onChange={(e) => handleInputChange('pickupTime', e.target.value)} /></div></div></div>
          )}
        </section>
      </div>
      <div className="lg:col-span-5 bg-white border-l p-8 space-y-8">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b pb-4 text-primary">Summary ({cartCount})</h2>
        <div className="space-y-6">{cart.map((item) => (<div key={item.variantId} className="flex gap-4"><div className="w-20 h-20 relative bg-gray-50 border shrink-0"><Image src={item.image} alt={item.name} fill className="object-cover" /></div><div className="flex-1 flex flex-col justify-between py-0.5"><div className="space-y-1"><div className="flex justify-between"><h3 className="text-[10px] font-bold uppercase tracking-tight text-primary">{item.name}</h3><p className="text-[11px] font-bold text-primary">{`C$${formatCurrency(item.price * item.quantity)}`}</p></div><div className="text-[9px] text-muted-foreground font-bold uppercase">Size: {item.size} • Qty: {item.quantity}</div></div></div></div>))}</div>
        <div className="pt-8 border-t space-y-3"><div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>Subtotal</span><span className="text-primary">{`C$${formatCurrency(cartSubtotal)}`}</span></div>{discountTotal > 0 && (<div className="flex justify-between text-[10px] font-bold uppercase text-destructive"><span>Discount</span><span className="text-destructive">{`-C$${formatCurrency(discountTotal)}`}</span></div>)}<div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>{deliveryMethod === 'shipping' ? 'Shipping' : 'Pickup'}</span><span className="text-primary">{isShippingReady ? (shippingRate > 0 ? `C$${formatCurrency(shippingRate)}` : 'FREE') : '--'}</span></div><div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>Tax</span><span className="text-primary">{isTaxReady ? `C$${formatCurrency(calculatedTax)}` : '--'}</span></div><Separator /><div className="flex justify-between items-end pt-2"><span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">Total</span><p className="text-2xl font-bold font-headline tracking-tighter text-primary">{isSummaryReady ? `C$${formatCurrency(finalTotal)}` : '--'}</p></div></div>
        <div className="pt-8 space-y-4">{paymentConfig?.paypalEnabled && (<PayPalPayment amount={finalTotal} orderData={currentOrderData} onSuccess={handlePayPalSuccess} validate={validate} clientId={paymentConfig.paypalClientId} />)}{selectedPayment === 'stripe' && (<Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-16 bg-primary text-primary-foreground font-bold uppercase tracking-[0.3em] text-[12px] rounded-none shadow-xl">{isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Place Order"}</Button>)}</div>
      </div>
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}><DialogContent className="sm:max-w-2xl bg-white border-none rounded-none p-12 text-center"><CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" /><DialogHeader><DialogTitle className="text-3xl font-headline font-bold uppercase tracking-tight text-primary text-center">Order confirmed</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground uppercase tracking-[0.2em] mb-8">Order placed successfully.</p><Button asChild className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-[11px] rounded-none"><Link href="/">Back to Shop</Link></Button></DialogContent></Dialog>
    </div>
  );
}
