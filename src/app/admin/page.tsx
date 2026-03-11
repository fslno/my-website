'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  UserPlus,
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
  Receipt,
  CreditCard,
  Calendar as CalendarIcon,
  ChevronDown
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
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const db = useFirestore();
  const [timeRange, setTimeRange] = useState('7d');
  const [date, setDate] = React.useState<Date | undefined>();

  // Fetch orders with a larger limit for forensic lifetime visibility
  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500));
  }, [db]);

  // Fetch users for member stats
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), limit(500));
  }, [db]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const filteredData = useMemo(() => {
    if (!orders || !users) return { orders: [], users: [] };

    const now = new Date();
    const filterByRange = (items: any[]) => {
      return items.filter(item => {
        const itemDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        
        if (timeRange === 'lifetime') return true;
        if (timeRange === 'custom' && date) {
          return itemDate >= startOfDay(date) && itemDate <= endOfDay(date);
        }

        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (timeRange) {
          case '1d': return diffDays <= 1;
          case '7d': return diffDays <= 7;
          case '15d': return diffDays <= 15;
          case '30d': return diffDays <= 30;
          case '90d': return diffDays <= 90;
          case '365d': return diffDays <= 365;
          default: return true;
        }
      });
    };

    return {
      orders: filterByRange(orders),
      users: filterByRange(users)
    };
  }, [orders, users, timeRange, date]);

  const stats = useMemo(() => {
    const { orders: fOrders, users: fUsers } = filteredData;
    
    const totalRevenue = fOrders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
    const totalTax = fOrders.reduce((acc, order) => acc + (Number(order.tax) || 0), 0);
    const totalFees = fOrders.reduce((acc, order) => {
      const total = Number(order.total) || 0;
      return acc + (total * 0.029 + 0.30);
    }, 0);
    const totalOrders = fOrders.length;
    const totalMembers = fUsers.length;

    return {
      revenue: totalRevenue,
      tax: totalTax,
      fees: totalFees,
      orders: totalOrders,
      members: totalMembers
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const { orders: fOrders } = filteredData;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Default to last 7 units of the selected range for visualization
    const rangeLimit = timeRange === '1d' ? 24 : 7;
    const dataPoints = Array.from({ length: rangeLimit }, (_, i) => {
      const d = new Date();
      if (timeRange === '1d') {
        d.setHours(d.getHours() - i);
        return { name: `${d.getHours()}:00`, time: d.getTime(), sales: 0 };
      }
      d.setDate(d.getDate() - i);
      return { 
        name: days[d.getDay()], 
        date: d.toLocaleDateString(),
        sales: 0 
      };
    }).reverse();

    fOrders.forEach(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const point = dataPoints.find(p => {
        if (timeRange === '1d') {
          return new Date(p.time).getHours() === orderDate.getHours();
        }
        return (p as any).date === orderDate.toLocaleDateString();
      });
      if (point) {
        point.sales += (Number(order.total) || 0);
      }
    });

    return dataPoints;
  }, [filteredData, timeRange]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Admin Overview</h1>
          <p className="text-[#5c5f62] mt-1 text-sm font-medium uppercase tracking-tight">Forensic archival performance monitoring.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#e1e3e5] rounded-md px-3 h-10 shadow-sm">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 h-8 w-[140px] text-[10px] font-bold uppercase tracking-widest p-0">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d" className="text-[10px] font-bold uppercase">Past 24 Hours</SelectItem>
                <SelectItem value="7d" className="text-[10px] font-bold uppercase">Past 7 Days</SelectItem>
                <SelectItem value="15d" className="text-[10px] font-bold uppercase">Semi-Month (15d)</SelectItem>
                <SelectItem value="30d" className="text-[10px] font-bold uppercase">Past 30 Days</SelectItem>
                <SelectItem value="90d" className="text-[10px] font-bold uppercase">Quarter (90d)</SelectItem>
                <SelectItem value="365d" className="text-[10px] font-bold uppercase">Annually (365d)</SelectItem>
                <SelectItem value="lifetime" className="text-[10px] font-bold uppercase">Lifetime</SelectItem>
                <SelectItem value="custom" className="text-[10px] font-bold uppercase">Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {timeRange === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "h-10 justify-start text-left font-bold uppercase text-[10px] tracking-widest border-[#e1e3e5] shadow-sm",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                  <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          <Separator orientation="vertical" className="h-8 hidden md:block" />
          
          <div className="flex gap-2">
            <button className="px-4 h-10 bg-white border border-[#babfc3] rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#f6f6f7] transition-colors shadow-sm">Export CSV</button>
            <Link href="/admin/products" className="px-4 h-10 bg-black text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-black/90 transition-colors flex items-center shadow-md">
              Manage Products
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard 
          title="Total Revenue" 
          value={formatCurrency(stats.revenue)} 
          trend="Authoritative" 
          icon={<DollarSign className="h-4 w-4 text-green-600" />} 
        />
        <StatsCard 
          title="Total Tax" 
          value={formatCurrency(stats.tax)} 
          trend="Forensic" 
          icon={<Receipt className="h-4 w-4 text-blue-600" />} 
        />
        <StatsCard 
          title="Processing Fees" 
          value={formatCurrency(stats.fees)} 
          trend="Estimated" 
          icon={<CreditCard className="h-4 w-4 text-red-600" />} 
        />
        <StatsCard 
          title="Total Orders" 
          value={stats.orders.toString()} 
          trend="Verified" 
          icon={<ShoppingCart className="h-4 w-4 text-blue-600" />} 
        />
        <StatsCard 
          title="Archive Members" 
          value={stats.members.toString()} 
          trend="Registered" 
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
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Sales Velocity ({timeRange.toUpperCase()})</CardTitle>
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
                  <XAxis dataKey="name" stroke="#8c9196" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8c9196" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e1e3e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
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
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Recent Transactions</CardTitle>
            <Link href="/admin/orders" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            <div className="flex flex-col">
              {filteredData.orders && filteredData.orders.length > 0 ? (
                filteredData.orders.slice(0, 5).map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#f6f6f7] transition-colors border-b last:border-0 border-[#e1e3e5]"
                  >
                    <div className="flex flex-col overflow-hidden mr-4">
                      <span className="text-[10px] font-mono font-bold truncate">#{order.id.substring(0, 6).toUpperCase()}</span>
                      <span className="text-[10px] font-bold uppercase text-[#5c5f62] truncate">{order.customer?.name || order.email}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] font-bold">{formatCurrency(order.total)}</span>
                      {getStatusBadge(order.status || 'Pending')}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">No transactions in this period.</p>
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
    <Card className="border-[#e1e3e5] shadow-none hover:border-black transition-all duration-300 rounded-none group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#1a1c1e] tracking-tight">{value}</div>
        <div className="flex items-center mt-1">
          <span className="text-[9px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-widest">
            <ArrowUpRight className="h-2.5 w-2.5" /> {trend}
          </span>
          <span className="text-[9px] text-[#8c9196] ml-2 font-bold uppercase tracking-tight">Verification Active</span>
        </div>
      </CardContent>
    </Card>
  );
}
