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
  ExternalLink
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function OrdersPage() {
  const db = useFirestore();
  const router = useRouter();

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: orders, loading } = useCollection(ordersQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      if (['awaiting_processing', 'processing', 'confirmed', 'pending'].includes(order.status)) acc.pending += 1;
      acc.revenue += (Number(order.total) || 0);
      return acc;
    }, { total: 0, pending: 0, revenue: 0 });
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_processing':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 uppercase text-[10px] font-bold">Awaiting Processing</Badge>;
      case 'processing':
        return <Badge className="bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100 uppercase text-[10px] font-bold">Processing</Badge>;
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
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100 uppercase text-[10px] font-bold">{status?.replace('_', ' ')}</Badge>;
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
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
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
    </div>
  );
}
