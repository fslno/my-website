
'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { Loader2, Package, ChevronRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function OrderHistoryPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Optimized query using userId for strict security rule alignment with limit
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db, user]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

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
      case 'cancelled':
        return <Badge className="bg-red-50 text-red-700 border-red-100 uppercase text-[9px] font-bold">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100 uppercase text-[9px] font-bold">{status?.replace('_', ' ')}</Badge>;
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="pt-40 pb-24 px-4 flex flex-col items-center justify-center text-center">
          <ShoppingBag className="h-12 w-12 text-gray-200 mb-6" />
          <h1 className="text-3xl font-headline font-bold uppercase mb-4">Account Required</h1>
          <p className="text-gray-500 max-w-xs mb-8">Please sign in to view your archive order history.</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-40 pb-24 max-w-[1440px] mx-auto px-4">
        <div className="mb-12">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400">Your Account</span>
          <h1 className="text-4xl md:text-6xl font-headline font-bold uppercase tracking-tight mt-2">Order History</h1>
        </div>

        {ordersLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed rounded-none bg-gray-50/50">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">No archival transactions found.</p>
            <Link href="/" className="mt-8 inline-block bg-black text-white px-10 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] w-fit mx-auto">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="rounded-none border shadow-none hover:border-black transition-colors">
                <CardHeader className="bg-gray-50/50 border-b py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-gray-400">Order ID</p>
                      <p className="text-xs font-mono font-bold uppercase">#{order.id.substring(0, 8)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-gray-400">Placed On</p>
                      <p className="text-xs font-bold uppercase">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-bold text-gray-400">Total</p>
                      <p className="text-xs font-bold uppercase">${order.total?.toFixed(2)} CAD</p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-8 justify-between">
                    <div className="flex-1 space-y-4">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-16 h-20 bg-gray-100 relative overflow-hidden border shrink-0">
                            {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="text-xs font-bold uppercase line-clamp-1">{item.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Size: {item.size} • Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-end">
                      <Link href={`/account/orders/${order.id}`} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors group">
                        Order Details <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
