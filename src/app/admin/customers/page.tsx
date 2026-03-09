
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
  ChevronRight, 
  UserCircle,
  MoreHorizontal,
  Filter
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

export default function CustomersPage() {
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time subscription to the users archive
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: customers, isLoading } = useCollection(usersQuery);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(customer => {
      const search = searchQuery.toLowerCase();
      return (
        customer.displayName?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.id.toLowerCase().includes(search)
      );
    });
  }, [customers, searchQuery]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Archive Members</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage user profiles and monitor archival engagement in real-time.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-black text-white px-4 py-1.5 rounded-sm font-bold uppercase tracking-widest text-[10px]">
            {customers?.length || 0} Total Members
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Users className="h-3 w-3" /> New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">
              {customers?.filter(c => {
                const date = new Date(c.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length || 0}
            </div>
            <p className="text-xs text-[#8c9196] mt-1">Growth in the archive circle</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <UserCircle className="h-3 w-3" /> Registered Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{customers?.length || 0}</div>
            <p className="text-xs text-[#8c9196] mt-1">Verified archive participants</p>
          </CardContent>
        </Card>
        <Card className="border-[#e1e3e5] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-[#5c5f62] flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Last Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1c1e]">Today</div>
            <p className="text-xs text-[#8c9196] mt-1">Archive heartbeat status</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
            <Input 
              placeholder="Search by name, email or ID..." 
              className="pl-10 h-10 border-[#e1e3e5] focus:ring-black bg-white uppercase text-[10px] font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-10 border-[#e1e3e5] gap-2 font-bold uppercase tracking-widest text-[10px]">
            <Filter className="h-3.5 w-3.5" /> Advanced Filter
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow className="border-[#e1e3e5]">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62] py-4">Archive Member</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Contact Identification</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Archival Registration</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Engagement Tier</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-gray-400 font-medium uppercase text-[10px] tracking-widest">
                  No archive members match your search criteria.
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
                        <span className="text-sm font-bold uppercase tracking-tight">{customer.displayName || 'Unknown Member'}</span>
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
                      {customer.phoneNumber && (
                        <span className="text-[10px] text-gray-400 font-mono">{customer.phoneNumber}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                      <Calendar className="h-3 w-3" />
                      {formatDate(customer.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none uppercase text-[9px] font-bold">
                      Standard Archive
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
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer">View Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer">Order History</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs uppercase font-bold cursor-pointer text-red-600">Suspend Access</DropdownMenuItem>
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
