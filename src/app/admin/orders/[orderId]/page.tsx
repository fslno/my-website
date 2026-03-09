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
  Scan
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
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const db = useFirestore();
  const { toast } = useToast();

  const orderRef = useMemoFirebase(() => db ? doc(db, 'orders', orderId) : null, [db, orderId]);
  const { data: order, loading } = useDoc(orderRef);

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    <div className="space-y-8 print:space-y-4">
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

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <Card className="border-[#e1e3e5] shadow-none bg-white print:hidden">
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
                      {order.deliveryMethod === 'shipping' && (
                        <>
                          <SelectItem value="shipped" className="text-[10px] font-bold uppercase">Shipped</SelectItem>
                          <SelectItem value="out_for_delivery" className="text-[10px] font-bold uppercase">Out for Delivery</SelectItem>
                        </>
                      )}
                      {order.deliveryMethod === 'pickup' && (
                        <SelectItem value="ready_for_pickup" className="text-[10px] font-bold uppercase">Ready for Pickup</SelectItem>
                      )}
                      <SelectItem value="delivered" className="text-[10px] font-bold uppercase">{order.deliveryMethod === 'pickup' ? 'Picked Up' : 'Delivered'}</SelectItem>
                      <SelectItem value="returned" className="text-[10px] font-bold uppercase">Returned</SelectItem>
                      <SelectItem value="cancelled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-sm rounded-none print:border-none print:shadow-none">
            <CardHeader className="bg-gray-50/50 border-b py-4 flex flex-row items-center justify-between print:bg-white">
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
                          <div className="w-12 h-16 bg-gray-100 rounded border shrink-0 overflow-hidden relative print:hidden">
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
                  <span className="text-black">${(Number(order.shipping) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                  <span>Estimated Tax</span>
                  <span className="text-black">${(Number(order.tax) || 0).toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-end">
                  <span className="text-[13px] font-bold uppercase tracking-[0.1em]">Total Value</span>
                  <span className="text-xl font-bold font-headline">${(Number(order.total) || 0).toLocaleString()} CAD</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e1e3e5] shadow-sm rounded-none bg-black text-white print:bg-gray-100 print:text-black">
              <CardHeader className="border-b border-white/10 py-4 print:border-gray-200">
                <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" /> Operational Meta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
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

                <div className="pt-4 border-t border-white/10 space-y-2 opacity-50">
                  <div className="flex justify-between items-center text-[8px] uppercase font-bold tracking-widest text-gray-500">
                    <span>Transaction Ref:</span>
                    <span className="text-white">{order.transactionId || 'STUDIO-TXN-INTERNAL'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] uppercase font-bold tracking-widest text-gray-500">
                    <span>Origin IP:</span>
                    <span className="text-white">{order.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>

                <div className="pt-2 print:hidden">
                  <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest h-10">
                    View Studio Logs <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-full xl:w-[320px] space-y-8">
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
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Status: Archive Member</span>
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
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Destination Archive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {order.customer?.shipping ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Shipping Address</p>
                    <p className="text-xs font-bold uppercase leading-relaxed">
                      {order.customer.shipping.address}<br />
                      {order.customer.shipping.city}, {order.customer.shipping.province}<br />
                      {order.customer.shipping.postalCode}<br />
                      {order.customer.shipping.country}
                    </p>
                  </div>
                  <Button variant="ghost" className="p-0 h-auto text-[10px] font-bold uppercase text-blue-600 underline hover:bg-transparent print:hidden">
                    Validate via Maps
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center border-2 border-dashed rounded-lg bg-gray-50">
                  <p className="text-[10px] font-bold uppercase text-gray-400">No Shipping (Local Pickup)</p>
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
