'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  Store, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  CheckCircle2,
  Package,
  Search,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Tag,
  X
} from 'lucide-react';
import { useCart, type Coupon } from '@/context/CartContext';
import { useUser, useFirestore } from '@/firebase';
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
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
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
  
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingRate, setShippingRate] = useState<number>(0);
  const [couponInput, setCouponInput] = useState('');
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
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: '14:00',
    referral: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showErrorBanner, setShowErrors] = useState(false);

  const calculatedTax = useMemo(() => {
    const province = deliveryMethod === 'shipping' ? formData.province : formData.billingProvince;
    const rate = TAX_RATES[province.toUpperCase()] || 0;
    return totalBeforeTax * rate;
  }, [totalBeforeTax, formData.province, formData.billingProvince, deliveryMethod]);

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

    if (deliveryMethod === 'shipping') {
      if (!formData.address) newErrors.address = true;
      if (!formData.city) newErrors.city = true;
      if (!formData.postalCode) newErrors.postalCode = true;
      if (!formData.province) newErrors.province = true;
      if (!formData.country) newErrors.country = true;
      if (!formData.courier) newErrors.courier = true;
    } else {
      if (!formData.billingAddress) newErrors.billingAddress = true;
      if (!formData.billingCity) newErrors.billingCity = true;
      if (!formData.billingPostalCode) newErrors.billingPostalCode = true;
      if (!formData.billingProvince) newErrors.billingProvince = true;
      if (!formData.billingCountry) newErrors.billingCountry = true;
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
          toast({ title: "Archive Code Applied", description: `Discount applied successfully.` });
          setCouponInput('');
        } else {
          toast({ variant: "destructive", title: "Invalid Code", description: "This coupon is no longer active." });
        }
      } else {
        toast({ variant: "destructive", title: "Not Found", description: "Archive code not recognized." });
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
      status: 'awaiting_processing',
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, 'orders'), orderData)
      .then((docRef) => {
        setConfirmedOrder({ ...orderData, id: docRef.id });
        setShowSuccessDialog(true);
        clearCart();
      })
      .catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: orderData
        }));
      })
      .finally(() => setIsSubmitting(false));
  };

  if (cartCount === 0 && !showSuccessDialog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <Package className="h-12 w-12 text-gray-200 mb-4" />
        <h1 className="text-2xl font-headline font-bold mb-4 uppercase">Bag is Empty</h1>
        <Button asChild className="bg-black text-white h-12 px-8 rounded-none uppercase tracking-widest font-bold text-[10px]">
          <Link href="/">Discover Archive</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <header className="h-20 bg-white border-b flex items-center px-4 lg:px-12 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">FSLNO ARCHIVE</span>
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
                className={cn("p-6 border-2 text-left flex flex-col gap-3 transition-all", deliveryMethod === 'shipping' ? "border-black bg-white shadow-lg" : "border-gray-200 bg-gray-50/50 hover:border-gray-300")}
              >
                <Truck className={cn("h-6 w-6", deliveryMethod === 'shipping' ? "text-black" : "text-gray-400")} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest">Shipping</p>
                  <p className="text-[10px] text-gray-500 mt-1">Dispatch from studio</p>
                </div>
              </button>
              <button
                onClick={() => { setDeliveryMethod('pickup'); setShippingRate(0); setErrors({}); }}
                className={cn("p-6 border-2 text-left flex flex-col gap-3 transition-all", deliveryMethod === 'pickup' ? "border-black bg-white shadow-lg" : "border-gray-200 bg-gray-50/50 hover:border-gray-300")}
              >
                <Store className={cn("h-6 w-6", deliveryMethod === 'pickup' ? "text-black" : "text-gray-400")} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest">In-Person Pickup</p>
                  <p className="text-[10px] text-gray-500 mt-1">Select studio location</p>
                </div>
              </button>
            </div>
          </section>

          <section className="space-y-8 bg-white p-8 border shadow-sm rounded-sm">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em]">02. Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.email ? "text-red-500" : "text-gray-500")}>Email Address {errors.email && "- REQUIRED"}</Label>
                <Input type="email" placeholder="ARCHIVE@FSLNO.COM" className="h-12 bg-[#F9F9F9] uppercase" value={formData.email} onChange={(e) => handleUppercaseInput('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.phone ? "text-red-500" : "text-gray-500")}>Phone Number {errors.phone && "- REQUIRED"}</Label>
                <Input type="tel" placeholder="+1 (555) 000-0000" className="h-12 bg-[#F9F9F9]" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.name ? "text-red-500" : "text-gray-500")}>Full Name {errors.name && "- REQUIRED"}</Label>
                <Input placeholder="ENTER YOUR FULL NAME" className="h-12 bg-[#F9F9F9] uppercase" value={formData.name} onChange={(e) => handleUppercaseInput('name', e.target.value)} />
              </div>
            </div>

            {deliveryMethod === 'shipping' ? (
              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-[10px] uppercase tracking-widest font-bold">Shipping Destination</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.address ? "text-red-500" : "text-gray-500")}>Address {errors.address && "- REQUIRED"}</Label>
                    <Input placeholder="STREET ADDRESS" className="h-12 uppercase" value={formData.address} onChange={(e) => handleUppercaseInput('address', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.city ? "text-red-500" : "text-gray-500")}>City {errors.city && "- REQUIRED"}</Label>
                      <Input placeholder="CITY" className="h-12 uppercase" value={formData.city} onChange={(e) => handleUppercaseInput('city', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.postalCode ? "text-red-500" : "text-gray-500")}>Postal Code {errors.postalCode && "- REQUIRED"}</Label>
                      <Input placeholder="POSTAL CODE" className="h-12 uppercase" value={formData.postalCode} onChange={(e) => handleUppercaseInput('postalCode', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.province ? "text-red-500" : "text-gray-500")}>Province / State {errors.province && "- REQUIRED"}</Label>
                      <Input placeholder="E.G. ON" className="h-12 uppercase" value={formData.province} onChange={(e) => handleUppercaseInput('province', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.country ? "text-red-500" : "text-gray-500")}>Country {errors.country && "- REQUIRED"}</Label>
                      <Input placeholder="E.G. CANADA" className="h-12 uppercase" value={formData.country} onChange={(e) => handleUppercaseInput('country', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h3 className={cn("text-[10px] uppercase tracking-widest font-bold flex items-center gap-2", errors.courier ? "text-red-500" : "text-gray-500")}>
                    <Truck className="h-3 w-3" /> Select Courier {errors.courier && "- REQUIRED"}
                  </h3>
                  <RadioGroup value={formData.courier} onValueChange={(val) => { setShippingRate(val === 'fedex' ? 25 : val === 'dhl' ? 45 : 0); handleInputChange('courier', val); }} className="grid grid-cols-1 gap-2">
                    <div className={cn("flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-all", formData.courier === 'usps' ? "bg-white border-black ring-1 ring-black" : "bg-gray-50/50 hover:bg-gray-100")}>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="usps" id="usps" />
                        <Label htmlFor="usps" className="text-[11px] font-bold uppercase tracking-widest cursor-pointer">Standard (USPS / Economy)</Label>
                      </div>
                      <span className="text-[11px] font-bold">FREE</span>
                    </div>
                    <div className={cn("flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-all", formData.courier === 'fedex' ? "bg-white border-black ring-1 ring-black" : "bg-gray-50/50 hover:bg-gray-100")}>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="fedex" id="fedex" />
                        <Label htmlFor="fedex" className="text-[11px] font-bold uppercase tracking-widest cursor-pointer">Priority (FedEx Express)</Label>
                      </div>
                      <span className="text-[11px] font-bold">$25.00</span>
                    </div>
                    <div className={cn("flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-all", formData.courier === 'dhl' ? "bg-white border-black ring-1 ring-black" : "bg-gray-50/50 hover:bg-gray-100")}>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="dhl" id="dhl" />
                        <Label htmlFor="dhl" className="text-[11px] font-bold uppercase tracking-widest cursor-pointer">International (DHL Luxury)</Label>
                      </div>
                      <span className="text-[11px] font-bold">$45.00</span>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-[10px] uppercase tracking-widest font-bold">Billing Address</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingAddress ? "text-red-500" : "text-gray-500")}>Address {errors.billingAddress && "- REQUIRED"}</Label>
                    <Input placeholder="BILLING ADDRESS" className="h-12 uppercase" value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCity ? "text-red-500" : "text-gray-500")}>City {errors.billingCity && "- REQUIRED"}</Label>
                      <Input placeholder="CITY" className="h-12 uppercase" value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingPostalCode ? "text-red-500" : "text-gray-500")}>Postal Code {errors.billingPostalCode && "- REQUIRED"}</Label>
                      <Input placeholder="POSTAL CODE" className="h-12 uppercase" value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingProvince ? "text-red-500" : "text-gray-500")}>Province / State {errors.billingProvince && "- REQUIRED"}</Label>
                      <Input placeholder="E.G. ON" className="h-12 uppercase" value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className={cn("text-[9px] uppercase tracking-widest font-bold", errors.billingCountry ? "text-red-500" : "text-gray-500")}>Country {errors.billingCountry && "- REQUIRED"}</Label>
                      <Input placeholder="E.G. CANADA" className="h-12 uppercase" value={formData.billingCountry} onChange={(e) => handleUppercaseInput('billingCountry', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-6 bg-gray-50 border p-8 rounded-sm">
            <h2 className={cn("text-sm font-bold uppercase tracking-[0.2em]", errors.referral ? "text-red-500" : "text-black")}>How did you find us? {errors.referral && "- REQUIRED"}</h2>
            <Select onValueChange={(val) => handleInputChange('referral', val)}>
              <SelectTrigger className="h-12 bg-secondary border-gray-200 hover:bg-gray-100 transition-colors text-[10px] font-bold uppercase tracking-widest rounded-sm">
                <SelectValue placeholder="SELECT AN OPTION" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google" className="text-[10px] font-bold uppercase tracking-widest">Google / Pinterest</SelectItem>
                <SelectItem value="social" className="text-[10px] font-bold uppercase tracking-widest">Facebook / Instagram</SelectItem>
                <SelectItem value="friend" className="text-[10px] font-bold uppercase tracking-widest">From Friend</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>

        <div className="lg:col-span-5 bg-white border-l p-6 lg:p-12 sticky lg:h-screen lg:top-20 overflow-y-auto">
          <div className="max-md:max-w-md mx-auto space-y-8">
            {showErrorBanner && (
              <Alert variant="destructive" className="rounded-none border-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-bold uppercase tracking-widest">Incomplete Archive Details</AlertTitle>
                <AlertDescription className="text-[9px] uppercase font-medium">Please review the highlighted required fields to finalize your acquisition.</AlertDescription>
              </Alert>
            )}

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
                        <p className="text-[11px] font-bold">{item.price === 0 ? 'FREE' : `$${(item.price * item.quantity).toLocaleString()}`}</p>
                      </div>
                      <div className="flex gap-3 text-[9px] text-gray-400 font-bold uppercase">
                        <span>Size: {item.size}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                      {(item.customName || item.customNumber) && (
                        <div className="text-[8px] font-bold uppercase text-blue-600">
                          {item.customName} {item.customNumber}
                        </div>
                      )}
                      {item.specialNote && (
                        <div className="text-[8px] text-gray-500 mt-1 border-l border-gray-200 pl-2">
                          {item.specialNote}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Archive Code</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="ENTER CODE" 
                    className="h-10 bg-gray-50 border-gray-200 text-[10px] font-bold uppercase rounded-none"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                  />
                  <Button 
                    onClick={handleValidateCoupon}
                    disabled={isValidatingCoupon}
                    variant="outline" 
                    className="h-10 px-4 rounded-none border-black text-[9px] font-bold uppercase tracking-widest"
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
                  <span className="text-black">${cartSubtotal.toLocaleString()}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase text-red-600">
                    <span>Archive Discounts</span>
                    <span>-${discountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                  <span>Shipping</span>
                  <span className="text-black">{shippingRate > 0 ? `$${shippingRate}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                  <span>Tax</span>
                  <span className="text-black">${calculatedTax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end pt-2">
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em]">Total</span>
                  <p className="text-2xl font-bold font-headline tracking-tighter">${finalTotal.toLocaleString()} CAD</p>
                </div>
              </div>

              <div className="pt-8">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-16 bg-black text-white font-bold uppercase tracking-[0.3em] text-[12px] rounded-none shadow-xl"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Secure Checkout"}
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
              <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">Archive Order Confirmed</h2>
              <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Thank you for your acquisition.</p>
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
                    <p className="text-green-600">{confirmedOrder.status}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400">Recipient</p>
                    <p className="text-black">{confirmedOrder.customer.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400">Dispatch via</p>
                    <p className="text-black">{confirmedOrder.courier || confirmedOrder.deliveryMethod}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Archive Manifest</p>
                  <div className="space-y-3">
                    {confirmedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-[11px] font-bold uppercase">
                        <span>{item.quantity}x {item.name} ({item.size})</span>
                        <span>${(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between items-end">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total Value</span>
                  <span className="text-xl font-bold font-headline">${confirmedOrder.total.toLocaleString()} CAD</span>
                </div>
              </div>
            )}

            <Button asChild className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-[11px] rounded-none">
              <Link href="/">Return to Archive</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
