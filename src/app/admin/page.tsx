'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  ChevronDown,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { useFirestore, useCollection, useMemoFirebase, useUser, useIsAdmin } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
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
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { type DateRange } from "react-day-picker";

export default function AdminDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  
  const [hasMounted, setHasMounted] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const savedRange = localStorage.getItem('fslno_admin_timerange');
    const savedDate = localStorage.getItem('fslno_admin_daterange');
    
    if (savedRange) setTimeRange(savedRange);
    
    if (savedDate) {
      try {
        const parsed = JSON.parse(savedDate);
        if (parsed) {
          setDate({
            from: parsed.from ? new Date(parsed.from) : undefined,
            to: parsed.to ? new Date(parsed.to) : undefined
          });
        }
      } catch (e) {
        console.error("Failed to load saved date range", e);
        // Go back to the default date if loading fails
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fslno_admin_timerange', timeRange);
    if (date) {
      localStorage.setItem('fslno_admin_daterange', JSON.stringify(date));
    }
  }, [timeRange, date]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500));
  }, [db, isAdmin]);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'users'), limit(500));
  }, [db, isAdmin]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const filteredData = useMemo(() => {
    if (!orders || !users) return { orders: [], users: [] };

    const now = new Date();
    const filterByRange = (items: any[]) => {
      return items.filter(item => {
        const itemDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        
        if (timeRange === 'lifetime') return true;
        
        if (timeRange === 'custom' && date?.from) {
          const from = startOfDay(date.from);
          const to = date.to ? endOfDay(date.to) : endOfDay(date.from);
          return itemDate >= from && itemDate <= to;
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
    const { orders: fOrders, users: fUsers } = filteredData;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    let rangeLimit = 7;
    let unit: 'hour' | 'day' | 'month' = 'day';

    if (timeRange === '1d') { rangeLimit = 24; unit = 'hour'; }
    else if (timeRange === '7d') { rangeLimit = 7; unit = 'day'; }
    else if (timeRange === '15d') { rangeLimit = 15; unit = 'day'; }
    else if (timeRange === '30d') { rangeLimit = 30; unit = 'day'; }
    else if (timeRange === '90d') { rangeLimit = 90; unit = 'day'; }
    else if (timeRange === '365d') { rangeLimit = 12; unit = 'month'; }
    else if (timeRange === 'custom' && date?.from && date?.to) {
      const diffTime = Math.abs(date.to.getTime() - date.from.getTime());
      rangeLimit = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      unit = 'day';
      if (rangeLimit > 60) {
         rangeLimit = Math.ceil(rangeLimit / 30);
         unit = 'month';
      }
    } else {
      rangeLimit = 7; unit = 'day';
    }

    const dataPoints = Array.from({ length: Math.min(rangeLimit, 100) }, (_, i) => {
      const d = new Date();
      if (timeRange === 'custom' && date?.to) {
        d.setTime(date.to.getTime());
      }

      if (unit === 'hour') {
        d.setHours(d.getHours() - i);
        return { name: `${d.getHours()}:00`, time: d.getTime(), sales: 0, tax: 0, fees: 0, orders: 0, members: 0 };
      } else if (unit === 'month') {
        d.setMonth(d.getMonth() - i);
        return { name: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear(), sales: 0, tax: 0, fees: 0, orders: 0, members: 0 };
      } else {
        d.setDate(d.getDate() - i);
        return { 
          name: days[d.getDay()], 
          date: d.toLocaleDateString(),
          sales: 0,
          tax: 0,
          fees: 0,
          orders: 0,
          members: 0
        };
      }
    }).reverse();

    fOrders.forEach(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const point = dataPoints.find(p => {
        if (unit === 'hour') {
          return new Date(p.time!).getHours() === orderDate.getHours() && new Date(p.time!).getDate() === orderDate.getDate();
        } else if (unit === 'month') {
          return (p as any).month === orderDate.getMonth() && (p as any).year === orderDate.getFullYear();
        }
        return (p as any).date === orderDate.toLocaleDateString();
      });
      if (point) {
        point.sales += (Number(order.total) || 0);
        point.tax += (Number(order.tax) || 0);
        point.fees += ((Number(order.total) || 0) * 0.029 + 0.30);
        point.orders += 1;
      }
    });

    fUsers.forEach(u => {
      const userDate = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const point = dataPoints.find(p => {
        if (unit === 'hour') {
          return new Date(p.time!).getHours() === userDate.getHours() && new Date(p.time!).getDate() === userDate.getDate();
        } else if (unit === 'month') {
          return (p as any).month === userDate.getMonth() && (p as any).year === userDate.getFullYear();
        }
        return (p as any).date === userDate.toLocaleDateString();
      });
      if (point) {
        point.members += 1;
      }
    });

    return dataPoints;
  }, [filteredData, timeRange, date]);

  const handleExportCSV = () => {
    if (!filteredData.orders || filteredData.orders.length === 0) {
      toast({
        title: "No Data",
        description: "No orders found in this date range to export.",
        variant: "destructive"
      });
      return;
    }

    const headers = ["Order ID", "Date", "Customer", "Email", "Subtotal", "Tax", "Shipping", "Total", "Status", "Payment Status"];
    const rows = filteredData.orders.map(order => {
      const dateStr = order.createdAt?.toDate 
        ? order.createdAt.toDate().toISOString() 
        : new Date(order.createdAt).toISOString();
      
      return [
        order.id,
        dateStr,
        order.customer?.name || "GUEST",
        order.email || "NO-EMAIL",
        order.subtotal || 0,
        order.tax || 0,
        order.shipping || 0,
        order.total || 0,
        order.status || "PENDING",
        order.paymentStatus || "PENDING"
      ].map(val => `"${val}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateRangeStr = timeRange === 'custom' && date?.from
      ? `${format(date.from, 'yyyy-MM-dd')}_to_${date.to ? format(date.to, 'yyyy-MM-dd') : format(date.from, 'yyyy-MM-dd')}`
      : timeRange.toUpperCase();

    link.setAttribute("download", `Order_Report_${dateRangeStr}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Success",
      description: "Your order report has been downloaded."
    });
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  if (!hasMounted) return null;

  if (ordersLoading || usersLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <img src="/icon.png" alt="Loading" className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="w-full lg:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Dashboard</h1>
          <p className="text-[#5c5f62] mt-1 text-xs sm:text-sm font-medium uppercase tracking-tight">View your store's performance.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-white border border-[#e1e3e5] rounded-md px-3 h-10 shadow-sm min-w-[160px]">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 h-8 flex-1 text-[10px] font-bold uppercase tracking-widest p-0">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d" className="text-[10px] font-bold uppercase">Last 24 Hours</SelectItem>
                <SelectItem value="7d" className="text-[10px] font-bold uppercase">Last 7 Days</SelectItem>
                <SelectItem value="15d" className="text-[10px] font-bold uppercase">Last 15 Days</SelectItem>
                <SelectItem value="30d" className="text-[10px] font-bold uppercase">Last 30 Days</SelectItem>
                <SelectItem value="90d" className="text-[10px] font-bold uppercase">Last 90 Days</SelectItem>
                <SelectItem value="365d" className="text-[10px] font-bold uppercase">Last Year</SelectItem>
                <SelectItem value="lifetime" className="text-[10px] font-bold uppercase">All Time</SelectItem>
                <SelectItem value="custom" className="text-[10px] font-bold uppercase">Custom Range</SelectItem>
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
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {date?.from ? (
                    date.to ? (
                      <span className="truncate">
                        {format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}
                      </span>
                    ) : (
                      format(date.from, "LLL dd")
                    )
                  ) : (
                    <span>Pick dates</span>
                  )}
                  <ChevronDown className="ml-2 h-3 w-3 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none px-4 h-10 bg-white border border-[#babfc3] rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#f6f6f7] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <Link href="/admin/products" className="flex-1 sm:flex-none px-4 h-10 bg-black text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-black/90 transition-colors flex items-center justify-center shadow-md">
              Products
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard 
          title="Total Sales" 
          value={`C$${formatCurrency(stats.revenue)}`} 
          trend="Confirmed" 
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
          data={chartData.map(d => ({ value: d.sales }))}
          color="#16a34a"
        />
        <StatsCard 
          title="Total Tax" 
          value={`C$${formatCurrency(stats.tax)}`} 
          trend="Detailed" 
          icon={<Receipt className="h-4 w-4 text-blue-600" />} 
          data={chartData.map(d => ({ value: d.tax }))}
          color="#2563eb"
        />
        <StatsCard 
          title="Processing Fees" 
          value={`C$${formatCurrency(stats.fees)}`} 
          trend="Expected" 
          icon={<CreditCard className="h-4 w-4 text-red-600" />} 
          data={chartData.map(d => ({ value: d.fees }))}
          color="#dc2626"
        />
        <StatsCard 
          title="Total Orders" 
          value={stats.orders.toString()} 
          trend="Confirmed" 
          icon={<ShoppingCart className="h-4 w-4 text-blue-600" />} 
          data={chartData.map(d => ({ value: d.orders }))}
          color="#2563eb"
        />
        <StatsCard 
          title="Total Customers" 
          value={stats.members.toString()} 
          trend="Signed Up" 
          icon={<UserPlus className="h-4 w-4 text-purple-600" />} 
          data={chartData.map(d => ({ value: d.members }))}
          color="#9333ea"
        />
        <StatsCard 
          title="Active Sessions" 
          value="42" 
          trend="Live" 
          icon={<TrendingUp className="h-4 w-4 text-orange-600" />} 
          data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 20) + 30 }))}
          color="#ea580c"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#e1e3e5] shadow-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#e1e3e5] px-4 sm:px-6">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Sales Over Time ({timeRange.toUpperCase()})</CardTitle>
            <button className="p-1 hover:bg-[#f1f2f3] rounded transition-colors">
              <MoreHorizontal className="h-4 w-4 text-[#5c5f62]" />
            </button>
          </CardHeader>
          <CardContent className="pt-6 px-2 sm:px-6">
            <div className="h-[250px] sm:h-[300px] w-full">
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
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#000" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none overflow-hidden">
          <CardHeader className="border-b border-[#e1e3e5] flex flex-row items-center justify-between px-4 sm:px-6">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Recent Orders</CardTitle>
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
                    className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-[#f6f6f6] transition-colors border-b last:border-0 border-[#e1e3e5]"
                  >
                    <div className="flex flex-col overflow-hidden mr-4">
                      <span className="text-[10px] font-mono font-bold truncate">#{order.id.substring(0, 6).toUpperCase()}</span>
                      <span className="text-[10px] font-bold uppercase text-[#5c5f62] truncate">{order.customer?.name || order.email}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] font-bold">{`C$${formatCurrency(order.total)}`}</span>
                      {getStatusBadge(order.status || 'Pending')}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">No orders in this period.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, trend, icon, data, color = "#000" }: { 
  title: string, 
  value: string, 
  trend: string, 
  icon: React.ReactNode,
  data?: any[],
  color?: string 
}) {
  return (
    <Card className="border-[#e1e3e5] shadow-none hover:border-black transition-all duration-300 rounded-none group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold text-[#1a1c1e] tracking-tight">{value}</div>
        <div className="flex items-center mt-1">
          <span className="text-[9px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-widest">
            <ArrowUpRight className="h-2.5 w-2.5" /> {trend}
          </span>
          <span className="text-[9px] text-[#8c9196] ml-2 font-bold uppercase tracking-tight truncate">Confirmed</span>
        </div>
        
        {data && (
          <div className="h-[35px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  fill={color} 
                  fillOpacity={0.1} 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

