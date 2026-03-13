'use client';

import React, { use } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { Loader2, Package, Truck, MapPin, Calendar, CreditCard, ExternalLink, ArrowLeft, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function OrderDetailPage({ 
  params 
}: { 
  params: Promise<{ orderId: string }> 
}) {
  const { orderId } = use(params);
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!db || !orderId) return null;
    return doc(db, 'orders', orderId);
  }, [db, orderId]);

  const { data: order, isLoading: orderLoading } = useDoc(orderRef);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-50 text-green-700 border-green-100 uppercase text-[10px] font-bold tracking-widest">Delivered</Badge>;
      case 'processing':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-bold tracking-widest">Processing</Badge>;
      case 'ready_for_pickup':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-100 uppercase text-[10px] font-bold tracking-widest">Ready for Pickup</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-100 uppercase text-[10px] font-bold tracking-widest">In Transit</Badge>;
      case 'canceled':
        return <Badge className="bg-red-50 text-red-700 border-red-100 uppercase text-[10px] font-bold tracking-widest">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100 uppercase text-[10px] font-bold tracking-widest">{status?.replace('_', ' ')}</Badge>;
    }
  };

  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  if (isUserLoading || orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user || (order && order.userId !== user.uid)) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="pt-40 pb-24 px-4 flex flex-col items-center justify-center text-center">
          <div className="bg-red-50 p-8 border border-red-100 max-w-md">
            <h1 className="text-2xl font-headline font-bold uppercase mb-4">Access Denied</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
              This forensic transaction manifest is restricted. Please verify your credentials.
            </p>
            <Button asChild className="bg-black text-white px-10 h-12 rounded-none font-bold uppercase tracking-widest text-[10px]">
              <Link href="/account/orders">Back to History</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="pt-40 pb-24 px-4 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Transaction Not Found.</p>
          <Link href="/account/orders" className="mt-8 inline-block text-[10px] font-bold uppercase underline tracking-widest">Return to Archive</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F9F9]">
      <Header />
      
      <div className="pt-40 pb-24 max-w-[1280px] mx-auto px-4">
        <div className="mb-12">
          <Link href="/account/orders" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-6 group w-fit">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Back to History
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Order Status</span>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl md:text-5xl font-headline font-bold uppercase tracking-tight">#{order.id.substring(0, 8)}</h1>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Placed on {formatDate(order.createdAt)}</p>
            </div>
            {order.trackingNumber && (
              <Button asChild className="bg-black text-white h-12 px-8 rounded-none font-bold uppercase tracking-widest text-[10px]">
                <a href={`/track/${order.trackingNumber}`} target="_blank" rel="noopener noreferrer">
                  Track Shipment <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-none border shadow-none bg-white">
              <CardHeader className="border-b py-4">
                <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                  <Package className="h-3 w-3" /> Items Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex gap-6 p-6">
                      <div className="w-24 h-32 bg-gray-100 relative overflow-hidden border shrink-0">
                        {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="text-sm font-bold uppercase tracking-tight text-primary leading-none">{item.name}</h3>
                            <p className="text-sm font-bold text-primary">${formatCurrency(item.price * item.quantity)}</p>
                          </div>
                          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            <span>Size: {item.size}</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          {(item.customName || item.customNumber || item.specialNote) && (
                            <div className="pt-2 space-y-1">
                              {(item.customName || item.customNumber) && (
                                <p className="text-[10px] font-bold text-blue-600 uppercase">Personalized: {item.customName} {item.customNumber && `#${item.customNumber}`}</p>
                              )}
                              {item.specialNote && (
                                <p className="text-[10px] text-gray-400 italic">"{item.specialNote}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-none border shadow-none bg-white">
                <CardHeader className="border-b py-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                    <Truck className="h-3 w-3" /> Fulfillment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Delivery Method</p>
                    <p className="text-xs font-bold uppercase flex items-center gap-2">
                      {order.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {order.deliveryMethod} {order.courier && `• ${order.courier.toUpperCase()}`}
                    </p>
                  </div>
                  {order.deliveryMethod === 'shipping' && order.customer?.shipping && (
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Shipping Address</p>
                      <p className="text-xs font-bold uppercase leading-relaxed text-gray-600">
                        {order.customer.shipping.address}<br />
                        {order.customer.shipping.city}, {order.customer.shipping.province}<br />
                        {order.customer.shipping.postalCode}<br />
                        {order.customer.shipping.country}
                      </p>
                    </div>
                  )}
                  {order.deliveryMethod === 'pickup' && (
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Pickup Status</p>
                      <p className="text-xs font-bold uppercase text-blue-600">
                        {order.status === 'ready_for_pickup' ? 'Ready at the Spot' : 'Preparing for Pickup'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-none border shadow-none bg-white">
                <CardHeader className="border-b py-4">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                    <CreditCard className="h-3 w-3" /> Financials
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>Subtotal</span>
                    <span className="text-primary">${formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discountTotal > 0 && (
                    <div className="flex justify-between text-[10px] font-bold text-red-600 uppercase">
                      <span>Discounts</span>
                      <span>-${formatCurrency(order.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>Shipping</span>
                    <span className="text-primary">{order.shipping > 0 ? `$${formatCurrency(order.shipping)}` : 'FREE'}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>Tax</span>
                    <span className="text-primary">${formatCurrency(order.tax)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-[12px] font-bold uppercase tracking-widest">Grand Total</span>
                    <span className="text-xl font-bold font-headline">${formatCurrency(order.total)} CAD</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-black text-white p-8 space-y-6">
              <h3 className="text-sm font-headline font-bold uppercase tracking-tight">Need Assistance?</h3>
              <p className="text-[10px] uppercase font-bold text-gray-400 leading-relaxed tracking-widest">
                Our studio team is available for forensic support regarding your archival selection.
              </p>
              <Separator className="bg-white/10" />
              <div className="space-y-4">
                <Link href="/contact" className="flex items-center justify-between group">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Contact Studio</span>
                  <ChevronLeft className="h-3 w-3 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/shipping" className="flex items-center justify-between group">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Logistics Policy</span>
                  <ChevronLeft className="h-3 w-3 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="p-8 border bg-white space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-400" /> Archival Integrity
              </h3>
              <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-medium">
                Every transaction in the FSLNO archive is Authoritatively logged and verified. Once a status reaches "Delivered", the logistical cycle is strictly finalized.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
