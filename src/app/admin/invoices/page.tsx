'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Plus, 
  Trash2, 
  Send, 
  Receipt, 
  User, 
  Mail, 
  FileText, 
  Zap, 
  ChevronRight,
  Package,
  CreditCard,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
  Truck,
  RefreshCw
} from 'lucide-react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getLivePath } from '@/lib/paths';
import { queueNotification, formatProductList, formatProductListHtml } from '@/lib/notifications';

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productId?: string;
  image?: string;
  sku?: string;
  size?: string;
}

export default function InvoiceMakerPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // HUD State
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Generate initial invoice ID on mount
  useEffect(() => {
    if (!invoiceNumber) {
      setInvoiceNumber(`INV-${Math.round(Date.now() / 1000)}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [invoiceNumber]);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [pendingSize, setPendingSize] = useState<string>('');
  const [senderAddress, setSenderAddress] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [shippingFee, setShippingFee] = useState(0);

  const paymentConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'payments') : null, [db]);
  const { data: paymentConfig } = useDoc(paymentConfigRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  // Automatically populate sender address from store config
  useEffect(() => {
    if (storeConfig?.address && !senderAddress) {
      setSenderAddress(storeConfig.address);
    }
  }, [storeConfig, senderAddress]);

  // Totals Calculation
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
  const tax = subtotal * 0.13; // 13% tax
  
  const processingFee = useMemo(() => {
    if (paymentMethod === 'manual' || !paymentConfig) return 0;
    const baseAmount = subtotal + tax;
    
    let percent = 0;
    let flat = 0;

    if (paymentMethod === 'paypal') {
      percent = paymentConfig.paypalProcessingFeePercent || 0;
      flat = paymentConfig.paypalProcessingFeeFlat || 0;
    } else if (paymentMethod === 'stripe') {
      percent = paymentConfig.stripeProcessingFeePercent || 0;
      flat = paymentConfig.stripeProcessingFeeFlat || 0;
    }
    
    return (baseAmount * (percent / 100)) + flat;
  }, [paymentMethod, paymentConfig, subtotal, tax]);

  const total = subtotal + tax + processingFee + Number(shippingFee);

  // Search Products – properly queries Firestore
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!db) return;
      
      // If searchQuery is empty, we show all products (latest 50)
      setIsSearching(true);
      try {
        const prodRef = collection(db, 'products');
        // Fetch up to 1000, filter client-side for flexible name/sku matching
        const q = query(prodRef, limit(1000));
        const snapshot = await getDocs(q);
        const term = searchQuery.toLowerCase();
        const results = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((p: any) => {
            if (!term) return true; // Show all if no term
            return (
              p.name?.toLowerCase().includes(term) ||
              p.sku?.toLowerCase().includes(term) ||
              p.brand?.toLowerCase().includes(term) ||
              p.category?.toLowerCase().includes(term)
            );
          })
          .slice(0, 200); // Increased limit significantly to show "all" relevant ones
        setSearchResults(results);
      } catch (error) {
        console.error('Product search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, db]);

  // Called after user picks a product from search; opens size picker
  const selectProductForSizing = (product: any) => {
    setPendingProduct(product);
    setPendingSize('');
    setSearchQuery('');
    setSearchResults([]);
  };

  // Extract all available sizes from a product's variants
  const getSizesForProduct = (product: any): string[] => {
    const variants = product.variants || {};
    const sizeSet = new Set<string>();
    Object.values(variants).forEach((v: any) => {
      if (v.size) sizeSet.add(v.size);
    });
    if (sizeSet.size === 0 && product.sizes) {
      (product.sizes as string[]).forEach(s => sizeSet.add(s));
    }
    return Array.from(sizeSet).sort();
  };

  // Actually add the item once a size has been chosen
  const confirmAddItem = () => {
    if (!pendingProduct) return;
    const sizeKey = pendingSize || 'ONE SIZE';
    const uniqueId = `${pendingProduct.id}-${sizeKey}`;
    
    setItems(prev => {
      const existing = prev.find(i => i.id === uniqueId);
      if (existing) {
        return prev.map(i => i.id === uniqueId ? { 
          ...i, 
          quantity: i.quantity + 1,
          productId: i.productId || pendingProduct.id,
          image: i.image || (pendingProduct.images?.[0] || '')
        } : i);
      }
      return [...prev, {
        id: uniqueId,
        productId: pendingProduct.id,
        name: pendingProduct.name,
        price: pendingProduct.price || 0,
        quantity: 1,
        sku: pendingProduct.sku,
        size: sizeKey,
        image: pendingProduct.images?.[0] || '',
      }];
    });

    toast({ title: 'Item Added', description: `${pendingProduct.name} (${sizeKey}) added.` });
    setPendingProduct(null);
    setPendingSize('');
    // Auto-focus back on search for "bring new product"
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const addManualItem = () => {
    const id = `manual-${Date.now()}`;
    setItems(prev => [...prev, { id, name: 'Custom Service/Item', price: 0, quantity: 1 }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    let sanitizedVal = val;
    if (field === 'price' || field === 'quantity') {
      sanitizedVal = isNaN(val) ? 0 : val;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: sanitizedVal } : i));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSendInvoice = async () => {
    if (!db || !customerEmail || items.length === 0) {
      toast({ title: "Transmission Failed", description: "Customer email and items required for uplink.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const invoiceData = {
        invoiceNumber,
        customerName,
        customerEmail,
        senderAddress,
        receiverAddress,
        items,
        subtotal,
        tax,
        shippingFee,
        processingFee,
        paymentMethod,
        total,
        timestamp: serverTimestamp(),
        status: 'SENT'
      };

      // 1. Log to invoices collection
      await addDoc(collection(db, 'invoices'), invoiceData);      // 2. Dispatch to mail collection for immediate delivery using template system
      await queueNotification(db, 'invoice', customerEmail, {
        customer_name: customerName || 'Valued Client',
        order_id: invoiceNumber,
        invoice_number: invoiceNumber,
        subtotal: `$${subtotal.toFixed(2)}`,
        shipping_fee: `$${Number(shippingFee).toFixed(2)}`,
        tax: `$${tax.toFixed(2)}`,
        processing_fee: `$${processingFee.toFixed(2)}`,
        order_total: `$${total.toFixed(2)}`,
        payment_method: paymentMethod?.toUpperCase() || 'MANUAL',
        product_list: formatProductList(items),
        product_manifest: formatProductListHtml(items),
        business_address: senderAddress || 'Feiselino (FSLNO) Sport Jerseys',
        business_name: 'Feiselino (FSLNO) Sport Jerseys'
      });

      toast({ 
        title: "Transmission Success", 
        description: `Invoice ${invoiceNumber} dispatched to client.`,
        className: "bg-black text-white"
      });
      
      // Reset
      setItems([]);
      setCustomerName('');
      setCustomerEmail('');
      setInvoiceNumber(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
      
    } catch (error: any) {
      toast({ title: "System Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1c1e] p-4 sm:p-0 font-admin-body selection:bg-black/10">
      {/* HUD Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/5 border border-black/10 flex items-center justify-center rounded-sm overflow-hidden">
              {storeConfig?.logoUrl ? (
                <img src={storeConfig.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Zap className="h-5 w-5 text-black" />
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black uppercase tracking-tighter italic text-black font-admin-headline leading-none">
                {storeConfig?.businessName || 'Invoice Maker'} <span className="text-gray-400">v2.1</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{storeConfig?.email}</p>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{storeConfig?.phone}</p>
              </div>
            </div>
          </div>
          <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black animate-pulse" />
            Order System Ready • FSLNO Team
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none px-3 sm:px-4 py-2 bg-gray-50 border border-[#e1e3e5] rounded-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Input 
                placeholder="INV-XXXX"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                className="h-6 bg-transparent border-none p-0 text-xs sm:text-sm font-mono font-bold tracking-widest text-black focus-visible:ring-0 w-24 sm:w-32"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-black/5 transition-colors"
                onClick={() => setInvoiceNumber(`INV-${Math.floor(100000 + Math.random() * 900000)}`)}
                title="Regenerate"
              >
                <RefreshCw className="h-3 w-3 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSendInvoice}
            disabled={isSending || items.length === 0}
            className={cn(
               "h-12 sm:h-14 transition-all font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-4 sm:px-8 rounded-none group relative overflow-hidden flex-1 md:flex-none",
               items.length === 0 ? "bg-gray-100 text-gray-400 border border-[#e1e3e5]" : "bg-black text-white hover:bg-black/90"
            )}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <div className="flex items-center gap-2">
                <span>Engage</span>
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Modules */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Module */}
            <Card className="bg-white border-[#e1e3e5] rounded-none shadow-none relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-black" />
              <CardHeader className="border-b border-[#e1e3e5] bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Client Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Full Name</Label>
                    <Input 
                      placeholder="JOHN DOE" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value.toUpperCase())}
                      className="bg-white border-[#e1e3e5] h-11 uppercase font-bold text-xs tracking-tight focus-visible:ring-black/5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="client@uplink.net" 
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="bg-white border-[#e1e3e5] h-11 pl-10 font-mono text-xs focus-visible:ring-black/5"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="bg-white border-[#e1e3e5] h-11 text-xs font-bold uppercase tracking-tight focus:ring-black/5 rounded-none">
                        <SelectValue placeholder="SELECT PAYMENT" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-[#e1e3e5]">
                        <SelectItem value="manual" className="text-xs font-bold uppercase">Manual / E-Transfer (No Fee)</SelectItem>
                        <SelectItem value="stripe" className="text-xs font-bold uppercase">Stripe / Credit Card (+ Fee)</SelectItem>
                        <SelectItem value="paypal" className="text-xs font-bold uppercase">PayPal (+ Fee)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Shipping Fee</Label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={shippingFee || ''}
                        onChange={(e) => setShippingFee(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        className="bg-white border-[#e1e3e5] h-11 pl-10 font-mono text-xs focus-visible:ring-black/5"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Matrix Module */}
            <Card className="bg-white border-[#e1e3e5] rounded-none shadow-none relative overflow-hidden md:col-span-2">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <CardHeader className="border-b border-[#e1e3e5] bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Shipping Addresses</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Sender Address (Origins)</Label>
                    <textarea 
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-[#e1e3e5] p-3 text-xs font-bold uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-black min-h-[80px]"
                      placeholder="FSLNO HQ..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Receiver Address (Destination)</Label>
                    <textarea 
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-[#e1e3e5] p-3 text-xs font-bold uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-black min-h-[80px]"
                      placeholder="CLIENT DESTINATION..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Search Module */}
            <Card className="bg-white border-[#e1e3e5] rounded-none shadow-none relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-gray-300" />
              <CardHeader className="border-b border-[#e1e3e5] bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Product Search</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input 
                    placeholder="SCAN BY NAME OR SKU..." 
                    value={searchQuery}
                    ref={searchInputRef}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border-[#e1e3e5] h-11 pl-10 uppercase font-black text-[9px] tracking-widest focus-visible:ring-black/5"
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                  {(searchQuery || pendingProduct) && !isSearching && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setPendingProduct(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                  )}
                </div>

                {/* Backdrop and HUD Local Selection Dropdown */}
                {(searchResults.length > 0 || pendingProduct) && (
                  <>
                    <div 
                      className="fixed inset-0 z-[150]"
                      onClick={() => {
                        setSearchResults([]);
                        if (!pendingProduct) setSearchQuery('');
                        setPendingProduct(null);
                      }}
                    />
                    <div className="absolute top-full left-0 right-0 z-[160] mt-1 bg-white border-2 border-black shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col max-h-[450px] overflow-hidden">
                      {pendingProduct ? (
                        <div className="flex flex-col h-full bg-white divide-y divide-black">
                          <div className="p-4 bg-black text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white border border-white/20 flex items-center justify-center shrink-0 overflow-hidden rounded-sm">
                                {pendingProduct.images?.[0] ? (
                                  <img src={pendingProduct.images[0]} alt="" className="w-full h-full object-cover p-0.5" />
                                ) : (
                                  <Package className="h-4 w-4 text-black" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{pendingProduct.name}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{pendingProduct.sku} • ${pendingProduct.price}</span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setPendingProduct(null)}
                              className="h-7 text-white/50 hover:text-white hover:bg-white/10 text-[8px] font-black uppercase tracking-widest"
                            >
                              Back to search
                            </Button>
                          </div>
                          <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                            <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Specify Variant / Size</p>
                            {(() => {
                              const sizes = getSizesForProduct(pendingProduct);
                              if (sizes.length === 0) {
                                return (
                                  <Input
                                    placeholder="e.g. M, L, XL or ONE SIZE"
                                    value={pendingSize}
                                    onChange={(e) => setPendingSize(e.target.value.toUpperCase())}
                                    className="h-10 uppercase font-bold text-xs tracking-tight border-black rounded-none focus-visible:ring-black/5"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && pendingSize && confirmAddItem()}
                                  />
                                );
                              }
                              return (
                                <div className="grid grid-cols-4 gap-2">
                                  {sizes.map(s => (
                                    <button
                                      key={s}
                                      onClick={() => {
                                        setPendingSize(s);
                                        // Auto confirm if picking from grid for speed
                                        setTimeout(() => {
                                          const sizeKey = s || 'ONE SIZE';
                                          const uniqueId = `${pendingProduct.id}-${sizeKey}`;
                                          setItems(prev => {
                                            const existing = prev.find(i => i.id === uniqueId);
                                            if (existing) {
                                              return prev.map(i => i.id === uniqueId ? { 
                                                ...i, 
                                                quantity: i.quantity + 1,
                                                productId: i.productId || pendingProduct.id,
                                                image: i.image || (pendingProduct.images?.[0] || '')
                                              } : i);
                                            }
                                            return [...prev, {
                                              id: uniqueId,
                                              productId: pendingProduct.id,
                                              name: pendingProduct.name,
                                              price: pendingProduct.price || 0,
                                              quantity: 1,
                                              sku: pendingProduct.sku,
                                              size: sizeKey,
                                              image: pendingProduct.images?.[0] || '',
                                            }];
                                          });
                                          toast({ title: 'Item Added', description: `${pendingProduct.name} (${sizeKey}) added.` });
                                          setPendingProduct(null);
                                          setPendingSize('');
                                          setSearchQuery('');
                                          setSearchResults([]);
                                          setTimeout(() => searchInputRef.current?.focus(), 10);
                                        }, 10);
                                      }}
                                      className={cn(
                                        "px-2 py-2 border text-[10px] font-black uppercase tracking-widest transition-all h-10 flex items-center justify-center",
                                        "bg-white text-black border-black hover:bg-black hover:text-white"
                                      )}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                            {!getSizesForProduct(pendingProduct).length && (
                              <Button
                                onClick={confirmAddItem}
                                disabled={!pendingSize}
                                className="w-full h-10 bg-black text-white font-black uppercase tracking-widest text-[9px] rounded-none hover:bg-black/90 disabled:opacity-30"
                              >
                                <Plus className="h-3.5 w-3.5 mr-2" />
                                Confirm Selection
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                          <div className="grid grid-cols-1 divide-y divide-gray-100">
                            {searchResults.map((product) => (
                              <div 
                                key={product.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => selectProductForSizing(product)}
                                onKeyDown={(e) => e.key === 'Enter' && selectProductForSizing(product)}
                                className="p-3 flex items-center justify-between hover:bg-black hover:text-white cursor-pointer group/item transition-all duration-150 outline-none"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white border border-black/5 flex items-center justify-center shrink-0 overflow-hidden rounded-sm">
                                    {product.images?.[0] ? (
                                      <img src={product.images[0]} alt="" className="w-full h-full object-cover p-0.5" />
                                    ) : (
                                      <Package className="h-4 w-4 text-gray-200" />
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-tight text-inherit leading-none">{product.name}</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="rounded-none border-gray-200 text-[7px] font-mono h-4 px-1 uppercase font-black text-gray-400 group-hover/item:text-white group-hover/item:border-white/40">
                                        {product.sku || 'N/A'}
                                      </Badge>
                                      {product.category && (
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest group-hover/item:text-white/60">{product.category}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-sm font-black italic tracking-tighter">${product.price}</p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover/item:text-white transition-colors" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="border-t border-black/5 p-2 bg-gray-50 flex justify-center sticky bottom-0">
                        <p className="text-[7px] font-black uppercase tracking-[0.4em] text-gray-400">Stream Intelligence • Encrypted Uplink</p>
                      </div>
                    </div>
                  </>
                )}
                
                <p className="text-[8px] uppercase font-bold text-gray-400 italic tracking-widest">
                  * Live inventory synchronization active.
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Receipt Items */}
          <Card className="bg-white border-[#e1e3e5] rounded-none shadow-none">
            <CardHeader className="border-b border-[#e1e3e5] flex flex-row items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Purchased Items</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addManualItem}
                className="h-8 border-[#e1e3e5] hover:bg-black hover:text-white transition-all text-[9px] font-black uppercase tracking-widest gap-2"
              >
                <Plus className="h-3 w-3" /> Add Custom Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {/* Desktop View Table */}
                <table className="w-full text-left hidden md:table">
                  <thead>
                    <tr className="border-b border-[#e1e3e5] bg-gray-50/10">
                      <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400">Product Name</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Size</th>
                      <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400">Price Each</th>
                      <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Quantity</th>
                      <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Total</th>
                      <th className="p-6 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-[#e1e3e5] group hover:bg-gray-50 transition-colors">
                        <td className="p-6">
                          <div className="space-y-1">
                            <Input 
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value.toUpperCase())}
                              className="bg-transparent border-none p-0 h-auto font-black uppercase text-xs tracking-tight focus-visible:ring-0 focus-visible:text-black transition-colors"
                            />
                            {item.sku && <p className="text-[8px] font-mono text-gray-300 tracking-widest uppercase">{item.sku}</p>}
                          </div>
                        </td>
                        <td className="p-4">
                          <Input 
                            value={item.size || ''}
                            placeholder="SIZE"
                            onChange={(e) => updateItem(item.id, 'size', e.target.value.toUpperCase())}
                            className="h-8 w-16 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-none text-center border-none focus-visible:ring-1 focus-visible:ring-gray-400"
                          />
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-300 font-bold">$</span>
                            <Input 
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                updateItem(item.id, 'price', val);
                              }}
                              className="bg-transparent border-none p-0 h-auto w-20 font-mono text-xs focus-visible:ring-0 font-bold"
                            />
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                              className="w-6 h-6 border border-[#e1e3e5] rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors text-[10px]"
                            >-</button>
                            <span className="w-6 text-center font-black text-xs">{item.quantity}</span>
                            <button 
                              onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                              className="w-6 h-6 border border-[#e1e3e5] rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors text-[10px]"
                            >+</button>
                          </div>
                        </td>
                        <td className="p-6 text-right font-black text-xs tracking-tighter">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="p-6 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile View Card Layout */}
                <div className="md:hidden divide-y divide-[#e1e3e5]">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 space-y-4 bg-white hover:bg-gray-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 pr-10 relative flex-1">
                          <Input 
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value.toUpperCase())}
                            className="bg-transparent border-none p-0 h-auto font-black uppercase text-sm tracking-tight focus-visible:ring-0"
                          />
                          {item.sku && <p className="text-[9px] font-mono text-gray-400 tracking-widest uppercase">{item.sku}</p>}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-gray-300 hover:text-red-500 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-[8px] uppercase font-bold text-gray-400 tracking-widest lowercase">Spec/Size</Label>
                          <Input 
                            value={item.size || ''}
                            placeholder="SIZE"
                            onChange={(e) => updateItem(item.id, 'size', e.target.value.toUpperCase())}
                            className="h-9 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-none border-none px-3"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[8px] uppercase font-bold text-gray-400 tracking-widest lowercase">Unit Price</Label>
                          <div className="flex items-center h-9 px-3 border border-[#e1e3e5]">
                            <span className="text-gray-400 text-xs mr-1">$</span>
                            <Input 
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => updateItem(item.id, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="bg-transparent border-none p-0 h-full w-full font-mono text-xs font-bold focus-visible:ring-0"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 border border-[#e1e3e5] rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                          >-</button>
                          <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                            className="w-8 h-8 border border-[#e1e3e5] rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                          >+</button>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest italic">Item Total</p>
                          <p className="text-sm font-black italic tracking-tighter">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <Package className="h-12 w-12" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Invoice is empty</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: HUD Preview */}
        <div className="lg:col-span-12 xl:col-span-4 mt-8 xl:mt-0">
          <div className="sticky top-24 space-y-6">
            <Card className="bg-white border border-[#e1e3e5] rounded-none shadow-2xl overflow-hidden relative">
              <CardHeader className="border-b border-[#e1e3e5] bg-gray-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-black" />
                    <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Receipt Preview</CardTitle>
                  </div>
                  <Badge className="bg-black text-white border-none text-[8px] font-black tracking-widest px-2 uppercase rounded-none">Ready</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8 relative">
                
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Consignee</p>
                    <p className="text-sm font-black uppercase tracking-tight">{customerName || ''}</p>
                    <p className="text-[9px] font-mono text-gray-400">{customerEmail || ''}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Reference</p>
                    <p className="text-[10px] font-mono font-bold text-black">{invoiceNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[9px] text-gray-400 font-bold uppercase tracking-tight italic">
                  <div className="space-y-1">
                    <p className="text-black border-b border-black/5 pb-1 mb-1">Origin</p>
                    <p className="whitespace-pre-line leading-tight">{senderAddress}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-black border-b border-black/5 pb-1 mb-1">Destination</p>
                    <p className="whitespace-pre-line leading-tight">{receiverAddress || ''}</p>
                  </div>
                </div>

                <Separator className="bg-[#e1e3e5]" />

                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center group animate-in slide-in-from-right-2 duration-300">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-tight text-[#1a1c1e] group-hover:text-blue-600 transition-colors">{item.name}</p>
                        <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest italic">x{item.quantity} @ ${item.price}</p>
                      </div>
                      <p className="text-[10px] font-black text-[#1a1c1e] italic">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-[9px] font-black uppercase text-gray-300 text-center py-4 border border-dashed border-[#e1e3e5] italic">Empty Terminal</p>
                  )}
                </div>

                <div className="space-y-3 pt-6 border-t border-[#e1e3e5]">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Subtotal Manifest</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Regulatory Tax (13%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  {Number(shippingFee) > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>Shipping Manifest</span>
                      <span>${Number(shippingFee).toFixed(2)}</span>
                    </div>
                  )}
                  {processingFee > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-blue-600">
                      <span>Processing Fee ({paymentMethod.toUpperCase()})</span>
                      <span>${processingFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-[#e1e3e5]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Net Exposure</span>
                    <span className="text-2xl font-black italic tracking-tighter text-[#1a1c1e]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Accents */}
                <div className="absolute bottom-4 right-4 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-black" />
                  <div className="w-6 h-1 bg-gray-100" />
                </div>
              </CardContent>
            </Card>

            <div className="bg-gray-50 border border-[#e1e3e5] p-4 flex gap-3 items-start">
              <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-[#1a1c1e] tracking-tight italic">Protocol Insight</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed tracking-tight">
                  Dispatched invoices                  Clients receive immediate email notifications from the FSLNO automated dispatch system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
