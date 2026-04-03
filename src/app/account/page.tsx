'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { ShoppingBag, Truck, MapPin, ChevronRight, Clock, Star, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccountLoadingCover } from '@/components/storefront/AccountLoadingCover';

export default function AccountDashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const recentOrdersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [db, user]);

  const { data: recentOrders, isLoading: ordersLoading } = useCollection(recentOrdersQuery);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-50 text-green-700 border-green-100 uppercase text-[9px] font-bold">Delivered</Badge>;
      case 'processing':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] font-bold">Processing</Badge>;
      case 'ready_for_pickup':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-100 uppercase text-[9px] font-bold">Ready for Pickup</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-100 uppercase text-[9px] font-bold">Shipped</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-50 text-red-700 border-red-100 uppercase text-[9px] font-bold">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100 uppercase text-[9px] font-bold">{status?.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">Dashboard</h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Manage your orders and personal information.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Snapshot */}
        <Card className="rounded-none border shadow-none bg-gray-50/50">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-headline font-bold uppercase"
                style={{ borderRadius: 'var(--btn-radius)' }}
              >
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div>
                <p className="text-xs font-bold uppercase">{user?.displayName || 'Set your name'}</p>
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{user?.email}</p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <Link href="/account/profile" className="text-[9px] font-bold uppercase tracking-[0.3em] text-black hover:opacity-60 transition-opacity flex items-center gap-2">
                Edit Profile <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats or Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black p-6 flex flex-col justify-between text-white">
            <ShoppingBag className="h-6 w-6 mb-4" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-60">Total Orders</p>
              <p className="text-2xl font-headline font-bold">{recentOrders?.length || 0}</p>
            </div>
          </div>
          <div className="bg-gray-100 p-6 flex flex-col justify-between text-black">
            <Star className="h-6 w-6 mb-4" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">Loyalty Status</p>
              <p className="text-2xl font-headline font-bold uppercase">Premium</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-lg font-headline font-bold uppercase tracking-tight flex items-center gap-3">
            <Clock className="h-5 w-5" /> Recent Orders
          </h3>
          <Link href="/account/orders" className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors">
            View All
          </Link>
        </div>

        {ordersLoading ? (
            <AccountLoadingCover />
          ) : !recentOrders || recentOrders.length === 0 ? (
            <div 
              className="text-center py-20 bg-gray-50/50 border border-dashed"
              style={{ borderRadius: 'var(--btn-radius)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">No recent orders found.</p>
              <Link 
                href="/" 
                className="mt-8 inline-block px-8 h-12 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] w-fit mx-auto btn-theme"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Card key={order.id} className="border shadow-none hover:border-black transition-all group overflow-hidden" style={{ borderRadius: 'var(--btn-radius)' }}>
                  <Link href={`/account/orders/${order.id}`}>
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div className="w-24 bg-gray-50 border-r p-4 flex items-center justify-center shrink-0">
                          {order.items?.[0]?.image ? (
                            <img src={order.items[0].image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-8 w-8 text-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 p-6 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <p className="text-xs font-bold uppercase font-mono">#{order.id.substring(0, 8)}</p>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                              Placed on {formatDate(order.createdAt)} • {order.items?.length || 0} ITEMS
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase mb-1">Total</p>
                            <p className="text-sm font-bold uppercase">{`C$${order.total?.toFixed(2)}`}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )
        }
      </section>

      {/* Support or Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        <div className="space-y-4">
          <Truck className="h-6 w-6 text-gray-300" />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Shipping Support</h4>
          <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Having issues with your delivery? Track your order in real-time or contact our support team for assistance.</p>
        </div>
        <div className="space-y-4">
          <MapPin className="h-6 w-6 text-gray-300" />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Stored Addresses</h4>
          <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Manage multiple shipping addresses for a faster checkout experience. Set a default address for your future orders.</p>
        </div>
        <div className="space-y-4 text-center md:text-left flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-8">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2">Need Help?</p>
          <a href="mailto:admin@example.com" className="text-[10px] font-bold uppercase tracking-widest text-black underline underline-offset-4 decoration-1 decoration-gray-200 hover:decoration-black transition-all">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

