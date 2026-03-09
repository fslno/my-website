
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
                  <SidebarMenuButton asChild tooltip="Payments: * Apple/Google Pay: One-touch checkout integration. Klarna/Afterpay: Toggle for 'Buy Now, Pay Later' (essential for clothing stores).">
                    <Link href="/admin/payments">
                      <CreditCard />
                      <span>Payments</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Domain Name & Site Address The primary URL for your store (e.g., fslno.com). This section allows you to connect a custom domain and ensures all traffic is directed to the secure https version of your Next.js site. Header Meta Tags & Site Verification A central hub to inject custom code into the <head> of your site. This is where you paste verification strings for Google Search Console, Pinterest, and Facebook Business Manager to prove you own the domain. Sitemap An automatically generated sitemap.xml file that lists every product, category, and page on Fslno. It acts as a roadmap for Google’s crawlers to find and index your new clothing drops instantly. Allow Search Engines to Index Instant Site A master 'Visibility Toggle.' When ON, it tells Google and Bing that your store is live and ready to appear in search results. When OFF (Maintenance Mode), it hides your site while you are building or updating a 'Spot Closing' drop.">
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
                  <SidebarMenuButton asChild tooltip="Merchant API (V1) Integration: On-Demand Updates: Unlike standard feeds that update once a day, the API pushes price or stock changes to Google in minutes. Partial Sync: Only update the 'Price' or 'Availability' for a specific hoodie without re-sending your entire 500-item catalog. Google Product Studio: AI Enhancement: Integrated tools to remove backgrounds or upscale FSLNO lifestyle photos directly before they hit Google Shopping. YouTube Shopping: Product Tagging: Automatically syncs your FSLNO catalog so you can tag products in YouTube videos or during live streams. Local Inventory Ads: If you have a physical 'Spot' location, this tells Google users exactly what is in stock at that specific address.">
                    <Link href="/admin/sales-channels/google">
                      <RefreshCw />
                      <span>Google Sync</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Social Commerce Webhooks: TikTok & Instagram Access Tokens and Pixel ID management. Inventory Buffer: 'Safety Stock' feature to prevent overselling on social platforms by setting stock thresholds.">
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
