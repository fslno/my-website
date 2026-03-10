'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ShieldCheck
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

type DeliveryMethod = 'shipping' | 'pickup';

const TAX_RATES: Record<string, number> = {
  'ON': 0.13,
  'BC': 0.12,
  'QC': 0.14975,
  'AB': 0.05,
  'MB': 0.12,
  'NB': 0.15,
  'NL': 0.15,
  'NS': 0.15,
  'PE': 0.15,
  'SK': 0.11,
  'NY': 0.08875,
  'CA': 0.0725,
  'TX': 0.0625,
  'FL': 0.06,
  'DEFAULT': 0.10
};

export default function CheckoutPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { 
    cart, cartSubtotal, cartCount, clearCart, 
    discountTotal, totalBeforeTax, appliedCoupon, applyCoupon 
  } = useCart();
  
  // Fetch Global Configs
  const paymentConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: paymentConfig, loading: paymentsLoading } = useDoc(paymentConfigRef);

  const shippingConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'shipping') : null, [db]);
  const { data: shippingConfig, loading: shippingLoading } = useDoc(shippingConfigRef);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingRate, setShippingRate] = useState<number>(0);
  const [couponInput, setCouponInput] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    country: '',
    billingAddress: '',
    billingCity: '',
    billingPostalCode: '',
    billingProvince: '',
    billingCountry: '',
    courier: '', 
    referral: '',
    pickupDate: '',
    pickupTime: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showErrorBanner, setShowErrors] = useState(false);

  const isTaxReady = useMemo(() => {
    if (deliveryMethod === 'shipping') {
      return billingSameAsShipping ? !!formData.province : !!formData.billingProvince;
    }
    return !!formData.billingProvince;
  }, [deliveryMethod, billingSameAsShipping, formData.province, formData.billingProvince]);

  const isShippingReady = useMemo(() => {
    if (deliveryMethod === 'shipping') {
      return !!formData.courier;
    }
    return true; 
  }, [deliveryMethod, formData.courier]);

  const isSummaryReady = isTaxReady && isShippingReady && !!selectedPayment;

  const calculatedTax = useMemo(() => {
    if (!isTaxReady) return 0;
    const province = deliveryMethod === 'shipping' ? 
      (billingSameAsShipping ? formData.province : formData.billingProvince) : 
      formData.billingProvince;
    const rate = TAX_RATES[province.toUpperCase()] || TAX_RATES['DEFAULT'];
    return totalBeforeTax * rate;
  }, [totalBeforeTax, formData.province, formData.billingProvince, deliveryMethod, billingSameAsShipping, isTaxReady]);

  const finalTotal = useMemo(() => {
    return totalBeforeTax + calculatedTax + shippingRate;
  }, [totalBeforeTax, calculatedTax, shippingRate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleUppercaseInput = (field: string, value: string) => {
    handleInputChange(field, value.toUpperCase());
  };

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.email) newErrors.email = true;
    if (!formData.phone) newErrors.phone = true;
    if (!formData.name) newErrors.name = true;
    if (!formData.referral) newErrors.referral = true;
    if (!selectedPayment) newErrors.payment = true;

    if (deliveryMethod === 'shipping') {
      if (!formData.address) newErrors.address = true;
      if (!formData.city) newErrors.city = true;
      if (!formData.postalCode) newErrors.postalCode = true;
      if (!formData.province) newErrors.province = true;
      if (!formData.country) newErrors.country = true;
      if (!formData.courier) newErrors.courier = true;

      if (!billingSameAsShipping) {
        if (!formData.billingAddress) newErrors.billingAddress = true;
        if (!formData.billingCity) newErrors.billingCity = true;
        if (!formData.billingPostalCode) newErrors.billingPostalCode = true;
        if (!formData.billingProvince) newErrors.billingProvince = true;
        if (!formData.billingCountry) newErrors.billingCountry = true;
      }
    } else {
      if (!formData.billingAddress) newErrors.billingAddress = true;
      if (!formData.billingCity) newErrors.billingCity = true;
      if (!formData.billingPostalCode) newErrors.billingPostalCode = true;
      if (!formData.billingProvince) newErrors.billingProvince = true;
      if (!formData.billingCountry) newErrors.billingCountry = true;
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
        if (data.active) {
          applyCoupon(data);
          toast({ title: "Discount Applied", description: `Your code has been validated.` });
          setCouponInput('');
        } else {
          toast({ variant: "destructive", title: "Invalid Code", description: "This code is no longer active." });
        }
      } else {
        toast({ variant: "destructive", title: "Not Found", description: "Discount code not recognized." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to validate code." });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleSubmit = async () => {
    if (!db || isSubmitting) return;
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const orderData = {
      userId: user?.uid || 'guest',
      email: formData.email,
      customer: {
        name: formData.name,
        phone: formData.phone,
        shipping: deliveryMethod === 'shipping' ? {
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          province: formData.province,
          country: formData.country
        } : null,
        billing: {
          address: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.address : formData.billingAddress,
          city: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.city : formData.billingCity,
          postalCode: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.postalCode : formData.billingPostalCode,
          province: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.province : formData.billingProvince,
          country: billingSameAsShipping && deliveryMethod === 'shipping' ? formData.country : formData.billingCountry,
        }
      },
      items: cart,
      subtotal: cartSubtotal,
      discountTotal: discountTotal,
      couponCode: appliedCoupon?.code || null,
      tax: calculatedTax,
      shipping: shippingRate,
      total: finalTotal,
      deliveryMethod,
      courier: formData.courier,
      paymentMethod: selectedPayment,
      referral: formData.referral,
      note: orderNote,
      pickupDate: deliveryMethod === 'pickup' ? formData.pickupDate : null,
      pickupTime: deliveryMethod === 'pickup' ? formData.pickupTime : null,
      status: 'awaiting_processing',
      paymentStatus: 'pending',
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, 'orders'), orderData)
      .then((docRef) => {
        setConfirmedOrder({ ...orderData, id: docRef.id });
        setShowSuccessDialog(true);
        clearCart();
      })
      .catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: orderData
        }));
      })
      .finally(() => setIsSubmitting(false));
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  if (cartCount === 0 && !showSuccessDialog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <Package className="h-12 w-12 text-gray-200 mb-4" />
        <h1 className="text-2xl font-headline font-bold mb-4 uppercase">Your cart is empty</h1>
        <Button asChild className="bg-black text-white h-12 px-8 rounded-none uppercase tracking-widest font-bold text-[10px] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out">
          <Link href="/">Shop Now</Link>
        </Button>
      </div>
    );
  }

  const enabledCarriers = shippingConfig?.carriers?.filter((c: any) => typeof c === 'string' ? true : c.active) || [];

  return (
    <main className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <header className="h-20 bg-white border-b flex items-center px-4 lg:px-12 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Back to Shop</span>
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-headline font-bold tracking-tighter">CHECKOUT</h1>
      </header>

      <div className="max-w-[1440px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 lg:p-12 space-y-12">
          
          <section className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em]">01. Delivery Method</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setDeliveryMethod('shipping'); setShippingRate(0); setErrors({}); }}
                className={cn("p-6 border-2 text-left flex flex-col gap-3 transition-all duration-300 ease-in-out hover:bg-[#D3D3D3] hover:text-[#333333]", deliveryMethod === 'shipping' ? "border-black bg-white shadow-lg" : "border-gray-200 bg-gray-50/50")}
              >
                <Truck className={cn("h-6 w-6", deliveryMethod === 'shipping' ? "text-black" : "text-gray-400")} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest">Shipping</p>
                  <p className="text-[10px] text-gray-500 mt-1">Deliver to my address</p>
                </div>
              </button>
              <button
                onClick={() => { setDeliveryMethod('pickup'); setShippingRate(0); setErrors({}); }}
                className={cn("p-6 border-2 text-left flex flex-col gap-3 transition-all duration-300 ease-in-out hover:bg-[#D3D3D3] hover:text-[#333333]", deliveryMethod === 'pickup' ? "border-black bg-white shadow-lg" : "border-gray-200 bg-gray-50/50")}
              >
                <Store className={cn("h-6 w-6", deliveryMethod === 'pickup' ? "text-black" : "text-gray-400")} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest">Store Pickup</p>
                  <p className="text-[10px] text-gray-500 mt-1">Pick up in-person</p>
                </div>
              </button>
            </div>
          </section>

          <section className="space-y-8 bg-white p-8 border shadow-sm rounded-sm">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em]">02. Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.email ? "text-red-500" : "text-gray-500")}>Email Address {errors.email && "- REQUIRED"}</Label>
                <Input autoComplete="email" placeholder="" className="h-12 bg-[#F9F9F9] uppercase" value={formData.email} onChange={(e) => handleUppercaseInput('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.phone ? "text-red-500" : "text-gray-500")}>Phone Number {errors.phone && "- REQUIRED"}</Label>
                <Input autoComplete="tel" placeholder="" className="h-12 bg-[#F9F9F9]" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.name ? "text-red-500" : "text-gray-500")}>Full Name {errors.name && "- REQUIRED"}</Label>
                <Input autoComplete="name" placeholder="" className="h-12 bg-[#F9F9F9] uppercase" value={formData.name} onChange={(e) => handleUppercaseInput('name', e.target.value)} />
              </div>
            </div>

            {deliveryMethod === 'shipping' ? (
              <div className="space-y-10 pt-4 border-t">
                <div className="space-y-6">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold">Shipping Address</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.address ? "text-red-500" : "text-gray-500")}>Address {errors.address && "- REQUIRED"}</Label>
                      <Input autoComplete="address-line1" placeholder="" className="h-12 uppercase" value={formData.address} onChange={(e) => handleUppercaseInput('address', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.city ? "text-red-500" : "text-gray-500")}>City {errors.city && "- REQUIRED"}</Label>
                        <Input autoComplete="address-level2" placeholder="" className="h-12 uppercase" value={formData.city} onChange={(e) => handleUppercaseInput('city', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.postalCode ? "text-red-500" : "text-gray-500")}>Postal Code {errors.postalCode && "- REQUIRED"}</Label>
                        <Input autoComplete="postal-code" placeholder="" className="h-12 uppercase" value={formData.postalCode} onChange={(e) => handleUppercaseInput('postalCode', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.province ? "text-red-500" : "text-gray-500")}>Province / State {errors.province && "- REQUIRED"}</Label>
                        <Input autoComplete="address-level1" placeholder="" className="h-12 uppercase" value={formData.province} onChange={(e) => handleUppercaseInput('province', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.country ? "text-red-500" : "text-gray-500")}>Country {errors.country && "- REQUIRED"}</Label>
                        <Input autoComplete="country-name" placeholder="" className="h-12 uppercase" value={formData.country} onChange={(e) => handleUppercaseInput('country', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="billing-same" 
                      checked={billingSameAsShipping} 
                      onCheckedChange={(checked) => setBillingSameAsShipping(checked === true)} 
                    />
                    <Label htmlFor="billing-same" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                      Billing address is same as shipping address
                    </Label>
                  </div>

                  {!billingSameAsShipping && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                        <CreditCard className="h-3 w-3" /> Billing Address
                      </h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingAddress ? "text-red-500" : "text-gray-500")}>Address {errors.billingAddress && "- REQUIRED"}</Label>
                          <Input autoComplete="billing address-line1" placeholder="" className="h-12 uppercase" value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCity ? "text-red-500" : "text-gray-500")}>City {errors.billingCity && "- REQUIRED"}</Label>
                            <Input autoComplete="billing address-level2" placeholder="" className="h-12 uppercase" value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingPostalCode ? "text-red-500" : "text-gray-500")}>Postal Code {errors.billingPostalCode && "- REQUIRED"}</Label>
                            <Input autoComplete="billing postal-code" placeholder="" className="h-12 uppercase" value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingProvince ? "text-red-500" : "text-gray-500")}>Province / State {errors.billingProvince && "- REQUIRED"}</Label>
                            <Input autoComplete="billing address-level1" placeholder="" className="h-12 uppercase" value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCountry ? "text-red-500" : "text-gray-500")}>Country {errors.billingCountry && "- REQUIRED"}</Label>
                            <Input autoComplete="billing country-name" placeholder="" className="h-12 uppercase" value={formData.billingCountry} onChange={(e) => handleUppercaseInput('billingCountry', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h3 className={cn("text-[10px] uppercase tracking-widest font-bold flex items-center gap-2", errors.courier ? "text-red-500" : "text-gray-500")}>
                    <Truck className="h-3 w-3" /> Select Shipping Method {errors.courier && "- REQUIRED"}
                  </h3>
                  
                  {shippingLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-200" />
                    </div>
                  ) : (
                    <RadioGroup value={formData.courier} onValueChange={(val) => { 
                      const isExpress = ['FEDEX', 'DHL', 'UPS'].some(e => val.toUpperCase().includes(e));
                      setShippingRate(isExpress ? 25 : 0); 
                      handleInputChange('courier', val); 
                    }} className="grid grid-cols-1 gap-2">
                      {enabledCarriers.map((carrier: any) => {
                        const name = typeof carrier === 'string' ? carrier : carrier.name;
                        const isExpress = ['FEDEX', 'DHL', 'UPS'].some(e => name.toUpperCase().includes(e));
                        return (
                          <div key={name} className={cn("flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#D3D3D3] hover:text-[#333333]", formData.courier === name ? "bg-white border-black ring-1 ring-black" : "bg-gray-50/50")}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={name} id={name} />
                              <Label htmlFor={name} className="text-[11px] font-bold uppercase tracking-widest cursor-pointer">{name} {isExpress ? 'Express' : 'Standard'}</Label>
                            </div>
                            <span className="text-[11px] font-bold">{isExpress ? '$25.00' : 'FREE'}</span>
                          </div>
                        );
                      })}
                      {enabledCarriers.length === 0 && (
                        <p className="text-[10px] text-gray-400 italic py-4">No shipping carriers currently authorized for this drop.</p>
                      )}
                    </RadioGroup>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-10 pt-4 border-t">
                <div className="space-y-6">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <CreditCard className="h-3 w-3" /> Billing Address
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingAddress ? "text-red-500" : "text-gray-500")}>Address {errors.billingAddress && "- REQUIRED"}</Label>
                      <Input autoComplete="billing address-line1" placeholder="" className="h-12 uppercase" value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCity ? "text-red-500" : "text-gray-500")}>City {errors.billingCity && "- REQUIRED"}</Label>
                        <Input autoComplete="billing address-level2" placeholder="" className="h-12 uppercase" value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingPostalCode ? "text-red-500" : "text-gray-500")}>Postal Code {errors.billingPostalCode && "- REQUIRED"}</Label>
                        <Input autoComplete="billing postal-code" placeholder="" className="h-12 uppercase" value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingProvince ? "text-red-500" : "text-gray-500")}>Province / State {errors.billingProvince && "- REQUIRED"}</Label>
                        <Input autoComplete="billing address-level1" placeholder="" className="h-12 uppercase" value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCountry ? "text-red-500" : "text-gray-500")}>Country {errors.billingCountry && "- REQUIRED"}</Label>
                        <Input autoComplete="billing country-name" placeholder="" className="h-12 uppercase" value={formData.billingCountry} onChange={(e) => handleUppercaseInput('billingCountry', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t animate-in fade-in duration-300">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Pickup Schedule
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.pickupDate ? "text-red-500" : "text-gray-500")}>
                        Date {errors.pickupDate && "- REQUIRED"}
                      </Label>
                      <Input 
                        type="date" 
                        className="h-12 uppercase" 
                        value={formData.pickupDate} 
                        onChange={(e) => handleInputChange('pickupDate', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.pickupTime ? "text-red-500" : "text-gray-500")}>
                        Time {errors.pickupTime && "- REQUIRED"}
                      </Label>
                      <Input 
                        type="time" 
                        className="h-12 uppercase" 
                        value={formData.pickupTime} 
                        onChange={(e) => handleInputChange('pickupTime', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-8 bg-white p-8 border shadow-sm rounded-sm">
            <h2 className={cn("text-sm font-bold uppercase tracking-[0.2em]", errors.payment ? "text-red-500" : "text-black")}>03. Payment Method {errors.payment && "- REQUIRED"}</h2>
            {paymentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
              </div>
            ) : !paymentConfig ? (
              <Alert className="bg-amber-50 border-amber-100 rounded-none">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-[10px] font-bold uppercase text-amber-700">Payment system is currently in maintenance mode.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentConfig.stripeEnabled && (
                  <button 
                    onClick={() => setSelectedPayment('stripe')}
                    className={cn(
                      "flex items-center justify-between p-6 border-2 transition-all duration-300 ease-in-out text-left",
                      selectedPayment === 'stripe' ? "border-black bg-white shadow-lg" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <CreditCard className="h-6 w-6 text-black" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">Credit Card</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Secure Stripe Checkout</p>
                      </div>
                    </div>
                    {selectedPayment === 'stripe' && <CheckCircle2 className="h-4 w-4 text-black" />}
                  </button>
                )}
                {paymentConfig.paypalEnabled && (
                  <button 
                    onClick={() => setSelectedPayment('paypal')}
                    className={cn(
                      "flex items-center justify-between p-6 border-2 transition-all duration-300 ease-in-out text-left",
                      selectedPayment === 'paypal' ? "border-black bg-white shadow-lg" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Globe className="h-6 w-6 text-[#0070BA]" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">PayPal</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Global Digital Wallet</p>
                      </div>
                    </div>
                    {selectedPayment === 'paypal' && <CheckCircle2 className="h-4 w-4 text-black" />}
                  </button>
                )}
                {paymentConfig.klarnaEnabled && (
                  <button 
                    onClick={() => setSelectedPayment('klarna')}
                    className={cn(
                      "flex items-center justify-between p-6 border-2 transition-all duration-300 ease-in-out text-left",
                      selectedPayment === 'klarna' ? "border-black bg-white shadow-lg" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Coins className="h-6 w-6 text-[#FFB3C7]" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">Klarna</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Buy now, pay later</p>
                      </div>
                    </div>
                    {selectedPayment === 'klarna' && <CheckCircle2 className="h-4 w-4 text-black" />}
                  </button>
                )}
                {paymentConfig.afterpayEnabled && (
                  <button 
                    onClick={() => setSelectedPayment('afterpay')}
                    className={cn(
                      "flex items-center justify-between p-6 border-2 transition-all duration-300 ease-in-out text-left",
                      selectedPayment === 'afterpay' ? "border-black bg-white shadow-lg" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <History className="h-6 w-6 text-[#B2FCE4]" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">Afterpay</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Interest-free installments</p>
                      </div>
                    </div>
                    {selectedPayment === 'afterpay' && <CheckCircle2 className="h-4 w-4 text-black" />}
                  </button>
                )}
                {paymentConfig.adyenEnabled && (
                  <button 
                    onClick={() => setSelectedPayment('adyen')}
                    className={cn(
                      "flex items-center justify-between p-6 border-2 transition-all duration-300 ease-in-out text-left",
                      selectedPayment === 'adyen' ? "border-black bg-white shadow-lg" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Banknote className="h-6 w-6 text-[#00FF66]" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">Adyen</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Global merchant network</p>
                      </div>
                    </div>
                    {selectedPayment === 'adyen' && <CheckCircle2 className="h-4 w-4 text-black" />}
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="space-y-6 bg-gray-50 border p-8 rounded-sm">
            <h2 className={cn("text-sm font-bold uppercase tracking-[0.2em]", errors.referral ? "text-red-500" : "text-black")}>Referral Source {errors.referral && "- REQUIRED"}</h2>
            <Select onValueChange={(val) => handleInputChange('referral', val)}>
              <SelectTrigger className="h-12 bg-secondary border-gray-200 hover:bg-[#D3D3D3] transition-all duration-300 ease-in-out text-[10px] font-bold uppercase tracking-widest rounded-sm">
                <SelectValue placeholder="SELECT AN OPTION" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_pinterest" className="text-[10px] font-bold uppercase tracking-widest">Google/Pinterest</SelectItem>
                <SelectItem value="facebook_instagram" className="text-[10px] font-bold uppercase tracking-widest">Facebook/Instagram</SelectItem>
                <SelectItem value="from_friend" className="text-[10px] font-bold uppercase tracking-widest">From Friend</SelectItem>
                <SelectItem value="repeat_customer" className="text-[10px] font-bold uppercase tracking-widest">Repeat Customer</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>

        <div className="lg:col-span-5 bg-white border-l p-6 lg:p-12 sticky lg:h-screen lg:top-20 overflow-y-auto">
          <div className="max-md:max-w-md mx-auto space-y-8">
            {showErrorBanner && (
              <Alert variant="destructive" className="rounded-none border-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-bold uppercase tracking-widest">Validation Error</AlertTitle>
                <AlertDescription className="text-[9px] uppercase font-medium">Please review all required fields and select valid delivery/payment methods.</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Express Checkout Available
              </div>
              <div className="grid gap-3">
                {paymentConfig?.applePayEnabled && (
                  <Button className="h-14 w-full bg-black text-white hover:bg-black/90 rounded-none flex items-center justify-center gap-3">
                    <Apple className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Pay with Apple Pay</span>
                  </Button>
                )}
                {paymentConfig?.googlePayEnabled && (
                  <Button className="h-14 w-full bg-white border-2 border-black text-black hover:bg-gray-50 rounded-none flex items-center justify-center gap-3">
                    <Smartphone className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Pay with Google Pay</span>
                  </Button>
                )}
              </div>
            </div>

            <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b pb-4">Order Summary ({cartCount})</h2>
            
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.variantId} className="flex gap-4">
                  <div className="w-20 h-20 relative bg-gray-50 border overflow-hidden shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-tight line-clamp-1">{item.name}</h3>
                        <p className="text-[11px] font-bold">{item.price === 0 ? 'FREE' : `$${formatCurrency(item.price * item.quantity)}`}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-gray-400 font-bold uppercase">
                        <span>Size: {item.size}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                      
                      {(item.customName || item.customNumber || item.specialNote) && (
                        <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-dashed border-gray-100">
                          {(item.customName || item.customNumber) && (
                            <p className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1.5">
                              <Sparkles className="h-2.5 w-2.5" />
                              {item.customName} {item.customNumber && `#${item.customNumber}`}
                            </p>
                          )}
                          {item.specialNote && (
                            <p className="text-[9px] text-gray-400 italic flex items-start gap-1.5 leading-tight">
                              <MessageSquare className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                              {item.specialNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Order Note (Optional)</Label>
                <Textarea 
                  placeholder="ADD ANY SPECIAL INSTRUCTIONS FOR YOUR ORDER..." 
                  className="bg-gray-50 border-gray-200 text-[10px] font-bold uppercase rounded-none resize-none min-h-[80px]"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Discount Code</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="" 
                    className="h-10 bg-gray-50 border-gray-200 text-[10px] font-bold uppercase rounded-none"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                  />
                  <Button 
                    onClick={handleValidateCoupon}
                    disabled={isValidatingCoupon}
                    variant="outline" 
                    className="h-10 px-4 rounded-none border-black text-[9px] font-bold uppercase tracking-widest hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out"
                  >
                    {isValidatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-blue-50 p-2 border border-blue-100 mt-2">
                    <span className="text-[9px] font-bold text-blue-700 uppercase flex items-center gap-2">
                      <Tag className="h-3 w-3" /> {appliedCoupon.code} Applied
                    </span>
                    <button onClick={() => applyCoupon(null)} className="text-blue-700 hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-black">${formatCurrency(cartSubtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase text-red-600">
                    <span>Discounts</span>
                    <span>-${formatCurrency(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                  <span>{deliveryMethod === 'shipping' ? 'Shipping' : 'Pick up'}</span>
                  <span className="text-black">
                    {isShippingReady ? (shippingRate > 0 ? `$${formatCurrency(shippingRate)}` : (deliveryMethod === 'pickup' ? 'Pick up FREE' : 'FREE')) : '--'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                  <span>Tax</span>
                  <span className="text-black">
                    {isTaxReady ? `$${formatCurrency(calculatedTax)}` : '--'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-end pt-2">
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em]">Total</span>
                  <p className="text-2xl font-bold font-headline tracking-tighter">
                    {isSummaryReady ? `$${formatCurrency(finalTotal)} CAD` : '--'}
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-16 bg-black text-white font-bold uppercase tracking-[0.3em] text-[12px] rounded-none shadow-xl hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-2xl bg-white border-none rounded-none p-0 overflow-hidden">
          <div className="p-12 space-y-8">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">Order Confirmed</h2>
              <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Thank you for your purchase.</p>
            </div>

            {confirmedOrder && (
              <div className="space-y-6 border-y py-8">
                <div className="grid grid-cols-2 gap-8 text-[10px] font-bold uppercase tracking-widest">
                  <div className="space-y-2">
                    <p className="text-gray-400">Order ID</p>
                    <p className="text-black">{confirmedOrder.id}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400">Status</p>
                    <p className="text-green-600">Confirmed</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Items</p>
                  <div className="space-y-3">
                    {confirmedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col gap-1 border-b border-gray-50 pb-2 last:border-0">
                        <div className="flex justify-between text-[11px] font-bold uppercase">
                          <span>{item.quantity}x {item.name} ({item.size})</span>
                          <span>${formatCurrency(item.price * item.quantity)}</span>
                        </div>
                        {(item.customName || item.customNumber || item.specialNote) && (
                          <div className="flex flex-col gap-0.5 pl-4 border-l border-gray-100">
                            {(item.customName || item.customNumber) && (
                              <p className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1.5">
                                <Sparkles className="h-2.5 w-2.5" />
                                {item.customName} {item.customNumber && `#${item.customNumber}`}
                              </p>
                            )}
                            {item.specialNote && (
                              <p className="text-[9px] text-gray-400 italic flex items-start gap-1.5">
                                <MessageSquare className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                                {item.specialNote}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between items-end">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total</span>
                  <span className="text-xl font-bold font-headline">${formatCurrency(confirmedOrder.total)} CAD</span>
                </div>
              </div>
            )}

            <Button asChild className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-[11px] rounded-none hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out">
              <Link href="/">Return to Shop</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
