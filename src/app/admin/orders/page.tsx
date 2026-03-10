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
  Truck,
  MapPin,
  Phone,
  Package,
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

// --- Helper Components & Functions defined outside to prevent re-renders ---

const formatCurrency = (val: number) => {
  return val.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getStatusBadge = (status: string) => {
  const configs: Record<string, string> = {
    awaiting_processing: "bg-amber-50 text-amber-700 border-amber-100",
    processing: "bg-violet-50 text-violet-700 border-violet-100",
    shipped: "bg-blue-50 text-blue-700 border-blue-100",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
    out_for_delivery: "bg-indigo-50 text-indigo-700 border-indigo-100",
    returned: "bg-slate-50 text-slate-700 border-slate-100",
    cancelled: "bg-rose-50 text-rose-700 border-rose-100",
    confirmed: "bg-blue-50 text-blue-700 border-blue-100",
  };
  const style = configs[status] || "bg-gray-50 text-gray-700 border-gray-100";
  return <Badge className={`${style} uppercase text-[9px] font-bold`}>{status.replace('_', ' ')}</Badge>;
};

const getPaymentStatusBadge = (status: string) => {
  const configs: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
    awaiting: "bg-amber-50 text-amber-700 border-amber-100",
    refunded: "bg-slate-50 text-slate-700 border-slate-100",
    cancelled: "bg-rose-50 text-rose-700 border-rose-100",
  };
  const style = configs[status] || "bg-zinc-50 text-zinc-700 border-zinc-100";
  return <Badge className={`${style} uppercase text-[10px] font-bold`}>{status || 'Pending'}</Badge>;
};

// Memoized Table Row to prevent lag during search
const OrderRow = React.memo(({ order, router }: { order: any; router: any }) => {
  const totalUnits = order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0;
  const shipping = order.customer?.shipping;

  return (
    <TableRow 
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
            <span className="text-sm font-bold uppercase truncate max-w-[200px]">{order.items?.[0]?.name || 'Product'}</span>
            {order.items?.[0]?.customName && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 uppercase">
                <Sparkles className="h-2.5 w-2.5" /> {order.items[0].customName} {order.items[0].customNumber}
              </div>
            )}
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
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#8c9196]">
            <Phone className="h-2.5 w-2.5" /> {order.customer?.phone || 'NO PHONE'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            <div className="flex items-center gap-1 text-[9px] font-bold text-[#8c9196] uppercase">
              {order.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              {order.deliveryMethod}
            </div>
          </div>
          <span className="text-[10px] text-[#8c9196] line-clamp-1 uppercase italic">
            {shipping ? `${shipping.city}, ${shipping.province}` : 'Local Pickup'}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1.5">
          {getPaymentStatusBadge(order.paymentStatus)}
          <span className="text-sm font-bold tracking-tighter">${formatCurrency(Number(order.total) || 0)}</span>
        </div>
      </TableCell>
      <TableCell>
        <ChevronRight className="h-4 w-4 text-[#babfc3] group-hover:text-black transition-colors" />
      </TableCell>
    </TableRow>
  );
});

OrderRow.displayName = 'OrderRow';

// --- Main Page Component ---

export default function OrdersPage() {
  const db = useFirestore();
  const router = useRouter();
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounce search input: waits 300ms after you stop typing to filter the list
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isAdmin = useMemo(() => {
    const admins = ['fslno.dev@gmail.com', 'fslno.owner@gmail.com'];
    const adminUids = ['ulyu5w9XtYeVTmceUfOZLZwDQxF2', 'vu6glqmWKBULFaqyvwhHzHu37ox1'];
    return user && (admins.includes(user.email!) || adminUids.includes(user.uid));
  }, [user]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [db, isAdmin]);

  const { data: orders, loading } = useCollection(ordersQuery);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const search = debouncedSearch.toLowerCase();
    return orders.filter(order => {
      const matchesSearch = !search || 
        order.id.toLowerCase().includes(search) ||
        order.email?.toLowerCase().includes(search) ||
        order.customer?.name?.toLowerCase().includes(search) ||
        order.customer?.phone?.includes(search);
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    const res = { total: 0, pending: 0, revenue: 0 };
    if (!orders) return res;
    orders.forEach(order => {
      res.total += 1;
      if (['awaiting_processing', 'processing', 'confirmed', 'pending'].includes(order.status)) res.pending += 1;
      res.revenue += (Number(order.total) || 0);
    });
    return res;
  }, [orders]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Orders</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage store orders and shipping dispatch.</p>
        </div>
        <Button variant="outline" className="h-10 font-bold uppercase tracking-widest text-[10px]">Export List</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Sales" value={`$${formatCurrency(stats.revenue)}`} desc="Gross sales to date" icon={<ShoppingBag className="h-3 w-3" />} />
        <StatCard title="To Fulfill" value={stats.pending} desc="Orders requiring shipping" icon={<Clock className="h-3 w-3" />} color="text-blue-600" />
        <StatCard title="Completed" value={stats.total} desc="Total orders processed" icon={<CheckCircle2 className="h-3 w-3" />} />
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
            <Input 
              placeholder="Search ID, Name, or Email..." 
              className="pl-10 h-10 border-[#e1e3e5] focus:ring-black bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full md:w-[200px] bg-white border-[#e1e3e5] text-[10px] font-bold uppercase tracking-widest">
              <Filter className="h-3 w-3 mr-2" /> {statusFilter.replace('_', ' ')}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {['awaiting_processing', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                <SelectItem key={s} value={s} className="uppercase text-[10px] font-bold">{s.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase py-4 min-w-[320px]">Order Items</TableHead>
              <TableHead className="text-[10px] font-bold uppercase w-[120px]">Order & Date</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Customer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Shipping</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-gray-400 text-[10px] uppercase font-bold">No orders found.</TableCell></TableRow>
            ) : (
              filteredOrders.map((order) => <OrderRow key={order.id} order={order} router={router} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCard({ title, value, desc, icon, color = "text-[#1a1c1e]" }: any) {
  return (
    <Card className="border-[#e1e3e5] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <p className="text-xs text-[#8c9196] mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}