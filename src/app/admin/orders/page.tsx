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
  SelectTrigger
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
    // Strictly restricted to UID 'ulyu5w9XtYeVTmceUfOZLZwDQxF2'
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
    const map: any = {
      awaiting_processing: 'amber',
      processing: 'violet',
      shipped: 'blue',
      delivered: 'emerald',
      out_for_delivery: 'indigo',
      returned: 'slate',
      canceled: 'rose',
      confirmed: 'blue'
    };

    const color = map[status] || 'gray';

    return (
      <Badge className={`bg-${color}-50 text-${color}-700 border-${color}-100 uppercase text-[9px] font-bold`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const map: any = {
      paid: 'emerald',
      awaiting: 'amber',
      refunded: 'slate',
      partially_refunded: 'orange',
      canceled: 'rose'
    };

    const color = map[status] || 'zinc';

    return (
      <Badge className={`bg-${color}-50 text-${color}-700 border-${color}-100 uppercase text-[10px] font-bold`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500">Manage archive transactions</p>
        </div>
        <Button variant="outline">Export CSV</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex gap-2 uppercase tracking-widest text-gray-500">
              <ShoppingBag size={14}/> Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${formatCurrency(stats.revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex gap-2 uppercase tracking-widest text-gray-500">
              <Clock size={14}/> To Fulfill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex gap-2 uppercase tracking-widest text-gray-500">
              <CheckCircle2 size={14}/> Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
            <Input
              placeholder="Search orders..."
              className="pl-10"
              value={searchQuery}
              onChange={(e)=>setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] uppercase text-[10px] font-bold tracking-widest">
              <Filter className="h-4 w-4 mr-2"/>
              {statusFilter === 'all' ? 'Filter Status' : statusFilter.replace('_', ' ')}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="uppercase text-[10px] font-bold">All</SelectItem>
              <SelectItem value="awaiting_processing" className="uppercase text-[10px] font-bold">Awaiting</SelectItem>
              <SelectItem value="processing" className="uppercase text-[10px] font-bold">Processing</SelectItem>
              <SelectItem value="shipped" className="uppercase text-[10px] font-bold">Shipped</SelectItem>
              <SelectItem value="delivered" className="uppercase text-[10px] font-bold">Delivered</SelectItem>
              <SelectItem value="canceled" className="uppercase text-[10px] font-bold">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest">Items</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest">Order</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest">Customer</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest">Status</TableHead>
              <TableHead className="text-right text-[10px] uppercase font-bold tracking-widest">Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="animate-spin mx-auto text-gray-300"/>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  No orders found
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
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  <TableCell>
                    <div className="flex gap-3 items-center">
                      {(order.items || []).slice(0,3).map((item:any,i:number)=>(
                        <div key={i} className="w-10 h-12 relative bg-gray-100 rounded overflow-hidden border">
                          {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                        </div>
                      ))}
                      <div>
                        <div className="text-[10px] font-bold uppercase text-gray-400">
                          {totalUnits} items
                        </div>
                        <div className="text-xs font-bold uppercase line-clamp-1">
                          {order.items?.[0]?.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-mono font-bold">
                      #{order.id.substring(0,6).toUpperCase()}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">
                      {formatDate(order.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold uppercase">
                      {order.customer?.name || 'Guest'}
                    </div>
                    <div className="text-[10px] text-gray-500 flex gap-1 items-center font-mono">
                      <Phone size={10}/> {order.customer?.phone || 'No Phone'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      {getPaymentStatusBadge(order.paymentStatus || 'pending')}
                      <div className="font-bold text-sm">
                        ${formatCurrency(Number(order.total)||0)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChevronRight size={16} className="text-gray-300"/>
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
