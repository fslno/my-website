'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Settings, 
  Palette, 
  Truck, 
  CreditCard,
  BarChart3,
  Search,
  Bell,
  HelpCircle,
  Tag,
  Ruler
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f6f6f7]">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-[#e1e3e5] bg-white">
          <SidebarHeader className="h-16 flex items-center px-6 border-b border-[#e1e3e5]">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">F</div>
              <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">FSLNO Admin</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="py-4">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive tooltip="Home">
                    <Link href="/admin">
                      <LayoutDashboard />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Orders">
                    <Link href="/admin/orders">
                      <ShoppingBag />
                      <span>Orders</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Products">
                    <Link href="/admin/products">
                      <BarChart3 />
                      <span>Products</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Categories">
                    <Link href="/admin/categories">
                      <Tag />
                      <span>Categories</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Size Chart">
                    <Link href="/admin/size-chart">
                      <Ruler />
                      <span>Size Chart</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Customers">
                    <Link href="/admin/customers">
                      <Users />
                      <span>Customers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Store Management</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Theme Engine">
                    <Link href="/admin/theme">
                      <Palette />
                      <span>Theme Engine</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Shipping & Pickup">
                    <Link href="/admin/shipping">
                      <Truck />
                      <span>Shipping & Pickup</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Payments">
                    <Link href="/admin/payments">
                      <CreditCard />
                      <span>Payments</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-[#e1e3e5] p-4">
             <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Settings">
                    <Link href="/admin/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-[#e1e3e5] flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <SidebarTrigger />
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
                <input 
                  type="text" 
                  placeholder="Search admin..." 
                  className="w-full h-9 pl-10 pr-4 bg-[#f1f2f3] border-none rounded-md text-sm focus:ring-1 focus:ring-black outline-none" 
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-[#f1f2f3] rounded-md transition-colors">
                <Bell className="h-5 w-5 text-[#5c5f62]" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-200 border border-[#e1e3e5] overflow-hidden">
                <img src="https://picsum.photos/seed/admin/40/40" alt="Admin" />
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}