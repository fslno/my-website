
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronRight,
  Truck,
  MapPin,
  Phone,
  Package,
  Layers,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const db = useFirestore();
  const router = useRouter();
  const { user } = useUser();

  // Client-side admin verification to guard the query and avoid permission race conditions
  const isAdmin = useMemo(() => {
    return user && (
      user.email === 'fslno.dev@gmail.com' || 
      user.email === 'fslno.owner@gmail.com' ||
      user.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2' ||
      user.uid === 'vu6glqmWKBULFaqyvwhHzHu37ox1'
    );
  }, [user]);

  // Optimized query with admin guard and safe result limit
  const ordersQuery = useMemoFirebase(() => {
    // ONLY run the query if we are confident the user is an admin
    // This prevents "Missing or insufficient permissions" errors during auth hydration
    if (!db || !isAdmin) return null;
    return query(
      collection(db, 'orders'), 
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [db, isAdmin]);

  const { data: orders, loading } = useCollection(ordersQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, revenue: 0 };
    return orders.reduce((acc, order) => {
      acc.total += 1;
      if (['awaiting_processing', 'processing', 'confirmed', 'pending'].includes(order.status)) acc.pending += 1;
      acc.revenue += (Number(order.total) || 0);
      return acc;
    }, { total: 0, pending: 0, revenue: 0 });
  }, [orders]);

  const getStatusBadge = (status: string, deliveryMethod?: string) => {
    switch (status) {
      case 'awaiting_processing':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 uppercase text-[9px] font-bold">Awaiting Processing</Badge>;
      case 'processing':
        return <Badge className="bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100 uppercase text-[9px] font-bold">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 uppercase text-[9px] font-bold">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 uppercase text-[9px] font-bold">Delivered</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 uppercase text-[9px] font-bold">Out for Delivery</Badge>;
      case 'returned':
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[9px] font-bold">Returned</Badge>;
      case 'cancelled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[9px] font-bold">Cancelled</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 uppercase text-[9px] font-bold">Confirmed</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100 uppercase text-[9px] font-bold">{status?.replace('_', ' ')}</Badge>;
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

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Orders</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage your store orders and shipping dispatch.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 font-bold uppercase tracking-widest text-[10px] border-[#e1e3e5]">
            Export List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <ShoppingBag className="h-3 w-3" /> Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">${formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-[#8c9196] mt-1">Gross sales to date</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Clock className="h-3 w-3" /> To Fulfill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-[#8c9196] mt-1">Orders requiring shipping</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" /> Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">{stats.total}</div>
            <p className="text-xs text-[#8c9196] mt-1">Total orders processed</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-sm w-full">
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
              <SelectTrigger className="h-10 w-full md:w-[200px] bg-white border-[#e1e3e5] text-[10px] font-bold uppercase tracking-widest">
                <Filter className="h-3 w-3 mr-2" /> {statusFilter === 'all' ? 'All Statuses' : statusFilter.replace('_', ' ')}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] uppercase font-bold">All Statuses</SelectItem>
                <SelectItem value="awaiting_processing" className="text-[10px] uppercase font-bold">Awaiting Processing</SelectItem>
                <SelectItem value="processing" className="text-[10px] uppercase font-bold">Processing</SelectItem>
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
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] py-4 min-w-[320px]">Order Items</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] w-[120px]">Order & Date</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Customer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Shipping</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400 font-medium uppercase text-[10px] tracking-widest">
                  No orders found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const totalUnits = order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0;
                const shipping = order.customer?.shipping;
                
                return (
                  <TableRow 
                    key={order.id} 
                    className="hover:bg-[#f6f6f7]/50 cursor-pointer border-[#e1e3e5] group"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 overflow-hidden">
                          {(order.items || []).slice(0, 3).map((item: any, i: number) => (
                            <div key={i} className="inline-block h-14 w-11 bg-gray-100 border border-white rounded shrink-0 overflow-hidden relative shadow-sm">
                              {item.image ? <img src={item.image} className="object-cover w-full h-full" alt="" /> : <Package className="h-4 w-4 m-auto text-gray-300" />}
                            </div>
                          ))}
                          {(order.items || []).length > 3 && (
                            <div className="flex items-center justify-center h-14 w-11 bg-black text-white text-[10px] font-bold rounded border border-white shrink-0 shadow-sm">
                              +{(order.items || []).length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold uppercase tracking-tighter">{totalUnits} {totalUnits === 1 ? 'Item' : 'Items'}</span>
                          <span className="text-sm font-bold uppercase truncate max-w-[200px]">
                            {order.items?.[0]?.name || 'Product'}
                          </span>
                          
                          <div className="flex flex-col gap-0.5">
                            {order.items?.[0]?.customName && (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 uppercase">
                                <Sparkles className="h-2.5 w-2.5" />
                                {order.items[0].customName} {order.items[0].customNumber}
                              </div>
                            )}
                            {order.items?.[0]?.specialNote && (
                              <div className="flex items-center gap-1 text-[9px] text-gray-400 italic">
                                <MessageSquare className="h-2.5 w-2.5" />
                                {order.items[0].specialNote}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-tight">#{order.id.substring(0, 6).toUpperCase()}</span>
                        <span className="text-[10px] text-[#8c9196] font-medium leading-none">{formatDate(order.createdAt).split(',')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold truncate max-w-[150px] uppercase tracking-tight">{order.customer?.name || 'Guest'}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-2.5 w-2.5 text-[#babfc3]" />
                          <span className="text-[10px] font-mono text-[#8c9196]">{order.customer?.phone || 'NO PHONE'}</span>
                        </div>
                        <span className="text-[10px] text-[#8c9196] truncate max-w-[150px]">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status, order.deliveryMethod)}
                          <div className="flex items-center gap-1 text-[9px] font-bold text-[#8c9196] uppercase">
                            {order.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            {order.deliveryMethod}
                          </div>
                        </div>
                        {shipping ? (
                          <span className="text-[10px] text-[#8c9196] leading-tight max-w-[200px] line-clamp-1 uppercase italic">
                            {shipping.city}, {shipping.province}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8c9196] italic uppercase">Local Pickup</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        {getPaymentStatusBadge(order.paymentStatus || 'pending')}
                        <span className="text-sm font-bold tracking-tighter">
                          ${formatCurrency(Number(order.total) || 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-[#babfc3] group-hover:text-black transition-colors" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
