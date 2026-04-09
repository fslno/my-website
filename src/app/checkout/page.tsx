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
  Gift,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Calendar,
  Sparkles,
  MessageSquare,
  Globe,
  ShieldCheck,
  MapPin,
  Search,
  Zap,
  Coins,
  History as HistoryIcon,
  Banknote,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';
import { useCart, type Coupon } from '@/context/CartContext';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { trackSocialEvent } from '@/lib/social-events';
import { collection, addDoc, setDoc, serverTimestamp, getDoc, doc, updateDoc, increment, query, where, getDocs, arrayUnion } from 'firebase/firestore';
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
import { StripePayment } from '@/components/storefront/StripePayment';
import { ApplePayPayment } from '@/components/storefront/ApplePayPayment';
import { GooglePayPayment } from '@/components/storefront/GooglePayPayment';
import { StallionRates } from '@/components/storefront/StallionRates';
import { getStripe } from '@/lib/stripe';
import { queueNotification, formatProductList, formatProductListHtml, formatPriceBreakdownHtml, formatGiftCardsHtml } from '@/lib/notifications';
import { generateInvoicePDFBase64 } from '@/lib/pdf-generator';
import { getLivePath } from '@/lib/paths';
import { Elements } from '@stripe/react-stripe-js';


type DeliveryMethod = 'shipping' | 'pickup';

const TAX_RATES: Record<string, number> = {
  'ON': 0.13, 'BC': 0.12, 'QC': 0.14975, 'AB': 0.05, 'MB': 0.12, 'NB': 0.15, 'NL': 0.15, 'NS': 0.15, 'PE': 0.15, 'SK': 0.11, 'NY': 0.08875, 'CA': 0.0725, 'TX': 0.0625, 'FL': 0.06, 'DEFAULT': 0.10
};

const CheckoutCartItem = ({ item, updateCartItem, removeFromCart }: {
  item: any,
  updateCartItem: (id: string, updates: any) => void,
  removeFromCart: (id: string) => void
}) => {
  const [localName, setLocalName] = useState(item.customName || '');
  const [localNumber, setLocalNumber] = useState(item.customNumber || '');

  useEffect(() => {
    setLocalName(item.customName || '');
  }, [item.customName]);

  useEffect(() => {
    setLocalNumber(item.customNumber || '');
  }, [item.customNumber]);

  const db = useFirestore();
  const productRef = useMemoFirebase(() => 
    db && !item.isGiftCard ? doc(db, getLivePath('products'), item.id) : null, 
    [db, item.id, item.isGiftCard]
  );
  
  const { data: product } = useDoc(productRef);
  
  const maxQty = useMemo(() => {
    if (item.isGiftCard) return 10;
    
    // Prioritize data already in the cart item
    const preorderEnabled = item.preorderEnabled ?? product?.preorderEnabled;
    if (preorderEnabled) return 99;
    
    const stock = item.stock ?? (
      product?.variants && product.variants.length > 0 && item.size
        ? product.variants.find((v: any) => v.size === item.size)?.stock
        : product?.inventory
    );

    return stock !== undefined ? Number(stock) : item.quantity;
  }, [product, item]);

  const canIncrement = item.quantity < maxQty;

  const formatCurrencyLocal = (val: number) => val.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  return (
    <div className="flex gap-6 group">
      <Link href={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(item.id) ? '/gift-cards' : `/products/${item.id}`} className="w-20 h-20 relative bg-gray-50 border border-gray-100 shrink-0 shadow-sm overflow-hidden hover:opacity-80 transition-opacity">
        <Image src={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(item.id) ? '/images/gift-card-box.png' : item.image} alt={item.name} fill sizes="80px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
      </Link>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-4">
            <h3 className={cn(
              "text-[10px] font-black uppercase tracking-tight leading-tight hover:text-primary transition-colors",
              item.isLoyaltyReward ? "text-emerald-700" : "text-primary"
            )}>
              <Link href={['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(item.id) ? '/gift-cards' : `/products/${item.id}`}>
                {['electronic-gift-card', 'digital-gift-card', 'gift-card'].includes(item.id) ? 'Digital Gift Card' : item.name}
              </Link>
              {item.isLoyaltyReward && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[7px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm font-black tracking-widest leading-none">PREMIUM REWARD</span>
                </div>
              )}
            </h3>
            <div className="text-right shrink-0">
              <p className={cn(
                "text-[11px] font-black tracking-tighter",
                item.isLoyaltyReward ? "text-emerald-600" : "text-primary"
              )}>
                {item.isLoyaltyReward ? 'FREE' : `C$${formatCurrencyLocal(item.price * item.quantity)}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-4">
              <p className="text-[9px] text-muted-foreground font-black tracking-tight">Size: {item.size}</p>
              <div className="flex items-center gap-1.5 border border-gray-100/10 bg-gray-50/50 rounded-full px-2 py-0.5">
                <button 
                  onClick={() => updateCartItem(item.variantId, { quantity: Math.max(1, item.quantity - 1) })}
                  disabled={item.quantity <= 1}
                  className="text-black/40 hover:text-black transition-colors disabled:opacity-20"
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="text-[9px] font-black text-black w-3 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateCartItem(item.variantId, { quantity: item.quantity + 1 })}
                  disabled={!canIncrement}
                  className={cn(
                    "transition-colors",
                    canIncrement ? "text-black/40 hover:text-black" : "text-red-500/30 cursor-not-allowed"
                  )}
                  title={!canIncrement ? "Limit reached based on current stock" : ""}
                >
                  <Plus className={cn("h-2.5 w-2.5", !canIncrement && "text-red-500/50")} />
                </button>
              </div>
              <button 
                onClick={() => removeFromCart(item.variantId)}
                className="text-destructive hover:text-red-700 transition-colors ml-auto mr-1"
                title="Remove from cart"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            
            {item.isPreorder && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[8px] px-1.5 py-0.5 bg-orange-600 text-white rounded-full font-black italic tracking-widest leading-none">PRE-ORDER</span>
                <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest leading-none">Ships in {item.preorderEstimate || '2-4 weeks'}</span>
              </div>
            )}
          </div>
          {(item.customName !== undefined || item.customNumber !== undefined || item.specialNote) && (
            <div className="pt-2 space-y-1.5 border-t border-dashed border-gray-100 mt-2">
              {(item.customName !== undefined || item.customNumber !== undefined) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-2.5 w-2.5 text-blue-600" />
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Personalization</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[8.5px] font-black text-gray-400 uppercase">Name:</span>
                    <input 
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value.toUpperCase())}
                      onBlur={() => updateCartItem(item.variantId, { customName: localName })}
                      placeholder="PLAYER NAME"
                      className="flex-1 text-[8.5px] font-black text-blue-600 text-right uppercase bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-200 p-0 h-auto"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[8.5px] font-black text-gray-400 uppercase">Number:</span>
                    <input 
                      value={localNumber}
                      onChange={(e) => setLocalNumber(e.target.value)}
                      onBlur={() => updateCartItem(item.variantId, { customNumber: localNumber })}
                      placeholder="00"
                      className="w-12 text-[8.5px] font-black text-blue-600 text-right uppercase bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-200 p-0 h-auto"
                    />
                  </div>
                </div>
              )}
              {item.specialNote && (<p className="text-[8.5px] text-gray-400 italic font-medium leading-tight">"{item.specialNote}"</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CheckoutPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { 
    cart, 
    cartCount, 
    cartSubtotal, 
    clearCart,
    removeFromCart,
    updateCartItem,
    discountTotal, 
    totalBeforeTax,
    isFreeShippingEligible,
    shippingConfig,
    markSubscriberDiscountUsed,
    appliedCoupon, 
    applyCoupon, 
    appliedReferralCode, 
    applyReferralCode,
    referralDiscount,
    userReferralCode,
    userEarnings,
    userReferralCount,
    useCommission,
    setUseCommission,
    commissionApplied,
    appliedGiftCard,
    applyGiftCard,
    promoConfig
  } = useCart();
  
  const [mounted, setMounted] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const paymentConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: paymentConfig } = useDoc(paymentConfigRef);

  const notificationConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'notifications') : null, [db]);
  const { data: notificationConfig } = useDoc(notificationConfigRef);

    // Shipping config is now provided by useCart()

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const userProfileRef = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [selectedPayment, setSelectedPayment] = useState<string>('paypal');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingRate, setShippingRate] = useState<number>(0);
  const [stallionRateId, setStallionRateId] = useState<string>('');
  const [promoInput, setPromoInput] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  // Detect if every item in the cart is a digital product (no physical shipping needed)
  const isAllDigital = useMemo(() => cart.length > 0 && cart.every(item => item.isDigital || item.isGiftCard), [cart]);

  const stripePromise = useMemo(() => {
    if (paymentConfig?.stripePublishableKey) {
      return getStripe(paymentConfig.stripePublishableKey);
    }
    return null;
  }, [paymentConfig?.stripePublishableKey]);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [customerIp, setCustomerIp] = useState<string>('');
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [draftLeadId, setDraftLeadId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

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

  // Eligibility is now provided by useCart()

  const handleRateSelect = (rate: any) => {
    setSelectedRate(rate);
    setStallionRateId(rate.id);
    setFormData(prev => ({ ...prev, courier: rate.service }));
  };

  useEffect(() => {
    // Digital-only carts always have $0 shipping
    if (isAllDigital) {
      setShippingRate(0);
      return;
    }
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
  }, [isFreeShippingEligible, selectedRate, deliveryMethod, isAllDigital]);
  const isTaxReady = useMemo(() => {
    // Digital carts: tax readiness uses billing province only
    if (isAllDigital) return !!formData.billingProvince || !!formData.province;
    if (deliveryMethod === 'shipping') return billingSameAsShipping ? !!formData.province : !!formData.billingProvince;
    return !!formData.billingProvince;
  }, [isAllDigital, deliveryMethod, billingSameAsShipping, formData.province, formData.billingProvince]);

  const isShippingReady = useMemo(() => {
    // Digital-only orders don't need a shipping method
    if (isAllDigital) return true;
    if (deliveryMethod === 'shipping') return !!formData.courier || isFreeShippingEligible;
    return true; 
  }, [isAllDigital, deliveryMethod, formData.courier, isFreeShippingEligible]);

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
    } else if (selectedPayment === 'applepay' || selectedPayment === 'googlepay' || selectedPayment === 'stripe') {
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

  const currentTotal = totalBeforeTax + calculatedTax + shippingRate + calculatedProcessingFee;
  const giftCardUsage = appliedGiftCard ? Math.min(appliedGiftCard.currentBalance, currentTotal) : 0;
  const finalTotal = Math.max(0, currentTotal - giftCardUsage - commissionApplied);

  const shippingWeight = useMemo(() => {
    // Digital-only cart has no physical weight
    if (isAllDigital) return 0;
    return cart.reduce((acc, item) => {
      const itemWeight = Number(item.logistics?.weight || shippingConfig?.defaultWeight || 0.6);
      return acc + (itemWeight * item.quantity);
    }, 0);
  }, [cart, shippingConfig, isAllDigital]);

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
    stallionRateId: stallionRateId, paymentMethod: selectedPayment || 'paypal', referral: formData.referral, 
    referralCodeUsed: !!appliedReferralCode, 
    appliedReferralCode: appliedReferralCode || null,
    giftCardUsed: !!appliedGiftCard,
    giftCardCode: appliedGiftCard?.code || null,
    giftCardUsage: giftCardUsage,
    commissionUsed: commissionApplied,
    isAllDigital,
    note: orderNote,
    pickupDate: deliveryMethod === 'pickup' ? formData.pickupDate : null, pickupTime: deliveryMethod === 'pickup' ? formData.pickupTime : null,
  }), [user, formData, deliveryMethod, cart, cartSubtotal, discountTotal, appliedCoupon, calculatedTax, shippingRate, calculatedProcessingFee, finalTotal, selectedPayment, orderNote, billingSameAsShipping, stallionRateId, commissionApplied, appliedGiftCard, giftCardUsage, isAllDigital]);

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
    
    if (isAllDigital) {
      if (!formData.billingAddress) newErrors.billingAddress = true;
      if (!formData.billingCity) newErrors.billingCity = true;
      if (!formData.billingPostalCode) newErrors.billingPostalCode = true;
      if (!formData.billingProvince) newErrors.billingProvince = true;
    } else if (deliveryMethod === 'shipping') {
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

  const saveLead = async (forceData?: any) => {
    if (!db || !formData.email || isSavingDraft) return;
    setIsSavingDraft(true);
    
    try {
      const cartItems = cart.map(item => ({
        id: item.id,
        variantId: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        size: item.size,
        isDigital: item.isDigital || item.isGiftCard,
        isGiftCard: item.isGiftCard,
        customName: item.customName || '',
        customNumber: item.customNumber || '',
        specialNote: item.specialNote || ''
      }));

      const draftData = {
        ...(forceData || formData),
        items: cartItems,
        subtotal: cartSubtotal,
        total: finalTotal,
        discountTotal: discountTotal,
        discountAmount: discountTotal,
        shipping: shippingRate,
        tax: calculatedTax,
        processingFee: calculatedProcessingFee,
        currency: 'CAD',
        status: 'lead',
        paymentStatus: 'awaiting_payment',
        abandonedEmailSent: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAllDigital,
        customerIp,
        deliveryMethod,
        platform: 'web',
        source: 'checkout_lead_capture_auto',
        viewed: false
      };

      if (draftLeadId) {
        await updateDoc(doc(db, 'leads', draftLeadId), {
          ...draftData,
          updatedAt: serverTimestamp(),
          source: 'checkout_lead_update'
        });
      } else {
        const docRef = await addDoc(collection(db, 'leads'), draftData);
        setDraftLeadId(docRef.id);
      }
    } catch (error) {
      console.error("[CHECKOUT] Auto-save draft failed:", error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Automatic Lead Capture (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && (formData.name || formData.address)) {
        saveLead();
      }
    }, 5000); // 5s debounce for lead capture
    return () => clearTimeout(timer);
  }, [formData.email, formData.name, formData.address, deliveryMethod, shippingRate, finalTotal]);

  const handleApplyPromoCode = async () => {
    if (!db || !promoInput) return;
    setIsValidatingPromo(true);
    const upperInput = promoInput.toUpperCase().trim();

    try {
      // 1. Check for Gift Card Prefix
      if (upperInput.startsWith('GFT-')) {
        const result = await applyGiftCard(upperInput);
        if (result.success) {
          toast({ title: "Gift Card Applied", description: result.message });
          setPromoInput('');
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
        }
      } 
      // 2. Check for Referral Prefix
      else if (upperInput.startsWith('REF-')) {
        const result = await applyReferralCode(upperInput);
        if (result.success) {
          toast({ title: "Referral Applied", description: result.message });
          setPromoInput('');
        } else {
          toast({ variant: "destructive", title: "Referral Error", description: result.message });
        }
      } 
      // 3. Fallback/Smart Detection
      else {
        // Try as Coupon first
        const couponDoc = await getDoc(doc(db, 'coupons', upperInput));
        if (couponDoc.exists()) {
          const data = couponDoc.data() as any;
          if (data.active) {
            applyCoupon(data);
            toast({ title: "Coupon Applied", description: "Discount verified." });
            setPromoInput('');
          } else {
            toast({ variant: "destructive", title: "Error", description: "Code is not active." });
          }
        } else {
          // Try Gift Card WITHOUT prefix for user convenience
          const gfResult = await applyGiftCard(upperInput);
          if (gfResult.success) {
            toast({ title: "Gift Card Applied", description: gfResult.message });
            setPromoInput('');
          } else {
            // Try Referral WITHOUT prefix
            const refResult = await applyReferralCode(upperInput);
            if (refResult.success) {
              toast({ title: "Referral Applied", description: refResult.message });
              setPromoInput('');
            } else {
              toast({ 
                variant: "destructive", 
                title: "Invalid Code", 
                description: "Invalid coupon, gift card, or referral code." 
              });
            }
          }
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to validate code." });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleOrderSuccess = async (firestoreId: string) => {
    if (!db) return;

    // 1. PROVIDE IMMEDIATE UI FEEDBACK
    // Show the success dialog and clear the cart as the very first action.
    // This makes the system feel responsive and "zeroes out" the checkout instantly.
    setConfirmedOrder({ 
      ...currentOrderData, 
      id: firestoreId,
      paymentStatus: 'paid' // Explicitly set as paid here
    });
    setShowSuccessDialog(true);
    clearCart();

    // 1.5 Auto-Generate Gift Cards immediately so they can be included in the receipt
    let generatedGiftCards: Array<{ code: string; amount: number; recipientName?: string }> = [];
    
    // Construct sender details for gift card emails (billing info)
    const billingProvince = billingSameAsShipping ? formData.province : formData.billingProvince;
    const billingCity = billingSameAsShipping ? formData.city : formData.billingCity;
    const billingAddress = billingSameAsShipping ? formData.address : formData.billingAddress;
    const billingPostalCode = billingSameAsShipping ? formData.postalCode : formData.billingPostalCode;
    const billingCountry = billingSameAsShipping ? formData.country : formData.billingCountry;
    const senderDetails = `${billingAddress}, ${billingCity}, ${billingProvince}, ${billingPostalCode}, ${billingCountry}`;

    if (db) {
      for (const item of cart) {
        if (item.isGiftCard) {
          try {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let newCode = 'GFT-';
            for (let i = 0; i < 9; i++) newCode += chars.charAt(Math.floor(Math.random() * chars.length));

            const gcData = {
              code: newCode,
              initialBalance: item.price,
              currentBalance: item.price,
              active: true,
              type: 'purchased',
              purchasedBy: user?.uid || 'guest',
              purchaserEmail: currentOrderData.email,
              purchaserName: currentOrderData.customer.name,
              recipientEmail: item.recipientEmail || currentOrderData.email,
              recipientName: item.recipientName || currentOrderData.customer.name,
              message: item.giftMessage || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              orderId: firestoreId,
              status: 'active'
            };

            await setDoc(doc(db, 'gift-cards', newCode), gcData);
            generatedGiftCards.push({ 
              code: newCode, 
              amount: item.price, 
              recipientName: gcData.recipientName 
            });
            
              // 2. Notify recipient (Direct Email)
              if (gcData.recipientEmail && gcData.recipientEmail.includes('@')) {
                await queueNotification(
                  db,
                  'giftCardDelivery',
                  gcData.recipientEmail.trim(),
                  {
                    order_id: firestoreId.substring(0, 8).toUpperCase(),
                    recipient_name: gcData.recipientName,
                    sender_name: gcData.purchaserName,
                    sender_email: gcData.purchaserEmail,
                    sender_details: senderDetails,
                    amount: `C$${item.price.toFixed(2)}`,
                    gift_code: newCode,
                    gift_message: gcData.message
                  }
                );
                console.log(`[CHECKOUT] Queued notification for recipient: ${gcData.recipientEmail}`);
              }

              // 3. Notify sender/purchaser as well (Pretty Receipt/Copy)
              if (gcData.purchaserEmail && gcData.purchaserEmail.includes('@') && gcData.purchaserEmail !== gcData.recipientEmail) {
                await queueNotification(
                  db,
                  'giftCardDelivery',
                  gcData.purchaserEmail.trim(),
                  {
                    order_id: firestoreId.substring(0, 8).toUpperCase(),
                    recipient_name: gcData.recipientName,
                    sender_name: gcData.purchaserName,
                    sender_email: gcData.purchaserEmail,
                    sender_details: senderDetails,
                    amount: `C$${item.price.toFixed(2)}`,
                    gift_code: newCode,
                    gift_message: gcData.message
                  }
                );
                console.log(`[CHECKOUT] Queued notification for sender: ${gcData.purchaserEmail}`);
              }
          } catch (e) {
            console.error("[CHECKOUT] Failed to generate purchased gift card:", e);
          }
        }
      }
    }

    try {
      let activeStaffEmails: string[] = [];
      // Use configured admin/business emails instead of querying staff collection (which is restricted for customers)
      if (notificationConfig?.global?.business_email) {
        activeStaffEmails.push(notificationConfig.global.business_email);
      } else if (storeConfig?.email) {
        activeStaffEmails.push(storeConfig.email);
      } else {
        activeStaffEmails.push('goal@feiselinosportjerseys.ca'); // Global fallback
      }

      let attachments: any[] = [];
      try {
        const invoiceData = {
          orderId: firestoreId.substring(0, 8).toUpperCase(),
          customerName: currentOrderData.customer.name,
          customerEmail: currentOrderData.email,
          customerPhone: formData.phone,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal: cartSubtotal,
          discountTotal: discountTotal,
          shipping: shippingRate,
          tax: calculatedTax,
          total: finalTotal,
          paymentMethod: selectedPayment,
          shippingAddress: deliveryMethod === 'shipping' 
            ? `${formData.address}\n${formData.city}, ${formData.province} ${formData.postalCode}\n${formData.country}`
            : `PICKUP IN STORE: ${formData.pickupDate} @ ${formData.pickupTime}`,
          businessName: storeConfig?.businessName || 'Feiselino (FSLNO) Sport Jerseys',
          businessEmail: storeConfig?.email || 'goal@feiselinosportjerseys.ca',
          businessAddress: storeConfig?.address || '12 Brant Ave #13, Guelph, ON. N1E 1E7'
        };
        const base64Pdf = generateInvoicePDFBase64(invoiceData);
        attachments.push({
          filename: `Invoice_${invoiceData.orderId}.pdf`,
          content: base64Pdf,
          encoding: 'base64'
        });
      } catch (pdfErr) {
        console.error("Could not generate PDF invoice:", pdfErr);
      }

      await queueNotification(
        db,
        'customer.order_confirmation',
        currentOrderData.email,
        {
          customer_name: currentOrderData.customer.name,
          order_id: firestoreId.substring(0, 8).toUpperCase(),
          product_list_html: formatProductListHtml(cart),
          gift_cards_html: generatedGiftCards.length > 0 ? formatGiftCardsHtml(generatedGiftCards) : '',
          price_breakdown_html: formatPriceBreakdownHtml({
            subtotal: cartSubtotal,
            discountTotal: discountTotal,
            shipping: shippingRate,
            tax: calculatedTax,
            total: finalTotal,
            processingFee: calculatedProcessingFee,
            couponCode: appliedCoupon?.code
          })
        },
        attachments
      );

      for (const staffEmail of activeStaffEmails) {
        await queueNotification(
          db,
          'staff.fulfillment_alert',
          staffEmail,
          {
            order_id: firestoreId.substring(0, 8).toUpperCase(),
            customer_name: currentOrderData.customer.name,
            customer_email: currentOrderData.email,
            delivery_method: currentOrderData.deliveryMethod.toUpperCase(),
            product_list_html: formatProductListHtml(cart)
          },
          [],
          attachments
        );
      }

      fetch('https://push.fslno.com/trigger', {
        method: 'POST', body: JSON.stringify({
          title: `New Order: ${firestoreId.substring(0, 8)}`,
          body: `${currentOrderData.customer.name} ordered ${cartCount} items (C$${finalTotal.toFixed(2)})`,
          url: `https://fslno.com/admin/orders/${firestoreId}`
        })
      }).catch(err => console.error("[CHECKOUT] Push trigger failed:", err));

    } catch (e) {
      console.error("[CHECKOUT] Notification error:", e);
    }
  
    // Referral Tracking Logic - Deep Guard
    if (db && appliedReferralCode && promoConfig) {
      // 0. Double check if referral program is actually enabled in config
      if (promoConfig.referralEnabled === false) {
        console.warn("[CHECKOUT] Referral code applied but program is disabled. Skipping tracking.");
      } else {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('referralCode', '==', appliedReferralCode));
          let referrerSnap: any = { empty: true };
          
          try {
            referrerSnap = await getDocs(q);
          } catch (permErr: any) {
            // Silently handle permission errors for collection-level queries
            if (permErr?.code === 'permission-denied') {
              console.log("[CHECKOUT] Referral lookup restricted. This is normal for guest checkouts.");
            } else {
              throw permErr;
            }
          }
          
          if (!referrerSnap.empty) {
            const referrerDoc = referrerSnap.docs[0];
            const referrerUid = referrerDoc.id;
            const bonusAmount = promoConfig?.referrerValue || 5;

            // 1. Create Referral Record
            await addDoc(collection(db, 'referrals'), {
              referrerUid,
              referredUid: user?.uid || 'guest',
              referredEmail: currentOrderData.email,
              orderId: firestoreId,
              bonusAmount,
              status: 'completed',
              createdAt: serverTimestamp()
            });

            // 2. Update Referrer Stats
            await updateDoc(doc(db, 'users', referrerUid), {
              referralCount: increment(1),
              earnings: increment(bonusAmount),
              updatedAt: serverTimestamp()
            });
            
            console.log("[CHECKOUT] Referral tracked successfully.");
          }
        } catch (e) {
          console.error("[CHECKOUT] Referral tracking error:", e);
        }
      }
    }

    // Deduct Applied Commission from User Balance
    if (db && user && commissionApplied > 0) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          earnings: increment(-commissionApplied),
          updatedAt: serverTimestamp()
        });
        console.log(`[CHECKOUT] Deducted ${commissionApplied} from user earnings`);
      } catch (e) {
        console.error("[CHECKOUT] Commission deduction failed:", e);
      }
    }

    // Gift cards were handled prior to confirmation notification^

    // Handle Gift Card Redemption Balance Update
    if (db && appliedGiftCard && giftCardUsage > 0) {
      try {
        const giftCardRef = doc(db, 'gift-cards', appliedGiftCard.code);
        await updateDoc(giftCardRef, {
          currentBalance: increment(-giftCardUsage),
          updatedAt: serverTimestamp(),
          usageHistory: arrayUnion({
            type: 'usage',
            amount: giftCardUsage,
            orderId: firestoreId,
            timestamp: new Date().toISOString()
          })
        });
        console.log(`[CHECKOUT] Deducted ${giftCardUsage} from gift card ${appliedGiftCard.code}`);
      } catch (e) {
        console.error("[CHECKOUT] Failed to update gift card balance:", e);
      }
    }

    await markSubscriberDiscountUsed(currentOrderData.email);
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
                  <Skeleton className="h-28 w-full rounded-3xl" />
                  <Skeleton className="h-28 w-full rounded-3xl" />
                </div>
              </div>
              <div className="space-y-8 bg-white p-8 border shadow-sm rounded-3xl">
                <Skeleton className="h-4 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-12 w-full rounded-full" />
                  <Skeleton className="h-12 w-full rounded-full" />
                  <Skeleton className="h-12 w-full md:col-span-2 rounded-full" />
                </div>
                <div className="space-y-4 pt-8">
                  <Skeleton className="h-12 w-full rounded-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full rounded-full" />
                    <Skeleton className="h-12 w-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 bg-white border p-6 space-y-6 h-fit rounded-3xl">
              <Skeleton className="h-4 w-48 mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-20 h-20 shrink-0 rounded-2xl" />
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
                <Skeleton className="h-8 w-full mt-4 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full flex-1 pt-28 sm:pt-40 pb-32 sm:pb-20 px-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all duration-300 mb-8 group w-fit btn-theme-ghost"
        style={{ borderRadius: 'var(--btn-radius)' }}
      >
        <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>



      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-12">

          <section className="space-y-6">
            {isAllDigital ? (
              <div className="p-6 border-2 border-dashed border-green-200 bg-green-50/50 rounded-sm flex items-center gap-4">
                <div className="h-10 w-10 bg-green-600 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-green-800">Digital Delivery — Free</p>
                  <p className="text-[10px] font-black tracking-wider mt-0.5">Your gift card code will be emailed to the recipient instantly after payment.</p>
                </div>
                <span className="ml-auto text-lg font-black text-green-700">C$0.00</span>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary">01. Shipping Method</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setDeliveryMethod('shipping'); setShippingRate(0); setErrors({}); }} 
                    className={cn(
                      "p-4 border-2 text-left flex flex-col gap-3 transition-all duration-300", 
                      deliveryMethod === 'shipping' ? "border-primary bg-white shadow-lg" : "border-gray-200 bg-gray-50/50"
                    )}
                    style={{ borderRadius: 'var(--btn-radius)' }}
                  >
                    <Truck className={cn("h-6 w-6", deliveryMethod === 'shipping' ? "text-primary" : "text-muted-foreground")} />
                    <div><p className={cn("text-[11px] font-black uppercase tracking-widest", deliveryMethod === 'shipping' ? "text-primary" : "text-muted-foreground")}>Shipping</p><p className="text-[10px] text-muted-foreground mt-1">Deliver to my address</p></div>
                  </button>
                  <button 
                    onClick={() => { setDeliveryMethod('pickup'); setShippingRate(0); setErrors({}); }} 
                    className={cn(
                      "p-4 border-2 text-left flex flex-col gap-3 transition-all duration-300", 
                      deliveryMethod === 'pickup' ? "border-primary bg-white shadow-lg" : "border-gray-200 bg-gray-50/50"
                    )}
                    style={{ borderRadius: 'var(--btn-radius)' }}
                  >
                    <Store className={cn("h-6 w-6", deliveryMethod === 'pickup' ? "text-primary" : "text-muted-foreground")} />
                    <div><p className={cn("text-[11px] font-black uppercase tracking-widest", deliveryMethod === 'pickup' ? "text-primary" : "text-muted-foreground")}>Pickup</p><p className="text-[10px] text-muted-foreground mt-1">Pick up in store</p></div>
                  </button>
                </div>
              </>
            )}
          </section>
          
          <section className="space-y-8 bg-white p-8 border shadow-sm rounded-3xl">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary">02. Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="email" className={cn("text-[9px] uppercase tracking-widest font-black", errors.email ? "text-destructive" : "text-muted-foreground")}>Email</Label><Input id="email" className="h-12 bg-[#F9F9F9] uppercase" style={{ borderRadius: 'var(--btn-radius)' }} value={formData.email} onChange={(e) => handleUppercaseInput('email', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="tel" className={cn("text-[9px] uppercase tracking-widest font-black", errors.phone ? "text-destructive" : "text-muted-foreground")}>Phone</Label><Input id="tel" className="h-12 bg-[#F9F9F9]" style={{ borderRadius: 'var(--btn-radius)' }} value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
              <div className="md:col-span-2 space-y-2"><Label htmlFor="name" className={cn("text-[9px] uppercase tracking-widest font-black", errors.name ? "text-destructive" : "text-muted-foreground")}>Full Name</Label><Input id="name" className="h-12 bg-[#F9F9F9] uppercase" style={{ borderRadius: 'var(--btn-radius)' }} value={formData.name} onChange={(e) => handleUppercaseInput('name', e.target.value)} /></div>
            </div>

            {isAllDigital ? (
              <div className="space-y-6 pt-10 border-t mt-10 animate-in fade-in slide-in-from-top-2 duration-500">
                <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" /> Billing Address
                </h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingAddress ? "text-destructive" : "text-muted-foreground")}>Address</Label>
                    <Input id="billingAddress" value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingCity" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingCity ? "text-destructive" : "text-muted-foreground")}>City</Label>
                      <Input id="billingCity" value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingPostalCode" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingPostalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label>
                      <Input id="billingPostalCode" value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingProvince" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingProvince ? "text-destructive" : "text-muted-foreground")}>Province</Label>
                      <Input id="billingProvince" value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-black">Country</Label>
                      <Select value={formData.billingCountry} onValueChange={(val) => handleInputChange('billingCountry', val)}>
                        <SelectTrigger className="h-12 bg-[#F9F9F9] uppercase font-black text-[10px]" style={{ borderRadius: 'var(--btn-radius)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ) : deliveryMethod === 'shipping' ? (
              <div className="space-y-10 pt-4 border-t">
                <div className="grid gap-4">
                  <div className="space-y-2"><Label htmlFor="address" className={cn("text-[9px] uppercase tracking-widest font-black", errors.address ? "text-destructive" : "text-muted-foreground")}>Shipping Address</Label><Input id="address" value={formData.address} onChange={(e) => handleUppercaseInput('address', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="city" className={cn("text-[9px] uppercase tracking-widest font-black", errors.city ? "text-destructive" : "text-muted-foreground")}>City</Label><Input id="city" value={formData.city} onChange={(e) => handleUppercaseInput('city', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                    <div className="space-y-2"><Label htmlFor="postalCode" className={cn("text-[9px] uppercase tracking-widest font-black", errors.postalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input id="postalCode" value={formData.postalCode} onChange={(e) => handleUppercaseInput('postalCode', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="province" className={cn("text-[9px] uppercase tracking-widest font-black", errors.province ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input id="province" value={formData.province} onChange={(e) => handleUppercaseInput('province', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                    <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-black">Country</Label><Select value={formData.country} onValueChange={(val) => handleInputChange('country', val)}><SelectTrigger className="h-12 bg-[#F9F9F9] uppercase font-black text-[10px]" style={{ borderRadius: 'var(--btn-radius)' }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox id="billing-same" checked={billingSameAsShipping} onCheckedChange={(checked) => setBillingSameAsShipping(checked === true)} className="rounded-full" />
                  <Label htmlFor="billing-same" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Billing same as shipping</Label>
                </div>

                {!billingSameAsShipping && (
                  <div className="space-y-6 pt-10 border-t mt-10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Billing Address</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2"><Label htmlFor="billingAddress" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingAddress ? "text-destructive" : "text-muted-foreground")}>Address</Label><Input id="billingAddress" value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="billingCity" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingCity ? "text-destructive" : "text-muted-foreground")}>City</Label><Input id="billingCity" value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                        <div className="space-y-2"><Label htmlFor="billingPostalCode" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingPostalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input id="billingPostalCode" value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="billingProvince" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingProvince ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input id="billingProvince" value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                        <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-black">Country</Label><Select value={formData.billingCountry} onValueChange={(val) => handleInputChange('billingCountry', val)}><SelectTrigger className="h-12 bg-[#F9F9F9] uppercase font-black text-[10px]" style={{ borderRadius: 'var(--btn-radius)' }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
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
                    <div className="space-y-2"><Label htmlFor="billingAddress" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingAddress ? "text-destructive" : "text-muted-foreground")}>Address</Label><Input id="billingAddress" value={formData.billingAddress} onChange={(e) => handleUppercaseInput('billingAddress', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="billingCity" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingCity ? "text-destructive" : "text-muted-foreground")}>City</Label><Input id="billingCity" value={formData.billingCity} onChange={(e) => handleUppercaseInput('billingCity', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                      <div className="space-y-2"><Label htmlFor="billingPostalCode" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingPostalCode ? "text-destructive" : "text-muted-foreground")}>Postal Code</Label><Input id="billingPostalCode" value={formData.billingPostalCode} onChange={(e) => handleUppercaseInput('billingPostalCode', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="billingProvince" className={cn("text-[9px] uppercase tracking-widest font-black", errors.billingProvince ? "text-destructive" : "text-muted-foreground")}>Province</Label><Input id="billingProvince" value={formData.billingProvince} onChange={(e) => handleUppercaseInput('billingProvince', e.target.value)} className="h-12 uppercase" style={{ borderRadius: 'var(--btn-radius)' }} /></div>
                      <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-black">Country</Label><Select value={formData.billingCountry} onValueChange={(val) => handleInputChange('billingCountry', val)}><SelectTrigger className="h-12 bg-[#F9F9F9] uppercase font-black text-[10px]" style={{ borderRadius: 'var(--btn-radius)' }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="United States">United States</SelectItem></SelectContent></Select></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-10 border-t">
                  <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Pickup Time</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="pickupDate" className={cn("text-[9px] uppercase font-bold", errors.pickupDate ? "text-destructive" : "")}>Date</Label><Input id="pickupDate" type="date" className="h-12" style={{ borderRadius: 'var(--btn-radius)' }} value={formData.pickupDate} onChange={(e) => handleInputChange('pickupDate', e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="pickupTime" className={cn("text-[9px] uppercase font-bold", errors.pickupTime ? "text-destructive" : "")}>Time</Label><Input id="pickupTime" type="time" className="h-12" style={{ borderRadius: 'var(--btn-radius)' }} value={formData.pickupTime} onChange={(e) => handleInputChange('pickupTime', e.target.value)} /></div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Step 03: Final Details (Referral & Notes) */}
          <section className="space-y-8 bg-white p-6 sm:p-10 border shadow-sm rounded-none">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-primary text-white flex items-center justify-center font-bold text-lg select-none">03</div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Final Details</h2>
            </div>
            
            <div className="space-y-6">
              {/* How did you find us */}
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" /> 
                  How did you find us?
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="referral" className={cn("text-[9px] uppercase tracking-widest font-black", errors.referral ? "text-destructive" : "text-muted-foreground")}>
                    Select an option
                  </Label>
                  <Select value={formData.referral} onValueChange={(val) => handleInputChange('referral', val)}>
                    <SelectTrigger id="referral" className="h-12 bg-gray-50 border-gray-200 uppercase font-black text-[10px]" style={{ borderRadius: 'var(--btn-radius)' }}>
                      <SelectValue placeholder="SELECT SOURCE" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOOGLE/PINTEREST" className="uppercase font-black text-[10px]">Google / Pinterest</SelectItem>
                      <SelectItem value="FACEBOOK/INSTAGRAM" className="uppercase font-black text-[10px]">Facebook / Instagram</SelectItem>
                      <SelectItem value="FROM FRIENDS" className="uppercase font-black text-[10px]">From Friends</SelectItem>
                      <SelectItem value="REPEAT CUSTOMER" className="uppercase font-black text-[10px]">Repeat Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>

            {/* ─── Mandatory Consent ─── */}
            <div className={cn(
              "border p-4 rounded-none space-y-3 transition-colors mt-8",
              consentChecked
                ? "border-emerald-300 bg-emerald-50/40"
                : consentError
                  ? "border-red-500 bg-red-50/60 animate-in fade-in shake-x"
                  : "border-gray-200 bg-gray-50/40"
            )}>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="checkout-consent"
                  checked={consentChecked}
                  onCheckedChange={(v) => { setConsentChecked(!!v); if (!!v) setConsentError(false); }}
                  className="border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black rounded-full"
                />
                <label
                  htmlFor="checkout-consent"
                  className="text-[10px] font-black uppercase tracking-wide sm:tracking-widest leading-relaxed cursor-pointer select-none"
                >
                    <>
                      I agree to the{' '}
                      <Link href="/policy/terms" target="_blank" className="underline underline-offset-2 hover:opacity-70">
                        Terms & Conditions
                      </Link>
                      {' '}and{' '}
                      <Link href="/policy/privacy" target="_blank" className="underline underline-offset-2 hover:opacity-70">
                        Privacy Policy
                      </Link>
                      . I understand that all sales are subject to these policies.
                    </>
                </label>
              </div>
              {consentError && !consentChecked && (
                <p className="text-[9px] text-red-600 font-bold uppercase tracking-widest flex items-center gap-1.5 pl-7">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  You must agree before proceeding to payment.
                </p>
              )}
            </div>
          </section>

          {/* Steps 01 & 02 are here */}
          
          <div className="pt-10 border-t mt-4 opacity-10 blur-sm pointer-events-none grayscale">
            <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" /> 256-bit SSL encrypted • Your data is safe
            </p>
          </div>

        </div>

        <div className="lg:col-span-5 bg-white border-l p-6 space-y-6">
          <h2 id="order-summary-section" className="text-sm font-bold uppercase tracking-[0.2em] border-b pb-4 text-primary">Order Summary ({cartCount})</h2>
          <div className="space-y-4">
            {cart.map((item) => (
              <CheckoutCartItem 
                key={item.variantId} 
                item={item} 
                updateCartItem={updateCartItem} 
                removeFromCart={removeFromCart} 
              />
            ))}
            
            {cart.some(item => item.isPreorder) && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-sm mt-4">
                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                  <Truck className="h-3 w-3" /> Pre-order Shipping Note
                </p>
                <p className="text-[8.5px] font-bold text-orange-600/70 uppercase tracking-wider mt-1 leading-relaxed">
                  Items marked "Pre-order" will ship as they become available. If your order contains both stock and pre-order items, they may ship together when all items are ready.
                </p>
              </div>
            )}
          </div>



          {/* Order Notes (Moved from main column) */}
          <div className="space-y-3 pt-6 border-t border-dashed mt-6">
            <h3 className="text-[10px] uppercase font-bold text-primary tracking-widest flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" /> 
              CUSTOMER COMMENT OPTIONAL
            </h3>
            <Textarea 
              ref={noteRef}
              value={orderNote} 
              onChange={(e) => setOrderNote(e.target.value.toUpperCase())} 
              placeholder="ANY SPECIAL REQUESTS..." 
              className="min-h-[80px] uppercase text-xs border-gray-200 py-3 bg-gray-50" 
              style={{ borderRadius: 'var(--btn-radius)' }}
            />
          </div>

          <div className="space-y-4 pt-6 border-t mt-6">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[11px] uppercase font-black tracking-[0.2em] text-black">PROMO & CREDITS</Label>
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </div>
            
            <div className="flex gap-2">
              <Input 
                value={promoInput} 
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())} 
                placeholder="DISCOUNT, GIFT CARD, OR REFERRAL" 
                className="h-12 bg-gray-50 uppercase font-black text-[10px] tracking-widest border-gray-200 focus:border-black focus:ring-0 transition-all rounded-full"
              />
              <Button 
                onClick={handleApplyPromoCode} 
                disabled={!promoInput || isValidatingPromo} 
                variant="outline" 
                className="h-12 px-8 font-black uppercase text-[10px] tracking-widest rounded-full border-black hover:bg-black hover:text-white transition-all shrink-0"
              >
                {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>

            <div className="space-y-2">
              {appliedCoupon && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-full animate-in fade-in slide-in-from-top-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-2">
                    <Tag className="h-3 w-3" /> DISCOUNT: {appliedCoupon.code}
                  </span>
                  <button onClick={() => applyCoupon(null)} className="text-emerald-700 hover:text-emerald-900 pr-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              
              {appliedGiftCard && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-full animate-in fade-in slide-in-from-top-1">
                  <span className="text-[10px] font-bold uppercase text-red-700 flex items-center gap-2">
                    <Gift className="h-3 w-3" /> GIFT CARD: {appliedGiftCard.code} (C${appliedGiftCard.currentBalance.toFixed(2)})
                  </span>
                  <button onClick={() => applyGiftCard(null)} className="text-red-700 hover:text-red-900 pr-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              
              {promoConfig?.referralEnabled !== false && appliedReferralCode && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-full animate-in fade-in slide-in-from-top-1">
                  <span className="text-[10px] font-bold uppercase text-blue-700 flex items-center gap-2">
                    <Zap className="h-3 w-3" /> REFERRAL: {appliedReferralCode}
                  </span>
                  <button onClick={() => applyReferralCode(null)} className="text-blue-700 hover:text-blue-900 pr-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

            {/* New: Commission Reward Redemption */}
            {user && userEarnings > 0 && promoConfig?.referralEnabled !== false && (
              <div className="mt-4 p-4 border border-dashed border-primary bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary text-white rounded-sm">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Commission Reward</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Available: C${formatCurrency(userEarnings)}</p>
                    </div>
                  </div>
                  
                  {userReferralCount >= 2 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary mr-1">
                        {useCommission ? 'APPLIED' : 'USE NOW'}
                      </span>
                      <Checkbox 
                        id="redeem-commission" 
                        checked={useCommission} 
                        onCheckedChange={(checked) => setUseCommission(checked === true)}
                        className="border-primary data-[state=checked]:bg-primary rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="text-right">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-primary text-primary px-1.5 py-0 rounded-none">
                        LOCKED
                      </Badge>
                    </div>
                  )}
                </div>

                {userReferralCount < 2 ? (
                  <div className="pt-2 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-primary/60">Unlock Redemption</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-primary">{userReferralCount}/2 REFERRALS</p>
                    </div>
                    <div className="h-1 w-full bg-primary/10">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${(userReferralCount / 2) * 100}%` }}
                      />
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase italic mt-1.5 leading-tight">
                      Complete 2 successful referrals to unlock your commission balance for checkout.
                    </p>
                  </div>
                ) : (
                  useCommission && commissionApplied > 0 && (
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 p-2 text-center border border-emerald-100 mt-2">
                      SAVING C${formatCurrency(commissionApplied)} ON THIS ORDER
                    </p>
                  )
                )}
              </div>
            )}

          <div className="pt-6 border-t space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>Subtotal</span><span className="text-primary">{`C$${formatCurrency(cartSubtotal)}`}</span></div>
            {discountTotal > 0 && (<div className="flex justify-between text-[10px] font-bold uppercase text-destructive"><span>Discount</span><span className="text-destructive">{`-C$${formatCurrency(discountTotal)}`}</span></div>)}
            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>{deliveryMethod === 'shipping' ? 'Shipping Fee' : 'Store Pickup'}</span><span className="text-primary">{isShippingReady ? (shippingRate > 0 ? `C$${formatCurrency(shippingRate)}` : 'FREE') : '--'}</span></div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground"><span>Tax</span><span className="text-primary">{isTaxReady ? `C$${formatCurrency(calculatedTax)}` : '--'}</span></div>
            {calculatedProcessingFee > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                <span>Processing Fee</span>
                <span className="text-primary">{`C$${formatCurrency(calculatedProcessingFee)}`}</span>
              </div>
            )}
            {giftCardUsage > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase text-red-600">
                <span>Gift Card Balance Used</span>
                <span className="text-red-600">{`-C$${formatCurrency(giftCardUsage)}`}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2"><span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">Total</span><p className="text-2xl font-bold font-headline tracking-tighter text-primary">{isSummaryReady ? `C$${formatCurrency(finalTotal)}` : '--'}</p></div>
          </div>

          <div className="pt-6 space-y-4 relative z-0 isolate">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">


              {/* ─── Trust Signals ─── */}
              <div className="grid grid-cols-2 gap-4 pb-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Payment</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">256-bit SSL Encryption</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Need Help?</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Live Chat Available</p>
                  </div>
                </div>
              </div>

              {/* ─── Payment Buttons ─── */}
              <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-bottom-4 duration-700">
                {paymentConfig && stripePromise ? (
                  <Elements stripe={stripePromise}>
                    {paymentConfig?.paypalEnabled && (
                      <div 
                        onClickCapture={() => setSelectedPayment('paypal')}
                        className={cn(
                          "space-y-2 p-3 transition-all duration-300 border-2",
                          selectedPayment === 'paypal' ? "border-transparent bg-white shadow-md scale-[1.02]" : "border-transparent opacity-80 hover:opacity-100"
                        )}
                        style={{ borderRadius: 'var(--btn-radius)' }}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-widest text-primary ml-1 flex items-center justify-between">
                          PayPal / Digital Wallet
                        </p>
                        <PayPalPayment 
                          amount={finalTotal} 
                          orderData={currentOrderData} 
                          onSuccess={handleOrderSuccess} 
                          validate={validate} 
                          clientId={paymentConfig.paypalClientId} 
                        />
                      </div>
                    )}

                    {paymentConfig?.stripeEnabled && (
                      <div 
                        onClickCapture={() => setSelectedPayment('stripe')}
                        className={cn(
                          "space-y-2 p-3 transition-all duration-300 border-2",
                          selectedPayment === 'stripe' ? "border-transparent bg-white shadow-md scale-[1.02]" : "border-transparent opacity-80 hover:opacity-100"
                        )}
                        style={{ borderRadius: 'var(--btn-radius)' }}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-widest text-primary ml-1 flex items-center justify-between">
                          Credit / Debit Card (Stripe)
                        </p>
                        <StripePayment 
                          amount={finalTotal} 
                          orderData={currentOrderData} 
                          onSuccess={handleOrderSuccess} 
                          validate={validate} 
                        />
                      </div>
                    )}

                    {paymentConfig?.applePayEnabled && (
                      <div 
                        onClickCapture={() => setSelectedPayment('applepay')}
                        className={cn(
                          "space-y-2 p-3 transition-all duration-300 border-2",
                          selectedPayment === 'applepay' ? "border-transparent bg-white shadow-md scale-[1.02]" : "border-transparent opacity-80 hover:opacity-100"
                        )}
                        style={{ borderRadius: 'var(--btn-radius)' }}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-widest text-black ml-1 flex items-center justify-between">
                          Apple Pay
                        </p>
                        <ApplePayPayment amount={finalTotal} orderData={currentOrderData} onSuccess={handleOrderSuccess} validate={validate} />
                      </div>
                    )}

                    {paymentConfig?.googlePayEnabled && (
                      <div 
                        onClickCapture={() => setSelectedPayment('googlepay')}
                        className={cn(
                          "space-y-2 p-3 transition-all duration-300 border-2",
                          selectedPayment === 'googlepay' ? "border-transparent bg-white shadow-md scale-[1.02]" : "border-transparent opacity-80 hover:opacity-100"
                        )}
                        style={{ borderRadius: 'var(--btn-radius)' }}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-widest text-primary ml-1 flex items-center justify-between">
                          Google Pay
                        </p>
                        <GooglePayPayment amount={finalTotal} orderData={currentOrderData} onSuccess={handleOrderSuccess} validate={validate} />
                      </div>
                    )}

                    {paymentConfig?.klarnaEnabled && (
                      <div 
                        onClickCapture={() => setSelectedPayment('klarna')}
                        className={cn(
                          "space-y-2 p-3 transition-all duration-300 border-2",
                          selectedPayment === 'klarna' ? "border-transparent bg-white shadow-md scale-[1.02]" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        style={{ borderRadius: 'var(--btn-radius)' }}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-widest text-primary ml-1 flex items-center justify-between">
                          Klarna / Pay Later
                        </p>
                        <div className="p-6 border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 text-center" style={{ borderRadius: 'var(--btn-radius)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Klarna Integration Pending</p>
                        </div>
                      </div>
                    )}

                    {paymentConfig?.afterpayEnabled && (
                      <div 
                        onClickCapture={() => setSelectedPayment('afterpay')}
                        className={cn(
                          "space-y-2 p-3 transition-all duration-300 border-2",
                          selectedPayment === 'afterpay' ? "border-transparent bg-white shadow-md scale-[1.02]" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        style={{ borderRadius: 'var(--btn-radius)' }}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-widest text-primary ml-1 flex items-center justify-between">
                          Afterpay / Clearpay
                        </p>
                        <div className="p-6 border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 text-center" style={{ borderRadius: 'var(--btn-radius)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Afterpay Integration Pending</p>
                        </div>
                      </div>
                    )}
                  </Elements>
                ) : (
                  <div className="p-12 border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initializing Secure Payments...</p>
                  </div>
                )}
              </div>

              {/* ─── Payment Instructions ─── */}
              <div className="pt-2 text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Complete Your Order</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Click one of the secure payment buttons to finalize your purchase.</p>
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
    </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-none w-screen h-screen bg-white rounded-none p-0 border-none flex flex-col scale-in-center overflow-y-auto z-[100]">
          <div className="bg-black text-white px-8 py-8 flex flex-col items-center text-center gap-4 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce-subtle">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1 relative z-10">
              <DialogTitle className="text-2xl font-black uppercase tracking-[0.2em] text-white leading-none">Order Confirmed</DialogTitle>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mt-2 flex items-center justify-center gap-2">
                <Sparkles className="h-3 w-3" /> Thank you for your purchase
              </p>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/70 leading-none">
                  REF #{confirmedOrder?.id?.substring(0, 8)?.toUpperCase()}
                </p>
              </div>
              <div className="px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/70 leading-none">
                  {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {/* Payment & Customer Status */}
            <div className="px-10 py-8 bg-gray-50/50 border-b border-gray-100 grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Payment Details</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-primary">{confirmedOrder?.paymentMethod}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> SECURELY PAID
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Customer</p>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-primary">{confirmedOrder?.customer?.name}</p>
                  <p className="text-[10px] font-bold text-gray-500 lowercase tracking-tight">{confirmedOrder?.email}</p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="px-10 py-8 border-b border-gray-100 grid grid-cols-2 gap-8">
              {confirmedOrder?.deliveryMethod === 'shipping' ? (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Shipping To</p>
                  <p className="text-[11px] font-bold uppercase leading-relaxed text-primary/80">
                    {confirmedOrder.customer.shipping?.address}<br />
                    {confirmedOrder.customer.shipping?.city}, {confirmedOrder.customer.shipping?.province} {confirmedOrder.customer.shipping?.postalCode}<br />
                    {confirmedOrder.customer.shipping?.country}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Pickup Location</p>
                  <p className="text-[11px] font-bold uppercase text-primary/80">In-Store Pickup</p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 inline-flex rounded-sm">
                    <Calendar className="h-3 w-3" /> {confirmedOrder?.pickupDate} @ {confirmedOrder?.pickupTime}
                  </div>
                </div>
              )}
              {confirmedOrder?.courier && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Carrier</p>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary/40" />
                    <p className="text-[11px] font-black uppercase text-primary">{confirmedOrder.courier}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Itemized Receipt */}
            <div className="px-10 py-8 space-y-6">
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 flex items-center justify-between">
                Order Items <span>({confirmedOrder?.items?.length})</span>
              </p>
              <div className="space-y-4">
                {confirmedOrder?.items?.map((item: any) => (
                  <div key={item.variantId} className="flex gap-6 group">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 shrink-0 overflow-hidden relative shadow-sm rounded-sm">
                      {item.image && <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-tight leading-tight text-primary">{item.name}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Size {item.size}</p>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Qty {item.quantity}</p>
                      </div>
                      {item.isPreorder && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[8px] px-2 py-0.5 bg-orange-600 text-white rounded-full font-black italic tracking-widest leading-none">PRE-ORDER</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-black tracking-tighter text-primary">C${formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="px-10 py-8 bg-zinc-900 text-white space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span>Subtotal</span>
                <span className="text-zinc-300">C${formatCurrency(confirmedOrder?.subtotal || 0)}</span>
              </div>
              {(confirmedOrder?.discountTotal || 0) > 0 && (
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-red-400">
                  <span>Discounts Applied</span>
                  <span>-C${formatCurrency(confirmedOrder?.discountTotal || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span>{confirmedOrder?.deliveryMethod === 'shipping' ? 'Shipping & Handling' : 'Pickup Fee'}</span>
                <span className="text-zinc-300">{confirmedOrder?.shipping > 0 ? `C$${formatCurrency(confirmedOrder.shipping)}` : 'FREE'}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span>Sales Tax (HST/GST)</span>
                <span className="text-zinc-300">C${formatCurrency(confirmedOrder?.tax || 0)}</span>
              </div>
              {(confirmedOrder?.processingFee || 0) > 0 && (
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-400">
                  <span>{confirmedOrder?.paymentMethod?.toUpperCase()} FEE</span>
                  <span>C${formatCurrency(confirmedOrder?.processingFee || 0)}</span>
                </div>
              )}
              <div className="pt-4 mt-4 border-t border-zinc-800 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Total Paid</p>
                  <p className="text-3xl font-black tracking-tighter text-emerald-400 leading-none">C${formatCurrency(confirmedOrder?.total || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Currency</p>
                  <p className="text-[10px] font-black text-zinc-300">CAD (Canadian Dollar)</p>
                </div>
              </div>
            </div>

            {/* Note */}
            {confirmedOrder?.note && (
              <div className="px-10 py-6 bg-white border-t border-gray-100">
                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Special Instructions
                </p>
                <div className="p-4 bg-gray-50 border border-gray-100 text-[10px] text-gray-600 font-bold uppercase italic leading-relaxed">
                  "{confirmedOrder.note}"
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-10 py-8 bg-white border-t space-y-4 shrink-0">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className="h-14 font-black uppercase tracking-widest text-[10px] border-zinc-200 hover:bg-zinc-50 rounded-none w-full"
                onClick={() => {
                  if (confirmedOrder) {
                    const invoiceData = {
                      orderId: confirmedOrder.id.substring(0, 8).toUpperCase(),
                      customerName: confirmedOrder.customer.name,
                      customerEmail: confirmedOrder.email,
                      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                      items: confirmedOrder.items.map((item: any) => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                      })),
                      subtotal: confirmedOrder.subtotal,
                      discountTotal: confirmedOrder.discountTotal,
                      shipping: confirmedOrder.shipping,
                      tax: confirmedOrder.tax,
                      total: confirmedOrder.total,
                      paymentMethod: confirmedOrder.paymentMethod,
                      shippingAddress: confirmedOrder.deliveryMethod === 'shipping' 
                        ? `${formData.address}\n${formData.city}, ${formData.province} ${formData.postalCode}\n${formData.country}`
                        : `IN-STORE PICKUP @ ${formData.pickupDate}`,
                      businessName: storeConfig?.businessName || 'FSLNO Jerseys',
                      businessEmail: storeConfig?.email || 'goal@feiselinosportjerseys.ca',
                      businessAddress: storeConfig?.address || 'Canada'
                    };
                    const base64 = generateInvoicePDFBase64(invoiceData);
                    const link = document.createElement('a');
                    link.href = `data:application/pdf;base64,${base64}`;
                    link.download = `FSLNO-Order-${invoiceData.orderId}.pdf`;
                    link.click();
                  }
                }}
              >
                <Zap className="h-4 w-4 mr-2" /> Download Receipt
              </Button>
              <Button asChild className="h-14 btn-theme rounded-none w-full shadow-lg shadow-black/5 hover:scale-[1.02] transition-transform">
                <Link href="/">Back to Website <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <p className="text-[9px] text-center text-gray-400 uppercase font-black tracking-widest">
              A copy of this confirmation has been sent to {confirmedOrder?.email}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
