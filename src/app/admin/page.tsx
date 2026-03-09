
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  UserPlus,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';

const data = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Admin Overview</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Welcome back. Here's what's happening in your store today.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 h-9 bg-white border border-[#babfc3] rounded-md text-sm font-semibold hover:bg-[#f6f6f7] transition-colors">Export Report</button>
          <button className="px-4 h-9 bg-black text-white rounded-md text-sm font-semibold hover:bg-black/90 transition-colors">Manage Products</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Revenue" 
          value="$45,231.89" 
          trend="+20.1%" 
          icon={<DollarSign className="h-4 w-4 text-green-600" />} 
        />
        <StatsCard 
          title="Total Orders" 
          value="+2,350" 
          trend="+180.1%" 
          icon={<ShoppingCart className="h-4 w-4 text-blue-600" />} 
        />
        <StatsCard 
          title="New Customers" 
          value="+12,234" 
          trend="+19%" 
          icon={<UserPlus className="h-4 w-4 text-purple-600" />} 
        />
        <StatsCard 
          title="Active Sessions" 
          value="+573" 
          trend="+201" 
          icon={<TrendingUp className="h-4 w-4 text-orange-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#e1e3e5] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#e1e3e5]">
            <CardTitle className="text-sm font-semibold text-[#1a1c1e]">Sales Over Time</CardTitle>
            <button className="p-1 hover:bg-[#f1f2f3] rounded transition-colors">
              <MoreHorizontal className="h-4 w-4 text-[#5c5f62]" />
            </button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
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
                  />
                  <Area type="monotone" dataKey="sales" stroke="#000" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="border-b border-[#e1e3e5]">
            <CardTitle className="text-sm font-semibold text-[#1a1c1e]">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            <div className="flex flex-col">
              {[1, 2, 3, 4, 5].map((order) => (
                <div key={order} className="flex items-center justify-between px-6 py-4 hover:bg-[#f6f6f7] transition-colors border-b last:border-0 border-[#e1e3e5]">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">#ORD-0{order}</span>
                    <span className="text-xs text-[#5c5f62]">Sofia Davis</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">$124.00</span>
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase">Paid</span>
                  </div>
                </div>
              ))}
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
  );
}
