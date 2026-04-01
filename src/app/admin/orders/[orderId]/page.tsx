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
  MessageSquare,
  Copy,
  Camera
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
import { doc, updateDoc, query, where, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { queueNotification, formatProductList } from '@/lib/notifications';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('@/components/admin/BarcodeScanner').then(mod => mod.BarcodeScanner), { ssr: false });

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
  const { data: order, isLoading } = useDoc(orderRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  const customerOrdersQuery = useMemoFirebase(() => {
    if (!db || !order?.email) return null;
    return query(collection(db, 'orders'), where('email', '==', order.email));
  }, [db, order?.email]);

  const { data: customerOrders } = useCollection(customerOrdersQuery);
  const orderCount = customerOrders?.length || 0;

  const { totalSpent, firstOrderDate, otherOrders } = useMemo(() => {
    if (!customerOrders) return { totalSpent: 0, firstOrderDate: null, otherOrders: [] };
    
    let total = 0;
    let earliest: Date | null = null;
    const others: any[] = [];

    customerOrders.forEach(o => {
      // Calculate LTV from paid orders
      if (o.paymentStatus === 'paid') {
        total += Number(o.total || 0);
      }

      // Track first order date
      const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      if (!earliest || date < earliest) {
        earliest = date;
      }

      // Collect other orders for the history list
      if (o.id !== orderId) {
        others.push(o);
      }
    });

    return { 
      totalSpent: total, 
      firstOrderDate: earliest, 
      otherOrders: others.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime(); // Newest first
      })
    };
  }, [customerOrders, orderId]);

  const addressHistory = useMemo(() => {
    if (!customerOrders) return [];
    const addresses = new Map<string, any>();
    customerOrders.forEach(o => {
      const ship = o.customer?.shipping;
      if (ship && ship.address) {
        const key = `${ship.address}-${ship.postalCode}`.toUpperCase();
        if (!addresses.has(key)) {
          addresses.set(key, ship);
        }
      }
    });
    return Array.from(addresses.values());
  }, [customerOrders]);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handlePrintInvoice = () => {
    if (!order) return;
    const storeName = storeConfig?.name || 'FSLNO';
    const storeAddress = storeConfig?.address || '';
    const storeEmail = storeConfig?.email || '';
    const storePhone = storeConfig?.phone || '';
    const ship = order.customer?.shipping;
    const bill = order.customer?.billing;
    const formatC = (v: number) => `C$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const subtotal = (order.items || []).reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0);
    const shipping = Number(order.shippingCost) || 0;
    const discount = Number(order.discountAmount) || 0;
    const tax = Number(order.tax) || 0;
    const total = Number(order.total) || (subtotal + shipping + tax - discount);

    const itemRows = (order.items || []).map((item: any) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:11px;">${item.name}${item.size ? ` <span style="color:#999;">(${item.size})</span>` : ''}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:11px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:11px;text-align:right;">${formatC(Number(item.price) || 0)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:11px;text-align:right;font-weight:bold;">${formatC((Number(item.price) || 0) * item.quantity)}</td>
      </tr>`).join('');

    const printWindow = window.open('', '_blank', 'width=860,height=1100');
    if (!printWindow) return;
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice — ${order.id?.substring(0, 8).toUpperCase()}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;padding:48px;max-width:860px;margin:0 auto;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:24px;border-bottom:2px solid #111;}
    .store-name{font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;}
    .store-info{font-size:10px;color:#666;margin-top:6px;line-height:1.8;}
    .invoice-meta{text-align:right;}
    .invoice-label{font-size:10px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;}
    .invoice-value{font-size:13px;font-weight:700;margin-top:2px;}
    .section-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:8px;}
    .addresses{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin:32px 0;}
    .address-block p{font-size:11px;line-height:1.8;}
    table{width:100%;border-collapse:collapse;margin-top:24px;}
    thead{background:#111;color:#fff;}
    th{padding:10px 8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;text-align:left;}
    th:nth-child(2){text-align:center;}
    th:nth-child(3),th:nth-child(4){text-align:right;}
    .totals{margin-top:24px;display:flex;justify-content:flex-end;}
    .totals-block{width:240px;}
    .totals-row{display:flex;justify-content:space-between;font-size:11px;padding:5px 0;border-bottom:1px solid #f0f0f0;}
    .totals-row.grand{font-weight:900;font-size:14px;border-top:2px solid #111;border-bottom:none;padding-top:10px;margin-top:6px;}
    .badge{display:inline-block;padding:3px 8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border:1px solid;border-radius:2px;margin-left:8px;}
    .badge-paid{color:#06703a;border-color:#bbf7d0;background:#f0fdf4;}
    .badge-awaiting{color:#92400e;border-color:#fde68a;background:#fefce8;}
    .footer{margin-top:48px;padding-top:24px;border-top:1px solid #eee;font-size:9px;color:#aaa;text-align:center;}
    @media print{body{padding:24px;}button{display:none;}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="store-name">${storeName}</div>
      <div class="store-info">${[storeAddress, storePhone, storeEmail].filter(Boolean).join(' &bull; ')}</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-label">Invoice</div>
      <div class="invoice-value">#${order.id?.substring(0, 8).toUpperCase()}</div>
      <div class="invoice-label" style="margin-top:12px;">Date</div>
      <div class="invoice-value" style="font-size:11px;">${order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : 'N/A'}</div>
      <div style="margin-top:8px;">
        <span class="badge ${order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-awaiting'}">${(order.paymentStatus || 'awaiting payment').replace('_',' ')}</span>
      </div>
    </div>
  </div>

  <div class="addresses">
    <div>
      <div class="section-title">Bill To</div>
      <p>
        <strong>${order.customer?.name || 'Guest'}</strong><br/>
        ${order.email || ''}<br/>
        ${order.customer?.phone || ''}
      </p>
    </div>
    <div>
      <div class="section-title">Ship To</div>
      <p>
        ${ship ? `${ship.address || ''}<br/>${ship.city || ''}, ${ship.province || ''} ${ship.postalCode || ''}<br/>${ship.country || ''}` : '<em>Pickup / No shipping address</em>'}
      </p>
    </div>
  </div>

  ${order.trackingNumber ? `<p style="font-size:10px;margin-bottom:16px;"><span style="font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;">Tracking #:</span> ${order.trackingNumber}</p>` : ''}

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-block">
      <div class="totals-row"><span>Subtotal</span><span>${formatC(subtotal)}</span></div>
      ${shipping > 0 ? `<div class="totals-row"><span>Shipping Fee</span><span>${formatC(shipping)}</span></div>` : ''}
      ${(order.processingFee || 0) > 0 ? `<div class="totals-row"><span>Processing Fee</span><span>${formatC(order.processingFee)}</span></div>` : ''}
      ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatC(discount)}</span></div>` : ''}
      ${tax > 0 ? `<div class="totals-row"><span>Tax</span><span>${formatC(tax)}</span></div>` : ''}
      <div class="totals-row grand"><span>Total</span><span>${formatC(total)}</span></div>
    </div>
  </div>

  <div class="footer">
    ${storeName} &mdash; Thank you for your order!
  </div>

  <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

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

  const handleUpdateStatus = async (newStatus: string) => {
    if (!db || !order || isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      
      // Notify Customer & Staff
      const staffSnap = await getDocs(collection(db, 'staff'));
      const activeStaffEmails = staffSnap.docs
        .map(d => d.data())
        .filter(s => s.status === 'Active' && s.email)
        .map(s => s.email);

      await queueNotification(
        db,
        'statusChanged',
        order.email,
        {
          order_id: orderId.substring(0, 8).toUpperCase(),
          customer_name: order.customer?.name || 'Customer',
          status: newStatus.replace('_', ' ').toUpperCase()
        },
        activeStaffEmails
      );

      toast({ title: "Status Updated", description: `Order status changed to ${newStatus.replace('_', ' ').toUpperCase()}.` });
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `orders/${orderId}`,
        operation: 'update',
        requestResourceData: { status: newStatus }
      }));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmPayment = async (newPaymentStatus: string = 'paid') => {
    if (!db || !order || isUpdatingPayment) return;
    setIsUpdatingPayment(true);

    try {
      await updateDoc(doc(db, 'orders', orderId), { paymentStatus: newPaymentStatus });

      if (newPaymentStatus === 'paid') {
        const staffSnap = await getDocs(collection(db, 'staff'));
        const activeStaffEmails = staffSnap.docs
          .map(d => d.data())
          .filter(s => s.status === 'Active' && s.email)
          .map(s => s.email);

        await queueNotification(
          db,
          'paid',
          order.email,
          {
            order_id: orderId.substring(0, 8).toUpperCase(),
            customer_name: order.customer?.name || 'Customer',
            order_total: `C$${Number(order.total || 0).toFixed(2)}`
          },
          activeStaffEmails
        );
      }

      toast({ 
        title: "Payment Updated", 
        description: `Payment marked as ${newPaymentStatus.toUpperCase()}.` 
      });
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `orders/${orderId}`,
        operation: 'update',
        requestResourceData: { paymentStatus: newPaymentStatus }
      }));
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!db || !order) return;
    setIsSavingTracking(true);
    
    // Automatically transition to 'shipped' if tracking is added and order is in a non-final state
    const terminalStates = ['shipped', 'delivered', 'canceled', 'returned'];
    const shouldUpdateStatus = trackingNumber && !terminalStates.includes(order.status || '');
    const newStatus = shouldUpdateStatus ? 'shipped' : order.status;
    
    const updateData: any = { trackingNumber };
    if (shouldUpdateStatus) {
      updateData.status = newStatus;
    }
    
    try {
      await updateDoc(doc(db, 'orders', orderId), updateData);

      if (trackingNumber) {
        const staffSnap = await getDocs(collection(db, 'staff'));
        const activeStaffEmails = staffSnap.docs
          .map(d => d.data())
          .filter(s => s.status === 'Active' && s.email)
          .map(s => s.email);

        const shipping = order.customer?.shipping;
        const shippingAddress = shipping 
          ? `${shipping.address}, ${shipping.city}, ${shipping.province} ${shipping.postalCode}, ${shipping.country}`
          : 'Local Pickup';

        // Notify of shipping
        await queueNotification(
          db,
          'shipped',
          order.email,
          {
            order_id: orderId.substring(0, 8).toUpperCase(),
            customer_name: order.customer?.name || 'Customer',
            courier: order.courier || 'Standard Shipping',
            tracking_number: trackingNumber,
            shipping_address: shippingAddress
          },
          activeStaffEmails
        );

        // If status specifically changed to shipped, also send status update notification 
        // (Note: shipped template usually covers the announcement, but we keep system consistent)
        if (shouldUpdateStatus) {
          await queueNotification(
            db,
            'statusChanged',
            order.email,
            {
              order_id: orderId.substring(0, 8).toUpperCase(),
              customer_name: order.customer?.name || 'Customer',
              status: 'SHIPPED'
            },
            activeStaffEmails
          );
        }
      }

      toast({ 
        title: shouldUpdateStatus ? "Order Shipped" : "Tracking Saved", 
        description: shouldUpdateStatus ? `Status updated to SHIPPED and tracking saved.` : "Logistics ID has been updated." 
      });
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `orders/${orderId}`,
        operation: 'update',
        requestResourceData: updateData
      }));
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleAutomatedFulfillment = async () => {
    if (!db || !order || isFulfilling) return;
    setIsFulfilling(true);

    try {
      const response = await fetch('/api/shipping/stallion/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId,
          rateId: order.shippingCarrierId || 'standard'
        })
      });

      const data = await response.json();

      if (response.ok) {
        const tNumber = data.trackingNumber;
        if (tNumber) {
          setTrackingNumber(tNumber);
          
          // Automatically transition to 'shipped' if tracking was generated and not already shipped/final
          const terminalStates = ['shipped', 'delivered', 'canceled', 'returned'];
          const shouldUpdateStatus = !terminalStates.includes(order.status || '');
          
          const updateData: any = { trackingNumber: tNumber };
          if (shouldUpdateStatus) {
            updateData.status = 'shipped';
          }

          await updateDoc(doc(db, 'orders', orderId), updateData);

          const staffSnap = await getDocs(collection(db, 'staff'));
          const activeStaffEmails = staffSnap.docs
            .map(d => d.data())
            .filter(s => s.status === 'Active' && s.email)
            .map(s => s.email);

          const shipping = order.customer?.shipping;
          const shippingAddress = shipping 
            ? `${shipping.address}, ${shipping.city}, ${shipping.province} ${shipping.postalCode}, ${shipping.country}`
            : 'Local Pickup';

          // Notifications
          await queueNotification(
            db,
            'shipped',
            order.email,
            {
              order_id: orderId.substring(0, 8).toUpperCase(),
              customer_name: order.customer?.name || 'Customer',
              courier: 'Stallion Express',
              tracking_number: tNumber,
              shipping_address: shippingAddress
            },
            activeStaffEmails
          );

          if (shouldUpdateStatus) {
            await queueNotification(
              db,
              'statusChanged',
              order.email,
              {
                order_id: orderId.substring(0, 8).toUpperCase(),
                customer_name: order.customer?.name || 'Customer',
                status: 'SHIPPED'
              },
              activeStaffEmails
            );
          }
        }

        toast({ 
          title: "Shipment Created", 
          description: `Stallion Express tracking #${data.trackingNumber} generated and order SHIPPED.` 
        });
      } else {
        throw new Error(data.error || 'Logistics failure');
      }
    } catch (err: any) {
      toast({ 
        title: "Fulfillment Failed", 
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsFulfilling(false);
    }
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
      case 'partially_refunded':
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100 uppercase text-[10px] font-bold">Partially Refunded</Badge>;
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
      case 'shipped':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-bold">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold">Delivered</Badge>;
      case 'ready_for_pickup':
        return <Badge className="bg-sky-50 text-sky-700 border-sky-100 uppercase text-[10px] font-bold">Ready for Pickup</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase text-[10px] font-bold">Out for Delivery</Badge>;
      case 'returned':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 uppercase text-[10px] font-bold">Returned</Badge>;
      case 'canceled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Canceled</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">Pending</Badge>;
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

  if (isLoading) return <div className="min-h-screen bg-white" />;

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
            <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Order #{order.id?.substring(0, 6)?.toUpperCase()}</h1>
            <div className="flex gap-2 items-center">
              {getPaymentStatusBadge(order.paymentStatus || 'awaiting_payment')}
              {getStatusBadge(order.status || 'awaiting_processing')}
            </div>
          </div>
        </div>
        <Button
          onClick={handlePrintInvoice}
          variant="outline"
          className="flex items-center gap-2 h-10 px-5 rounded-none border-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
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
                      <SelectItem value="partially_refunded" className="text-[10px] font-bold uppercase">Partially Refunded</SelectItem>
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

          <Card className="rounded-none border shadow-none bg-white">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Items Manifest</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white"><TableRow><TableHead className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Product</TableHead><TableHead className="text-[9px] font-bold uppercase text-center tracking-widest text-gray-400">Qty</TableHead><TableHead className="text-[9px] font-bold uppercase text-right tracking-widest text-gray-400">Price</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(order.items || []).map((item: any, i: number) => (
                    <TableRow key={i} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex gap-4">
                          <div className="w-14 h-14 bg-gray-50 relative shrink-0 border overflow-hidden">{item.image && <Image src={item.image} alt="" fill className="object-cover" />}</div>
                          <div className="flex flex-col justify-center gap-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-tight">{item.name}</span>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Size: {item.size}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">{item.quantity}</TableCell>
                      <TableCell className="text-right text-xs font-bold font-mono tracking-tighter">{`C$${formatCurrency(Number(item.price) || 0)}`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-6 bg-gray-50/30 border-t space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-black font-mono">C${formatCurrency(order.subtotal || 0)}</span>
                </div>
                
                {(order.discountTotal || 0) > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-red-500">
                    <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                    <span className="font-mono">-C${formatCurrency(order.discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>Shipping Fee</span>
                  <span className="text-black font-mono">
                    {order.shipping > 0 ? `C$${formatCurrency(order.shipping)}` : 'FREE'}
                  </span>
                </div>

                {(order.processingFee || 0) > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Processing Fee ({order.paymentMethod?.toUpperCase() || 'PAYPAL'})</span>
                    <span className="text-black font-mono">C${formatCurrency(order.processingFee)}</span>
                  </div>
                )}

                {(order.tax || 0) > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Tax</span>
                    <span className="text-black font-mono">C${formatCurrency(order.tax)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-dashed flex justify-between items-end">
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">Total Paid</span>
                  <span className="text-2xl font-bold font-headline tracking-tighter text-primary">C${formatCurrency(order.total || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-none border shadow-none bg-white">
            <CardHeader className="bg-gray-50/50 border-b py-4">
              <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Participant Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-tight">{order.customer?.name || 'Guest Participant'}</span>
                
                <div className="flex items-center gap-2 group">
                  <span className="text-[10px] text-gray-400 lowercase font-medium">{order.email}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 text-gray-300 hover:text-black hover:bg-transparent"
                    onClick={() => {
                      navigator.clipboard.writeText(order.email);
                      toast({ title: "Email Copied", description: "Address copied to clipboard." });
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {order.customer?.phone && (
                  <div className="flex items-center gap-2 group pt-0.5">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <Phone className="h-2.5 w-2.5" />
                      {order.customer.phone}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 text-gray-300 hover:text-black hover:bg-transparent"
                      onClick={() => {
                        if (order.customer?.phone) {
                          navigator.clipboard.writeText(order.customer.phone);
                          toast({ title: "Phone Copied", description: "Number copied to clipboard." });
                        }
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 pt-1">
                <div className="p-3 border bg-gray-50/50 space-y-1 transition-colors hover:border-black cursor-default">
                  <p className="text-[8px] font-bold uppercase text-gray-400 tracking-widest">Total Orders</p>
                  <p className="text-sm font-black tracking-tight flex items-center justify-between">
                    {orderCount}
                    <Package className="h-3 w-3 text-gray-300" />
                  </p>
                </div>
                <div className="p-3 border bg-gray-50/50 space-y-1 transition-colors hover:border-black cursor-default">
                  <p className="text-[8px] font-bold uppercase text-gray-400 tracking-widest">Lifetime Value</p>
                  <p className="text-sm font-black tracking-tight flex items-center justify-between font-mono">
                    C${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <CreditCard className="h-3 w-3 text-gray-300" />
                  </p>
                </div>
              </div>

              {firstOrderDate && (
                <div className="flex items-center gap-1.5 pb-2">
                  <History className="h-2.5 w-2.5 text-gray-400" />
                  <span className="text-[9px] font-bold uppercase text-gray-400">Customer Since {formatDate(firstOrderDate)}</span>
                </div>
              )}

              <Separator />
              <div className="space-y-4">
                {(() => {
                  const s = order.customer?.shipping;
                  const b = order.customer?.billing;
                  
                  const isSame = s && b && 
                    s.address === b.address && 
                    s.city === b.city && 
                    s.province === b.province && 
                    s.postalCode === b.postalCode &&
                    s.country === b.country;

                  return (
                    <div className="flex flex-col gap-4">
                      {isSame ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] uppercase font-bold text-gray-400">Shipping & Billing Address</p>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.address}, ${s.city}, ${s.province} ${s.postalCode}, ${s.country}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                            >
                              <MapPin className="h-3 w-3" /> View Map
                            </a>
                          </div>
                          <p className="text-xs font-bold uppercase leading-relaxed">
                            {s.address}<br />
                            {s.city}, {s.province}<br />
                            {s.postalCode}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] uppercase font-bold text-gray-400">Shipping Address</p>
                              {s && (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.address}, ${s.city}, ${s.province} ${s.postalCode}, ${s.country}`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                                >
                                  <MapPin className="h-3 w-3" /> View Map
                                </a>
                              )}
                            </div>
                            {s ? (
                              <p className="text-xs font-bold uppercase leading-relaxed">
                                {s.address}<br />
                                {s.city}, {s.province}<br />
                                {s.postalCode}
                              </p>
                            ) : (
                              <p className="text-xs font-bold uppercase italic text-gray-400">Pickup</p>
                            )}
                          </div>
                          {b && (
                            <div className="space-y-1 pt-2 border-t">
                              <p className="text-[9px] uppercase font-bold text-gray-400">Billing Address</p>
                              <p className="text-xs font-bold uppercase leading-relaxed">
                                {b.address}<br />
                                {b.city}, {b.province}<br />
                                {b.postalCode}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              <Separator />
              <div className="space-y-4">
                <p className="text-[9px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                  <Barcode className="h-3 w-3" />
                  Tracking Number
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="SCAN OR ENTER BARCODE..." 
                      className="pl-9 h-11 text-xs uppercase font-bold rounded-none border-gray-200 bg-[#F9F9F9]"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTracking();
                      }}
                    />
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                    className="h-11 rounded-none px-4 border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSaveTracking} 
                    disabled={isSavingTracking || trackingNumber === order?.trackingNumber}
                    className="h-11 rounded-none px-6 font-bold uppercase text-[10px] bg-black text-white"
                  >
                    {isSavingTracking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>

                {/* Stallion Automated Fulfillment Action */}
                {!order?.trackingNumber && (
                  <Button
                    onClick={handleAutomatedFulfillment}
                    disabled={isFulfilling || order.status === 'delivered' || order.status === 'shipped'}
                    variant="outline"
                    className="w-full h-11 rounded-none border-dashed border-2 bg-blue-50/30 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 group transition-all"
                  >
                    {isFulfilling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Truck className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        Automated Stallion Fulfillment
                      </>
                    )}
                  </Button>
                )}

                {/* AfterShip Live Tracking Card — appears as soon as a tracking number exists */}
                {trackingNumber && (
                  <div className="border border-dashed border-gray-200 bg-gray-50/50 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">AfterShip Integration</span>
                        {trackingNumber !== order?.trackingNumber && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5">Unsaved</span>
                        )}
                        {trackingNumber === order?.trackingNumber && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Live
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-gray-300 hover:text-black hover:bg-transparent"
                        onClick={() => {
                          navigator.clipboard.writeText(trackingNumber);
                          toast({ title: "Copied", description: "Tracking number copied to clipboard." });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700 font-mono break-all">{trackingNumber}</p>
                    <a
                      href={`https://track.aftership.com/${trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full bg-black text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors group"
                    >
                      <span>Track on AfterShip</span>
                      <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                    <p className="text-[9px] text-gray-400 font-medium">
                      Opens AfterShip's universal tracking page. Supports 1,000+ carriers worldwide.
                    </p>
                  </div>
                )}

                {isScannerOpen && (
                  <BarcodeScanner 
                    onScan={(code) => {
                      setTrackingNumber(code.toUpperCase());
                      setIsScannerOpen(false);
                      if (code.toUpperCase() !== order?.trackingNumber) {
                        handleSaveTracking();
                      }
                    }}
                    onClose={() => setIsScannerOpen(false)}
                  />
                )}
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                  Support USB/Bluetooth barcode scanner. Focus input and scan label.
                </p>
              </div>

              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-400">Transaction ID</p>
                  <p className="text-[10px] font-bold uppercase truncate" title={order.paypalTransactionId || order.paymentDetails?.transactionId || 'N/A'}>
                    {order.paypalTransactionId || order.paymentDetails?.transactionId || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] uppercase font-bold text-gray-400">IP Address</p>
                  <p className="text-[10px] font-bold uppercase">{order.customerIp || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-gray-400">Total Weight</p>
                  <p className="text-[10px] font-bold uppercase tracking-tight">
                    {(() => {
                      const totalWeight = order.shippingWeight !== undefined 
                        ? Number(order.shippingWeight) 
                        : (order.items || []).reduce((acc: number, item: any) => {
                            const itemWeight = Number(item.logistics?.weight || 0.6);
                            return acc + (itemWeight * item.quantity);
                          }, 0);
                      return totalWeight.toFixed(2);
                    })()} KG
                  </p>
                </div>
              </div>

              {otherOrders.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-2">
                    <p className="text-[9px] uppercase font-bold text-gray-400 flex items-center gap-1.5 leading-none">
                      <History className="h-3 w-3" /> Shopping History
                    </p>
                    <div className="space-y-2">
                      {otherOrders.slice(0, 3).map((o: any) => (
                        <Link 
                          key={o.id} 
                          href={`/admin/orders/${o.id}`}
                          className="flex items-center justify-between p-2.5 border bg-white hover:border-black transition-all group"
                        >
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-bold uppercase tracking-tighter">Order #{o.id.substring(0, 6).toUpperCase()}</p>
                            <p className="text-[8px] text-gray-400 font-bold uppercase">{formatDate(o.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black font-mono">C${Number(o.total || 0).toFixed(2)}</span>
                            {getStatusBadge(o.status)}
                          </div>
                        </Link>
                      ))}
                      {otherOrders.length > 3 && (
                        <Button 
                          variant="link" 
                          className="p-0 h-6 text-[8px] font-bold uppercase tracking-widest text-gray-400 hover:text-black" 
                          onClick={() => setIsHistoryOpen(true)}
                        >
                          View all {otherOrders.length} previous orders
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Full Shopping History Sheet */}
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetContent className="sm:max-w-md w-full p-0 flex flex-col bg-white border-l rounded-none">
                  <SheetHeader className="p-6 border-b bg-gray-50/50">
                    <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Shopping History</SheetTitle>
                    <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Total Orders: {orderCount} • Customer: {order.email}
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-4 pb-12">
                      {otherOrders.map((o: any) => (
                        <Link 
                          key={o.id} 
                          href={`/admin/orders/${o.id}`}
                          onClick={() => setIsHistoryOpen(false)}
                          className="flex flex-col gap-3 p-4 border bg-white hover:border-black transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order #{o.id.substring(0, 8).toUpperCase()}</span>
                            <span className="text-[9px] font-bold uppercase text-gray-400">{formatDate(o.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black font-mono">C${Number(o.total || 0).toFixed(2)}</span>
                              <div className="flex items-center gap-1.5 pt-1">
                                {o.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3 text-gray-400" /> : <Package className="h-3 w-3 text-gray-400" />}
                                <span className="text-[8px] font-bold uppercase text-gray-400">{o.deliveryMethod || 'STANDBY'}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(o.status)}
                              {getPaymentStatusBadge(o.paymentStatus)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}