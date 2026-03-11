
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
  Calendar as CalendarIcon, 
  UserCircle,
  MoreHorizontal,
  Filter,
  ShoppingBag,
  CreditCard,
  UserCheck,
  UserPlus,
  ArrowRight,
  X,
  MapPin,
  Tag,
  Phone,
  Hash,
  ChevronDown
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
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { type DateRange } from "react-day-picker";

export default function CustomersPage() {
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'registered' | 'guest' | 'abandoned'>('all');
  
  // Advanced Audit State
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [advName, setAdvName] = useState('');
  const [advOrderNum, setAdvOrderNum] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advAddress, setAdvAddress] = useState('');
  const [advProduct, setAdvProduct] = useState('');
  const [advDateRange, setAdvDateRange] = useState<DateRange | undefined>(undefined);

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

  // Unified Member Manifest Logic with Forensic Indexing
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
        status: 'Registered',
        // Forensic Index
        orderIds: new Set<string>(),
        productNames: new Set<string>(),
        addresses: new Set<string>(),
        phones: new Set<string>()
      });
    });

    // 2. Orchestrate Guest Data and User Purchase Stats
    orders.forEach(o => {
      const email = o.email?.toLowerCase();
      if (!email) return;

      let entry = customerMap.get(email);
      
      if (!entry && o.userId === 'guest') {
        // High-Fidelity Guest Capture
        entry = {
          id: `guest_${o.id}`,
          email: o.email,
          displayName: o.customer?.name || 'Guest Piece',
          photoURL: null,
          createdAt: o.createdAt,
          tier: 'Guest',
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: null,
          status: 'Guest Purchaser',
          // Forensic Index
          orderIds: new Set<string>(),
          productNames: new Set<string>(),
          addresses: new Set<string>(),
          phones: new Set<string>()
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
        }

        // Forensic Indexing
        entry.orderIds.add(o.id.toUpperCase());
        if (o.customer?.phone) entry.phones.add(o.customer.phone);
        
        // Index Addresses
        if (o.customer?.shipping?.address) entry.addresses.add(o.customer.shipping.address.toUpperCase());
        if (o.customer?.billing?.address) entry.addresses.add(o.customer.billing.address.toUpperCase());

        // Index Products
        o.items?.forEach((item: any) => {
          if (item.name) entry.productNames.add(item.name.toUpperCase());
        });
      }
    });

    // 3. Final Classification
    return Array.from(customerMap.values()).map(c => {
      if (c.tier === 'Registered' && c.orderCount === 0) {
        return { ...c, status: 'Abandoned / Lead', isAbandoned: true };
      }
      return c;
    });
  }, [users, orders]);

  const filteredCustomers = useMemo(() => {
    return unifiedCustomers.filter(customer => {
      // 1. Basic Filters
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

      if (!matchesSearch || !matchesTier) return false;

      // 2. Advanced Forensic Audit Logic
      if (advName && !customer.displayName.toLowerCase().includes(advName.toLowerCase())) return false;
      
      if (advOrderNum) {
        const hasOrder = Array.from(customer.orderIds as Set<string>).some(id => id.includes(advOrderNum.toUpperCase()));
        if (!hasOrder) return false;
      }

      if (advPhone) {
        const hasPhone = Array.from(customer.phones as Set<string>).some(p => p.includes(advPhone));
        if (!hasPhone) return false;
      }

      if (advAddress) {
        const hasAddress = Array.from(customer.addresses as Set<string>).some(a => a.includes(advAddress.toUpperCase()));
        if (!hasAddress) return false;
      }

      if (advProduct) {
        const hasProduct = Array.from(customer.productNames as Set<string>).some(p => p.includes(advProduct.toUpperCase()));
        if (!hasProduct) return false;
      }

      if (advDateRange?.from) {
        const createdDate = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
        const start = startOfDay(advDateRange.from);
        const end = advDateRange.to ? endOfDay(advDateRange.to) : endOfDay(advDateRange.from);
        if (!isWithinInterval(createdDate, { start, end })) return false;
      }

      return true;
    });
  }, [unifiedCustomers, searchQuery, filterTier, advName, advOrderNum, advPhone, advAddress, advProduct, advDateRange]);

  const handleResetAudit = () => {
    setAdvName('');
    setAdvOrderNum('');
    setAdvPhone('');
    setAdvAddress('');
    setAdvProduct('');
    setAdvDateRange(undefined);
  };

  const isAuditActive = advName || advOrderNum || advPhone || advAddress || advProduct || advDateRange;

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
                placeholder="Quick search (Name, Email, ID)..." 
                className="pl-10 h-10 border-[#e1e3e5] focus:ring-black bg-white uppercase text-[10px] font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex border rounded-md p-1 bg-white shadow-sm">
              {(['all', 'registered', 'guest', 'abandoned'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFilterTier(tier)}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all rounded",
                    filterTier === tier ? "bg-black text-white shadow-md" : "text-gray-400 hover:text-black"
                  )}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "h-10 border-[#e1e3e5] gap-2 font-bold uppercase tracking-widest text-[10px]",
                  isAuditActive && "bg-blue-50 border-blue-200 text-blue-700"
                )}
              >
                <Filter className="h-3.5 w-3.5" /> 
                {isAuditActive ? 'Refining Audit' : 'Advanced Audit'}
                {isAuditActive && <Badge className="ml-1 h-4 px-1.5 bg-blue-600 text-[8px]">ACTIVE</Badge>}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white border-none rounded-none shadow-2xl">
              <DialogHeader className="pt-8 border-b pb-6">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Forensic Audit Protocol</DialogTitle>
                </div>
                <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Orchestrate specific temporal and behavioral filters.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6 py-8">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                    <UserCircle className="h-3 w-3" /> Participant Name
                  </Label>
                  <Input 
                    placeholder="Search by handle..." 
                    value={advName}
                    onChange={(e) => setAdvName(e.target.value)}
                    className="h-11 uppercase text-[10px] font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                    <Hash className="h-3 w-3" /> Forensic Order ID
                  </Label>
                  <Input 
                    placeholder="e.g. #ORD-7721" 
                    value={advOrderNum}
                    onChange={(e) => setAdvOrderNum(e.target.value)}
                    className="h-11 uppercase font-mono text-[10px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Phone Manifest
                  </Label>
                  <Input 
                    placeholder="+1..." 
                    value={advPhone}
                    onChange={(e) => setAdvPhone(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Delivery Address
                  </Label>
                  <Input 
                    placeholder="Search locations..." 
                    value={advAddress}
                    onChange={(e) => setAdvAddress(e.target.value)}
                    className="h-11 uppercase text-[10px] font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                    <Tag className="h-3 w-3" /> Archival Product
                  </Label>
                  <Input 
                    placeholder="Search piece name..." 
                    value={advProduct}
                    onChange={(e) => setAdvProduct(e.target.value)}
                    className="h-11 uppercase text-[10px] font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" /> Temporal Window
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-11 justify-start text-left font-bold uppercase text-[9px] tracking-widest border-gray-200",
                          !advDateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {advDateRange?.from ? (
                          advDateRange.to ? (
                            <>
                              {format(advDateRange.from, "LLL dd")} - {format(advDateRange.to, "LLL dd")}
                            </>
                          ) : (
                            format(advDateRange.from, "LLL dd")
                          )
                        ) : (
                          <span>Registration Date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={advDateRange?.from}
                        selected={advDateRange}
                        onSelect={setAdvDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <DialogFooter className="border-t pt-6 flex flex-row items-center justify-between gap-4">
                <Button 
                  variant="ghost" 
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground h-12"
                  onClick={handleResetAudit}
                >
                  Reset Protocol
                </Button>
                <Button 
                  className="flex-1 bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => setIsAuditOpen(false)}
                >
                  Apply Audit Manifest
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isAuditActive && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex flex-wrap gap-2 items-center">
            <span className="text-[9px] font-bold text-blue-700 uppercase tracking-widest mr-2">Active Audit:</span>
            {advName && <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 text-[8px] uppercase">Name: {advName}</Badge>}
            {advOrderNum && <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 text-[8px] uppercase font-mono">Order: {advOrderNum}</Badge>}
            {advPhone && <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 text-[8px] uppercase">Phone: {advPhone}</Badge>}
            {advAddress && <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 text-[8px] uppercase">Location: {advAddress}</Badge>}
            {advProduct && <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 text-[8px] uppercase">Product: {advProduct}</Badge>}
            {advDateRange?.from && <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 text-[8px] uppercase">Temporal Window Active</Badge>}
            <button onClick={handleResetAudit} className="ml-auto text-[9px] font-bold text-blue-700 hover:underline uppercase tracking-tighter flex items-center gap-1">
              <X className="h-3 w-3" /> Clear Audit
            </button>
          </div>
        )}

        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow className="border-[#e1e3e5]">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] py-4 pl-6">Participant Identity</TableHead>
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
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                        {customer.photoURL ? (
                          <img src={customer.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase tracking-tight text-primary">{customer.displayName}</span>
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
                      <CalendarIcon className="h-3 w-3" />
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
                        "uppercase text-[9px] font-bold border-none px-3",
                        customer.isAbandoned ? "bg-purple-50 text-purple-700" : 
                        customer.tier === 'Guest' ? "bg-orange-50 text-orange-700" :
                        "bg-blue-50 text-blue-700"
                      )}
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border-black/10 shadow-xl rounded-none animate-in fade-in slide-in-from-top-2 duration-300">
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-gray-400">Management</DropdownMenuLabel>
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer hover:bg-gray-50 py-3">
                          <ArrowRight className="h-3 w-3 mr-2" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer hover:bg-gray-50 py-3">
                          <ShoppingBag className="h-3 w-3 mr-2" /> Order History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer text-red-600 hover:bg-red-50 py-3">
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
    <Card className="border-[#e1e3e5] shadow-none rounded-none hover:border-black transition-colors group">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] uppercase tracking-widest text-[#5c5f62] flex items-center gap-2 group-hover:text-primary transition-colors">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#1a1c1e] tracking-tight">{value}</div>
        <p className="text-[9px] font-bold uppercase text-[#8c9196] mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
