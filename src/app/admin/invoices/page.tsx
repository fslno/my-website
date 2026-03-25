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
  Truck
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDoc, useMemoFirebase } from '@/firebase';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  size?: string;
}

export default function InvoiceMakerPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  // HUD State
  const [invoiceNumber, setInvoiceNumber] = useState('');
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
      if (!db || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const prodRef = collection(db, 'products');
        // Fetch up to 50, filter client-side for flexible name/sku matching
        const q = query(prodRef, limit(50));
        const snapshot = await getDocs(q);
        const term = searchQuery.toLowerCase();
        const results = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((p: any) =>
            p.name?.toLowerCase().includes(term) ||
            p.sku?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term)
          )
          .slice(0, 8);
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
    const existing = items.find(i => i.id === uniqueId);
    if (existing) {
      setItems(items.map(i => i.id === uniqueId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, {
        id: uniqueId,
        name: pendingProduct.name,
        price: pendingProduct.price || 0,
        quantity: 1,
        sku: pendingProduct.sku,
        size: sizeKey,
      }]);
    }
    toast({ title: 'Module Anchored', description: `${pendingProduct.name} (${sizeKey}) added.` });
    setPendingProduct(null);
    setPendingSize('');
  };

  const addManualItem = () => {
    const id = `manual-${Date.now()}`;
    setItems([...items, { id, name: 'Custom Service/Item', price: 0, quantity: 1 }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    let sanitizedVal = val;
    if (field === 'price' || field === 'quantity') {
      sanitizedVal = isNaN(val) ? 0 : val;
    }
    setItems(items.map(i => i.id === id ? { ...i, [field]: sanitizedVal } : i));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
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
      await addDoc(collection(db, 'invoices'), invoiceData);

      // 2. Dispatch to mail collection for immediate delivery
      await addDoc(collection(db, 'mail'), {
        to: customerEmail,
        from: "FSLNO <goal@feiselinosportjerseys.ca>",
        replyTo: "goal@feiselinosportjerseys.ca",
        message: {
          subject: `${invoiceNumber} - Official Transmission from FSLNO`,
          html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h1 style="color: #000; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">FSLNO INVOICE</h1>
              <p style="color: #64748b; font-size: 12px; text-transform: uppercase;">ID: ${invoiceNumber}</p>
              <hr style="border: 0; border-top: 2px solid #000; margin: 20px 0;">
              
              <div style="margin-bottom: 30px; display: flex; justify-content: space-between; gap: 20px;">
                <div style="flex: 1;">
                  <p style="font-weight: 700; margin-bottom: 5px; font-size: 10px; color: #64748b; text-transform: uppercase;">FROM:</p>
                  <p style="margin: 0; white-space: pre-line;">${senderAddress}</p>
                </div>
                <div style="flex: 1;">
                  <p style="font-weight: 700; margin-bottom: 5px; font-size: 10px; color: #64748b; text-transform: uppercase;">BILL TO:</p>
                  <p style="margin: 0;">${customerName || 'Valued Client'}</p>
                  <p style="margin: 0; color: #64748b;">${customerEmail}</p>
                  <p style="margin: 5px 0 0 0; white-space: pre-line; font-size: 12px;">${receiverAddress}</p>
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="text-align: left; background-color: #f8fafc;">
                    <th style="padding: 10px; border-bottom: 2px solid #000; font-size: 10px; text-transform: uppercase;">ITEM</th>
                    <th style="padding: 10px; border-bottom: 2px solid #000; font-size: 10px; text-transform: uppercase;">SIZE</th>
                    <th style="padding: 10px; border-bottom: 2px solid #000; font-size: 10px; text-transform: uppercase;">QTY</th>
                    <th style="padding: 10px; border-bottom: 2px solid #000; font-size: 10px; text-transform: uppercase;">PRICE</th>
                    <th style="padding: 10px; border-bottom: 2px solid #000; font-size: 10px; text-transform: uppercase;">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: 600;">${item.name}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">${item.size || '—'}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">${item.quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">$${item.price.toFixed(2)}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="text-align: right; border-top: 2px solid #000; padding-top: 15px;">
                <p style="margin: 0; font-size: 14px;">SUBTOTAL: <strong>$${subtotal.toFixed(2)}</strong></p>
                <p style="margin: 5px 0; font-size: 14px;">TAX (13%): <strong>$${tax.toFixed(2)}</strong></p>
                ${Number(shippingFee) > 0 ? `<p style="margin: 5px 0; font-size: 14px;">SHIPPING FEE: <strong>$${Number(shippingFee).toFixed(2)}</strong></p>` : ''}
                ${processingFee > 0 ? `<p style="margin: 5px 0; font-size: 14px;">PROCESSING FEE (${paymentMethod.toUpperCase()}): <strong>$${processingFee.toFixed(2)}</strong></p>` : ''}
                <p style="margin: 0; font-size: 20px; font-weight: 800;">TOTAL: $${total.toFixed(2)}</p>
              </div>

              <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">
                FSLNO Operational Command • Guelph, ON
              </div>
            </div>
          `
        }
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
            <div className="w-10 h-10 bg-black/5 border border-black/10 flex items-center justify-center rounded-sm">
              <Zap className="h-5 w-5 text-black" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-black font-admin-headline">
              Invoice Maker <span className="text-gray-400">v2.0</span>
            </h1>
          </div>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            Operational Command • Real-time Uplink Ready
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-gray-50 border border-[#e1e3e5] rounded-sm">
            <p className="text-[8px] uppercase font-bold text-gray-400 mb-0.5 tracking-widest">Manifest ID</p>
            <Input 
              placeholder="GEN-ID-XXXX"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
              className="h-6 bg-transparent border-none p-0 text-sm font-mono font-bold tracking-widest text-black focus-visible:ring-0"
            />
          </div>
          <Button 
            onClick={handleSendInvoice}
            disabled={isSending || items.length === 0}
            className={cn(
               "h-14 transition-all font-black uppercase tracking-widest text-[10px] px-8 rounded-none group relative overflow-hidden",
               items.length === 0 ? "bg-gray-100 text-gray-400 border border-[#e1e3e5]" : "bg-black text-white hover:bg-black/90"
            )}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <div className="flex items-center gap-2">
                <span>Engage Delivery</span>
                <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
                  <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Client Protocol</CardTitle>
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
                  <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Geospatial Matrix (Addresses)</CardTitle>
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
            <Card className="bg-white border-[#e1e3e5] rounded-none shadow-none relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-gray-300" />
              <CardHeader className="border-b border-[#e1e3e5] bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Inventory Uplink</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input 
                    placeholder="SCAN BY NAME OR SKU..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border-[#e1e3e5] h-11 pl-10 uppercase font-black text-[9px] tracking-widest focus-visible:ring-black/5"
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                </div>

                {/* Search Results HUD */}
                {searchResults.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-[100%] bg-white border-x border-b border-[#e1e3e5] max-h-[300px] overflow-y-auto overflow-x-hidden shadow-2xl">
                    {searchResults.map((product) => (
                      <div 
                        key={product.id}
                        onClick={() => selectProductForSizing(product)}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer border-b border-[#e1e3e5] last:border-0 group/item transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 border border-[#e1e3e5] flex items-center justify-center shrink-0 overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover p-1" />
                            ) : (
                              <Package className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{product.name}</p>
                            <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">{product.sku}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-black text-[#1a1c1e]">${product.price}</p>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover/item:text-black transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-[8px] uppercase font-bold text-gray-400 italic tracking-widest">
                  * Live inventory synchronization active.
                </p>
              </CardContent>
            </Card>

            {/* Size Picker Panel — appears after product is selected from search */}
            {pendingProduct && (
              <div className="bg-white border-2 border-black rounded-none shadow-2xl animate-in slide-in-from-top-2 duration-300">
                <div className="px-6 py-4 border-b border-[#e1e3e5] flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    {pendingProduct.images?.[0] && (
                      <img src={pendingProduct.images[0]} alt="" className="w-10 h-10 object-cover border border-[#e1e3e5]" />
                    )}
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight">{pendingProduct.name}</p>
                      <p className="text-[9px] font-mono text-gray-400 uppercase">{pendingProduct.sku} • ${pendingProduct.price}</p>
                    </div>
                  </div>
                  <button onClick={() => { setPendingProduct(null); setPendingSize(''); }} className="text-gray-400 hover:text-black transition-colors text-[10px] font-bold uppercase tracking-widest">
                    ✕ Cancel
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Select Size</p>
                  {(() => {
                    const sizes = getSizesForProduct(pendingProduct);
                    if (sizes.length === 0) {
                      // No size variants — show a free-text input
                      return (
                        <Input
                          placeholder="e.g. M, L, XL or ONE SIZE"
                          value={pendingSize}
                          onChange={(e) => setPendingSize(e.target.value.toUpperCase())}
                          className="h-11 uppercase font-bold text-xs tracking-tight border-[#e1e3e5] rounded-none"
                        />
                      );
                    }
                    return (
                      <div className="flex flex-wrap gap-2">
                        {sizes.map(s => (
                          <button
                            key={s}
                            onClick={() => setPendingSize(s)}
                            className={cn(
                              "px-4 py-2 border text-[10px] font-black uppercase tracking-widest transition-all",
                              pendingSize === s
                                ? "bg-black text-white border-black"
                                : "bg-white text-black border-[#e1e3e5] hover:border-black"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  <Button
                    onClick={confirmAddItem}
                    disabled={!pendingSize}
                    className="w-full h-11 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-none hover:bg-black/90 disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Add to Invoice — {pendingProduct.name} ({pendingSize || '?'})
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Line Items HUD */}
          <Card className="bg-white border-[#e1e3e5] rounded-none shadow-none">
            <CardHeader className="border-b border-[#e1e3e5] flex flex-row items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Transaction Manifest</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addManualItem}
                className="h-8 border-[#e1e3e5] hover:bg-black hover:text-white transition-all text-[9px] font-black uppercase tracking-widest gap-2"
              >
                <Plus className="h-3 w-3" /> Manual Override
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#e1e3e5] bg-gray-50/10">
                      <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400">Operation / Item</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Size</th>
                      <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400">Unit Val</th>
                      <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Batch Vol</th>
                      <th className="p-6 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Net Tot</th>
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
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              className="bg-transparent border-none p-0 h-auto font-black uppercase text-xs tracking-tight focus-visible:ring-0 focus-visible:text-black transition-colors"
                            />
                            {item.sku && <p className="text-[8px] font-mono text-gray-300 tracking-widest uppercase">{item.sku}</p>}
                          </div>
                        </td>
                        <td className="p-4">
                          {item.size
                            ? <span className="inline-block px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest">{item.size}</span>
                            : <span className="text-[9px] text-gray-300 font-bold uppercase">—</span>
                          }
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
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-10">
                            <Package className="h-12 w-12" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Transaction Void • Initiate Input</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                    <CardTitle className="text-[10px] uppercase font-black tracking-widest text-[#1a1c1e]">Live HUD Matrix</CardTitle>
                  </div>
                  <Badge className="bg-black text-white border-none text-[8px] font-black tracking-widest px-2 uppercase rounded-none">Rendering</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8 relative">
                
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
                  Dispatched invoices are archived in the forensic ledger. Clients receive immediate encrypted transmission via FSLNO mail nodes.
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
