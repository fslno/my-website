'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100", className)}
      {...props}
    />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-[#e1e3e5] p-6 space-y-4 rounded-none bg-white">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-[35px] w-full mt-2" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="border border-[#e1e3e5] bg-white">
      <div className="px-6 py-4 border-b border-[#e1e3e5] flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-6" />
      </div>
      <div className="p-10">
        <Skeleton className="h-[250px] w-full" />
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="border border-[#e1e3e5] bg-white">
      <div className="px-6 py-4 border-b border-[#e1e3e5] flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="divide-y divide-[#e1e3e5]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-6 flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="space-y-2 flex flex-col items-end">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ListSkeleton />
      </div>
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <div className="w-full h-full min-h-[400px] bg-white">
      <div className="divide-y divide-[#e1e3e5]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <Skeleton className="w-4 h-4 bg-gray-50" />
            <Skeleton className="w-16 h-16 bg-gray-50 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 bg-gray-100 w-1/3" />
              <Skeleton className="h-3 bg-gray-50 w-1/4" />
            </div>
            <Skeleton className="w-24 h-4 bg-gray-50 hidden sm:block" />
            <Skeleton className="w-20 h-6 bg-gray-50 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="w-full h-full min-h-[400px] bg-white">
      <div className="divide-y divide-[#e1e3e5]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 bg-gray-50 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 bg-gray-100 w-24" />
                <Skeleton className="h-3 bg-gray-50 w-32" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-4 bg-gray-100 w-16 ml-auto" />
              <Skeleton className="h-6 bg-gray-50 rounded-full w-20 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
