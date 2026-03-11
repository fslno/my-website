
'use client';

import React, { useState, useMemo } from 'react';
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
import { 
  Search, 
  Users, 
  Loader2, 
  Mail, 
  Calendar, 
  UserCircle,
  MoreHorizontal,
  Filter,
  ShoppingBag,
  CreditCard,
  UserCheck,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'registered' | 'guest' | 'abandoned'>('all');

  // Real-time subscription to core manifests
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

  // Unified Member Manifest Logic
  const unifiedCustomers = useMemo(() => {
    if (!users || !orders) return [];
    
    const customerMap = new Map<string, any>();

    // 1. Establish Registered Baseline
    users.forEach(u => {
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
        status: 'Registered'
      });
    });

    // 2. Orchestrate Guest Data and User Purchase Stats
    orders.forEach(o => {
      const email = o.email?.toLowerCase();
      if (!email) return;

      const existing = customerMap.get(email);
      
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += (Number(o.total) || 0);
        existing.status = 'Member';
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        if (!existing.lastOrderDate || oDate > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = oDate;
        }
      } else if (o.userId === 'guest') {
        // High-Fidelity Guest Capture
        customerMap.set(email, {
          id: `guest_${o.id}`,
          email: o.email,
          displayName: o.customer?.name || 'Guest Piece',
          photoURL: null,
          createdAt: o.createdAt,
          tier: 'Guest',
          orderCount: 1,
          totalSpent: (Number(o.total) || 0),
          lastOrderDate: o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt),
          status: 'Guest Purchaser'
        });
      }
    });

    // 3. Final Filter & Classification
    return Array.from(customerMap.values()).map(c => {
      // Classification for "Abandoned" heuristic: Registered with zero orders
      if (c.tier === 'Registered' && c.orderCount === 0) {
        return { ...c, status: 'Abandoned / Lead', isAbandoned: true };
      }
      return c;
    });
  }, [users, orders]);

  const filteredCustomers = useMemo(() => {
    return unifiedCustomers.filter(customer => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = (
        customer.displayName?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.id.toLowerCase().includes(search)
      );

      const matchesTier = (
        filterTier === 'all' ||
        (filterTier === 'registered' && customer.tier === 'Registered') ||
        (filterTier === 'guest' && customer.tier === 'Guest') ||
        (filterTier === 'abandoned' && customer.isAbandoned)
      );

      return matchesSearch && matchesTier;
    });
  }, [unifiedCustomers, searchQuery, filterTier]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isLoading = usersLoading || ordersLoading;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Archive Member Manifest</h1>
          <p className="text-[#5c5f62] mt-1 text-sm uppercase tracking-tight font-medium">Manage unified profiles and monitor forensic archival engagement.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-black text-white px-4 py-1.5 rounded-sm font-bold uppercase tracking-widest text-[10px]">
            {unifiedCustomers.length} Total Participants
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Registered" 
          value={unifiedCustomers.filter(c => c.tier === 'Registered').length.toString()} 
          label="Profile Created" 
          icon={<UserCheck className="h-3.5 w-3.5 text-blue-600" />} 
        />
        <StatsCard 
          title="Guest Purchasers" 
          value={unifiedCustomers.filter(c => c.tier === 'Guest').length.toString()} 
          label="No Formal Profile" 
          icon={<ShoppingBag className="h-3.5 w-3.5 text-orange-600" />} 
        />
        <StatsCard 
          title="Abandoned / Lead" 
          value={unifiedCustomers.filter(c => c.isAbandoned).length.toString()} 
          label="Pending Selection" 
          icon={<UserPlus className="h-3.5 w-3.5 text-purple-600" />} 
        />
        <StatsCard 
          title="Total Retention" 
          value={Math.round((unifiedCustomers.filter(c => c.orderCount > 0).length / Math.max(1, unifiedCustomers.length)) * 100) + '%'} 
          label="Purchase Velocity" 
          icon={<CreditCard className="h-3.5 w-3.5 text-green-600" />} 
        />
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
              <Input 
                placeholder="Search archive manifest..." 
                className="pl-10 h-10 border-[#e1e3e5] focus:ring-black bg-white uppercase text-[10px] font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex border rounded-md p-1 bg-white">
              {(['all', 'registered', 'guest', 'abandoned'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFilterTier(tier)}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all rounded",
                    filterTier === tier ? "bg-black text-white" : "text-gray-400 hover:text-black"
                  )}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
          <Button variant="outline" className="h-10 border-[#e1e3e5] gap-2 font-bold uppercase tracking-widest text-[10px]">
            <Filter className="h-3.5 w-3.5" /> Advanced Audit
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow className="border-[#e1e3e5]">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] py-4">Participant Identity</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Contact Manifest</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Archival Entry</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Purchase Profile</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Status Protocol</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400 font-medium uppercase text-[10px] tracking-widest">
                  No participants match the active temporal filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-[#f6f6f7]/50 border-[#e1e3e5] group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0">
                        {customer.photoURL ? (
                          <img src={customer.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase tracking-tight">{customer.displayName}</span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase">ID: {customer.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="lowercase">{customer.email}</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Level: {customer.tier}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                      <Calendar className="h-3 w-3" />
                      {formatDate(customer.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-primary">${customer.totalSpent.toFixed(2)}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{customer.orderCount} TRANSACTIONS</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "uppercase text-[9px] font-bold border-none",
                        customer.isAbandoned ? "bg-purple-50 text-purple-700" : 
                        customer.tier === 'Guest' ? "bg-orange-50 text-orange-700" :
                        "bg-blue-50 text-blue-700"
                      )}
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border-black/10">
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-gray-400">Management</DropdownMenuLabel>
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer">
                          <ArrowRight className="h-3 w-3 mr-2" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer">
                          <ShoppingBag className="h-3 w-3 mr-2" /> Order History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer text-red-600">
                          Suspend Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatsCard({ title, value, label, icon }: { title: string, value: string, label: string, icon: React.ReactNode }) {
  return (
    <Card className="border-[#e1e3e5] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#1a1c1e]">{value}</div>
        <p className="text-[9px] font-bold uppercase text-[#8c9196] mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
