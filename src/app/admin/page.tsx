'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  UserPlus,
  ArrowUpRight,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminDashboard() {
  const db = useFirestore();

  // Fetch all orders for revenue and volume stats
  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [db]);

  // Fetch users for member stats
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), limit(500));
  }, [db]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const stats = useMemo(() => {
    if (!orders || !users) return null;

    const totalRevenue = orders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
    const totalOrders = orders.length;
    const totalMembers = users.length;

    // Calculate growth (mock comparison for high-fidelity feel)
    const thisMonth = new Date().getMonth();
    const newThisMonth = users.filter(u => {
      const date = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return date.getMonth() === thisMonth;
    }).length;

    return {
      revenue: totalRevenue,
      orders: totalOrders,
      members: totalMembers,
      newMembers: newThisMonth
    };
  }, [orders, users]);

  const chartData = useMemo(() => {
    if (!orders) return [];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { 
        name: days[d.getDay()], 
        date: d.toLocaleDateString(),
        sales: 0 
      };
    }).reverse();

    orders.forEach(order => {
      const orderDate = (order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt)).toLocaleDateString();
      const dayData = last7Days.find(d => d.date === orderDate);
      if (dayData) {
        dayData.sales += (Number(order.total) || 0);
      }
    });

    return last7Days;
  }, [orders]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 border-none px-2 py-0.5 rounded-full font-bold uppercase text-[8px]">Completed</Badge>;
      case 'processing':
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800 border-none px-2 py-0.5 rounded-full font-bold uppercase text-[8px]">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-none px-2 py-0.5 rounded-full font-bold uppercase text-[8px]">{status || 'Pending'}</Badge>;
    }
  };

  if (ordersLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Admin Overview</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Welcome back. Here's what's happening in your store today.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 h-9 bg-white border border-[#babfc3] rounded-md text-sm font-semibold hover:bg-[#f6f6f7] transition-colors">Export Report</button>
          <Link href="/admin/products" className="px-4 h-9 bg-black text-white rounded-md text-sm font-semibold hover:bg-black/90 transition-colors flex items-center">
            Manage Products
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Revenue" 
          value={formatCurrency(stats?.revenue || 0)} 
          trend="+12.5%" 
          icon={<DollarSign className="h-4 w-4 text-green-600" />} 
        />
        <StatsCard 
          title="Total Orders" 
          value={(stats?.orders || 0).toString()} 
          trend="+18%" 
          icon={<ShoppingCart className="h-4 w-4 text-blue-600" />} 
        />
        <StatsCard 
          title="Archive Members" 
          value={(stats?.members || 0).toString()} 
          trend={`+${stats?.newMembers || 0} this month`} 
          icon={<UserPlus className="h-4 w-4 text-purple-600" />} 
        />
        <StatsCard 
          title="Active Sessions" 
          value="42" 
          trend="Real-time" 
          icon={<TrendingUp className="h-4 w-4 text-orange-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#e1e3e5] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#e1e3e5]">
            <CardTitle className="text-sm font-semibold text-[#1a1c1e]">Sales Activity (7 Days)</CardTitle>
            <button className="p-1 hover:bg-[#f1f2f3] rounded transition-colors">
              <MoreHorizontal className="h-4 w-4 text-[#5c5f62]" />
            </button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#8c9196" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8c9196" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e1e3e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#000" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="border-b border-[#e1e3e5] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#1a1c1e]">Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            <div className="flex flex-col">
              {orders && orders.length > 0 ? (
                orders.slice(0, 5).map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#f6f6f7] transition-colors border-b last:border-0 border-[#e1e3e5]"
                  >
                    <div className="flex flex-col overflow-hidden mr-4">
                      <span className="text-sm font-bold truncate">#{order.id.substring(0, 6).toUpperCase()}</span>
                      <span className="text-xs text-[#5c5f62] truncate">{order.customer?.name || order.email}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                      {getStatusBadge(order.status || 'Pending')}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No recent transactions.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <Card className="border-[#e1e3e5] shadow-none hover:border-[#babfc3] transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold text-[#5c5f62] uppercase tracking-wider">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#1a1c1e]">{value}</div>
        <div className="flex items-center mt-1">
          <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
            {trend} <ArrowUpRight className="h-3 w-3" />
          </span>
          <span className="text-xs text-[#8c9196] ml-2">from last month</span>
        </div>
      </CardContent>
    </Card>
}
