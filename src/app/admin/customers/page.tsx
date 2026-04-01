'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserCircle, Mail, Calendar as CalendarIcon, ArrowRight, Loader2, Clock, Search, Filter, ShoppingBag } from "lucide-react";
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  UserCheck,
  UserPlus,
  X,
  MapPin,
  Tag,
  Phone,
  Hash,
  ChevronDown,
  Fingerprint,
  Layers,
  History,
  Activity,
  Package
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useIsAdmin } from '@/firebase';
import { collection, query, orderBy, limit, deleteDoc, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { type DateRange } from "react-day-picker";
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'registered' | 'guest' | 'abandoned'>('all');
  const isAdmin = useIsAdmin();
  const { toast } = useToast();

  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [globalCartCounts, setGlobalCartCounts] = useState<Record<string, number>>({});
  const [isCartsLoading, setIsCartsLoading] = useState(false);

  const [advName, setAdvName] = useState('');
  const [advOrderNum, setAdvOrderNum] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advAddress, setAdvAddress] = useState('');
  const [advProduct, setAdvProduct] = useState('');
  const [advDateRange, setAdvDateRange] = useState<DateRange | undefined>(undefined);

  // 1. Data Fetching with Pagination
  const [pUsers, setPUsers] = useState<any[]>([]);
  const [pOrders, setPOrders] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const BATCH_SIZE = 50;

  const fetchData = async () => {
    if (!db || isDataLoading) return;
    setIsDataLoading(true);
    try {
      const uQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
      const oQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
      
      const [uSnap, oSnap] = await Promise.all([getDocs(uQ), getDocs(oQ)]);
      setPUsers(uSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setPOrders(oSnap.docs.map(d => ({ ...d.data(), id: d.id })));
    } catch (err) {
      console.error("Fetch Data Failed:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (db) fetchData();
  }, [db]);

  const unifiedCustomers = useMemo(() => {
    if (!pUsers || !pOrders) return [];
    const customerMap = new Map<string, any>();

    pUsers.forEach(u => {
      customerMap.set(u.email?.toLowerCase(), {
        id: u.id,
        email: u.email,
        displayName: u.displayName || 'Unknown Member',
        photoURL: u.photoURL,
        createdAt: u.createdAt,
        tier: 'Registered',
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: null,
        status: 'Registered',
        orderIds: new Set<string>(),
        productNames: new Set<string>(),
        addresses: new Set<string>(),
        phones: new Set<string>(),
        orderHistory: [],
        cartItems: [],
        cartCount: globalCartCounts[u.id] || 0
      });
    });

    pOrders.forEach(o => {
      const email = o.email?.toLowerCase();
      if (!email) return;
      let entry = customerMap.get(email);
      if (!entry && o.userId === 'guest') {
        entry = {
          id: `guest_${o.id}`, email: o.email, displayName: o.customer?.name || 'Guest Piece',
          photoURL: null, createdAt: o.createdAt, tier: 'Guest', orderCount: 0, totalSpent: 0,
          lastOrderDate: null, status: 'Guest Purchaser', orderIds: new Set<string>(),
          lastPaymentStatus: null, lastFulfillmentStatus: null,
          productNames: new Set<string>(), addresses: new Set<string>(), phones: new Set<string>(),
          orderHistory: [],
          cartItems: []
        };
        customerMap.set(email, entry);
      }
      if (entry) {
        entry.orderCount += 1;
        entry.totalSpent += (Number(o.total) || 0);
        entry.status = entry.tier === 'Registered' ? 'Member' : 'Guest Purchaser';
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        if (!entry.lastOrderDate || oDate > new Date(entry.lastOrderDate)) {
          entry.lastOrderDate = oDate;
          entry.lastPaymentStatus = o.paymentStatus;
          entry.lastFulfillmentStatus = o.status;
        }
        entry.orderIds.add(o.id.toUpperCase());
        if (o.customer?.phone) entry.phones.add(o.customer.phone);
        if (o.customer?.shipping?.address) entry.addresses.add(o.customer.shipping.address.toUpperCase());
        o.items?.forEach((item: any) => { if (item.name) entry.productNames.add(item.name.toUpperCase()); });
        entry.orderHistory.push({
          id: o.id,
          date: oDate,
          total: o.total,
          status: o.status,
          paymentStatus: o.paymentStatus || 'unpaid'
        });
      }
    });

    return Array.from(customerMap.values()).map(c => {
      c.orderHistory.sort((a: any, b: any) => b.date - a.date);
      if (c.tier === 'Registered' && c.orderCount === 0) return { ...c, status: 'Abandoned / Lead', isAbandoned: true };
      return c;
    });
  }, [pUsers, pOrders]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fulfilled': return <Badge className="bg-green-50 text-green-700 border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">Fulfilled</Badge>;
      case 'processing': return <Badge className="bg-blue-50 text-blue-700 border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">Processing</Badge>;
      case 'cancelled': return <Badge className="bg-red-50 text-red-700 border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">Cancelled</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-500 border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">{status || 'Standby'}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return <Badge className="bg-green-600 text-white border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">Paid</Badge>;
      case 'awaiting_payment': return <Badge className="bg-orange-500 text-white border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">Awaiting</Badge>;
      case 'refunded': return <Badge className="bg-gray-800 text-white border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">Refunded</Badge>;
      default: return <Badge className="bg-gray-400 text-white border-none px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">{status || 'Unpaid'}</Badge>;
    }
  };

  const filteredCustomers = useMemo(() => {
    return unifiedCustomers.filter(customer => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = (customer.displayName?.toLowerCase().includes(search) || customer.email?.toLowerCase().includes(search) || customer.id.toLowerCase().includes(search));
      const matchesTier = (filterTier === 'all' || (filterTier === 'registered' && customer.tier === 'Registered') || (filterTier === 'guest' && customer.tier === 'Guest') || (filterTier === 'abandoned' && customer.isAbandoned));
      if (!matchesSearch || !matchesTier) return false;
      if (advName && !customer.displayName.toLowerCase().includes(advName.toLowerCase())) return false;
      if (advOrderNum && !Array.from(customer.orderIds as Set<string>).some(id => id.includes(advOrderNum.toUpperCase()))) return false;
      if (advPhone && !Array.from(customer.phones as Set<string>).some(p => p.includes(advPhone))) return false;
      if (advAddress && !Array.from(customer.addresses as Set<string>).some(a => a.includes(advAddress.toUpperCase()))) return false;
      if (advProduct && !Array.from(customer.productNames as Set<string>).some(p => p.includes(advProduct.toUpperCase()))) return false;
      if (advDateRange?.from) {
        const createdDate = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
        const start = startOfDay(advDateRange.from);
        const end = advDateRange.to ? endOfDay(advDateRange.to) : endOfDay(advDateRange.from);
        if (!isWithinInterval(createdDate, { start, end })) return false;
      }
      return true;
    });
  }, [unifiedCustomers, searchQuery, filterTier, advName, advOrderNum, advPhone, advAddress, advProduct, advDateRange]);

  // ON-DEMAND CART FETCHING
  useEffect(() => {
    const fetchCart = async () => {
      if (!selectedCustomer || selectedCustomer.tier !== 'Registered' || !db) return;
      
      try {
        const cartRef = collection(db, 'users', selectedCustomer.id, 'cart');
        const cartSnap = await getDocs(cartRef);
        const items = cartSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        
        setSelectedCustomer((prev: any) => {
          if (!prev || prev.id !== selectedCustomer.id) return prev;
          return { ...prev, cartItems: items, isHighIntent: items.length > 0, cartCount: items.length };
        });
        
        // Update global count too if it changed
        setGlobalCartCounts(prev => ({ ...prev, [selectedCustomer.id]: items.length }));
      } catch (err) {
        console.error("Cart Fetch Failed:", err);
      }
    };

    fetchCart();
  }, [selectedCustomer?.id, db]);

  // OPTIONAL: Fetch all active carts (limit to first 50 users for performance)
  useEffect(() => {
    const fetchAllCarts = async () => {
      if (!pUsers || pUsers.length === 0 || !db || isCartsLoading) return;
      setIsCartsLoading(true);
      
      try {
        const counts: Record<string, number> = {};
        // Fetch up to 50 users' cart contents
        const userBatch = pUsers.slice(0, 50);
        await Promise.all(userBatch.map(async (u) => {
          const cartRef = collection(db, 'users', u.id, 'cart');
          const cartSnap = await getDocs(cartRef);
          counts[u.id] = cartSnap.size;
        }));
        setGlobalCartCounts(counts);
      } catch (err) {
        console.error("Fetch all carts failed:", err);
      } finally {
        setIsCartsLoading(false);
      }
    };

    if (pUsers) fetchAllCarts();
  }, [pUsers?.length, db]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  const isLoading = isDataLoading;

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Archive Members</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase tracking-tight font-medium">Manage profiles and monitor engagement.</p>
        </div>
        <Badge variant="outline" className="bg-black text-white px-4 py-1.5 rounded-none font-bold uppercase tracking-widest text-[10px]">
          {unifiedCustomers.length} TOTAL
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Registered" value={unifiedCustomers.filter(c => c.tier === 'Registered').length.toString()} label="Profiles Created" icon={<UserCheck className="h-3.5 w-3.5 text-blue-600" />} />
        <StatsCard title="Guest" value={unifiedCustomers.filter(c => c.tier === 'Guest').length.toString()} label="Purchasers" icon={<ShoppingBag className="h-3.5 w-3.5 text-orange-600" />} />
        <StatsCard title="Abandoned" value={unifiedCustomers.filter(c => c.isAbandoned).length.toString()} label="Leads" icon={<UserPlus className="h-3.5 w-3.5 text-purple-600" />} />
        <StatsCard title="Retention" value={Math.round((unifiedCustomers.filter(c => c.orderCount > 0).length / Math.max(1, unifiedCustomers.length)) * 100) + '%'} label="Purchase Velocity" icon={<CreditCard className="h-3.5 w-3.5 text-green-600" />} />
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-none overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:max-w-3xl">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
              <Input placeholder="Search..." className="pl-10 h-10 border-[#e1e3e5] focus:ring-black bg-white uppercase text-[10px] font-bold w-full rounded-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex w-full md:w-auto border rounded-none p-1 bg-white shadow-sm overflow-x-auto scrollbar-hide">
              {(['all', 'registered', 'guest', 'abandoned'] as const).map((tier) => (
                <button key={tier} onClick={() => setFilterTier(tier)} className={cn("flex-1 md:flex-none px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all rounded-none", filterTier === tier ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-black")}>{tier}</button>
              ))}
            </div>
          </div>
          <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
            <DialogTrigger asChild><Button variant="outline" className={cn("h-10 border-[#e1e3e5] gap-2 font-bold uppercase tracking-widest text-[10px] w-full lg:w-auto rounded-none", (advName || advOrderNum || advPhone || advAddress || advProduct || advDateRange) && "bg-blue-50 border-blue-200 text-blue-700")}><Filter className="h-3.5 w-3.5" /> Filter</Button></DialogTrigger>
            <DialogContent className="max-w-[100vw] w-screen h-screen sm:max-w-xl sm:h-auto m-0 rounded-none bg-white border-none flex flex-col p-0">
              <DialogHeader className="p-6 sm:p-8 border-b shrink-0"><DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Search Criteria</DialogTitle></DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Name</Label><Input placeholder="Handle..." value={advName} onChange={(e) => setAdvName(e.target.value)} className="h-11 uppercase text-[10px] font-bold" /></div>
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Order ID</Label><Input placeholder="e.g. #ORD-7721" value={advOrderNum} onChange={(e) => setAdvOrderNum(e.target.value)} className="h-11 uppercase font-mono text-[10px]" /></div>
                </div>
              </div>
              <DialogFooter className="p-6 sm:p-8 border-t shrink-0 flex flex-row items-center justify-between gap-4"><Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest h-12" onClick={() => { setAdvName(''); setAdvOrderNum(''); setAdvPhone(''); setAdvAddress(''); setAdvProduct(''); setAdvDateRange(undefined); }}>Reset</Button><Button className="flex-1 bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsAuditOpen(false)}>Apply</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-[#f6f6f7]"><TableRow className="border-[#e1e3e5]"><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] py-4 pl-6">Identity</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Contact</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Joined</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Purchase History</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Status</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#e1e3e5]">
                    <TableCell className="pl-6"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><div className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-24" /></div></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : filteredCustomers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-gray-400 font-medium uppercase text-[10px] tracking-widest">No members found.</TableCell></TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-[#f6f6f7]/50 border-[#e1e3e5] group cursor-pointer transition-colors"
                  >
                    <TableCell className="pl-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">{customer.photoURL ? <Image src={customer.photoURL} alt={customer.displayName} fill sizes="40px" className="object-cover" /> : <UserCircle className="h-6 w-6 text-gray-300" />}</div><div className="flex flex-col"><span className="text-sm font-bold uppercase tracking-tight text-primary">{customer.displayName}</span><span className="text-[9px] font-mono text-gray-400 uppercase">ID: {customer.id.substring(0, 8)}...</span></div></div></TableCell>
                    <TableCell><div className="flex flex-col gap-1"><div className="flex items-center gap-2 text-xs font-medium"><Mail className="h-3 w-3 text-gray-400" /><span className="lowercase">{customer.email}</span></div></div></TableCell>
                    <TableCell><div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase"><CalendarIcon className="h-3 w-3" />{formatDate(customer.createdAt)}</div></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-primary">C${customer.totalSpent.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{customer.orderCount} ORDERS</span>
                          {customer.lastOrderDate && (
                            <div className="flex gap-1">
                              {getPaymentStatusBadge(customer.lastPaymentStatus)}
                              {getStatusBadge(customer.lastFulfillmentStatus)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn("uppercase text-[9px] font-bold border-none px-3", 
                          customer.isHighIntent ? "bg-orange-100 text-orange-700 animate-pulse" :
                          customer.isAbandoned ? "bg-purple-50 text-purple-700" : 
                          customer.tier === 'Guest' ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700")}>
                          {customer.status}
                        </Badge>
                        {customer.cartCount > 0 && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-tighter">
                            <ShoppingBag className="h-2.5 w-2.5" />
                            {customer.cartCount} in cart
                          </div>
                        )}
                      </div>
                    <TableCell className="pr-6">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="lg:hidden">
          {isLoading ? (
            <div className="divide-y border-t">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No members found.</div>
          ) : (
            <div className="divide-y border-t">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="p-4 space-y-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">{customer.photoURL ? <Image src={customer.photoURL} alt={customer.displayName} fill sizes="40px" className="object-cover" /> : <UserCircle className="h-6 w-6 text-gray-300" />}</div>
                      <div className="flex flex-col"><span className="text-sm font-bold uppercase tracking-tight text-primary">{customer.displayName}</span><Badge variant="secondary" className={cn("w-fit uppercase text-[7px] font-bold border-none px-1.5 h-4 mt-0.5", customer.isAbandoned ? "bg-purple-50 text-purple-700" : customer.tier === 'Guest' ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700")}>{customer.status}</Badge></div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowRight className="h-4 w-4 text-gray-400" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Contact</p><p className="text-[10px] font-medium truncate lowercase">{customer.email}</p></div>
                    <div className="space-y-1 text-right"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Joined</p><p className="text-[10px] font-bold uppercase">{formatDate(customer.createdAt)}</p></div>
                    <div className="space-y-1"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Spent</p><p className="text-[10px] font-bold text-primary">C${customer.totalSpent.toFixed(2)}</p></div>
                    <div className="space-y-1 text-right">
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Account Status</p>
                      <div className="flex justify-end gap-1">
                        {customer.lastOrderDate && (
                          <>
                            {getPaymentStatusBadge(customer.lastPaymentStatus)}
                            {getStatusBadge(customer.lastFulfillmentStatus)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <SheetContent className="w-full sm:max-w-2xl bg-white p-0 flex flex-col border-l border-black/10 overflow-hidden">
          {selectedCustomer && (
            <>
              <SheetHeader className="p-8 border-b bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-white border-2 border-primary/5 overflow-hidden flex items-center justify-center shrink-0 shadow-xl relative">
                      {selectedCustomer.photoURL ? (
                        <Image 
                          src={selectedCustomer.photoURL} 
                          alt={selectedCustomer.displayName} 
                          fill 
                          sizes="80px"
                          className="object-cover" 
                        />
                      ) : (
                        <UserCircle className="h-12 w-12 text-gray-200" />
                      )}
                    </div>
                    {selectedCustomer.isHighIntent && (
                      <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                        <ShoppingBag className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <SheetTitle className="text-2xl font-headline font-bold uppercase tracking-tight truncate">
                        {selectedCustomer.displayName}
                      </SheetTitle>
                      <Badge className={cn("uppercase text-[8px] font-bold tracking-widest px-2 h-5 border-none", 
                        selectedCustomer.isHighIntent ? 'bg-orange-600' : 
                        selectedCustomer.tier === 'Registered' ? 'bg-blue-600' : 'bg-orange-500')}>
                        {selectedCustomer.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">{selectedCustomer.email}</p>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400 mt-1 uppercase">
                      <Fingerprint className="h-3 w-3" /> ID: {selectedCustomer.id}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="p-8 space-y-10">
                  
                  {/* METRICS */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="shadow-none rounded-none border border-black/5 bg-gray-50/30">
                      <CardContent className="p-6">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lifetime Value</p>
                        <p className="text-2xl font-bold font-headline text-primary">C${selectedCustomer.totalSpent.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none rounded-none border border-black/5 bg-gray-50/30">
                      <CardContent className="p-6">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <p className="text-2xl font-bold font-headline text-primary">{selectedCustomer.orderCount}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* ABANDONED CART SECTION */}
                  {selectedCustomer.cartItems?.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600 flex items-center gap-2">
                          <ShoppingBag className="h-3.5 w-3.5" /> Live Abandoned Cart
                        </h3>
                        <Badge className="bg-orange-50 text-orange-700 border-none rounded-none text-[8px] font-bold">
                          {selectedCustomer.cartItems.length} ITEMS
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {selectedCustomer.cartItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 border bg-orange-50/20 group hover:border-orange-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white border flex items-center justify-center p-1 relative overflow-hidden">
                                {item.image ? (
                                  <Image 
                                    src={item.image} 
                                    alt={item.name} 
                                    fill 
                                    sizes="40px"
                                    className="object-contain" 
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-300" />
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase truncate max-w-[200px]">{item.name}</p>
                                <p className="text-[8px] font-bold text-gray-400">SIZE: {item.size || 'N/A'} • QTY: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="text-[10px] font-bold text-primary">C${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                        <div className="pt-2 flex justify-between items-center text-orange-700">
                          <span className="text-[9px] font-bold uppercase">Estimated Value</span>
                          <span className="text-sm font-bold">C${selectedCustomer.cartItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ORDER HISTORY TABLE */}
                  <section className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2 text-primary flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-blue-500" /> Transactional History
                    </h3>
                    {selectedCustomer.orderHistory?.length > 0 ? (
                      <div className="border rounded-none overflow-hidden bg-white shadow-sm">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow className="border-b">
                              <TableHead className="text-[8px] font-bold uppercase h-8 py-0 pl-4 w-[20%]">Date</TableHead>
                              <TableHead className="text-[8px] font-bold uppercase h-8 py-0 w-[40%]">ID & Summary</TableHead>
                              <TableHead className="text-[8px] font-bold uppercase h-8 py-0">Amount</TableHead>
                              <TableHead className="text-[8px] font-bold uppercase h-8 py-0 pr-4 text-right">View</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCustomer.orderHistory.map((order: any) => (
                              <TableRow key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                                <TableCell className="pl-4 py-3">
                                  <p className="text-[9px] font-bold uppercase leading-tight">
                                    {order.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                  </p>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-mono font-bold text-primary">#{order.id.substring(0, 8).toUpperCase()}...</p>
                                    <div className="flex gap-1">
                                      {getPaymentStatusBadge(order.paymentStatus)}
                                      {getStatusBadge(order.status)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 font-bold text-[9px]">C${Number(order.total).toFixed(2)}</TableCell>
                                <TableCell className="pr-4 py-3 text-right">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none border border-black/5 hover:border-black transition-all" asChild>
                                    <a href={`/admin/orders/${order.id.toLowerCase()}`} target="_blank">
                                      <ArrowRight className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-12 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center space-y-2 opacity-60">
                         <Activity className="h-6 w-6 text-gray-200" />
                         <p className="text-[10px] font-bold uppercase text-gray-400 italic">No transactional record found.</p>
                      </div>
                    )}
                  </section>

                  {/* LOGISTICS & CONTACT */}
                  <section className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2 text-primary flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Logistics & Contact
                    </h3>
                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Registered Addresses</Label>
                        <div className="grid gap-3">
                          {Array.from(selectedCustomer.addresses).map((addr: any) => (
                            <div key={addr} className="p-4 bg-gray-50/50 border rounded-none text-[10px] font-bold uppercase leading-relaxed text-gray-600 flex items-start gap-3">
                              <MapPin className="h-3 w-3 mt-0.5 shrink-0" /> {addr}
                            </div>
                          ))}
                          {selectedCustomer.addresses.size === 0 && <p className="text-[9px] font-medium text-gray-400 italic">No address on file.</p>}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Direct Contact</Label>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(selectedCustomer.phones).map((p: any) => (
                            <div key={p} className="flex items-center gap-2 px-3 py-2 bg-gray-50/30 border text-[10px] font-mono font-bold text-primary rounded-none">
                              <Phone className="h-3 w-3 text-gray-400" /> {p}
                            </div>
                          ))}
                          {selectedCustomer.phones.size === 0 && <p className="text-[9px] font-medium text-gray-400 italic">No phone record.</p>}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* MANIFEST */}
                  <section className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2 text-primary flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-purple-500" /> Items Manifest
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selectedCustomer.productNames).map((name: any) => (
                        <Badge key={name} variant="outline" className="rounded-none border-black/10 bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-tight shadow-sm">
                          {name}
                        </Badge>
                      ))}
                      {selectedCustomer.productNames.size === 0 && (
                        <p className="text-[10px] font-bold uppercase text-gray-400 italic">No products cataloged.</p>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="p-8 border-t bg-gray-50/50 shrink-0">
                <Button 
                  className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-gray-900 transition-all rounded-none"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Close Manifest
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatsCard({ title, value, label, icon }: { title: string, value: string, label: string, icon: React.ReactNode }) {
  return (
    <Card className="border-[#e1e3e5] shadow-none rounded-none hover:border-black transition-colors group">
      <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2 group-hover:text-primary transition-colors">{icon} {title}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold text-[#1a1c1e] tracking-tight">{value}</div><p className="text-[9px] font-bold uppercase text-[#8c9196] mt-1">{label}</p></CardContent>
    </Card>
  );
}

