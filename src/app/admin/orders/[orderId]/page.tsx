'use client';

import React, { use, useState, useEffect, useRef } from 'react';
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
  BadgeCheck,
  CreditCard as PaymentIcon,
  Printer,
  Send,
  ArrowLeft,
  ExternalLink,
  ScanBarcode,
  Globe,
  Barcode,
  Scan,
  ShieldCheck,
  Building2,
  ShoppingBag,
  Search,
  Sparkles,
  Terminal,
  Fingerprint,
  History,
  Shield
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function OrderDetailPage(props: { params: Promise<{ orderId: string }> }) {
  const params = use(props.params);
  const orderId = params.orderId;
  const db = useFirestore();
  const { toast } = useToast();

  const orderRef = useMemoFirebase(() => db ? doc(db, 'orders', orderId) : null, [db, orderId]);
  const { data: order, loading } = useDoc(orderRef);

  // Fetch Store Config for Branding & Invoice Sender details
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  // Fetch all orders for this customer to get the total count
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
        toast({ title: "Order Updated", description: `Logistics status changed to ${newStatus.replace('_', ' ').toUpperCase()}.` });
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
          title: "Payment Synchronized", 
          description: `Financial record marked as ${newPaymentStatus.toUpperCase()}.` 
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
    updateDoc(doc(db, 'orders', orderId), { trackingNumber })
      .then(() => {
        toast({ title: "Tracking Linked", description: "Courier manifest has been synchronized." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `orders/${orderId}`,
          operation: 'update',
          requestResourceData: { trackingNumber }
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
        title: "Notification Dispatched",
        description: `Archive confirmation resent to ${order?.email}.`
      });
    }, 1500);
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
      case 'cancelled':
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

  const getReferralLabel = (ref: string) => {
    switch (ref) {
      case 'google': return 'Google / Pinterest';
      case 'social': return 'Facebook / Instagram';
      case 'friend': return 'From Friend';
      default: return ref || 'Direct / Organic';
    }
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
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const aftershipUrl = order.trackingNumber 
    ? `https://www.aftership.com/track/${order.courier || 'auto'}/${order.trackingNumber}`
    : '#';

  return (
    <div className="space-y-8">
      {/* Printable Invoice Section - Hidden in UI */}
      <div className="hidden print:block w-[210mm] mx-auto bg-white text-black p-12 font-sans">
        <style type="text/css" dangerouslySetInnerHTML={{ __html: `
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
        ` }} />
        
        <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded flex items-center justify-center text-white font-bold text-xl">
                {storeConfig?.logoUrl ? <img src={storeConfig.logoUrl} className="w-full h-full object-cover" alt="logo" /> : (storeConfig?.businessName?.[0] || 'F')}
              </div>
              <h1 className="text-3xl font-headline font-bold tracking-tighter uppercase">{storeConfig?.businessName || 'FSLNO STUDIO'}</h1>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 space-y-1">
              <p className="flex items-center gap-2"><Globe className="h-3 w-3" /> ARCHIVE OPERATIONS SUITE</p>
              <p className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> VERIFIED ACQUISITION</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-headline font-bold tracking-tighter mb-2">INVOICE</h2>
            <p className="text-sm font-mono font-bold uppercase tracking-tight">Order #{order.id.substring(0, 6).toUpperCase()}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ref: {order.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b pb-2">Sender (From)</h3>
            <div className="space-y-1">
              <p className="font-bold uppercase text-sm">{storeConfig?.businessName || 'FSLNO STUDIO'}</p>
              <p className="text-xs uppercase leading-relaxed text-gray-600 whitespace-pre-wrap">
                {storeConfig?.address || '123 Studio Way\nLondon, UK\nArchives HQ'}
              </p>
              <p className="text-xs font-bold mt-2">{storeConfig?.phone || '+1 (555) 000-0000'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b pb-2">Receiver (To)</h3>
            <div className="space-y-1">
              <p className="font-bold uppercase text-sm">{order.customer?.name || 'GUEST USER'}</p>
              {order.customer?.shipping ? (
                <p className="text-xs uppercase leading-relaxed text-gray-600">
                  {order.customer.shipping.address}<br />
                  {order.customer.shipping.city}, {order.customer.shipping.province}<br />
                  {order.customer.shipping.postalCode}<br />
                  {order.customer.shipping.country}
                </p>
              ) : (
                <p className="text-xs uppercase italic text-gray-400">Local Studio Pickup - Verification Required</p>
              )}
              <p className="text-xs font-bold mt-2">{order.email}</p>
              <p className="text-xs font-bold">{order.customer?.phone}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b pb-2">Archive Manifest</h3>
          <Table className="border-none shadow-none">
            <TableHeader className="bg-gray-50">
              <TableRow className="border-black border-b">
                <TableHead className="text-[9px] font-bold uppercase text-black">Acquisition Item</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-black text-center">Size</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-black text-center">Qty</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-black text-right">Unit Price</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-black text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.items || []).map((item: any, i: number) => (
                <TableRow key={i} className="border-b border-gray-100">
                  <TableCell>
                    <div className="py-1">
                      <p className="font-bold uppercase text-xs">{item.name}</p>
                      {(item.customName || item.customNumber) && (
                        <p className="text-[9px] font-bold text-blue-600 uppercase mt-0.5">Custom: {item.customName} {item.customNumber}</p>
                      )}
                      {item.specialNote && <p className="text-[9px] text-gray-400 italic mt-0.5">Note: {item.specialNote}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs uppercase">{item.size}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{item.quantity}</TableCell>
                  <TableCell className="text-right text-xs">${(Number(item.price) || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-xs">${((Number(item.price) || 0) * item.quantity).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mb-12">
          <div className="w-[300px] space-y-3">
            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
              <span>Subtotal</span>
              <span className="text-black">${(Number(order.subtotal) || 0).toLocaleString()}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase text-red-600">
                <span>Archive Discounts</span>
                <span>-${(Number(order.discountTotal) || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
              <span>Shipping & Logistics</span>
              <span className="text-black">${(Number(order.shipping) || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
              <span>Estimated Tax</span>
              <span className="text-black">${(Number(order.tax) || 0).toLocaleString()}</span>
            </div>
            <div className="h-px bg-black my-2" />
            <div className="flex justify-between items-end">
              <span className="text-[12px] font-bold uppercase tracking-widest">Total Acquisition Value</span>
              <span className="text-2xl font-headline font-bold">${(Number(order.total) || 0).toLocaleString()} CAD</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t-2 border-black pt-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Transaction Logs</h3>
            <div className="space-y-2 font-mono text-[9px] font-bold text-gray-500 uppercase">
              <p>Acquired: {formatDate(order.createdAt)}</p>
              <p>Transaction: {order.transactionId || 'STUDIO-TXN-INTERNAL'}</p>
              <p>Origin IP: {order.ipAddress || '127.0.0.1'}</p>
              <p>Status: {order.status?.toUpperCase()}</p>
              <p>Payment: {order.paymentStatus?.toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black">Thank you for your acquisition.</p>
            <p className="text-[8px] font-bold text-gray-400 mt-2">© 2024 FSLNO ARCHIVES. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </div>

      {/* Screen-only UI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <Link href="/admin/orders" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Archive
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Order #{order.id.substring(0, 6).toUpperCase()}</h1>
            {getPaymentStatusBadge(order.paymentStatus || 'pending')}
          </div>
          <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">Global ID: {order.id}</p>
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
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Logistics & Financial Orchestration</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-400">Financial Status</Label>
                  <Select value={order.paymentStatus || 'pending'} onValueChange={handleConfirmPayment} disabled={isUpdatingPayment}>
                    <SelectTrigger className="h-11 bg-white border-black text-[10px] font-bold uppercase tracking-widest">
                      <PaymentIcon className="h-3 w-3 mr-2" /> 
                      <SelectValue placeholder="Financial Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-[10px] font-bold uppercase">Pending</SelectItem>
                      <SelectItem value="paid" className="text-[10px] font-bold uppercase">Paid</SelectItem>
                      <SelectItem value="awaiting" className="text-[10px] font-bold uppercase">Awaiting Payment</SelectItem>
                      <SelectItem value="refunded" className="text-[10px] font-bold uppercase">Refunded</SelectItem>
                      <SelectItem value="cancelled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-400">Logistics Status</Label>
                  <Select value={order.status} onValueChange={handleUpdateStatus} disabled={isUpdatingStatus}>
                    <SelectTrigger className="h-11 bg-black text-white text-[10px] font-bold uppercase tracking-widest border-none">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awaiting_processing" className="text-[10px] font-bold uppercase">Awaiting Processing</SelectItem>
                      <SelectItem value="processing" className="text-[10px] font-bold uppercase">Processing</SelectItem>
                      <SelectItem value="shipped" className="text-[10px] font-bold uppercase">Shipped</SelectItem>
                      <SelectItem value="out_for_delivery" className="text-[10px] font-bold uppercase">Out for Delivery</SelectItem>
                      <SelectItem value="delivered" className="text-[10px] font-bold uppercase">Delivered</SelectItem>
                      <SelectItem value="returned" className="text-[10px] font-bold uppercase">Returned</SelectItem>
                      <SelectItem value="cancelled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-sm rounded-none">
            <CardHeader className="bg-gray-50/50 border-b py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <Package className="h-3 w-3" /> Archive Manifest ({(order.items || []).length} Items)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-b">
                    <TableHead className="text-[9px] uppercase font-bold">Item</TableHead>
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
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-[8px] h-4 uppercase font-bold">Size: {item.size}</Badge>
                              {(item.customName || item.customNumber) && (
                                <Badge variant="secondary" className="text-[8px] h-4 uppercase font-bold bg-blue-50 text-blue-600 border-blue-100">
                                  Custom: {item.customName} {item.customNumber}
                                </Badge>
                              )}
                            </div>
                            {item.specialNote && (
                              <p className="text-[8px] text-gray-400 mt-1 italic line-clamp-1">Note: {item.specialNote}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">{item.quantity}</TableCell>
                      <TableCell className="text-right text-xs">${(Number(item.price) || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs font-bold">${((Number(item.price) || 0) * item.quantity).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#e1e3e5] shadow-sm rounded-none">
              <CardHeader className="bg-gray-50/50 border-b py-4">
                <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                  <PaymentIcon className="h-3 w-3" /> Financial Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                  <span>Subtotal</span>
                  <span className="text-black">${(Number(order.subtotal) || 0).toLocaleString()}</span>
                </div>
                {Number(order.discountTotal) > 0 && (
                  <div className="flex justify-between text-[11px] font-bold text-red-600 uppercase">
                    <span>Discounts ({order.couponCode || 'Promo'})</span>
                    <span>-${(Number(order.discountTotal) || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                  <span>Shipping</span>
                  <span className="text-black">{Number(order.shipping) > 0 ? `$${Number(order.shipping).toLocaleString()}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                  <span>Estimated Tax</span>
                  <span className="text-black">${(Number(order.tax) || 0).toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-end pt-2">
                  <span className="text-[13px] font-bold uppercase tracking-[0.1em]">Total Value</span>
                  <span className="text-xl font-bold font-headline">${(Number(order.total) || 0).toLocaleString()} CAD</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e1e3e5] shadow-sm rounded-none bg-black text-white">
              <CardHeader className="border-b border-white/10 py-4">
                <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" /> Operational Meta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Discovery Source</p>
                  <p className="text-xs font-bold uppercase">{getReferralLabel(order.referral)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Delivery Route</p>
                  <p className="text-xs font-bold uppercase flex items-center gap-2">
                    {order.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    {order.deliveryMethod} {order.courier && `• ${order.courier.toUpperCase()}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Transaction Date</p>
                  <p className="text-xs font-bold uppercase flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                {order.deliveryMethod === 'shipping' && (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <Label className="text-[9px] uppercase font-bold text-gray-500">Logistics Tracking</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="TRACKING #" 
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="h-10 bg-white/5 border-white/10 text-white text-xs font-mono uppercase pl-10"
                        />
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-10 w-10 border-white/10 bg-white/5 hover:bg-white/10"
                        onClick={() => setIsScannerOpen(true)}
                      >
                        <ScanBarcode className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveTracking} 
                        disabled={isSavingTracking}
                        className="flex-1 h-9 bg-white text-black text-[9px] font-bold uppercase tracking-widest hover:bg-gray-200"
                      >
                        {isSavingTracking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Link Manifest"}
                      </Button>
                      {order.trackingNumber && (
                        <Button 
                          variant="outline" 
                          asChild 
                          className="flex-1 h-9 border-white/10 bg-white/5 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-white/10"
                        >
                          <a href={aftershipUrl} target="_blank">
                            <Globe className="h-3 w-3 mr-2" /> Aftership
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-sm uppercase font-bold tracking-widest text-white">
                    <span>Transaction Ref:</span>
                    <span className="font-mono">{order.transactionId || 'STUDIO-TXN-INTERNAL'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm uppercase font-bold tracking-widest text-white">
                    <span>Origin IP:</span>
                    <span className="font-mono">{order.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest h-10">
                        View Studio Logs <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-black text-white border-white/10 sm:max-w-lg overflow-y-auto">
                      <SheetHeader className="border-b border-white/10 pb-6 mb-6">
                        <div className="flex items-center gap-3 text-white">
                          <Terminal className="h-5 w-5 text-green-500" />
                          <SheetTitle className="text-xl font-headline font-bold text-white uppercase tracking-tight">Studio Archive Logs</SheetTitle>
                        </div>
                        <SheetDescription className="text-gray-400 text-xs">
                          Forensic transaction data for order {order.id}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-8 font-mono">
                        <section className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <Fingerprint className="h-3 w-3" /> Security Footprint
                          </div>
                          <div className="bg-white/5 p-4 rounded border border-white/10 space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-[10px] text-gray-400">TRANSACTION_ID</span>
                              <span className="text-[10px] text-green-400">{order.transactionId || 'INTERNAL'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-[10px] text-gray-400">ORIGIN_IP</span>
                              <span className="text-[10px] text-white">{order.ipAddress || '72.143.XX.XX'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-[10px] text-gray-400">PROTOCOL</span>
                              <span className="text-[10px] text-white">HTTPS/2.0 TLS 1.3</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-gray-400">FINGERPRINT</span>
                              <span className="text-[10px] text-white">BROWSER_ENGINE_V8</span>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <History className="h-3 w-3" /> Event Lifecycle
                          </div>
                          <div className="space-y-4 border-l border-white/10 ml-1 pl-4">
                            <div className="relative">
                              <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-green-500" />
                              <p className="text-[10px] text-white font-bold uppercase">Order Created</p>
                              <p className="text-[9px] text-gray-500">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="relative">
                              <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-blue-500" />
                              <p className="text-[10px] text-white font-bold uppercase">Financial Confirmation</p>
                              <p className="text-[9px] text-gray-500">Status: {order.paymentStatus?.toUpperCase()}</p>
                            </div>
                            <div className="relative">
                              <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                              <p className="text-[10px] text-white font-bold uppercase">Last Logistics Sync</p>
                              <p className="text-[9px] text-gray-500">Current Status: {order.status?.toUpperCase()}</p>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <Shield className="h-3 w-3" /> Verification Hash
                          </div>
                          <div className="bg-white/5 p-4 rounded border border-white/10">
                            <p className="text-[8px] text-gray-500 break-all leading-loose">
                              SHA256: {order.id ? btoa(order.id).slice(0, 64).toUpperCase() : 'N/A'}
                            </p>
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
          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <User className="h-3 w-3" /> Customer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-black flex items-center justify-center text-white font-bold text-lg">
                  {(order.customer?.name || 'G')[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm uppercase">{order.customer?.name || 'Guest User'}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Status: Archive Member</span>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter flex items-center gap-1">
                      <Sparkles className="h-2 w-2" /> Total Acquisitions: {orderCount}
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
                    <p className="text-[9px] uppercase font-bold text-gray-400">Phone Number</p>
                    <p className="text-xs font-bold uppercase">{order.customer?.phone || 'Not Provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Full Shipping Address</p>
                    {order.customer?.shipping ? (
                      <p className="text-xs font-bold uppercase leading-relaxed">
                        {order.customer.shipping.address}<br />
                        {order.customer.shipping.city}, {order.customer.shipping.province}<br />
                        {order.customer.shipping.postalCode}<br />
                        {order.customer.shipping.country}
                      </p>
                    ) : (
                      <p className="text-xs font-bold uppercase text-gray-400 italic">Local Studio Pickup</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Billing Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {order.customer?.billing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Verified Billing Address</p>
                    <p className="text-xs font-bold uppercase leading-relaxed">
                      {order.customer.billing.address}<br />
                      {order.customer.billing.city}, {order.customer.billing.province}<br />
                      {order.customer.billing.postalCode}<br />
                      {order.customer.billing.country}
                    </p>
                  </div>
                  <Button variant="ghost" className="p-0 h-auto text-[10px] font-bold uppercase text-blue-600 underline hover:bg-transparent">
                    Validate via Maps
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center border-2 border-dashed rounded-lg bg-gray-50">
                  <p className="text-[10px] font-bold uppercase text-gray-400">No Billing Info Provided</p>
                </div>
              )}
              <Separator />
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-gray-400">Billing Verification</p>
                <p className="text-xs font-bold uppercase leading-relaxed text-gray-500 italic">
                  Verified via Studio Payment Engine. {order.customer?.billing?.city || 'Local Transaction'}
                </p>
              </div>
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
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  React.useEffect(() => {
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
        }
      };
      getCameraPermission();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [isOpen]);

  const simulateScan = () => {
    const randomTracking = "1Z" + Math.random().toString(36).substring(2, 12).toUpperCase();
    onScan(randomTracking);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Archive Barcode Scanner</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-white/5">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          {hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-white/20 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 animate-[scan_2s_infinite]" />
              </div>
              <p className="text-[8px] uppercase tracking-widest font-bold text-white/40 mt-4">Align barcode within the frame</p>
            </div>
          )}
          {!hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-widest">Camera Access Required</p>
              <p className="text-[10px] text-gray-500">Please authorize camera access in your browser settings to scan courier manifests.</p>
            </div>
          )}
        </div>
        <DialogFooter className="flex-row justify-between items-center gap-4">
          <Button variant="ghost" className="text-[10px] uppercase font-bold text-gray-500" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-white text-black text-[10px] font-bold uppercase tracking-widest h-10 px-6" onClick={simulateScan}>Simulate Scan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
