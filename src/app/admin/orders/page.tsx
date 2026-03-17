'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Loader2,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronRight,
  Phone,
  RotateCcw,
  Mail,
  Truck,
  MapPin,
  MessageSquare,
  Sparkles,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function OrdersPage() {
  const db = useFirestore();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
  }, [user]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [db, isAdmin]);

  const { data: ordersData, loading } = useCollection(ordersQuery);
  const orders = ordersData || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.toLowerCase());
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.filter((order: any) => {
      const id = order.id?.toLowerCase() || '';
      const email = order.email?.toLowerCase() || '';
      const name = order.customer?.name?.toLowerCase() || '';
      const phone = order.customer?.phone?.toLowerCase() || '';

      const matchesSearch =
        id.includes(debouncedSearch) ||
        email.includes(debouncedSearch) ||
        name.includes(debouncedSearch) ||
        phone.includes(debouncedSearch);

      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let revenue = 0;
    let returned = 0;

    for (const order of orders) {
      total++;
      if (
        order.status === 'awaiting_processing' ||
        order.status === 'processing' ||
        order.status === 'ready_for_pickup' ||
        order.status === 'confirmed' ||
        order.status === 'pending'
      ) {
        pending++;
      }
      if (order.status === 'returned') {
        returned++;
      }
      revenue += Number(order.total) || 0;
    }

    return { total, pending, revenue, returned };
  }, [orders]);

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const currentFilteredIds = filteredOrders.map(o => o.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    } else {
      const currentFilteredIds = new Set(filteredOrders.map(o => o.id));
      setSelectedIds(prev => prev.filter(id => !currentFilteredIds.has(id)));
    }
  };

  const handleToggleSelect = (id: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Authoritatively delete ${selectedIds.length} order documents? This action is forensicly irreversible.`)) return;

    setIsProcessing(true);
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      batch.delete(doc(db, 'orders', id));
    });

    try {
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Purge Complete", description: `${selectedIds.length} orders removed from archive.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Protocol Failure", description: "Batch deletion failed." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!db || selectedIds.length === 0 || !bulkStatus) return;
    setIsProcessing(true);

    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      batch.update(doc(db, 'orders', id), {
        status: bulkStatus,
        updatedAt: serverTimestamp()
      });
    });

    try {
      await batch.commit();
      setSelectedIds([]);
      setIsBulkStatusOpen(false);
      setBulkStatus('');
      toast({ title: "Protocol Sync", description: `Updated ${selectedIds.length} orders successfully.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to update status." });
    } finally {
      setIsProcessing(false);
    }
  };

  const isAllFilteredSelected = useMemo(() => {
    return filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o.id));
  }, [filteredOrders, selectedIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return filteredOrders.some(o => selectedIds.includes(o.id)) && !isAllFilteredSelected;
  }, [filteredOrders, selectedIds, isAllFilteredSelected]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate
      ? timestamp.toDate()
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_processing':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[9px] font-bold">Awaiting Processing</Badge>;
      case 'processing':
        return <Badge className="bg-violet-50 text-violet-700 border-violet-100 uppercase text-[9px] font-bold">Processing</Badge>;
      case 'ready_for_pickup':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-100 uppercase text-[9px] font-bold">Ready for Pickup</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] font-bold">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[9px] font-bold">Delivered</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase text-[10px] font-bold">Out for Delivery</Badge>;
      case 'returned':
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[9px] font-bold">Returned</Badge>;
      case 'canceled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Canceled</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-50 text-blue-100 uppercase text-[9px] font-bold">Confirmed</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-100 uppercase text-[9px] font-bold">{status?.replace('_', ' ')}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold">Paid</Badge>;
      case 'awaiting_payment':
      case 'awaiting':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">Awaiting Payment</Badge>;
      case 'refunded':
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[10px] font-bold">Refunded</Badge>;
      case 'partially_refunded':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-100 uppercase text-[10px] font-bold">Partially Refunded</Badge>;
      case 'canceled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Canceled</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">Awaiting Payment</Badge>;
    }
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Orders</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">View and manage your store's orders.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="h-10 border-[#babfc3] font-bold uppercase tracking-widest text-[10px] w-full sm:w-auto">Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2 uppercase tracking-widest text-[#5c5f62]">
              <ShoppingBag className="h-3.5 w-3.5" /> Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">
              {`C$${formatCurrency(stats.revenue)}`}
            </div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Gross Archive Revenue</p>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2 uppercase tracking-widest text-[#5c5f62]">
              <Clock className="h-3.5 w-3.5" /> Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pending}
            </div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Awaiting studio dispatch</p>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2 uppercase tracking-widest text-[#5c5f62]">
              <RotateCcw className="h-3.5 w-3.5" /> Returned Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.returned}
            </div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Archival re-integrations</p>
          </CardContent>
        </Card>

        <Card className="border-[#e1e3e5] shadow-none rounded-none group hover:border-black transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2 uppercase tracking-widest text-[#5c5f62]">
              <CheckCircle2 className="h-3.5 w-3.5" /> Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">
              {stats.total}
            </div>
            <p className="text-[9px] uppercase font-bold text-[#8c9196] mt-1">Total transaction volume</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-none overflow-hidden shadow-sm">
        {selectedIds.length > 0 && (
          <div className="p-4 border-b bg-blue-50/20 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white rounded-none uppercase text-[9px] font-bold px-2 h-5 border-none">Selection Manifest</Badge>
                <span className="text-[10px] font-bold uppercase text-blue-700">{selectedIds.length} Orders Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsBulkStatusOpen(true)}
                  className="h-9 border-blue-200 text-blue-700 font-bold uppercase tracking-widest text-[9px] gap-2 bg-white hover:bg-blue-50"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit Status
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                  className="h-9 border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase tracking-widest text-[9px] gap-2"
                >
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Purge
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])} className="h-9 w-9 text-blue-400 hover:text-blue-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="p-4 border-b bg-gray-50/50 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]"/>
            <Input
              placeholder="Quick search orders..."
              className="pl-10 h-10 border-[#e1e3e5] bg-white text-[10px] font-bold uppercase tracking-widest rounded-none"
              value={searchQuery}
              onChange={(e)=>setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-[200px] h-10 border-[#e1e3e5] bg-white text-[10px] font-bold uppercase tracking-widest rounded-none">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-[#8c9196]"/>
                <span>{statusFilter === 'all' ? 'All Status' : statusFilter.replace('_', ' ').toUpperCase()}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="uppercase text-[10px] font-bold">All Orders</SelectItem>
              <SelectItem value="awaiting_processing" className="uppercase text-[10px] font-bold">Awaiting Processing</SelectItem>
              <SelectItem value="processing" className="uppercase text-[10px] font-bold">Processing</SelectItem>
              <SelectItem value="ready_for_pickup" className="uppercase text-[10px] font-bold">Pick up</SelectItem>
              <SelectItem value="shipped" className="uppercase text-[10px] font-bold">Shipped</SelectItem>
              <SelectItem value="delivered" className="uppercase text-[10px] font-bold">Delivered</SelectItem>
              <SelectItem value="canceled" className="uppercase text-[10px] font-bold">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-[#f6f6f7]">
              <TableRow className="border-[#e1e3e5] hover:bg-transparent">
                <TableHead className="w-[40px] px-4">
                  <Checkbox 
                    checked={isAllFilteredSelected ? true : isSomeFilteredSelected ? "indeterminate" : false} 
                    onCheckedChange={handleSelectAll} 
                  />
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62] py-4 w-[35%]">Archival Selection (Manifest)</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Transaction ID</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Participant</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Fulfillment</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Financials</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300"/>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : filteredOrders.map((order: any) => {
                const totalUnits = order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0;
                const isSelected = selectedIds.includes(order.id);

                return (
                  <TableRow
                    key={order.id}
                    className={cn(
                      "cursor-pointer border-[#e1e3e5] group transition-colors",
                      isSelected ? "bg-blue-50/30" : "hover:bg-[#f6f6f7]/50"
                    )}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={(checked) => handleToggleSelect(order.id, checked)} 
                      />
                    </TableCell>
                    <TableCell className="align-top py-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          {!order.viewed && <Badge className="bg-red-600 text-white rounded-none uppercase text-[8px] font-bold px-1.5 h-4 border-none animate-pulse">NEW</Badge>}
                          <Badge variant="outline" className="bg-black text-white text-[8px] font-bold px-1.5 h-4 border-none">{totalUnits} PIECES</Badge>
                          {order.note && <Badge className="bg-amber-50 text-amber-700 border-none text-[8px] font-bold uppercase"><MessageSquare className="h-2 w-2 mr-1" /> NOTE</Badge>}
                        </div>
                        <div className="space-y-3">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-14 h-14 bg-gray-100 rounded-none border overflow-hidden shrink-0 relative">
                                {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] text-gray-400 uppercase font-bold">SIZE: {item.size} • QTY: {item.quantity}</p>
                                <p className="text-[10px] font-bold uppercase line-clamp-2 leading-tight">{item.name}</p>
                                {(item.customName || item.customNumber || item.specialNote) && (
                                  <div className="mt-1 pl-2 border-l-2 border-blue-100 space-y-0.5">
                                    {(item.customName || item.customNumber) && (
                                      <p className="text-[8px] font-bold text-blue-600 uppercase flex items-center gap-1">
                                        <Sparkles className="h-2 w-2" /> {item.customName} {item.customNumber && `#${item.customNumber}`}
                                      </p>
                                    )}
                                    {item.specialNote && (
                                      <p className="text-[8px] text-gray-400 italic">"{item.specialNote}"</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.note && (
                          <div className="p-2 bg-amber-50/50 border border-amber-100 rounded-none text-[9px] font-medium italic text-amber-900 leading-tight uppercase">
                            "{order.note}"
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-6">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono font-bold text-primary uppercase">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1.5">
                          <Clock className="h-2.5 w-2.5" /> {formatDate(order.createdAt)}
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1.5 pt-1">
                          {order.deliveryMethod === 'shipping' ? <Truck className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
                          {order.deliveryMethod?.toUpperCase()} {order.courier ? `• ${order.courier.toUpperCase()}` : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-6">
                      <div className="space-y-1">
                        <div className="text-xs font-bold uppercase tracking-tight text-primary">
                          {order.customer?.name || 'Guest Customer'}
                        </div>
                        <div className="text-[9px] text-gray-400 flex gap-1.5 items-center lowercase font-medium">
                          <Mail className="h-2.5 w-2.5"/> {order.email}
                        </div>
                        <div className="text-[9px] text-gray-400 flex gap-1.5 items-center font-mono mt-0.5">
                          <Phone className="h-2.5 w-2.5"/> {order.customer?.phone || 'NO-PHONE'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-6">
                      <div className="space-y-2">
                        {getStatusBadge(order.status)}
                        {order.trackingNumber && (
                          <div className="text-[8px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-none border border-blue-100 w-fit">
                            ID: {order.trackingNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top py-6">
                      <div className="flex flex-col items-end gap-2">
                        <div className="font-bold text-base text-primary tracking-tighter">
                          {`C$${formatCurrency(Number(order.total)||0)}`}
                        </div>
                        {getPaymentStatusBadge(order.paymentStatus || 'awaiting_payment')}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-6">
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors"/>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300"/></div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-bold tracking-widest">No orders manifesting.</div>
          ) : filteredOrders.map((order: any) => {
            const isSelected = selectedIds.includes(order.id);
            return (
              <div 
                key={order.id} 
                className={cn(
                  "p-4 space-y-4 transition-colors cursor-pointer relative",
                  isSelected ? "bg-blue-50/30" : "hover:bg-gray-50"
                )}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <div className="absolute left-2 top-4 z-10" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={(checked) => handleToggleSelect(order.id, checked)} 
                  />
                </div>
                <div className="pl-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!order.viewed && <Badge className="bg-red-600 text-white rounded-none uppercase text-[7px] font-bold px-1.5 h-3.5 border-none animate-pulse">NEW</Badge>}
                        <div className="text-[10px] font-mono font-bold text-primary uppercase">#{order.id.substring(0,8)}</div>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{formatDate(order.createdAt)}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        {(order.items || []).slice(0,3).map((item:any, i:number) => (
                          <div key={i} className="w-14 h-14 bg-gray-100 border-2 border-white rounded-sm overflow-hidden shadow-sm relative">
                            {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold uppercase truncate max-w-[120px]">{order.customer?.name || 'Guest Piece'}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{(order.items || []).length} ARCHIVE ITEMS</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold text-primary">{`C$${formatCurrency(Number(order.total) || 0)}`}</div>
                      {getPaymentStatusBadge(order.paymentStatus || 'awaiting_payment')}
                    </div>
                  </div>

                  {/* Item Manifest with Customizations */}
                  <div className="space-y-3 pt-3 border-t border-dashed mt-4">
                    {(order.items || []).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">SIZE: {item.size} • QTY: {item.quantity}</p>
                          <p className="text-[10px] font-bold uppercase leading-tight line-clamp-2">{item.name}</p>
                          {(item.customName || item.customNumber || item.specialNote) && (
                            <div className="flex flex-col gap-1 mt-1.5 pl-2 border-l-2 border-blue-100">
                              {(item.customName || item.customNumber) && (
                                <p className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1.5">
                                  <Sparkles className="h-2.5 w-2.5" /> {item.customName} {item.customNumber && `#${item.customNumber}`}
                                </p>
                              )}
                              {item.specialNote && (
                                <p className="text-[9px] text-gray-500 italic leading-snug">"{item.specialNote}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Forensic Details Manifest */}
                  <div className="flex flex-col gap-2 border-t pt-3 mt-4">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      <Mail className="h-3 w-3" /> {order.email}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      <Phone className="h-3 w-3" /> {order.customer?.phone || 'NO PHONE'}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      {order.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {order.deliveryMethod?.toUpperCase()} {order.courier ? `• ${order.courier.toUpperCase()}` : ''}
                    </div>
                  </div>

                  {/* Special Request Prompt */}
                  {order.note && (
                    <div className="p-3 bg-amber-50 border border-amber-100 mt-2 rounded-none">
                      <p className="text-[8px] font-bold uppercase text-amber-800 mb-1 flex items-center gap-1.5">
                        <MessageSquare className="h-2.5 w-2.5" /> Special Request
                      </p>
                      <p className="text-[10px] text-amber-900 font-medium italic">"{order.note}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isBulkStatusOpen} onOpenChange={setIsBulkStatusOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
          <DialogHeader className="pt-6">
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">Bulk Status Protocol</DialogTitle>
            <DialogDescription className="text-xs uppercase font-bold text-muted-foreground mt-1">
              Synchronize {selectedIds.length} orders to a new fulfillment state.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-gray-500">New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="h-12 uppercase font-bold text-[10px]">
                  <SelectValue placeholder="SELECT STATUS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awaiting_processing" className="uppercase text-[10px] font-bold">Awaiting Processing</SelectItem>
                  <SelectItem value="processing" className="uppercase text-[10px] font-bold">Processing</SelectItem>
                  <SelectItem value="ready_for_pickup" className="uppercase text-[10px] font-bold">Pick up</SelectItem>
                  <SelectItem value="shipped" className="uppercase text-[10px] font-bold">Shipped</SelectItem>
                  <SelectItem value="delivered" className="uppercase text-[10px] font-bold">Delivered</SelectItem>
                  <SelectItem value="returned" className="uppercase text-[10px] font-bold">Returned</SelectItem>
                  <SelectItem value="canceled" className="uppercase text-[10px] font-bold">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleBulkStatusUpdate} 
              disabled={isProcessing || !bulkStatus} 
              className="w-full bg-black text-white h-14 font-bold uppercase tracking-widest text-[10px]"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Synchronize {selectedIds.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
