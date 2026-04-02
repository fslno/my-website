'use client';

import React from 'react';
import { 
  Area, 
  AreaChart as RechartsAreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';

interface DashboardChartsProps {
  chartData: any[];
}

export function DashboardMainChart({ chartData }: DashboardChartsProps) {
  return (
    <div className="h-[250px] sm:h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={chartData}>
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
            formatter={(value: any) => [`$${value.toFixed(2)}`, 'Sales']}
          />
          <Area type="monotone" dataKey="sales" stroke="#000" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StatsTrendChartProps {
  data: any[];
  color: string;
}

export function StatsTrendChart({ data, color }: StatsTrendChartProps) {
  return (
    <div className="h-[35px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data}>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fill={color} 
            fillOpacity={0.1} 
            strokeWidth={2}
            isAnimationActive={false}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
