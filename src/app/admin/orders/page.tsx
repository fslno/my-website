'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Loader2,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  ExternalLink,
  ChevronRight,
  User,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  BadgeCheck,
  CreditCard as PaymentIcon
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: orders, loading } = useCollection(ordersQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, revenue: 0 };
    return orders.reduce((acc, order) => {
      acc.total += 1;
      if (order.status === 'awaiting_shipping' || order.status === 'confirmed' || order.status === 'pending') acc.pending += 1;
      acc.revenue += (Number(order.total) || 0);
      return acc;
    }, { total: 0, pending: 0, revenue: 0 });
  }, [orders]);

  const handleUpdateStatus = (newStatus: string) => {
    if (!db || !selectedOrder || isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    const orderRef = doc(db, 'orders', selectedOrder.id);
    updateDoc(orderRef, { status: newStatus })
      .then(() => {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
        toast({ title: "Order Updated", description: `Logistics status changed to ${newStatus.replace('_', ' ').toUpperCase()}.` });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `orders/${selectedOrder.id}`,
          operation: 'update',
          requestResourceData: { status: newStatus }
        }));
      })
      .finally(() => setIsUpdatingStatus(false));
  };

  const handleConfirmPayment = (newPaymentStatus: string = 'paid') => {
    if (!db || !selectedOrder || isUpdatingPayment) return;
    setIsUpdatingPayment(true);

    const orderRef = doc(db, 'orders', selectedOrder.id);
    updateDoc(orderRef, { paymentStatus: newPaymentStatus })
      .then(() => {
        setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
        toast({ 
          title: "Payment Synchronized", 
          description: `Financial record marked as ${newPaymentStatus.toUpperCase()}.` 
        });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `orders/${selectedOrder.id}`,
          operation: 'update',
          requestResourceData: { paymentStatus: newPaymentStatus }
        }));
      })
      .finally(() => setIsUpdatingPayment(false));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_shipping':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 uppercase text-[10px] font-bold">Awaiting Shipping</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 uppercase text-[10px] font-bold">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 uppercase text-[10px] font-bold">Delivered</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 uppercase text-[10px] font-bold">Out for Delivery</Badge>;
      case 'returned':
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100 uppercase text-[10px] font-bold">Returned</Badge>;
      case 'cancelled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 uppercase text-[10px] font-bold">Cancelled</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 uppercase text-[10px] font-bold">Confirmed</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100 uppercase text-[10px] font-bold">{status.replace('_', ' ')}</Badge>;
    }
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Archive Orders</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Review acquisitions and manage studio dispatch logistics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 font-bold uppercase tracking-widest text-[10px] border-[#e1e3e5]">
            Export manifest
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <ShoppingBag className="h-3 w-3" /> Gross Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-[#8c9196] mt-1">Lifetime archival sales</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Clock className="h-3 w-3" /> Active Fulfillments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-[#8c9196] mt-1">Orders requiring dispatch</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" /> Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">{stats.total}</div>
            <p className="text-xs text-[#8c9196] mt-1">Successful transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
            <Input 
              placeholder="Search by Order ID, Name, or Email..." 
              className="pl-10 h-10 border-[#e1e3e5] focus:ring-black bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full md:w-[180px] bg-white border-[#e1e3e5] text-[10px] font-bold uppercase tracking-widest">
                <Filter className="h-3 w-3 mr-2" /> {statusFilter === 'all' ? 'All Statuses' : statusFilter.replace('_', ' ')}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] uppercase font-bold">All Statuses</SelectItem>
                <SelectItem value="awaiting_shipping" className="text-[10px] uppercase font-bold">Awaiting Shipping</SelectItem>
                <SelectItem value="shipped" className="text-[10px] uppercase font-bold">Shipped</SelectItem>
                <SelectItem value="out_for_delivery" className="text-[10px] uppercase font-bold">Out for Delivery</SelectItem>
                <SelectItem value="delivered" className="text-[10px] uppercase font-bold">Delivered</SelectItem>
                <SelectItem value="returned" className="text-[10px] uppercase font-bold">Returned</SelectItem>
                <SelectItem value="cancelled" className="text-[10px] uppercase font-bold">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow className="border-[#e1e3e5]">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] py-4">Order ID</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Date</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Customer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Logistics</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Financial</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-gray-400 font-medium uppercase text-[10px] tracking-widest">
                  No archive orders found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className="hover:bg-[#f6f6f7]/50 cursor-pointer border-[#e1e3e5] group"
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsDetailOpen(true);
                  }}
                >
                  <TableCell className="font-mono text-[11px] font-bold">
                    #{order.id.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-[11px] text-[#5c5f62]">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{order.customer?.name || 'Guest User'}</span>
                      <span className="text-[10px] text-[#8c9196]">{order.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(order.paymentStatus || 'pending')}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold">
                    ${(Number(order.total) || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-[#babfc3] group-hover:text-black transition-colors" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-[1000px] w-[95vw] h-[90vh] p-0 border-none bg-[#F9F9F9] flex flex-col overflow-hidden">
          {selectedOrder && (
            <>
              <DialogHeader className="bg-white border-b p-6 shrink-0 flex-row items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Order Details</DialogTitle>
                    {getPaymentStatusBadge(selectedOrder.paymentStatus || 'pending')}
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">ID: {selectedOrder.id}</p>
                </div>
                <div className="flex gap-3">
                  <Select value={selectedOrder.paymentStatus || 'pending'} onValueChange={handleConfirmPayment} disabled={isUpdatingPayment}>
                    <SelectTrigger className="h-10 w-[160px] bg-white border-black text-[10px] font-bold uppercase tracking-widest">
                      <PaymentIcon className="h-3 w-3 mr-2" /> Financial Status
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-[10px] font-bold uppercase">Pending</SelectItem>
                      <SelectItem value="paid" className="text-[10px] font-bold uppercase">Paid</SelectItem>
                      <SelectItem value="awaiting" className="text-[10px] font-bold uppercase">Awaiting Payment</SelectItem>
                      <SelectItem value="refunded" className="text-[10px] font-bold uppercase">Refunded</SelectItem>
                      <SelectItem value="cancelled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedOrder.status} onValueChange={handleUpdateStatus} disabled={isUpdatingStatus}>
                    <SelectTrigger className="h-10 w-[180px] bg-black text-white text-[10px] font-bold uppercase tracking-widest border-none">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awaiting_shipping" className="text-[10px] font-bold uppercase">Awaiting Shipping</SelectItem>
                      <SelectItem value="shipped" className="text-[10px] font-bold uppercase">Shipped</SelectItem>
                      <SelectItem value="out_for_delivery" className="text-[10px] font-bold uppercase">Out for Delivery</SelectItem>
                      <SelectItem value="delivered" className="text-[10px] font-bold uppercase">Delivered</SelectItem>
                      <SelectItem value="returned" className="text-[10px] font-bold uppercase">Returned</SelectItem>
                      <SelectItem value="cancelled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Items & Summary */}
                  <div className="lg:col-span-2 space-y-8">
                    <Card className="border-[#e1e3e5] shadow-sm rounded-none">
                      <CardHeader className="bg-gray-50/50 border-b py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                          <Package className="h-3 w-3" /> Archive Manifest ({(selectedOrder.items || []).length} Items)
                        </CardTitle>
                        {selectedOrder.paymentStatus !== 'paid' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleConfirmPayment('paid')}
                            disabled={isUpdatingPayment}
                            className="h-7 px-3 bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-100"
                          >
                            {isUpdatingPayment ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <BadgeCheck className="h-3 w-3 mr-1" />}
                            Mark as Paid
                          </Button>
                        )}
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
                            {(selectedOrder.items || []).map((item: any, i: number) => (
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
                            <CreditCard className="h-3 w-3" /> Financial Ledger
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3">
                          <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                            <span>Subtotal</span>
                            <span className="text-black">${(Number(selectedOrder.subtotal) || 0).toLocaleString()}</span>
                          </div>
                          {Number(selectedOrder.discountTotal) > 0 && (
                            <div className="flex justify-between text-[11px] font-bold text-red-600 uppercase">
                              <span>Discounts ({selectedOrder.couponCode || 'Promo'})</span>
                              <span>-${(Number(selectedOrder.discountTotal) || 0).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                            <span>Shipping</span>
                            <span className="text-black">${(Number(selectedOrder.shipping) || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                            <span>Estimated Tax</span>
                            <span className="text-black">${(Number(selectedOrder.tax) || 0).toLocaleString()}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between items-end">
                            <span className="text-[13px] font-bold uppercase tracking-[0.1em]">Total Value</span>
                            <span className="text-xl font-bold font-headline">${(Number(selectedOrder.total) || 0).toLocaleString()} CAD</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-[#e1e3e5] shadow-sm rounded-none bg-black text-white">
                        <CardHeader className="border-b border-white/10 py-4">
                          <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" /> Operational Meta
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="space-y-1">
                            <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Delivery Route</p>
                            <p className="text-xs font-bold uppercase flex items-center gap-2">
                              {selectedOrder.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                              {selectedOrder.deliveryMethod} {selectedOrder.courier && `• ${selectedOrder.courier.toUpperCase()}`}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Transaction Date</p>
                            <p className="text-xs font-bold uppercase flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(selectedOrder.createdAt)}
                            </p>
                          </div>
                          <div className="pt-4">
                            <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest h-10">
                              View Raw JSON <ExternalLink className="ml-2 h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Right Column: Customer Details */}
                  <div className="space-y-8">
                    <Card className="border-[#e1e3e5] shadow-sm rounded-none">
                      <CardHeader className="bg-gray-50/50 border-b py-4">
                        <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                          <User className="h-3 w-3" /> Customer Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded bg-black flex items-center justify-center text-white font-bold text-lg">
                            {(selectedOrder.customer?.name || 'G')[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm uppercase">{selectedOrder.customer?.name || 'Guest User'}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Status: Archive Member</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-bold text-gray-400">Email Address</p>
                              <p className="text-xs font-bold uppercase">{selectedOrder.email}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-bold text-gray-400">Phone Number</p>
                              <p className="text-xs font-bold uppercase">{selectedOrder.customer?.phone || 'Not Provided'}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-[#e1e3e5] shadow-sm rounded-none">
                      <CardHeader className="bg-gray-50/50 border-b py-4">
                        <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                          <MapPin className="h-3 w-3" /> Destination Archive
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {selectedOrder.customer?.shipping ? (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-bold text-gray-400">Shipping Address</p>
                              <p className="text-xs font-bold uppercase leading-relaxed">
                                {selectedOrder.customer.shipping.address}<br />
                                {selectedOrder.customer.shipping.city}, {selectedOrder.customer.shipping.province}<br />
                                {selectedOrder.customer.shipping.postalCode}<br />
                                {selectedOrder.customer.shipping.country}
                              </p>
                            </div>
                            <Button variant="ghost" className="p-0 h-auto text-[10px] font-bold uppercase text-blue-600 underline hover:bg-transparent">
                              Validate via Google Maps
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
                            Verified via Studio Payment Engine. {selectedOrder.customer?.billing?.city || 'Local Transaction'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <DialogFooter className="bg-white border-t p-6 shrink-0 flex items-center justify-between">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="h-11 px-8 font-bold uppercase tracking-widest text-[10px]">
                  Close Entry
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" className="h-11 px-8 font-bold uppercase tracking-widest text-[10px] border-black">
                    Print Invoice
                  </Button>
                  <Button className="h-11 px-8 bg-black text-white font-bold uppercase tracking-widest text-[10px]">
                    Resend Email
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}