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
  ChevronDown,
  Fingerprint,
  Layers,
  History,
  Activity,
  Package
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
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

export default function CustomersPage() {
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'registered' | 'guest' | 'abandoned'>('all');
  
  const isAdmin = useMemo(() => {
    return currentUser?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
  }, [currentUser]);

  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const [advName, setAdvName] = useState('');
  const [advOrderNum, setAdvOrderNum] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advAddress, setAdvAddress] = useState('');
  const [advProduct, setAdvProduct] = useState('');
  const [advDateRange, setAdvDateRange] = useState<DateRange | undefined>(undefined);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const unifiedCustomers = useMemo(() => {
    if (!users || !orders) return [];
    const customerMap = new Map<string, any>();

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
        orderIds: new Set<string>(),
        productNames: new Set<string>(),
        addresses: new Set<string>(),
        phones: new Set<string>()
      });
    });

    orders.forEach(o => {
      const email = o.email?.toLowerCase();
      if (!email) return;
      let entry = customerMap.get(email);
      if (!entry && o.userId === 'guest') {
        entry = {
          id: `guest_${o.id}`, email: o.email, displayName: o.customer?.name || 'Guest Piece',
          photoURL: null, createdAt: o.createdAt, tier: 'Guest', orderCount: 0, totalSpent: 0,
          lastOrderDate: null, status: 'Guest Purchaser', orderIds: new Set<string>(),
          productNames: new Set<string>(), addresses: new Set<string>(), phones: new Set<string>()
        };
        customerMap.set(email, entry);
      }
      if (entry) {
        entry.orderCount += 1;
        entry.totalSpent += (Number(o.total) || 0);
        entry.status = entry.tier === 'Registered' ? 'Member' : 'Guest Purchaser';
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        if (!entry.lastOrderDate || oDate > new Date(entry.lastOrderDate)) entry.lastOrderDate = oDate;
        entry.orderIds.add(o.id.toUpperCase());
        if (o.customer?.phone) entry.phones.add(o.customer.phone);
        if (o.customer?.shipping?.address) entry.addresses.add(o.customer.shipping.address.toUpperCase());
        o.items?.forEach((item: any) => { if (item.name) entry.productNames.add(item.name.toUpperCase()); });
      }
    });

    return Array.from(customerMap.values()).map(c => {
      if (c.tier === 'Registered' && c.orderCount === 0) return { ...c, status: 'Abandoned / Lead', isAbandoned: true };
      return c;
    });
  }, [users, orders]);

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

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isLoading = usersLoading || ordersLoading;

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
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-gray-400 font-medium uppercase text-[10px] tracking-widest">No members found.</TableCell></TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-[#f6f6f7]/50 border-[#e1e3e5] group cursor-pointer transition-colors"
                  >
                    <TableCell className="pl-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0 shadow-sm">{customer.photoURL ? <img src={customer.photoURL} alt="" className="w-full h-full object-cover" /> : <UserCircle className="h-6 w-6 text-gray-300" />}</div><div className="flex flex-col"><span className="text-sm font-bold uppercase tracking-tight text-primary">{customer.displayName}</span><span className="text-[9px] font-mono text-gray-400 uppercase">ID: {customer.id.substring(0, 8)}...</span></div></div></TableCell>
                    <TableCell><div className="flex flex-col gap-1"><div className="flex items-center gap-2 text-xs font-medium"><Mail className="h-3 w-3 text-gray-400" /><span className="lowercase">{customer.email}</span></div></div></TableCell>
                    <TableCell><div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase"><CalendarIcon className="h-3 w-3" />{formatDate(customer.createdAt)}</div></TableCell>
                    <TableCell><div className="flex flex-col gap-0.5"><span className="text-xs font-bold text-primary">C$${customer.totalSpent.toFixed(2)}</span><span className="text-[9px] font-bold text-gray-400 uppercase">{customer.orderCount} ORDERS</span></div></TableCell>
                    <TableCell><Badge variant="secondary" className={cn("uppercase text-[9px] font-bold border-none px-3", customer.isAbandoned ? "bg-purple-50 text-purple-700" : customer.tier === 'Guest' ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700")}>{customer.status}</Badge></TableCell>
                    <TableCell className="pr-6"><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight className="h-4 w-4 text-gray-400" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="lg:hidden">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
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
                      <div className="w-10 h-10 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0 shadow-sm">{customer.photoURL ? <img src={customer.photoURL} alt="" className="w-full h-full object-cover" /> : <UserCircle className="h-6 w-6 text-gray-300" />}</div>
                      <div className="flex flex-col"><span className="text-sm font-bold uppercase tracking-tight text-primary">{customer.displayName}</span><Badge variant="secondary" className={cn("w-fit uppercase text-[7px] font-bold border-none px-1.5 h-4 mt-0.5", customer.isAbandoned ? "bg-purple-50 text-purple-700" : customer.tier === 'Guest' ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700")}>{customer.status}</Badge></div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowRight className="h-4 w-4 text-gray-400" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Contact</p><p className="text-[10px] font-medium truncate lowercase">{customer.email}</p></div>
                    <div className="space-y-1 text-right"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Joined</p><p className="text-[10px] font-bold uppercase">{formatDate(customer.createdAt)}</p></div>
                    <div className="space-y-1"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Spent</p><p className="text-[10px] font-bold text-primary">C$${customer.totalSpent.toFixed(2)}</p></div>
                    <div className="space-y-1 text-right"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Orders</p><p className="text-[10px] font-bold">{customer.orderCount}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <SheetContent className="w-full sm:max-w-2xl bg-white p-0 flex flex-col border-l border-black/10">
          {selectedCustomer && (
            <>
              <SheetHeader className="p-8 border-b bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-primary/5 overflow-hidden flex items-center justify-center shrink-0 shadow-xl">
                    {selectedCustomer.photoURL ? (
                      <img src={selectedCustomer.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="h-12 w-12 text-gray-200" />
                    )}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <SheetTitle className="text-2xl font-headline font-bold uppercase tracking-tight truncate">
                        {selectedCustomer.displayName}
                      </SheetTitle>
                      <Badge className={cn("uppercase text-[8px] font-bold tracking-widest px-2 h-5 border-none", selectedCustomer.tier === 'Registered' ? 'bg-blue-600' : 'bg-orange-500')}>
                        {selectedCustomer.tier}
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
                <div className="p-8 space-y-12">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="shadow-none rounded-none border border-black/5 bg-gray-50/30">
                      <CardContent className="p-6">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lifetime Value</p>
                        <p className="text-2xl font-bold font-headline text-primary">C$${selectedCustomer.totalSpent.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none rounded-none border border-black/5 bg-gray-50/30">
                      <CardContent className="p-6">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <p className="text-2xl font-bold font-headline text-primary">{selectedCustomer.orderCount}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <section className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2 text-primary flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-blue-500" /> Order History
                    </h3>
                    {selectedCustomer.orderIds.size > 0 ? (
                      <div className="grid gap-3">
                        {Array.from(selectedCustomer.orderIds).map((id: any) => (
                          <div key={id} className="p-4 border rounded-none bg-white hover:border-black transition-all group flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-mono font-bold">#{id}</p>
                              <p className="text-[9px] font-bold uppercase text-muted-foreground">Archival Transaction</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={`/admin/orders/${id.toLowerCase()}`} target="_blank">
                                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold uppercase text-gray-400 italic py-4">No transactions found.</p>
                    )}
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2 text-primary flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-orange-500" /> Items Manifest
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selectedCustomer.productNames).map((name: any) => (
                        <Badge key={name} variant="outline" className="rounded-none border-black/10 bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-tight">
                          {name}
                        </Badge>
                      ))}
                      {selectedCustomer.productNames.size === 0 && (
                        <p className="text-[10px] font-bold uppercase text-gray-400 italic">No items cataloged.</p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2 text-primary flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Contact & Logistics
                    </h3>
                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Addresses</Label>
                        <div className="grid gap-3">
                          {Array.from(selectedCustomer.addresses).map((addr: any) => (
                            <div key={addr} className="p-4 bg-gray-50 border rounded-none text-xs font-bold uppercase leading-relaxed text-gray-600">
                              {addr}
                            </div>
                          ))}
                          {selectedCustomer.addresses.size === 0 && <p className="text-[9px] font-medium text-gray-400 italic">None provided.</p>}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Phones</Label>
                        <div className="flex flex-wrap gap-3">
                          {Array.from(selectedCustomer.phones).map((p: any) => (
                            <div key={p} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border text-[10px] font-mono font-bold text-primary">
                              <Phone className="h-3 w-3 text-gray-400" /> {p}
                            </div>
                          ))}
                          {selectedCustomer.phones.size === 0 && <p className="text-[9px] font-medium text-gray-400 italic">None provided.</p>}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="p-8 border-t bg-gray-50/50 shrink-0">
                <Button 
                  className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl"
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
