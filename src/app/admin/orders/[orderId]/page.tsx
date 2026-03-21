'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  X,
  Save,
  ArrowRight,
  MessageSquare
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
  DialogFooter, 
  DialogDescription
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
import { doc, updateDoc, query, where, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function OrderDetailPage(props: PageProps) {
  const resolvedParams = React.use(props.params);
  const { orderId } = resolvedParams;
  
  const db = useFirestore();
  const { toast } = useToast();

  const orderRef = useMemoFirebase(() => db ? doc(db, 'orders', orderId) : null, [db, orderId]);
  const { data: order, isLoading: loading } = useDoc(orderRef);

  const notificationConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'notifications') : null, [db]);
  const { data: notificationConfig } = useDoc(notificationConfigRef);

  const customerOrdersQuery = useMemoFirebase(() => {
    if (!db || !order?.email) return null;
    return query(collection(db, 'orders'), where('email', '==', order.email));
  }, [db, order?.email]);

  const { data: customerOrders } = useCollection(customerOrdersQuery);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    if (order?.trackingNumber) {
      setTrackingNumber(order.trackingNumber);
    }
  }, [order]);

  // Marking order as viewed on manifest load
  useEffect(() => {
    if (db && orderId && order && order.viewed !== true) {
      updateDoc(doc(db, 'orders', orderId), {
        viewed: true,
        viewedAt: serverTimestamp()
      }).catch(() => {
        // Fail silent, non-critical manifest update
      });
    }
  }, [db, orderId, order]);

  const handleUpdateStatus = (newStatus: string) => {
    if (!db || !order || isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    updateDoc(doc(db, 'orders', orderId), { status: newStatus, updatedAt: serverTimestamp() })
      .then(() => {
        // Authoritative Staff Notification Protocol
        const staffEmail = notificationConfig?.global?.senderEmail;
        if (staffEmail) {
          addDoc(collection(db, 'mail'), {
            to: staffEmail,
            from: staffEmail,
            message: {
              subject: `PROTOCOL_SYNC: Order #${orderId.substring(0, 6).toUpperCase()}`,
              html: `
                <div style="font-family: sans-serif; padding: 20px;">
                  <h2 style="text-transform: uppercase; letter-spacing: -0.02em;">Status Synchronized</h2>
                  <p>Order <strong>#${orderId}</strong> has been forensicly updated.</p>
                  <p><strong>NEW_STATE:</strong> ${newStatus.toUpperCase()}</p>
                  <p><strong>ACTOR:</strong> Staff Portal</p>
                </div>
              `
            },
            createdAt: serverTimestamp()
          });
        }
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

    updateDoc(doc(db, 'orders', orderId), { paymentStatus: newPaymentStatus, updatedAt: serverTimestamp() })
      .then(() => {
        // Authoritative Staff Notification Protocol
        const staffEmail = notificationConfig?.global?.senderEmail;
        if (staffEmail) {
          addDoc(collection(db, 'mail'), {
            to: staffEmail,
            from: staffEmail,
            message: {
              subject: `FINANCIAL_SYNC: Order #${orderId.substring(0, 6).toUpperCase()}`,
              html: `
                <div style="font-family: sans-serif; padding: 20px;">
                  <h2 style="text-transform: uppercase; letter-spacing: -0.02em;">Payment Manifest Updated</h2>
                  <p>Order <strong>#${orderId}</strong> payment state synchronized.</p>
                  <p><strong>NEW_STATE:</strong> ${newPaymentStatus.toUpperCase()}</p>
                </div>
              `
            },
            createdAt: serverTimestamp()
          });
        }
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
      case 'awaiting_payment':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">Awaiting Payment</Badge>;
      case 'refunded':
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[10px] font-bold">Refunded</Badge>;
      case 'canceled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Canceled</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">Awaiting Payment</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge className="bg-violet-50 text-violet-700 border-violet-100 uppercase text-[10px] font-bold">Processing</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold">Delivered</Badge>;
      case 'canceled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Canceled</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">Pending</Badge>;
    }
  };

  if (loading) return <div className="min-h-screen bg-white" />;

  if (!order) {
    return (
      <div className="text-center py-20 bg-white min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold uppercase">Order Record Missing</h2>
        <Button asChild variant="link" className="mt-4"><Link href="/admin/orders">Return to Orders</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white min-h-screen p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/orders" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Order #{order.id.substring(0, 6).toUpperCase()}</h1>
            <div className="flex gap-2 items-center">
              {getPaymentStatusBadge(order.paymentStatus || 'awaiting_payment')}
              {getStatusBadge(order.status || 'awaiting_processing')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card className="rounded-none border shadow-none bg-white">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Order Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-400">Payment Status</Label>
                  <Select value={order.paymentStatus || 'awaiting_payment'} onValueChange={handleConfirmPayment} disabled={isUpdatingPayment}>
                    <SelectTrigger className="h-11 rounded-none border-black text-[10px] font-bold uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awaiting_payment" className="text-[10px] font-bold uppercase">Awaiting Payment</SelectItem>
                      <SelectItem value="paid" className="text-[10px] font-bold uppercase">Paid</SelectItem>
                      <SelectItem value="refunded" className="text-[10px] font-bold uppercase">Refunded</SelectItem>
                      <SelectItem value="canceled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold text-gray-400">Fulfillment Status</Label>
                  <Select value={order.status || 'awaiting_processing'} onValueChange={handleUpdateStatus} disabled={isUpdatingStatus}>
                    <SelectTrigger className="h-11 rounded-none bg-black text-white text-[10px] font-bold uppercase border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awaiting_processing" className="text-[10px] font-bold uppercase">Awaiting Processing</SelectItem>
                      <SelectItem value="processing" className="text-[10px] font-bold uppercase">Processing</SelectItem>
                      <SelectItem value="shipped" className="text-[10px] font-bold uppercase">Shipped</SelectItem>
                      <SelectItem value="delivered" className="text-[10px] font-bold uppercase">Delivered</SelectItem>
                      <SelectItem value="canceled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border shadow-none bg-white">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Items Manifest</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white"><TableRow><TableHead className="text-[9px] font-bold uppercase">Product</TableHead><TableHead className="text-[9px] font-bold uppercase text-center">Qty</TableHead><TableHead className="text-[9px] font-bold uppercase text-right">Price</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(order.items || []).map((item: any, i: number) => (
                    <TableRow key={i} className="border-b last:border-0">
                      <TableCell>
                        <div className="flex gap-3">
                          <div className="w-12 h-16 bg-gray-50 relative shrink-0 border">{item.image && <Image src={item.image} alt="" fill className="object-cover" />}</div>
                          <div className="flex flex-col justify-center">
                            <span className="text-[10px] font-bold uppercase">{item.name}</span>
                            <span className="text-[8px] text-gray-400 font-bold uppercase">Size: {item.size}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">{item.quantity}</TableCell>
                      <TableCell className="text-right text-xs font-bold">{`C$${formatCurrency(Number(item.price) || 0)}`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-none border shadow-none bg-white">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Participant Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase">{order.customer?.name || 'Guest'}</span>
                <span className="text-[10px] text-gray-400 lowercase">{order.email}</span>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-400">Destination</p>
                  {order.customer?.shipping ? (
                    <p className="text-xs font-bold uppercase leading-relaxed">
                      {order.customer.shipping.address}<br />
                      {order.customer.shipping.city}, {order.customer.shipping.province}<br />
                      {order.customer.shipping.postalCode}
                    </p>
                  ) : <p className="text-xs font-bold uppercase italic text-gray-400">Pickup</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
