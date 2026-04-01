'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
  X,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  LayoutList,
  List
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
import { useUser, useFirestore, useCollection, useMemoFirebase, useIsAdmin } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit as firestoreLimit, 
  startAfter, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

/**
 * Reconstructed Orders Page
 * Features absolute zero blocking loaders (Skeletons/Inline spinners) and fully clickable rows.
 */
export default function OrdersPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const db = useFirestore();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  // 1. Data Fetching & State
  const [orders, setOrders] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const INITIAL_BATCH = 25;

  const fetchOrders = async (isInitial = false) => {
    if (!db || isQueryLoading || (!hasMore && !isInitial)) return;
    
    setIsQueryLoading(true);
    try {
      let q = query(
        collection(db, 'orders'), 
        orderBy('createdAt', 'desc'), 
        firestoreLimit(INITIAL_BATCH)
      );
      
      if (!isInitial && lastDoc) {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), startAfter(lastDoc), firestoreLimit(INITIAL_BATCH));
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      if (isInitial) {
        setOrders(fetched);
      } else {
        setOrders(prev => [...prev, ...fetched]);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === INITIAL_BATCH);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      toast({
        title: "FETCH ERROR",
        description: "Failed to sync archive records.",
        variant: "destructive"
      });
    } finally {
      setIsQueryLoading(false);
    }
  };

  useEffect(() => {
    if (db) fetchOrders(true);
  }, [db]);

  // Handle individual status update (Optimistic)
  const updateOrderStatus = async (orderId: string, updates: any) => {
    if (!db) return;
    // 1. Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    
    // 2. Persist to Firestore
    try {
      await updateDoc(doc(db, 'orders', orderId), updates);
      toast({
        title: "ORDER UPDATED",
        description: `Successfully modified record #${orderId.slice(0, 8)}`,
      });
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  // 2. UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<'status' | 'paymentStatus'>('status');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const lastSelectedId = React.useRef<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.toLowerCase());
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // 3. Logic & Filtering
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.filter((order: any) => {
      const lowerSearch = debouncedSearch;
      const matchesSearch = !lowerSearch ||
                           order.id?.toLowerCase().includes(lowerSearch) ||
                           order.email?.toLowerCase().includes(lowerSearch) ||
                           order.customer?.name?.toLowerCase().includes(lowerSearch) ||
                           order.items?.some((item: any) => item.name?.toLowerCase().includes(lowerSearch));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let revenue = 0;
    let returned = 0;

    if (!orders) return { total, pending, revenue, returned };

    for (const order of orders) {
      total++;
      if (['awaiting_processing', 'processing', 'ready_for_pickup', 'confirmed', 'pending'].includes(order.status)) {
        pending++;
      }
      if (order.status === 'returned') returned++;
      revenue += (Number(order.total) || 0);
    }

    return { total, pending, revenue, returned };
  }, [orders]);

  // Actions
  const handleToggleSelect = (id: string, checked: boolean | "indeterminate", isShiftKey = false) => {
    if (checked === true) {
      if (isShiftKey && lastSelectedId.current) {
        const orderIds = filteredOrders.map(o => o.id);
        const lastIndex = orderIds.indexOf(lastSelectedId.current);
        const currentIndex = orderIds.indexOf(id);
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const batch = orderIds.slice(start, end + 1);
        setSelectedIds(prev => Array.from(new Set([...prev, ...batch])));
      } else {
        setSelectedIds(prev => [...prev, id]);
        lastSelectedId.current = id;
      }
    } else {
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      lastSelectedId.current = null;
    }
  };

  const handleBulkUpdate = async () => {
    if (!db || selectedIds.length === 0 || !bulkEditValue) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'orders', id), { 
          [bulkEditField]: bulkEditValue,
          updatedAt: serverTimestamp() 
        });
      });
      await batch.commit();
      
      const updates = { [bulkEditField]: bulkEditValue, updatedAt: new Date() };
      setOrders(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, ...updates } : o));

      toast({ 
        title: "Bulk Update Successful", 
        description: `${selectedIds.length} orders updated for field ${bulkEditField}.` 
      });
      setSelectedIds([]);
      setIsBulkEditOpen(false);
      setBulkEditValue('');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Bulk update failed." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = idToDelete ? [idToDelete] : selectedIds;
    if (!db || ids.length === 0) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, 'orders', id));
      });
      await batch.commit();

      setOrders(prev => prev.filter(o => !ids.includes(o.id)));

      toast({ 
        title: "Delete Successful", 
        description: `${ids.length} order${ids.length > 1 ? 's were' : ' was'} permanently removed.` 
      });
      if (idToDelete) setIdToDelete(null);
      else setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete orders." });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '–';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    switch (s) {
      case 'delivered':
        return <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-black uppercase tracking-widest px-2 h-5">DELIVERED</Badge>;
      case 'processing':
      case 'awaiting_processing':
        return <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-black uppercase tracking-widest px-2 h-5">PROCESSING</Badge>;
      case 'shipped':
        return <Badge className="bg-indigo-50 text-indigo-700 border-none text-[8px] font-black uppercase tracking-widest px-2 h-5">SHIPPED</Badge>;
      case 'ready_for_pickup':
        return <Badge className="bg-orange-50 text-orange-700 border-none text-[8px] font-black uppercase tracking-widest px-2 h-5">PICKUP READY</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge className="bg-red-50 text-red-700 border-none text-[8px] font-black uppercase tracking-widest px-2 h-5">CANCELLED</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-none text-[8px] font-black uppercase tracking-widest px-2 h-5">{s.replace('_', ' ')}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'awaiting';
    if (s === 'paid' || s === 'succeeded') 
      return <Badge className="bg-emerald-500 text-white border-none text-[7px] font-black uppercase tracking-widest px-1.5 h-4">PAID</Badge>;
    return <Badge className="bg-amber-500 text-white border-none text-[7px] font-black uppercase tracking-widest px-1.5 h-4">AWAITING</Badge>;
  };

  // 4. Render
  if (!hasMounted) return null;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white border border-[#e1e3e5]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-headline font-bold uppercase tracking-tight mb-2">Unauthorized Access</h2>
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-6">Security protocols prevent unauthorized data access.</p>
        <Button onClick={() => router.push('/admin')} variant="outline" className="border-black font-bold uppercase text-[10px] tracking-widest">Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section with Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-black uppercase tracking-tighter text-black">Orders List</h1>
          <p className="text-[10px] uppercase font-bold text-[#8c9196] tracking-[0.2em] flex items-center gap-2">
            <Clock className="h-3 w-3" /> LIVE UPDATE: {new Date().toLocaleTimeString().toUpperCase()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="bg-black text-white h-11 px-6 font-bold uppercase text-[10px] tracking-widest rounded-none shadow-lg hover:scale-105 transition-all"
                >
                  Bulk Actions ({selectedIds.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-none border-[#e1e3e5] min-w-[200px]">
                <DropdownMenuLabel className="text-[9px] font-black uppercase text-gray-400 p-3">Manage Selection</DropdownMenuLabel>
                <DropdownMenuItem 
                  className="text-[10px] font-bold uppercase p-3 cursor-pointer"
                  onClick={() => {
                    setBulkEditField('status');
                    setBulkEditValue('');
                    setIsBulkEditOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5 mr-2" /> Update status
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-[10px] font-bold uppercase p-3 cursor-pointer"
                  onClick={() => {
                    setBulkEditField('paymentStatus');
                    setBulkEditValue('');
                    setIsBulkEditOpen(true);
                  }}
                >
                  <DollarSign className="h-3.5 w-3.5 mr-2" /> Update payment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-[10px] font-bold uppercase p-3 cursor-pointer text-red-600 focus:text-red-700"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" className="border-[#e1e3e5] h-11 px-6 font-bold uppercase text-[10px] tracking-widest rounded-none bg-white">
            Export Orders
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: stats.total, icon: ShoppingBag, color: 'text-black' },
          { label: 'Pending Processing', value: stats.pending, icon: Clock, color: 'text-blue-600' },
          { label: 'Lifetime Revenue', value: `C$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600' },
          { label: 'Orders Returned', value: stats.returned, icon: RotateCcw, color: 'text-red-500' },
        ].map((stat, i) => (
          <Card key={i} className="border-[#e1e3e5] shadow-none rounded-none bg-gray-50/30 overflow-hidden relative group">
            <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <stat.icon className="h-24 w-24" />
            </div>
            <CardContent className="p-5 space-y-1">
              <p className="text-[9px] uppercase font-black tracking-widest text-[#8c9196]">{stat.label}</p>
              <p className={cn("text-xl sm:text-2xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table Card */}
      <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden bg-white">
        <div className="p-4 sm:p-6 border-b border-[#e1e3e5] bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
            <Input 
              placeholder="SEARCH BY ID, EMAIL, OR PARTICIPANT..." 
              className="pl-10 h-12 bg-white border-[#e1e3e5] rounded-none font-bold uppercase text-[10px] tracking-widest focus-visible:ring-black/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 w-full md:w-[220px] bg-white border-[#e1e3e5] rounded-none font-bold uppercase text-[10px] tracking-widest">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue placeholder="STATUS FILTER" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#e1e3e5]">
                <SelectItem value="all" className="text-[10px] font-bold uppercase">All Statuses</SelectItem>
                <SelectItem value="awaiting_processing" className="text-[10px] font-bold uppercase">Awaiting Processing</SelectItem>
                <SelectItem value="processing" className="text-[10px] font-bold uppercase">Processing</SelectItem>
                <SelectItem value="shipped" className="text-[10px] font-bold uppercase">Shipped</SelectItem>
                <SelectItem value="delivered" className="text-[10px] font-bold uppercase">Delivered</SelectItem>
                <SelectItem value="returned" className="text-[10px] font-bold uppercase">Returned</SelectItem>
                <SelectItem value="cancelled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex bg-white border border-[#e1e3e5] p-1 gap-1">
              <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('compact')}
                className={cn(
                  "h-10 w-10 rounded-none transition-all",
                  viewMode === 'compact' ? "bg-black text-white" : "text-[#8c9196] hover:bg-gray-100"
                )}
                title="Compact View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'expanded' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('expanded')}
                className={cn(
                  "h-10 w-10 rounded-none transition-all",
                  viewMode === 'expanded' ? "bg-black text-white" : "text-[#8c9196] hover:bg-gray-100"
                )}
                title="Expanded View"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-[#e1e3e5]">
                  <TableHead className="w-[50px] px-6">
                    <Checkbox 
                      checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(filteredOrders.map(o => o.id));
                        else setSelectedIds([]);
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62] py-4">Participant & Items</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Order Hash</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Order Status</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest text-[#5c5f62]">Financials</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isQueryLoading && filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Package className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Archive Empty or Filtered Out</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.map((order: any) => (
                  <TableRow 
                    key={order.id} 
                    className={cn(
                      "group border-[#e1e3e5] transition-all duration-200 cursor-pointer",
                      selectedIds.includes(order.id) ? "bg-blue-50/30" : "hover:bg-gray-50/80"
                    )}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.includes(order.id)} 
                        onCheckedChange={(checked) => handleToggleSelect(order.id, !!checked)} 
                      />
                    </TableCell>
                    <TableCell className="py-6 align-top">
                      <div className="flex flex-col gap-6">
                        {/* Customer Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-black uppercase tracking-tight text-black">
                              {order.customer?.name || 'Guest Participant'}
                            </p>
                            {!order.viewed && (
                              <Badge className="bg-red-600 text-white text-[7px] font-black tracking-tighter px-2 h-4 border-none rounded-none animate-pulse">NEW</Badge>
                            )}
                          </div>
                          
                          {viewMode === 'expanded' && (
                            <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                              {order.customer?.phone && (
                                <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1.5 drop-shadow-sm">
                                  <Phone className="h-3 w-3 text-emerald-600" /> {order.customer.phone}
                                </p>
                              )}
                              {(() => {
                                const address = order.customer?.shipping || order.customer?.billing;
                                if (!address) return null;
                                return (
                                  <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1.5 leading-tight">
                                    <MapPin className="h-3 w-3 text-blue-600" /> 
                                    {address.address}, {address.city}, {address.postalCode}
                                  </p>
                                );
                              })()}
                              {order.email && (
                                <p className="text-[9px] font-medium text-gray-400 lowercase flex items-center gap-1.5">
                                  <Mail className="h-2.5 w-2.5" /> {order.email}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                          {/* Compact Items Summary - UPDATED */}
                          {viewMode === 'compact' && (
                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                              <div className="flex items-center gap-1.5 overflow-hidden p-1 bg-gray-50/50 border border-dashed border-gray-200">
                                {(order.items || []).slice(0, 4).map((item: any, i: number) => (
                                  <div 
                                    key={i} 
                                    className="w-12 h-12 rounded-none border border-white bg-white shrink-0 relative shadow-sm overflow-hidden group/thumb"
                                  >
                                    {item.image ? (
                                      <Image 
                                        src={item.image} 
                                        alt={item.name} 
                                        fill 
                                        sizes="48px"
                                        className="object-cover group-hover/thumb:scale-110 transition-transform duration-300" 
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <Package className="h-4 w-4 text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {(order.items || []).length > 4 && (
                                  <div className="w-12 h-12 bg-gray-100 border border-white flex items-center justify-center z-0 shadow-sm">
                                    <span className="text-[10px] font-black text-gray-400">+{(order.items || []).length - 4}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <Badge className="bg-black text-white border-none text-[9px] font-black uppercase tracking-tighter px-2 h-5 rounded-none w-fit">
                                  {(order.items || []).length} {(order.items || []).length === 1 ? 'ITEM' : 'ITEMS'}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {/* Detailed Items List - Conditional */}
                          {viewMode === 'expanded' && (
                            <div className="space-y-3 bg-gray-50/50 p-3 border border-dashed border-gray-200 animate-in slide-in-from-top-2 duration-300">
                              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 border-b border-gray-200 pb-1 flex justify-between items-center">
                                <span>Order Items ({(order.items || []).length})</span>
                                <Package className="h-2.5 w-2.5" />
                              </p>
                              {(order.items || []).map((item: any, i: number) => (
                                <div key={i} className="flex gap-4 items-start group/item">
                                  <div className="w-12 h-12 bg-white shrink-0 border border-gray-200 shadow-sm relative overflow-hidden">
                                    {item.image && (
                                      <Image 
                                        src={item.image} 
                                        alt={item.name} 
                                        fill 
                                        sizes="48px"
                                        className="object-cover group-hover/item:scale-110 transition-transform duration-300" 
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                                    <p className="text-[11px] font-black uppercase text-black truncate leading-tight">{item.name}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                      <span className="text-[9px] font-black text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded-sm">Size: {item.size || 'N/A'}</span>
                                      {(item.customName || item.customNumber) && (
                                        <span className="text-[9px] font-black text-blue-700 uppercase bg-blue-50 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                                          <Sparkles className="h-2.5 w-2.5" /> {item.customName} {item.customNumber && `#${item.customNumber}`}
                                        </span>
                                      )}
                                      {item.quantity > 1 && (
                                        <span className="text-[9px] font-black text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Qty: {item.quantity}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono font-bold text-black uppercase">#{order.id.slice(-8).toUpperCase()}</div>
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar className="h-2.5 w-2.5" /> {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="cursor-pointer hover:opacity-80 transition-opacity">
                              {getStatusBadge(order.status)}
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-none border-[#e1e3e5] min-w-[180px]">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase text-gray-400 p-3">Update Status</DropdownMenuLabel>
                            {[
                              { label: 'Processing', value: 'processing' },
                              { label: 'Shipped', value: 'shipped' },
                              { label: 'Ready for Pickup', value: 'ready_for_pickup' },
                              { label: 'Delivered', value: 'delivered' },
                              { label: 'Cancelled', value: 'cancelled' },
                            ].map((opt) => (
                              <DropdownMenuItem 
                                key={opt.value}
                                className={cn(
                                  "text-[10px] font-bold uppercase p-3 cursor-pointer",
                                  order.status === opt.value && "bg-gray-50 text-black"
                                )}
                                onClick={() => updateOrderStatus(order.id, { status: opt.value, updatedAt: serverTimestamp() })}
                              >
                                {opt.label}
                                {order.status === opt.value && <CheckCircle2 className="h-3 w-3 ml-auto text-emerald-500" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex items-center gap-1.5 opacity-50">
                          {order.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          <span className="text-[8px] font-black uppercase tracking-tighter">{order.deliveryMethod || 'STANDBY'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                       <div className="space-y-1.5">
                         <div className="text-sm font-black tracking-tighter text-black">C${Number(order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <div className="cursor-pointer hover:opacity-80 transition-opacity w-fit">
                               {getPaymentStatusBadge(order.paymentStatus)}
                             </div>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent className="rounded-none border-[#e1e3e5] min-w-[150px] z-50">
                             <DropdownMenuLabel className="text-[9px] font-black uppercase text-gray-400 p-3">Payment State</DropdownMenuLabel>
                             <DropdownMenuItem className="text-[10px] font-bold uppercase p-3 cursor-pointer" onClick={() => updateOrderStatus(order.id, { paymentStatus: 'paid' })}>Mark as Paid</DropdownMenuItem>
                             <DropdownMenuItem className="text-[10px] font-bold uppercase p-3 cursor-pointer" onClick={() => updateOrderStatus(order.id, { paymentStatus: 'awaiting_payment' })}>Awaiting Payment</DropdownMenuItem>
                             <DropdownMenuItem className="text-[10px] font-bold uppercase p-3 cursor-pointer" onClick={() => updateOrderStatus(order.id, { paymentStatus: 'refunded' })}>Refunded</DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors rounded-none opacity-0 group-hover:opacity-100"
                           onClick={(e) => {
                             e.stopPropagation();
                             setIdToDelete(order.id);
                             setIsBulkDeleteOpen(true);
                           }}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                         <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-black transition-colors" />
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMore && (
              <div className="p-6 text-center">
                <Button variant="outline" onClick={() => fetchOrders()} disabled={isQueryLoading}>
                  {isQueryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More"}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-[#e1e3e5]">
            {filteredOrders.map((order: any) => (
              <div 
                key={order.id} 
                className={cn(
                  "p-5 relative transition-colors cursor-pointer",
                  selectedIds.includes(order.id) ? "bg-blue-50/30" : "hover:bg-gray-50 active:bg-gray-100"
                )}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <div className="absolute left-1 top-5 z-20" onClick={(e) => e.stopPropagation()}>
                   <Checkbox 
                     checked={selectedIds.includes(order.id)} 
                     onCheckedChange={(checked) => handleToggleSelect(order.id, !!checked)} 
                   />
                </div>
                
                <div className="pl-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono font-bold text-black uppercase flex items-center gap-2">
                        #{order.id.slice(-8).toUpperCase()}
                        {!order.viewed && <Badge className="bg-red-600 text-white text-[7px] font-black px-1 h-3.5 rounded-none border-none">NEW</Badge>}
                      </div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600 active:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIdToDelete(order.id);
                          setIsBulkDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                     {/* Mobile Customer Info */}
                     <div className="min-w-0">
                        <p className="text-[13px] font-black uppercase text-black leading-tight mb-1">{order.customer?.name || 'Guest Participant'}</p>
                        {viewMode === 'expanded' && (
                          <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            {order.customer?.phone && <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1"><Phone className="h-3 w-3 text-emerald-600" /> {order.customer.phone}</p>}
                            {(() => {
                              const address = order.customer?.shipping || order.customer?.billing;
                              if (!address) return null;
                              return (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.address}, ${address.city}, ${address.province || ''}`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-gray-700 flex items-center gap-1 hover:text-blue-600 transition-colors"
                                >
                                  <MapPin className="h-3 w-3 text-blue-600" /> {address.address}, {address.city}
                                </a>
                              );
                            })()}
                          </div>
                        )}
                     </div>

                     {/* Mobile Compact Item Summary - UPDATED */}
                     {viewMode === 'compact' && (
                        <div className="flex flex-col gap-3 bg-gray-50/80 p-3 border border-dashed border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                           {(order.items || []).length > 5 && (
                             <div className="w-12 h-12 bg-gray-100 border border-white flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm shrink-0">
                               +{(order.items || []).length - 5}
                             </div>
                           )}
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest bg-white px-2 py-1 border border-gray-100 shadow-sm">
                              {(order.items || []).length} ITEMS
                            </p>
                          </div>
                        </div>
                     )}

                     {/* Mobile Item List - Conditional */}
                     {viewMode === 'expanded' && (
                        <div className="space-y-3 bg-gray-50 p-3 border border-[#e1e3e5] animate-in zoom-in-95 duration-200">
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2 border-b pb-1">Items List</p>
                          {(order.items || []).map((item: any, i: number) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className="w-10 h-10 bg-white shrink-0 border border-gray-200 shadow-xs relative overflow-hidden">
                                {item.image && (
                                  <Image 
                                    src={item.image} 
                                    alt={item.name} 
                                    fill 
                                    sizes="48px"
                                    className="object-cover" 
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black uppercase text-black truncate leading-tight">{item.name}</p>
                                <div className="flex flex-wrap gap-x-2 mt-0.5">
                                  <span className="text-[8px] font-black text-gray-500 uppercase">Size: {item.size || 'N/A'}</span>
                                  {(item.customName || item.customNumber) && (
                                    <span className="text-[8px] font-black text-blue-600 uppercase flex items-center gap-1">✦ {item.customName} {item.customNumber}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                     )}
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-dashed border-[#e1e3e5]">
                     <div className="flex items-center gap-2">
                       {order.deliveryMethod === 'shipping' ? <Truck className="h-3 w-3 text-gray-400" /> : <MapPin className="h-3 w-3 text-gray-400" />}
                       <span className="text-[8px] font-black uppercase tracking-tighter text-gray-500">{order.deliveryMethod || 'STANDBY'}</span>
                     </div>
                     <div className="text-right">
                       <div className="text-[13px] font-black text-black">C${Number(order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                       {getPaymentStatusBadge(order.paymentStatus)}
                     </div>
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="p-6 text-center">
                <Button variant="outline" onClick={() => fetchOrders()} disabled={isQueryLoading}>
                  {isQueryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>

    {/* Bulk Edit Dialog */}
    <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
      <DialogContent className="max-w-[400px] bg-white border-none rounded-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-xl font-headline font-black uppercase tracking-tighter">
            Bulk {bulkEditField === 'status' ? 'Status' : 'Payment'} Update
          </DialogTitle>
          <DialogDescription className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">
            Updating {selectedIds.length} orders across the archive.
          </DialogDescription>
        </DialogHeader>
        <div className="p-8 pt-0 space-y-6">
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-500">
              Select New {bulkEditField === 'status' ? 'Status' : 'Payment State'}
            </Label>
            <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
              <SelectTrigger className="h-12 rounded-none border-[#e1e3e5] font-bold uppercase text-[10px] tracking-widest">
                <SelectValue placeholder="CHOOSE VALUE..." />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#e1e3e5]">
                {bulkEditField === 'status' ? (
                  <>
                    <SelectItem value="processing" className="text-[10px] font-bold uppercase">Processing</SelectItem>
                    <SelectItem value="shipped" className="text-[10px] font-bold uppercase">Shipped</SelectItem>
                    <SelectItem value="ready_for_pickup" className="text-[10px] font-bold uppercase">Ready for Pickup</SelectItem>
                    <SelectItem value="delivered" className="text-[10px] font-bold uppercase">Delivered</SelectItem>
                    <SelectItem value="cancelled" className="text-[10px] font-bold uppercase">Cancelled</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="paid" className="text-[10px] font-bold uppercase">Mark as Paid</SelectItem>
                    <SelectItem value="awaiting_payment" className="text-[10px] font-bold uppercase">Awaiting payment</SelectItem>
                    <SelectItem value="refunded" className="text-[10px] font-bold uppercase">Refunded</SelectItem>
                    <SelectItem value="canceled" className="text-[10px] font-bold uppercase">Canceled</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleBulkUpdate} 
            disabled={isProcessing || !bulkEditValue}
            className="w-full h-14 bg-black text-white hover:bg-black/90 font-black uppercase tracking-[0.2em] text-[10px] rounded-none shadow-xl transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : null}
            Apply Bulk Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>

     {/* Delete Confirm */}
    <AlertDialog open={isBulkDeleteOpen} onOpenChange={(open) => {
      setIsBulkDeleteOpen(open);
      if (!open) setIdToDelete(null);
    }}>
      <AlertDialogContent className="rounded-none bg-white border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-headline font-black uppercase tracking-tighter">
            {idToDelete ? 'Delete Order' : 'Confirm Bulk Deletion'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[10px] uppercase font-bold text-gray-600 tracking-widest leading-relaxed">
            {idToDelete ? (
               <>You are about to permanently delete order <span className="text-red-600 font-black">#{idToDelete.slice(-8).toUpperCase()}</span>.</>
            ) : (
               <>You are about to permanently delete <span className="text-red-600 font-black">{selectedIds.length} orders</span>.</>
            )}
            <br />This action is irreversible and will remove all audit trails.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex gap-3">
          <AlertDialogCancel className="rounded-none border-gray-200 text-[10px] font-bold uppercase tracking-widest h-12 flex-1">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBulkDelete}
            disabled={isProcessing}
            className="rounded-none bg-red-600 text-white hover:bg-red-700 text-[10px] font-bold uppercase tracking-widest h-12 flex-1 shadow-lg"
          >
            {isProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />}
            Confirm Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
