
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
  Tag,
  Ruler,
  Globe,
  Share2,
  RefreshCw,
  BarChart
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const auth = useAuth();

  const handleLogin = () => {
    if (auth) {
      signInWithPopup(auth, new GoogleAuthProvider());
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f6f7]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Initializing FSLNO Admin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f6f7] p-4 text-center">
        <div className="w-12 h-12 bg-black rounded flex items-center justify-center text-white font-bold text-xl mb-6">F</div>
        <h1 className="text-2xl font-headline font-bold mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">Authentication required to access the FSLNO Admin Command Center.</p>
        <Button onClick={handleLogin} className="bg-black text-white px-8 h-12 font-bold uppercase tracking-widest">
          Sign in with Google
        </Button>
      </div>
    );
  }

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
                  <SidebarMenuButton asChild tooltip="Bundle Builder: Create 'Spot Closing' sets (e.g., Hoodie + Matching Sweatpants) with a single click. SEO Automation: Auto-generate Google-friendly Meta Titles and Descriptions based on the product name and category. Pre-Order Toggle: For 'Drops,' allow customers to buy before the stock arrives, with a countdown timer pulled from the drop_date in Firestore.">
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
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Domain Name & Site Address: The primary URL for your store (e.g., fslno.com). Connect a custom domain and ensure all traffic is directed to the secure https version. Header Meta Tags & Site Verification: A central hub to inject custom code into the <head> of your site. Sitemap: An automatically generated sitemap.xml file that lists every product, category, and page. Allow Search Engines to Index: A master 'Visibility Toggle' for public vs. maintenance mode.">
                    <Link href="/admin/domain">
                      <Globe />
                      <span>Domain</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="SEO">
                    <Link href="/admin/seo">
                      <Search />
                      <span>SEO</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Sales Channels</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Merchant API (V1) Integration: On-Demand Updates pushes price or stock changes to Google in minutes. Partial Sync allows updating specific attributes without re-sending the entire catalog. Google Product Studio provides AI enhancement to remove backgrounds. YouTube Shopping enables product tagging in videos. Local Inventory Ads sync physical stock for localized results.">
                    <Link href="/admin/sales-channels/google">
                      <RefreshCw />
                      <span>Google Sync</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="TikTok Shop Seller API: In-App Checkout allows purchases without leaving TikTok. Affiliate Management tracks samples and creator-led sales. Meta Conversions API (CAPI): Server-to-Server Tracking bypasses ad-blockers for direct 'Purchase' data. Event Match Quality (EMQ) sends hashed data to optimize targeting. Instagram Shopping: Real-time sync of Bento Grid categories into shoppable Reels.">
                    <Link href="/admin/sales-channels/social">
                      <Share2 />
                      <span>Social Commerce</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="GA4 Analytics: Automatically track 'Add to Cart', 'Begin Checkout', and 'Purchase' events to optimize Google Ads and marketing conversion data.">
                    <Link href="/admin/sales-channels/analytics">
                      <BarChart />
                      <span>Analytics (GA4)</span>
                    </Link>
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
                <img src={user.photoURL || `https://picsum.photos/seed/admin/40/40`} alt="Admin" />
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
