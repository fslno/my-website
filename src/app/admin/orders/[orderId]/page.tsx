'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Loader2,
  Package,
  Truck,
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Printer,
  Send,
  ArrowLeft,
  ExternalLink,
  ScanBarcode,
  Globe,
  Barcode,
  ShieldCheck,
  Search,
  Sparkles,
  Terminal,
  Fingerprint,
  History,
  Shield,
  CreditCard,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, query, where, collection } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function OrderDetailPage(props: { 
  params: Promise<{ orderId: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = React.use(props.params);
  const searchParams = React.use(props.searchParams);
  const { orderId } = params;
  
  const db = useFirestore();
  const { toast } = useToast();

  const orderRef = useMemoFirebase(() => db ? doc(db, 'orders', orderId) : null, [db, orderId]);
  const { data: order, loading } = useDoc(orderRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  const customerOrdersQuery = useMemoFirebase(() => {
    if (!db || !order?.email) return null;
    return query(collection(db, 'orders'), where('email', '==', order.email));
  }, [db, order?.email]);

  const { data: customerOrders } = useCollection(customerOrdersQuery);
  const orderCount = customerOrders?.length || 0;

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (order?.trackingNumber) {
      setTrackingNumber(order.trackingNumber);
    }
  }, [order]);

  const handleUpdateStatus = (newStatus: string) => {
    if (!db || !order || isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    updateDoc(doc(db, 'orders', orderId), { status: newStatus })
      .then(() => {
        toast({ title: "Status Updated", description: `Order status changed to ${newStatus.replace('_', ' ').toUpperCase()}.` });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `orders/${orderId}`,
          operation: 'update',
          requestResourceData: { status: newStatus }
        }));
      })
      .finally(() => setIsUpdatingStatus(false));
  };

  const handleConfirmPayment = (newPaymentStatus: string = 'paid') => {
    if (!db || !order || isUpdatingPayment) return;
    setIsUpdatingPayment(true);

    updateDoc(doc(db, 'orders', orderId), { paymentStatus: newPaymentStatus })
      .then(() => {
        toast({ 
          title: "Payment Updated", 
          description: `Payment marked as ${newPaymentStatus.toUpperCase()}.` 
        });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `orders/${orderId}`,
          operation: 'update',
          requestResourceData: { paymentStatus: newPaymentStatus }
        }));
      })
      .finally(() => setIsUpdatingPayment(false));
  };

  const handleSaveTracking = () => {
    if (!db || !order) return;
    setIsSavingTracking(true);
    const updateData = { trackingNumber };
    updateDoc(doc(db, 'orders', orderId), updateData)
      .then(() => {
        toast({ title: "Tracking Saved", description: "Logistics ID has been updated." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `orders/${orderId}`,
          operation: 'update',
          requestResourceData: updateData
        }));
      })
      .finally(() => setIsSavingTracking(false));
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleResendEmail = () => {
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      toast({
        title: "Notification Sent",
        description: `Confirmation email resent to ${order?.email}.`
      });
    }, 1500);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold">Paid</Badge>;
      case 'awaiting':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">Awaiting Payment</Badge>;
      case 'refunded':
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[10px] font-bold">Refunded</Badge>;
      case 'partially_refunded':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-100 uppercase text-[10px] font-bold">Partially Refunded</Badge>;
      case 'canceled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Canceled</Badge>;
      default:
        return <Badge className="bg-zinc-50 text-zinc-700 border-zinc-100 uppercase text-[10px] font-bold">Pending</Badge>;
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Order Record Missing</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href="/admin/orders">Return to Orders</Link>
        </Button>
      </div>
    );
  }

  const aftershipUrl = order.trackingNumber 
    ? `https://www.aftership.com/track/${order.courier || 'auto'}/${order.trackingNumber}`
    : '#';

  return (
    <div className="space-y-8">
      {/* Printable Invoice Logic */}
      <div id="printable-invoice" className="hidden print:block w-[210mm] mx-auto bg-white text-black p-12 font-sans min-h-[297mm]">
        <style type="text/css" dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; padding: 0 !important; margin: 0 !important; }
            header, nav, aside, button, .print-hidden, footer, #theme-preview-root { display: none !important; }
            #printable-invoice { display: block !important; visibility: visible !important; position: absolute; left: 0; top: 0; }
            @page { size: A4; margin: 0; }
          }
        ` }} />
        
        <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                {storeConfig?.logoUrl ? <img src={storeConfig.logoUrl} className="w-full h-full object-cover" alt="logo" /> : (storeConfig?.businessName?.[0] || 'S')}
              </div>
              <h1 className="text-3xl font-headline font-bold tracking-tighter uppercase">{storeConfig?.businessName || 'FSLNO STUDIO'}</h1>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-headline font-bold tracking-tighter mb-2">INVOICE</h2>
            <p className="text-sm font-mono font-bold uppercase tracking-tight">Order #{order.id.substring(0, 6).toUpperCase()}</p>
            <p className="text-[10px] text-gray-400 mt-1">{formatDate(new Date())}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b pb-2">From</h3>
            <div className="space-y-1">
              <p className="font-bold uppercase text-sm">{storeConfig?.businessName || 'FSLNO STUDIO'}</p>
              <p className="text-xs uppercase leading-relaxed text-gray-600 whitespace-pre-wrap">
                {storeConfig?.address || '123 Luxury Way\nLondon, UK'}
              </p>
              <p className="text-xs font-bold mt-2">{storeConfig?.phone || '+1 (555) 000-0000'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b pb-2">To</h3>
            <div className="space-y-1">
              <p className="font-bold uppercase text-sm">{order.customer?.name || 'Valued Client'}</p>
              {order.customer?.shipping ? (
                <p className="text-xs uppercase leading-relaxed text-gray-600">
                  {order.customer.shipping.address}<br />
                  {order.customer.shipping.city}, {order.customer.shipping.province}<br />
                  {order.customer.shipping.postalCode}<br />
                  {order.customer.shipping.country}
                </p>
              ) : (
                <p className="text-xs uppercase italic text-gray-400">In-Store Pickup</p>
              )}
              <p className="text-xs font-bold mt-2">{order.email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b pb-2">Items Purchased</h3>
          <Table className="border-none shadow-none">
            <TableHeader className="bg-gray-50">
              <TableRow className="border-black border-b">
                <TableHead className="text-[9px] font-bold uppercase text-black">Product</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-black text-center">Size</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-black text-center">Qty</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-black text-right">Price</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-black text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.items || []).map((item: any, i: number) => (
                <TableRow key={i} className="border-b border-gray-100">
                  <TableCell>
                    <div className="py-1">
                      <p className="font-bold uppercase text-xs">{item.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs uppercase">{item.size}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{item.quantity}</TableCell>
                  <TableCell className="text-right text-xs">${formatCurrency(Number(item.price) || 0)}</TableCell>
                  <TableCell className="text-right font-bold text-xs">${formatCurrency((Number(item.price) || 0) * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mb-12">
          <div className="w-[300px] space-y-3">
            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
              <span>{order.deliveryMethod === 'shipping' ? 'Shipping' : 'Pick up'}</span>
              <span className="text-black">{Number(order.shipping) > 0 ? `$${formatCurrency(Number(order.shipping))}` : 'FREE'}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase text-red-600">
                <span>Discounts</span>
                <span>-${formatCurrency(Number(order.discountTotal) || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
              <span>Sales Tax</span>
              <span className="text-black">${formatCurrency(Number(order.tax) || 0)}</span>
            </div>
            <div className="h-px bg-black my-2" />
            <div className="flex justify-between items-end">
              <span className="text-[12px] font-bold uppercase tracking-widest">Grand Total</span>
              <span className="text-2xl font-headline font-bold">${formatCurrency(Number(order.total) || 0)} CAD</span>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-12 border-t text-[9px] uppercase tracking-widest text-gray-400 text-center">
          <p>Thank you for shopping with {storeConfig?.businessName || 'FSLNO'}.</p>
          <p className="mt-1">© {new Date().getFullYear()} {storeConfig?.businessName || 'FSLNO'}. ALL RIGHTS RESERVED.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <Link href="/admin/orders" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Order #{order.id.substring(0, 6).toUpperCase()}</h1>
            {getPaymentStatusBadge(order.paymentStatus || 'pending')}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrintInvoice} className="h-10 font-bold uppercase tracking-widest text-[10px] border-black">
            <Printer className="h-3 w-3 mr-2" /> Print Invoice
          </Button>
          <Button variant="outline" onClick={handleResendEmail} disabled={isSendingEmail} className="h-10 font-bold uppercase tracking-widest text-[10px] border-black">
            {isSendingEmail ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Send className="h-3 w-3 mr-2" />}
            Resend Email
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 print:hidden">
        <div className="flex-1 space-y-8">
          <Card className="border-[#e1e3e5] shadow-none bg-white">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Order Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-400">Payment Status</Label>
                  <Select value={order.paymentStatus || 'pending'} onValueChange={handleConfirmPayment} disabled={isUpdatingPayment}>
                    <SelectTrigger className="h-11 bg-white border-black text-[10px] font-bold uppercase tracking-widest">
                      <SelectValue placeholder="Payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-[10px] font-bold uppercase">Pending</SelectItem>
                      <SelectItem value="paid" className="text-[10px] font-bold uppercase">Paid</SelectItem>
                      <SelectItem value="awaiting" className="text-[10px] font-bold uppercase">Awaiting</SelectItem>
                      <SelectItem value="refunded" className="text-[10px] font-bold uppercase">Refunded</SelectItem>
                      <SelectItem value="partially_refunded" className="text-[10px] font-bold uppercase">Partially Refunded</SelectItem>
                      <SelectItem value="canceled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-400">Fulfillment Status</Label>
                  <Select value={order.status} onValueChange={handleUpdateStatus} disabled={isUpdatingStatus}>
                    <SelectTrigger className="h-11 bg-black text-white text-[10px] font-bold uppercase tracking-widest border-none">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awaiting_processing" className="text-[10px] font-bold uppercase">Awaiting Processing</SelectItem>
                      <SelectItem value="processing" className="text-[10px] font-bold uppercase">Processing</SelectItem>
                      <SelectItem value="ready_for_pickup" className="text-[10px] font-bold uppercase">Ready for Pickup</SelectItem>
                      <SelectItem value="shipped" className="text-[10px] font-bold uppercase">Shipped</SelectItem>
                      <SelectItem value="out_for_delivery" className="text-[10px] font-bold uppercase">Out for Delivery</SelectItem>
                      <SelectItem value="delivered" className="text-[10px] font-bold uppercase">Delivered</SelectItem>
                      <SelectItem value="returned" className="text-[10px] font-bold uppercase">Returned</SelectItem>
                      <SelectItem value="canceled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-sm rounded-none">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <Package className="h-3 w-3" /> Items Summary ({(order.items || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-b">
                    <TableHead className="text-[9px] uppercase font-bold">Product</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-center">Qty</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right">Price</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(order.items || []).map((item: any, i: number) => (
                    <TableRow key={i} className="border-b last:border-0">
                      <TableCell>
                        <div className="flex gap-3">
                          <div className="w-12 h-16 bg-gray-100 rounded border shrink-0 overflow-hidden relative">
                            {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="text-xs font-bold uppercase line-clamp-1">{item.name}</span>
                            <span className="text-[8px] h-4 uppercase font-bold">Size: {item.size}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">{item.quantity}</TableCell>
                      <TableCell className="text-right text-xs">${formatCurrency(Number(item.price) || 0)}</TableCell>
                      <TableCell className="text-right text-xs font-bold">${formatCurrency((Number(item.price) || 0) * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#e1e3e5] shadow-sm rounded-none">
              <CardHeader className="bg-gray-50/50 border-b py-4">
                <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                  <span>Subtotal</span>
                  <span className="text-black">${formatCurrency(Number(order.subtotal) || 0)}</span>
                </div>
                {Number(order.discountTotal) > 0 && (
                  <div className="flex justify-between text-[11px] font-bold text-red-600 uppercase">
                    <span>Discounts</span>
                    <span>-${formatCurrency(Number(order.discountTotal) || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                  <span>{order.deliveryMethod === 'shipping' ? 'Shipping' : 'Pick up'}</span>
                  <span className="text-black">{Number(order.shipping) > 0 ? `$${formatCurrency(Number(order.shipping))}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                  <span>Sales Tax</span>
                  <span className="text-black">${formatCurrency(Number(order.tax) || 0)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-end pt-2">
                  <span className="text-[13px] font-bold uppercase tracking-[0.1em]">Total</span>
                  <span className="text-xl font-bold font-headline">${formatCurrency(Number(order.total) || 0)} CAD</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e1e3e5] shadow-sm rounded-none bg-black text-white">
              <CardHeader className="border-b border-white/10 py-4">
                <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Order Context</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Referral Source</p>
                  <p className="text-xs font-bold uppercase">{order.referral || 'Direct Traffic'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Delivery Method</p>
                  <p className="text-xs font-bold uppercase flex items-center gap-2">
                    {order.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    {order.deliveryMethod} {order.courier && `• ${order.courier.toUpperCase()}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Created At</p>
                  <p className="text-xs font-bold uppercase flex items-center gap-2 text-white">
                    <Calendar className="h-3 w-3" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="pt-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest h-10">
                        View Logs <Terminal className="ml-2 h-3 w-3" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-black text-white border-white/10 sm:max-w-lg">
                      <SheetHeader className="pt-12 border-b border-white/10 pb-6 mb-6">
                        <div className="flex items-center gap-3 text-white">
                          <Terminal className="h-5 w-5 text-green-500" />
                          <SheetTitle className="text-xl font-headline font-bold text-white uppercase tracking-tight">Studio Logs</SheetTitle>
                        </div>
                      </SheetHeader>
                      <div className="space-y-8 font-mono">
                        <section className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <Fingerprint className="h-3 w-3" /> Security Footprint
                          </div>
                          <div className="bg-white/5 p-4 rounded border border-white/10 space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-[10px] text-gray-400">TRANSACTION_ID</span>
                              <span className="text-[10px] text-green-400">{order.id.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-gray-400">ORIGIN_UID</span>
                              <span className="text-[10px] text-white truncate max-w-[180px]">{order.userId}</span>
                            </div>
                          </div>
                        </section>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-full xl:w-[320px] space-y-8 print:hidden">
          {/* Tracking Card added to sidebar per request */}
          {order.deliveryMethod === 'shipping' && (
            <Card className="border-[#e1e3e5] shadow-none rounded-none border-blue-100 bg-blue-50/10">
              <CardHeader className="bg-blue-50/30 border-b py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-blue-600 flex items-center gap-2">
                    <Truck className="h-3 w-3" /> Logistics Tracing
                  </CardTitle>
                  {order.trackingNumber && (
                    <a 
                      href={aftershipUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold uppercase text-blue-700 hover:underline flex items-center gap-1"
                    >
                      AfterShip <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-400">Tracking Number</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        placeholder="ENTER LOGISTICS ID" 
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="h-11 bg-white border-blue-200 text-black text-xs font-mono uppercase pl-9"
                      />
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
                    </div>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-11 w-11 border-blue-200 bg-white hover:bg-blue-50 text-blue-600"
                      onClick={() => setIsScannerOpen(true)}
                    >
                      <ScanBarcode className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveTracking} 
                  disabled={isSavingTracking || trackingNumber === order.trackingNumber}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  {isSavingTracking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Commit Tracking
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <User className="h-3 w-3" /> Customer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-black flex items-center justify-center text-white font-bold text-lg">
                  {(order.customer?.name || order.email || 'G')[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm uppercase truncate max-w-[180px]">{order.customer?.name || 'Guest Client'}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Purchase Count: {orderCount}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Email Address</p>
                    <p className="text-xs font-bold uppercase break-all">{order.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Phone</p>
                    <p className="text-xs font-bold uppercase">{order.customer?.phone || 'Not Provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Delivery Address</p>
                    {order.customer?.shipping ? (
                      <p className="text-xs font-bold uppercase leading-relaxed">
                        {order.customer.shipping.address}<br />
                        {order.customer.shipping.city}, {order.customer.shipping.province}<br />
                        {order.customer.shipping.postalCode}<br />
                        {order.customer.shipping.country}
                      </p>
                    ) : (
                      <p className="text-xs font-bold uppercase text-gray-400 italic">In-Store Pickup</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Billing Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {order.customer?.billing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Address</p>
                    <p className="text-xs font-bold uppercase leading-relaxed">
                      {order.customer.billing.address}<br />
                      {order.customer.billing.city}, {order.customer.billing.province}<br />
                      {order.customer.billing.postalCode}<br />
                      {order.customer.billing.country}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center border-2 border-dashed rounded-lg bg-gray-50">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Missing Billing Info</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BarcodeScannerDialog 
        isOpen={isScannerOpen} 
        onOpenChange={setIsScannerOpen} 
        onScan={(val: string) => setTrackingNumber(val)} 
      />
    </div>
  );
}

function BarcodeScannerDialog({ onScan, isOpen, onOpenChange }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use the scanner.',
          });
        }
      };
      getCameraPermission();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [isOpen, toast]);

  const simulateScan = () => {
    const randomTracking = "1Z" + Math.random().toString(36).substring(2, 12).toUpperCase();
    onScan(randomTracking);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black text-white border-none rounded-none p-0 overflow-hidden shadow-2xl">
        <div className="p-8 space-y-6">
          <DialogHeader className="p-0 space-y-2">
            <div className="flex items-center gap-3 text-white">
              <ScanBarcode className="h-6 w-6 text-blue-400" />
              <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Logistics Scanner</DialogTitle>
            </div>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold text-zinc-500">
              Point your device at the shipping label barcode.
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden border border-white/10 group">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              playsInline 
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-white/20 rounded-lg relative overflow-hidden">
                {/* Scanning animation line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[scan_2s_infinite]" />
              </div>
              <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Align Barcode within Frame</p>
            </div>

            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6 space-y-4">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-white">Camera Access Required</p>
                <p className="text-[10px] text-zinc-500 uppercase leading-relaxed max-w-[200px]">
                  Please verify browser permissions to Authoritatively access the hardware.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-0 border-t border-white/10 pt-6 flex flex-row items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              className="text-[10px] uppercase font-bold text-zinc-500 hover:text-white" 
              onClick={() => onOpenChange(false)}
            >
              Decline Scanner
            </Button>
            <Button 
              className="bg-white text-black text-[10px] font-bold uppercase tracking-widest h-12 px-8 rounded-none hover:bg-zinc-200" 
              onClick={simulateScan}
            >
              Manual Bypass (Mock Scan)
            </Button>
          </DialogFooter>
        </div>
        <style jsx global>{`
          @keyframes scan {
            0% { transform: translateY(0); }
            50% { transform: translateY(128px); }
            100% { transform: translateY(0); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}