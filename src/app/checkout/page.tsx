'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
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
import { queueNotification, formatProductList, formatProductListHtml } from '@/lib/notifications';
import { getDocs } from 'firebase/firestore';

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
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const paymentConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: paymentConfig } = useDoc(paymentConfigRef);

  const shippingConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'shipping') : null, [db]);
  const { data: shippingConfig } = useDoc(shippingConfigRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  const userProfileRef = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [selectedPayment, setSelectedPayment] = useState<string>('paypal');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingRate, setShippingRate] = useState<number>(0);
  const [stallionRateId, setStallionRateId] = useState<string>('');
  const [couponInput, setCouponInput] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [customerIp, setCustomerIp] = useState<string>('');
  const [selectedRate, setSelectedRate] = useState<any>(null);
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setCustomerIp(data.ip))
      .catch(err => console.warn('IP check failed:', err));
  }, []);

  const [formData, setFormData] = useState({
    email: '', phone: '', name: '', address: '', city: '', postalCode: '', province: '', country: 'Canada',
    billingAddress: '', billingCity: '', billingPostalCode: '', billingProvince: '', billingCountry: 'Canada',
    courier: '', referral: '', pickupDate: '', pickupTime: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        email: userProfile.email || user?.email || prev.email,
        name: userProfile.displayName || user?.displayName || prev.name,
        phone: userProfile.phone || prev.phone,
        address: userProfile.shippingAddress?.address || prev.address,
        city: userProfile.shippingAddress?.city || prev.city,
        postalCode: userProfile.shippingAddress?.postalCode || prev.postalCode,
        province: userProfile.shippingAddress?.province || prev.province,
        country: userProfile.shippingAddress?.country || prev.country,
      }));
    }
  }, [userProfile, user]);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Auto-expand order note logic
  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.height = 'auto';
      noteRef.current.style.height = noteRef.current.scrollHeight + 'px';
    }
  }, [orderNote]);

  const isFreeShippingEligible = useMemo(() => {
    if (!shippingConfig?.freeShippingEnabled) return false;
    const threshold = Number(shippingConfig.freeShippingThreshold) || 500;
    return cartSubtotal >= threshold;
  }, [shippingConfig, cartSubtotal]);

  const handleRateSelect = (rate: any) => {
    setSelectedRate(rate);
    setStallionRateId(rate.id);
    setFormData(prev => ({ ...prev, courier: rate.service }));
  };

  useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setShippingRate(0);
      return;
    }
    
    if (selectedRate) {
      const cost = (isFreeShippingEligible && selectedRate.type === 'standard') ? 0 : selectedRate.totalCost;
      setShippingRate(cost);
    } else if (isFreeShippingEligible) {
      setShippingRate(0);
    }
  }, [isFreeShippingEligible, selectedRate, deliveryMethod]);
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
    const rate = TAX_RATES[(province || '').toUpperCase()] || TAX_RATES['DEFAULT'];
    return totalBeforeTax * rate;
  }, [totalBeforeTax, formData.province, formData.billingProvince, deliveryMethod, billingSameAsShipping, isTaxReady]);

  const calculatedProcessingFee = useMemo(() => {
    if (!paymentConfig) return 0;
    const baseAmount = totalBeforeTax + calculatedTax + shippingRate;
    
    let percent = 0;
    let flat = 0;

    if (selectedPayment === 'paypal') {
      percent = paymentConfig.paypalProcessingFeePercent || 0;
      flat = paymentConfig.paypalProcessingFeeFlat || 0;
    } else if (selectedPayment === 'stripe') {
      percent = paymentConfig.stripeProcessingFeePercent || 0;
      flat = paymentConfig.stripeProcessingFeeFlat || 0;
    } else if (selectedPayment === 'klarna') {
      percent = paymentConfig.klarnaProcessingFeePercent || 0;
      flat = paymentConfig.klarnaProcessingFeeFlat || 0;
    } else if (selectedPayment === 'afterpay') {
      percent = paymentConfig.afterpayProcessingFeePercent || 0;
      flat = paymentConfig.afterpayProcessingFeeFlat || 0;
    } else if (selectedPayment === 'adyen') {
      percent = paymentConfig.adyenProcessingFeePercent || 0;
      flat = paymentConfig.adyenProcessingFeeFlat || 0;
    }

    return (baseAmount * (percent / 100)) + flat;
  }, [paymentConfig, selectedPayment, totalBeforeTax, calculatedTax, shippingRate]);

  const finalTotal = useMemo(() => totalBeforeTax + calculatedTax + shippingRate + calculatedProcessingFee, [totalBeforeTax, calculatedTax, shippingRate, calculatedProcessingFee]);

  const shippingWeight = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemWeight = Number(item.logistics?.weight || shippingConfig?.defaultWeight || 0.6);
      return acc + (itemWeight * item.quantity);
    }, 0);
  }, [cart, shippingConfig]);

  const currentOrderData = useMemo(() => ({
    userId: user?.uid || 'guest', email: formData.email,
    customerIp,
    shippingWeight,
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
    tax: calculatedTax, shipping: shippingRate, processingFee: calculatedProcessingFee, total: finalTotal, deliveryMethod, courier: formData.courier,
    stallionRateId: stallionRateId, paymentMethod: selectedPayment || 'paypal', referral: formData.referral, note: orderNote,
    pickupDate: deliveryMethod === 'pickup' ? formData.pickupDate : null, pickupTime: deliveryMethod === 'pickup' ? formData.pickupTime : null,
  }), [user, formData, deliveryMethod, cart, cartSubtotal, discountTotal, appliedCoupon, calculatedTax, shippingRate, calculatedProcessingFee, finalTotal, selectedPayment, orderNote, billingSameAsShipping, stallionRateId]);

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

    // Consent Check
    if (!consentChecked) {
      setConsentError(true);
    }

    const hasErrors = Object.keys(newErrors).length > 0 || !consentChecked;

    if (hasErrors) {
      toast({
        variant: "destructive",
        title: "Information Required",
        description: "Please complete all highlighted fields."
      });

      // Scroll to first error
      const firstErrorKey = Object.keys(newErrors)[0];
      if (firstErrorKey) {
        const element = document.getElementById(firstErrorKey);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (!consentChecked) {
        document.getElementById('checkout-consent')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

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
        else toast({ variant: "destructive", title: "Error", description: "Code is not active." });
      } else toast({ variant: "destructive", title: "Error", description: "Invalid code." });
    } catch (e) { toast({ variant: "destructive", title: "Error", description: "Verification failed." }); }
    finally { setIsValidatingCoupon(false); }
  };

  const handlePayPalSuccess = async (firestoreId: string) => {
    // Queue Notification
    if (db) {
      try {
        const staffSnap = await getDocs(collection(db, 'staff'));
        const activeStaffEmails = staffSnap.docs
          .map(d => d.data())
          .filter(s => s.status === 'Active' && s.email)
          .map(s => s.email);

        await queueNotification(
          db,
          'orderConfirmation',
          currentOrderData.email,
          {
            order_id: firestoreId.substring(0, 8).toUpperCase(),
            customer_name: currentOrderData.customer.name,
            order_total: `C$${finalTotal.toFixed(2)}`,
            product_list: formatProductList(currentOrderData.items),
            product_list_html: formatProductListHtml(currentOrderData.items),
            payment_method: selectedPayment,
            shipping_address: deliveryMethod === 'shipping' 
              ? `${formData.address}\n${formData.city}, ${formData.province} ${formData.postalCode}\n${formData.country}`
              : `PICKUP ON ${formData.pickupDate} @ ${formData.pickupTime}`,
            order_breakdown: `Subtotal: C$${cartSubtotal.toFixed(2)}\nDiscount: -C$${discountTotal.toFixed(2)}\nShipping: ${shippingRate > 0 ? `C$${shippingRate.toFixed(2)}` : 'FREE'}\nTax: C$${calculatedTax.toFixed(2)}\nTotal: C$${finalTotal.toFixed(2)}`
          },
          activeStaffEmails
        );

        // 2. Trigger Admin Push Notification (Banner)
        fetch('/api/admin/notifications/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: firestoreId,
            customerName: currentOrderData.customer.name,
            total: `C$${finalTotal.toFixed(2)}`
          })
        }).catch(err => console.error("[CHECKOUT] Push trigger failed:", err));

      } catch (e) {
        console.error("[CHECKOUT] Notification error:", e);
      }
    }

    setConfirmedOrder({ ...currentOrderData, id: firestoreId });
    setShowSuccessDialog(true);
    clearCart();
  };

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!mounted) {
    return (
      <div className="min-h-[100vh] flex flex-col bg-white">
        <div className="flex-grow max-w-[1440px] mx-auto w-full pt-28 sm:pt-40 pb-12 px-4">
          <Skeleton className="h-4 w-24 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                <Skeleton className="h-4 w-40" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-28 w-full rounded-none" />
                  <Skeleton className="h-28 w-full rounded-none" />
                </div>
              </div>
              <div className="space-y-8 bg-white p-8 border shadow-sm">
                <Skeleton className="h-4 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-12 w-full rounded-none" />
                  <Skeleton className="h-12 w-full rounded-none" />
                  <Skeleton className="h-12 w-full md:col-span-2 rounded-none" />
                </div>
                <div className="space-y-4 pt-8">
                  <Skeleton className="h-12 w-full rounded-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full rounded-none" />
                    <Skeleton className="h-12 w-full rounded-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 bg-white border-l p-6 space-y-6 h-fit">
              <Skeleton className="h-4 w-48 mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-20 h-20 shrink-0 rounded-none" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t mt-6 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full flex-1 pt-28 sm:pt-40 pb-12 px-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all duration-300 mb-8 group w-fit"
      >
        <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-12">
          <section className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">01. Shipping Method</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setDeliveryMethod('shipping'); setShippingRate(0); setErrors({}); }} className={cn("p-4 border-2 text-left flex flex-col gap-3 transition-all duration-300", deliveryMethod === 'shipping' ? "border-primary bg-white shadow-lg" : "border-gray-200 bg-gray-50/50")}>
                <Truck className={cn("h-6 w-6", deliveryMethod === 'shipping' ? "text-primary" : "text-muted-foreground")} />
                <div><p className={cn("text-[11px] font-bold uppercase tracking-widest", deliveryMethod === 'shipping' ? "text-primary" : "text-muted-foreground")}>Shipping</p><p className="text-[10px] text-muted-foreground mt-1">Deliver to my address</p></div>
              </button>
              <button onClick={() => { setDeliveryMethod('pickup'); setShippingRate(0); setErrors({}); }} className={cn("p-4 border-2 text-left flex flex-col gap-3 transition-all duration-300", deliveryMethod === 'pickup' ? "border-primary bg-white shadow-lg" : "border-gray-200 bg-gray-50/50")}>
                <Store className={cn("h-6 w-6", deliveryMethod === 'pickup' ? "text-primary" : "text-muted-foreground")} />
                <div><p className={cn("text-[11px] font-bold uppercase tracking-widest", deliveryMethod === 'pickup' ? "text-primary" : "text-muted-foreground")}>Pickup</p><p className="text-[10px] text-muted-foreground mt-1">Pick up in store</p></div>
              </button>
            </div>
          </section>
          
          <section className="space-y-8 bg-white p-8 border shadow-sm rounded-none">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">02. Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="email" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.email ? "text-destructive" : "text-muted-foreground")}>Email</Label><Input id="email" className="h-12 bg-[#F9F9F9] uppercase rounded-none" value={formData.email} onChange={(e) => handleUppercaseInput('email', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="tel" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.phone ? "text-destructive" : "text-muted-foreground")}>Phone</Label><Input id="tel" className="h-12 bg-[#F9F9F9] rounded-none" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
              <div className="md:col-span-2 space-y-2"><Label htmlFor="name" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.name ? "text-destructive" : "text-muted-foreground")}>Full Name</Label><Input id="name" className="h-12 bg-[#F9F9F9] uppercase rounded-none" value={formData.name} onChange={(e) => handleUppercaseInput('name', e.target.value)} /></div>
            </div>

            {deliveryMethod === 'shipping' ? (
              <div className="space-y-10 pt-4 border-t">
                <div className="grid gap-4">
                  <div className="space-y-2"><Label htmlFor="address" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.address ? "text-destructive" : "text-muted-foreground")}>Shipping Address</Label><Input id="address" value={formData.address} onChange={(e) => handleUppercaseInput('address', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="city" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.city ? "text-destructive" : "text-muted-foreground")}>City</Label><Input id="city" value={formData.city} onChange={(e) => handleUppercaseInput('city', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                    <div className="space-y-2"><Label htmlFor="postalCode" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.postalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input id="postalCode" value={formData.postalCode} onChange={(e) => handleUppercaseInput('postalCode', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="province" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.province ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input id="province" value={formData.province} onChange={(e) => handleUppercaseInput('province', e.target.value)} className="h-12 uppercase rounded-none" /></div>
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
                      <div className="space-y-2"><Label htmlFor="billingAddress" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingAddress ? "text-destructive" : "text-muted-foreground")}>Address</Label><Input id="billingAddress" value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="billingCity" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCity ? "text-destructive" : "text-muted-foreground")}>City</Label><Input id="billingCity" value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                        <div className="space-y-2"><Label htmlFor="billingPostalCode" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingPostalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input id="billingPostalCode" value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="billingProvince" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingProvince ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input id="billingProvince" value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                        <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Country</Label><Select value={formData.billingCountry} onValueChange={(val) => handleInputChange('billingCountry', val)}><SelectTrigger className="h-12 rounded-none bg-[#F9F9F9] uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-6 border-t"><StallionRates address={{ city: formData.city, postalCode: formData.postalCode, province: formData.province, country: formData.country }} cartItems={cart} onRateSelect={handleRateSelect} selectedRateId={stallionRateId} manualRates={shippingConfig?.provinceRates} isFreeEligible={isFreeShippingEligible} /></div>
              </div>
            ) : (
              <div className="space-y-10 pt-4 border-t">
                <div className="space-y-6">
                  <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Billing Address</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2"><Label htmlFor="billingAddress" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingAddress ? "text-destructive" : "text-muted-foreground")}>Address</Label><Input id="billingAddress" value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="billingCity" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCity ? "text-destructive" : "text-muted-foreground")}>City</Label><Input id="billingCity" value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                      <div className="space-y-2"><Label htmlFor="billingPostalCode" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingPostalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input id="billingPostalCode" value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="billingProvince" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingProvince ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input id="billingProvince" value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} className="h-12 uppercase rounded-none" /></div>
                      <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold">Country</Label><Select value={formData.billingCountry} onValueChange={(val) => handleInputChange('billingCountry', val)}><SelectTrigger className="h-12 rounded-none bg-[#F9F9F9] uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-10 border-t">
                  <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Pickup Time</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="pickupDate" className={cn("text-[9px] uppercase font-bold", errors.pickupDate ? "text-destructive" : "")}>Date</Label><Input id="pickupDate" type="date" className="h-12 rounded-none" value={formData.pickupDate} onChange={(e) => handleInputChange('pickupDate', e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="pickupTime" className={cn("text-[9px] uppercase font-bold", errors.pickupTime ? "text-destructive" : "")}>Time</Label><Input id="pickupTime" type="time" className="h-12 rounded-none" value={formData.pickupTime} onChange={(e) => handleInputChange('pickupTime', e.target.value)} /></div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-5 bg-white border-l p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b pb-4 text-primary">Order Summary ({cartCount})</h2>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.variantId} className="flex gap-4">
                <div className="w-20 h-20 relative bg-gray-50 border shrink-0"><Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" /></div>
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

          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><Search className="h-3.5 w-3.5" /> How did you find us?</h3>
            <div className="space-y-2">
              <Label htmlFor="referral" className={cn("text-[9px] uppercase tracking-widest font-bold", errors.referral ? "text-destructive" : "text-muted-foreground")}>Select an option</Label>
              <Select value={formData.referral} onValueChange={(val) => handleInputChange('referral', val)}>
                <SelectTrigger id="referral" className="h-12 bg-gray-50 border-gray-200 uppercase font-bold text-[10px] rounded-none">
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

          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Order Notes (Optional)</h3>
            <Textarea 
              ref={noteRef}
              value={orderNote} 
              onChange={(e) => setOrderNote(e.target.value.toUpperCase())} 
              placeholder="ANY SPECIAL REQUESTS..." 
              className="min-h-[40px] overflow-hidden resize-none uppercase text-xs rounded-none border-gray-200 py-2" 
            />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Discount Code</Label>
            <div className="flex gap-2">
              <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="COUPON" className="h-12 bg-gray-50 uppercase font-bold text-xs rounded-none border-gray-200" />
              <Button onClick={handleValidateCoupon} disabled={!couponInput || isValidatingCoupon} variant="outline" className="h-12 px-6 border-black font-bold uppercase tracking-widest text-[10px] rounded-none">{isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}</Button>
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-none animate-in fade-in slide-in-from-top-1"><span className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-2"><Tag className="h-3 w-3" /> {appliedCoupon.code}</span><button onClick={() => applyCoupon(null)} className="text-emerald-700 hover:text-emerald-900"><X className="h-3.5 w-3.5" /></button></div>
            )}
          </div>

          <div className="pt-6 border-t space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>Subtotal</span><span className="text-primary">{`C$${formatCurrency(cartSubtotal)}`}</span></div>
            {discountTotal > 0 && (<div className="flex justify-between text-[10px] font-bold uppercase text-destructive"><span>Discount</span><span className="text-destructive">{`-C$${formatCurrency(discountTotal)}`}</span></div>)}
            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>{deliveryMethod === 'shipping' ? 'Shipping Fee' : 'Store Pickup'}</span><span className="text-primary">{isShippingReady ? (shippingRate > 0 ? `C$${formatCurrency(shippingRate)}` : 'FREE') : '--'}</span></div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>Tax</span><span className="text-primary">{isTaxReady ? `C$${formatCurrency(calculatedTax)}` : '--'}</span></div>
            {calculatedProcessingFee > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                <span>Processing Fee ({selectedPayment.toUpperCase()})</span>
                <span className="text-primary">{`C$${formatCurrency(calculatedProcessingFee)}`}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-end pt-2"><span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">Total</span><p className="text-2xl font-bold font-headline tracking-tighter text-primary">{isSummaryReady ? `C$${formatCurrency(finalTotal)}` : '--'}</p></div>
          </div>

          <div className="pt-6 space-y-4 relative z-0 isolate">

            {/* ─── Mandatory Consent ─── */}
            <div className={cn(
              "border p-4 rounded-none space-y-3 transition-colors",
              consentChecked
                ? "border-emerald-300 bg-emerald-50/40"
                : consentError
                  ? "border-red-500 bg-red-50/60 animate-in fade-in shake-x"
                  : "border-gray-200 bg-gray-50/40"
            )}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="checkout-consent"
                  checked={consentChecked}
                  onCheckedChange={(v) => { setConsentChecked(!!v); if (!!v) setConsentError(false); }}
                  className="mt-0.5 border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black rounded-none"
                />
                <label
                  htmlFor="checkout-consent"
                  className="text-[10px] font-bold uppercase tracking-widest leading-relaxed cursor-pointer select-none"
                >
                  {storeConfig?.checkoutConsentText ? (
                    storeConfig.checkoutConsentText
                  ) : (
                    <>
                      I agree to the{' '}
                      <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:opacity-70">
                        Terms & Conditions
                      </Link>
                      ,{' '}
                      <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:opacity-70">
                        Privacy Policy
                      </Link>
                      {' '}and{' '}
                      <Link href="/returns" target="_blank" className="underline underline-offset-2 hover:opacity-70">
                        Return Policy
                      </Link>
                      . I understand that all sales are subject to these policies.
                    </>
                  )}
                </label>
              </div>
              {consentError && !consentChecked && (
                <p className="text-[9px] text-red-600 font-bold uppercase tracking-widest flex items-center gap-1.5 pl-7">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  You must agree before proceeding to payment.
                </p>
              )}
            </div>

            {/* ─── PayPal Button ─── */}
            <div className="pt-2 relative z-0 isolate">
              {paymentConfig?.paypalEnabled && selectedPayment === 'paypal' && (
                <PayPalPayment amount={finalTotal} orderData={currentOrderData} onSuccess={handlePayPalSuccess} validate={validate} clientId={paymentConfig.paypalClientId} />
              )}
            </div>

            <div className="flex flex-col items-center gap-4 pt-6">
              <div className="flex items-center gap-6 grayscale opacity-40"><ShieldCheck className="h-5 w-5" /><div className="h-4 w-px bg-gray-200" /><div className="flex items-center gap-2"><div className="w-8 h-5 bg-gray-200 rounded-sm" /><div className="w-8 h-5 bg-gray-200 rounded-sm" /><div className="w-8 h-5 bg-gray-200 rounded-sm" /></div></div>
              <p className="text-[8px] text-center text-muted-foreground uppercase font-bold tracking-widest leading-relaxed whitespace-pre-line">
                {storeConfig?.checkoutSecurityMsg || "Safe Payment Active.\nYour details are kept private and secure."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-2xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-black text-white px-8 py-6 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-[0.15em] text-white">Order Confirmed</DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-0.5">
                Ref #{confirmedOrder?.id?.substring(0, 8)?.toUpperCase()} • {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100">

            {/* Customer Info */}
            <div className="px-8 py-5 grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Customer</p>
                <p className="text-sm font-bold uppercase">{confirmedOrder?.customer?.name}</p>
                <p className="text-[10px] font-mono text-gray-500">{confirmedOrder?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Payment Method</p>
                <p className="text-sm font-bold uppercase">{confirmedOrder?.paymentMethod}</p>
                <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </p>
              </div>
            </div>

            {/* Addresses */}
            {confirmedOrder?.deliveryMethod === 'shipping' && confirmedOrder?.customer?.shipping && (
              <div className="px-8 py-5 grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Ship To</p>
                  <p className="text-[11px] font-bold uppercase leading-relaxed">
                    {confirmedOrder.customer.shipping.address}<br />
                    {confirmedOrder.customer.shipping.city}, {confirmedOrder.customer.shipping.province} {confirmedOrder.customer.shipping.postalCode}<br />
                    {confirmedOrder.customer.shipping.country}
                  </p>
                </div>
                {confirmedOrder?.courier && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Courier</p>
                    <p className="text-[11px] font-bold uppercase">{confirmedOrder.courier}</p>
                  </div>
                )}
              </div>
            )}

            {confirmedOrder?.deliveryMethod === 'pickup' && (
              <div className="px-8 py-5">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Pickup Details</p>
                <p className="text-[11px] font-bold uppercase">In-Store Pickup</p>
                {confirmedOrder?.pickupDate && <p className="text-[10px] text-gray-500 font-bold uppercase">{confirmedOrder.pickupDate} @ {confirmedOrder.pickupTime}</p>}
              </div>
            )}

            {/* Items */}
            <div className="px-8 py-5 space-y-3">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Items Ordered ({confirmedOrder?.items?.length})</p>
              <div className="space-y-3">
                {confirmedOrder?.items?.map((item: any) => (
                  <div key={item.variantId} className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 border shrink-0 overflow-hidden relative">
                      {item.image && <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-tight truncate">{item.name}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">Size: {item.size} × {item.quantity}</p>
                      {(item.customName || item.customNumber) && (
                        <p className="text-[9px] text-blue-600 font-bold uppercase">✦ {item.customName} {item.customNumber && `#${item.customNumber}`}</p>
                      )}
                    </div>
                    <p className="text-[11px] font-black shrink-0">C${formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="px-8 py-5 space-y-2">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-3">Price details</p>
              <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                <span>Subtotal</span>
                <span>C${formatCurrency(confirmedOrder?.subtotal || 0)}</span>
              </div>
              {(confirmedOrder?.discountTotal || 0) > 0 && (
                <div className="flex justify-between text-[10px] font-bold uppercase text-red-500">
                  <span>Discount {confirmedOrder?.couponCode && `(${confirmedOrder.couponCode})`}</span>
                  <span>-C${formatCurrency(confirmedOrder?.discountTotal || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                <span>{confirmedOrder?.deliveryMethod === 'shipping' ? 'Shipping' : 'Pickup'}</span>
                <span>{confirmedOrder?.shipping > 0 ? `C$${formatCurrency(confirmedOrder.shipping)}` : 'FREE'}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                <span>Tax</span>
                <span>C${formatCurrency(confirmedOrder?.tax || 0)}</span>
              </div>
              {(confirmedOrder?.processingFee || 0) > 0 && (
                <div className="flex justify-between text-[10px] font-bold uppercase text-blue-600">
                  <span>Processing Fee ({confirmedOrder?.paymentMethod?.toUpperCase()})</span>
                  <span>C${formatCurrency(confirmedOrder?.processingFee || 0)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-3 border-t border-gray-200 mt-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Total Paid</span>
                <span className="text-2xl font-black tracking-tighter">C${formatCurrency(confirmedOrder?.total || 0)}</span>
              </div>
            </div>

            {/* Note */}
            {confirmedOrder?.note && (
              <div className="px-8 py-5">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Order Note</p>
                <p className="text-[10px] text-gray-600 italic uppercase">{confirmedOrder.note}</p>
              </div>
            )}

            {/* Confirmation Footer */}
            <div className="px-8 py-4 bg-gray-50">
              <p className="text-[9px] text-center text-gray-500 uppercase font-bold tracking-widest leading-relaxed">
                A confirmation email has been sent to <span className="text-black">{confirmedOrder?.email}</span>.<br />
                Save your Order ID for tracking: <span className="font-mono text-black">#{confirmedOrder?.id?.substring(0, 8)?.toUpperCase()}</span>
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="px-8 py-6 shrink-0 bg-white border-t">
            <Button asChild className="w-full h-14 bg-black text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-none shadow-xl hover:bg-black/90">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
