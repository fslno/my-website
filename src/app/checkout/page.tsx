'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Store, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  CheckCircle2,
  Package,
  Search,
  ChevronDown
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
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
import { cn } from '@/lib/utils';
import Image from 'next/image';

type DeliveryMethod = 'shipping' | 'pickup';

const TAX_RATES: Record<string, number> = {
  // Canada
  'ON': 0.13, // HST
  'BC': 0.12, // PST + GST
  'QC': 0.14975, // QST + GST
  'AB': 0.05, // GST
  'MB': 0.12,
  'NB': 0.15,
  'NL': 0.15,
  'NS': 0.15,
  'PE': 0.15,
  'SK': 0.11,
  // US (Simulated defaults)
  'NY': 0.08875,
  'CA': 0.0725,
  'TX': 0.0625,
  'FL': 0.06,
  'DEFAULT': 0.10
};

export default function CheckoutPage() {
  const { cart, cartSubtotal, cartCount } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [shippingRate, setShippingRate] = useState<number>(0);

  const calculatedTax = useMemo(() => {
    const rate = TAX_RATES[selectedProvince.toUpperCase()] || 0;
    return cartSubtotal * rate;
  }, [cartSubtotal, selectedProvince]);

  const total = useMemo(() => {
    return cartSubtotal + calculatedTax + shippingRate;
  }, [cartSubtotal, calculatedTax, shippingRate]);

  if (cartCount === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <Package className="h-12 w-12 text-gray-200 mb-4" />
        <h1 className="text-2xl font-headline font-bold mb-4 uppercase">Bag is Empty</h1>
        <p className="text-muted-foreground mb-8">You haven't archived any items yet.</p>
        <Button asChild className="bg-black text-white h-12 px-8 rounded-none uppercase tracking-widest font-bold text-[10px]">
          <Link href="/">Discover Archive</Link>
        </Button>
      </div>
    );
  }

  const handleUppercaseInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.toUpperCase();
  };

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
                onClick={() => { setDeliveryMethod('shipping'); setShippingRate(0); }}
                className={cn(
                  "p-6 border-2 text-left flex flex-col gap-3 transition-all",
                  deliveryMethod === 'shipping' ? "border-black bg-white shadow-lg" : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <Truck className={cn("h-6 w-6", deliveryMethod === 'shipping' ? "text-black" : "text-gray-400")} />
                  {deliveryMethod === 'shipping' && <CheckCircle2 className="h-4 w-4 text-black" />}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest">Shipping</p>
                  <p className="text-[10px] text-gray-500 mt-1">Dispatch from studio</p>
                </div>
              </button>

              <button
                onClick={() => { setDeliveryMethod('pickup'); setShippingRate(0); }}
                className={cn(
                  "p-6 border-2 text-left flex flex-col gap-3 transition-all",
                  deliveryMethod === 'pickup' ? "border-black bg-white shadow-lg" : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <Store className={cn("h-6 w-6", deliveryMethod === 'pickup' ? "text-black" : "text-gray-400")} />
                  {deliveryMethod === 'pickup' && <CheckCircle2 className="h-4 w-4 text-black" />}
                </div>
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
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Email Address</Label>
                <Input type="email" placeholder="ARCHIVE@FSLNO.COM" className="h-12 bg-[#F9F9F9] uppercase" onChange={handleUppercaseInput} />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Phone Number</Label>
                <Input type="tel" placeholder="+1 (555) 000-0000" className="h-12 bg-[#F9F9F9]" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Full Name</Label>
                <Input placeholder="ENTER YOUR FULL NAME" className="h-12 bg-[#F9F9F9] uppercase" onChange={handleUppercaseInput} />
              </div>
            </div>

            {deliveryMethod === 'shipping' ? (
              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-[10px] uppercase tracking-widest font-bold">Shipping Destination</h3>
                <div className="grid gap-4">
                  <Input placeholder="ADDRESS" className="h-12 uppercase" onChange={handleUppercaseInput} />
                  <Input placeholder="APARTMENT, SUITE, ETC. (OPTIONAL)" className="h-12 uppercase" onChange={handleUppercaseInput} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="CITY" className="h-12 uppercase" onChange={handleUppercaseInput} />
                    <Input placeholder="POSTAL CODE" className="h-12 uppercase" onChange={handleUppercaseInput} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Province / State</Label>
                      <Input 
                        placeholder="E.G. ON" 
                        className="h-12 uppercase"
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Country</Label>
                      <Input placeholder="E.G. CANADA" className="h-12 uppercase" onChange={handleUppercaseInput} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <Checkbox 
                    id="billing-same" 
                    checked={billingSameAsShipping} 
                    onCheckedChange={(checked) => setBillingSameAsShipping(!!checked)}
                  />
                  <label htmlFor="billing-same" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                    Billing address is the same as shipping
                  </label>
                </div>

                {!billingSameAsShipping && (
                  <div className="space-y-4 pt-4 animate-in fade-in duration-300">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold">Billing Address</h3>
                    <div className="grid gap-4">
                      <Input placeholder="ADDRESS" className="h-12 uppercase" onChange={handleUppercaseInput} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="CITY" className="h-12 uppercase" onChange={handleUppercaseInput} />
                        <Input placeholder="POSTAL CODE" className="h-12 uppercase" onChange={handleUppercaseInput} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <Truck className="h-3 w-3" /> Select Courier
                  </h3>
                  <RadioGroup defaultValue="fedex" onValueChange={(val) => setShippingRate(val === 'fedex' ? 25 : val === 'dhl' ? 45 : 0)} className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between p-4 border rounded-sm bg-gray-50/50">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="usps" id="usps" />
                        <Label htmlFor="usps" className="text-[11px] font-bold uppercase tracking-widest">Standard (USPS / Economy)</Label>
                      </div>
                      <span className="text-[11px] font-bold">FREE</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-sm bg-white">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="fedex" id="fedex" />
                        <Label htmlFor="fedex" className="text-[11px] font-bold uppercase tracking-widest">Priority (FedEx Express)</Label>
                      </div>
                      <span className="text-[11px] font-bold">$25.00</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-sm bg-white">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="dhl" id="dhl" />
                        <Label htmlFor="dhl" className="text-[11px] font-bold uppercase tracking-widest">International (DHL Luxury)</Label>
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
                  <Input placeholder="BILLING ADDRESS" className="h-12 uppercase" onChange={handleUppercaseInput} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="CITY" className="h-12 uppercase" onChange={handleUppercaseInput} />
                    <Input placeholder="POSTAL CODE" className="h-12 uppercase" onChange={handleUppercaseInput} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Province / State</Label>
                      <Input 
                        placeholder="E.G. ON" 
                        className="h-12 uppercase"
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Country</Label>
                      <Input placeholder="E.G. CANADA" className="h-12 uppercase" onChange={handleUppercaseInput} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t bg-gray-50/50 p-6 rounded-sm">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Pickup Scheduling
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Pickup Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input type="date" className="pl-10 h-12" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Time Slot</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input type="time" className="pl-10 h-12" defaultValue="14:00" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-6 bg-gray-50 border border-gray-100 p-8 rounded-sm">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-gray-500" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black">How did you find us?</h2>
            </div>
            
            <Select>
              <SelectTrigger className="h-12 bg-white border-gray-200 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                <SelectValue placeholder="SELECT AN OPTION" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google" className="text-[10px] font-bold uppercase tracking-widest">Google / Pinterest</SelectItem>
                <SelectItem value="social" className="text-[10px] font-bold uppercase tracking-widest">Facebook / Instagram</SelectItem>
                <SelectItem value="friend" className="text-[10px] font-bold uppercase tracking-widest">From Friend</SelectItem>
                <SelectItem value="repeat" className="text-[10px] font-bold uppercase tracking-widest">Repeat Customer</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>

        <div className="lg:col-span-5 bg-white border-l p-6 lg:p-12 sticky lg:h-screen lg:top-20 overflow-y-auto">
          <div className="max-md:max-w-md mx-auto space-y-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b pb-4">Order Summary ({cartCount})</h2>
            
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.variantId} className="flex gap-4 group">
                  <div className="w-20 h-20 relative bg-gray-50 border overflow-hidden shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-tight max-w-[180px] line-clamp-1">{item.name}</h3>
                        <p className="text-[11px] font-bold">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex gap-3 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        <span>Size: {item.size}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                      {(item.customName || item.customNumber) && (
                        <div className="mt-1 text-[8px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 p-1.5 rounded-sm">
                          {item.customName && <span className="mr-2">Name: {item.customName}</span>}
                          {item.customNumber && <span>No: {item.customNumber}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-8 border-t">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span>Subtotal</span>
                <span className="text-black">${cartSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span>Shipping</span>
                <span className="text-black">
                  {shippingRate > 0 ? `$${shippingRate.toFixed(2)} CAD` : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span>Tax</span>
                <span className={cn("text-black", !selectedProvince && "italic")}>
                  {selectedProvince ? `$${calculatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD` : 'Region tax calculated'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-end pt-2">
                <span className="text-[12px] font-bold uppercase tracking-[0.2em]">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-bold font-headline tracking-tighter">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">CAD</p>
                </div>
              </div>

              <div className="pt-8">
                <Button className="w-full h-16 bg-black text-white font-bold uppercase tracking-[0.3em] text-[12px] hover:bg-black/90 transition-all rounded-none shadow-xl">
                  Pay Now & Confirm Archive
                </Button>
                <p className="text-center text-[9px] text-gray-400 mt-4 uppercase tracking-widest">
                  By confirming your order, you agree to the FSLNO Archive terms of service.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-sm space-y-4 border border-dashed">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">SSL Secure Payment</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed uppercase tracking-widest">
                Your archive order is processed through encrypted financial networks. FSLNO does not store full credit card information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
