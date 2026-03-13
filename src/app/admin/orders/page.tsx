'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Phone
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

export default function OrdersPage() {
  const db = useFirestore();
  const router = useRouter();
  const { user } = useUser();

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
  }, [user]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [db, isAdmin]);

  const { data: ordersData, loading } = useCollection(ordersQuery);
  const orders = ordersData || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.toLowerCase());
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.filter((order: any) => {
      const id = order.id?.toLowerCase() || '';
      const email = order.email?.toLowerCase() || '';
      const name = order.customer?.name?.toLowerCase() || '';
      const phone = order.customer?.phone?.toLowerCase() || '';

      const matchesSearch =
        id.includes(debouncedSearch) ||
        email.includes(debouncedSearch) ||
        name.includes(debouncedSearch) ||
        phone.includes(debouncedSearch);

      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let revenue = 0;

    for (const order of orders) {
      total++;
      if (
        order.status === 'awaiting_processing' ||
        order.status === 'processing' ||
        order.status === 'ready_for_pickup' ||
        order.status === 'confirmed' ||
        order.status === 'pending'
      ) {
        pending++;
      }
      revenue += Number(order.total) || 0;
    }

    return { total, pending, revenue };
  }, [orders]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate
      ? timestamp.toDate()
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_processing':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[9px] font-bold">Awaiting</Badge>;
      case 'processing':
        return <Badge className="bg-violet-50 text-violet-700 border-violet-100 uppercase text-[9px] font-bold">Processing</Badge>;
      case 'ready_for_pickup':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-100 uppercase text-[9px] font-bold">Ready for Pickup</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] font-bold">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[9px] font-bold">Delivered</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase text-[9px] font-bold">Out for Delivery</Badge>;
      case 'returned':
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[9px] font-bold">Returned</Badge>;
      case 'canceled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[9px] font-bold">Canceled</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] font-bold">Confirmed</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100 uppercase text-[9px] font-bold">{status?.replace('_', ' ')}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold">Paid</Badge>;
      case 'awaiting':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">Awaiting</Badge>;
      case 'refunded':
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[10px] font-bold">Refunded</Badge>;
      case 'partially_refunded':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-100 uppercase text-[10px] font-bold">Partially Refunded</Badge>;
      case 'canceled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Canceled</Badge>;
      default:
        return <Badge className="bg-zinc-50 text-zinc-700 border-zinc-100 uppercase text-[10px] font-bold">{status || 'Pending'}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Orders</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">View and manage your store's orders.</p>
        </div>
        <Button variant="outline" className="h-10 border-[#babfc3] font-bold uppercase tracking-widest text-[10px]">Export CSV</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2 uppercase tracking-widest text-[#5c5f62]">
              <ShoppingBag className="h-3.5 w-3.5" /> Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">
              ${formatCurrency(stats.revenue)}
            </div>
            <p className="text-xs text-[#8c9196] mt-1">Total revenue from all orders</p>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2 uppercase tracking-widest text-[#5c5f62]">
              <Clock className="h-3.5 w-3.5" /> Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pending}
            </div>
            <p className="text-xs text-[#8c9196] mt-1">Orders waiting to be shipped</p>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2 uppercase tracking-widest text-[#5c5f62]">
              <CheckCircle2 className="h-3.5 w-3.5" /> Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">
              {stats.total}
            </div>
            <p className="text-xs text-[#8c9196] mt-1">Total number of orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]"/>
            <Input
              placeholder="Search orders by ID, customer or phone..."
              className="pl-10 h-10 border-[#e1e3e5] bg-white text-[10px] font-bold uppercase tracking-widest"
              value={searchQuery}
              onChange={(e)=>setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-10 border-[#e1e3e5] bg-white text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-[#8c9196]"/>
                <span>{statusFilter === 'all' ? 'Filter Status' : statusFilter.replace('_', ' ')}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="uppercase text-[10px] font-bold">All Orders</SelectItem>
              <SelectItem value="awaiting_processing" className="uppercase text-[10px] font-bold">Awaiting</SelectItem>
              <SelectItem value="processing" className="uppercase text-[10px] font-bold">Processing</SelectItem>
              <SelectItem value="ready_for_pickup" className="uppercase text-[10px] font-bold">Pick up</SelectItem>
              <SelectItem value="shipped" className="uppercase text-[10px] font-bold">Shipped</SelectItem>
              <SelectItem value="delivered" className="uppercase text-[10px] font-bold">Delivered</SelectItem>
              <SelectItem value="canceled" className="uppercase text-[10px] font-bold">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow className="border-[#e1e3e5]">
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62] py-4">Items</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Order ID</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Customer</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Status</TableHead>
              <TableHead className="text-right text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300"/>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : filteredOrders.map((order: any) => {
              const totalUnits =
                order.items?.reduce(
                  (acc: number, item: any) => acc + (item.quantity || 0),
                  0
                ) || 0;

              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-[#f6f6f7]/50 border-[#e1e3e5] group"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      {(order.items || []).slice(0,3).map((item:any,i:number)=>(
                        <div key={i} className="w-10 h-12 relative bg-gray-100 rounded-sm overflow-hidden border shadow-sm">
                          {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                        </div>
                      ))}
                      {totalUnits > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-50 border flex items-center justify-center text-[9px] font-bold text-gray-400">
                          +{totalUnits - 3}
                        </div>
                      )}
                      <div className="ml-2">
                        <div className="text-[9px] font-bold uppercase text-gray-400">
                          {totalUnits} Units
                        </div>
                        <div className="text-[10px] font-bold uppercase line-clamp-1 max-w-[120px]">
                          {order.items?.[0]?.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] font-mono font-bold text-primary">
                      #{order.id.substring(0,6).toUpperCase()}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase font-bold mt-0.5">
                      {formatDate(order.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold uppercase tracking-tight text-primary">
                      {order.customer?.name || 'Guest Customer'}
                    </div>
                    <div className="text-[9px] text-gray-400 flex gap-1.5 items-center font-mono mt-0.5">
                      <Phone className="h-2.5 w-2.5"/> {order.customer?.phone || 'NO-PHONE'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      {getPaymentStatusBadge(order.paymentStatus || 'pending')}
                      <div className="font-bold text-sm text-primary tracking-tight">
                        ${formatCurrency(Number(order.total)||0)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors"/>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
