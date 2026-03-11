'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  BarChart,
  LogOut,
  Mail,
  Lock,
  TicketPercent,
  MailWarning,
  ShieldAlert,
  Menu as MenuIcon
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger,
  useSidebar 
} from '@/components/ui/sidebar';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';

/**
 * High-fidelity sidebar component that consumes the sidebar context
 * to handle auto-closing logic on navigation.
 */
function AppSidebar({ storeConfig }: { storeConfig: any }) {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const auth = useAuth();
  const { toast } = useToast();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "Admin session terminated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out.",
      });
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-[#e1e3e5] bg-white">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-[#e1e3e5] bg-white">
        <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm overflow-hidden relative">
            {storeConfig?.logoUrl ? (
              <Image src={storeConfig.logoUrl} alt="Logo" fill className="object-cover" />
            ) : (
              "F"
            )}
          </div>
          <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
            {storeConfig?.businessName || "FSLNO"} Studio
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-4 bg-white">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Home (Alt+D)" onClick={handleNavClick}>
                <Link href="/admin">
                  <LayoutDashboard />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Orders (Alt+O)" onClick={handleNavClick}>
                <Link href="/admin/orders">
                  <ShoppingBag />
                  <span>Orders</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Products (Alt+P)" onClick={handleNavClick}>
                <Link href="/admin/products">
                  <BarChart3 />
                  <span>Products</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Categories (Alt+C)" onClick={handleNavClick}>
                <Link href="/admin/categories">
                  <Tag />
                  <span>Categories</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Promotions (Alt+R)" onClick={handleNavClick}>
                <Link href="/admin/promotions">
                  <TicketPercent />
                  <span>Promotions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Size Chart (Alt+Z)" onClick={handleNavClick}>
                <Link href="/admin/size-chart">
                  <Ruler />
                  <span>Size Chart</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Customers (Alt+U)" onClick={handleNavClick}>
                <Link href="/admin/customers">
                  <Users />
                  <span>Customers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] uppercase tracking-widest font-bold">Store Management</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Theme Engine (Alt+T)" onClick={handleNavClick}>
                <Link href="/admin/theme">
                  <Palette />
                  <span>Theme Engine</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Footer Editor" onClick={handleNavClick}>
                <Link href="/admin/footer">
                  <MenuIcon />
                  <span>Footer Editor</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Notifications" onClick={handleNavClick}>
                <Link href="/admin/notifications">
                  <MailWarning />
                  <span>Notifications</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Shipping & Pickup" onClick={handleNavClick}>
                <Link href="/admin/shipping">
                  <Truck />
                  <span>Shipping & Pickup</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Payments" onClick={handleNavClick}>
                <Link href="/admin/payments">
                  <CreditCard />
                  <span>Payments</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Domain" onClick={handleNavClick}>
                <Link href="/admin/domain">
                  <Globe />
                  <span>Domain</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="SEO" onClick={handleNavClick}>
                <Link href="/admin/seo">
                  <Search />
                  <span>SEO</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] uppercase tracking-widest font-bold">Sales Channels</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Google Sync" onClick={handleNavClick}>
                <Link href="/admin/sales-channels/google">
                  <RefreshCw />
                  <span>Google Sync</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Social Commerce" onClick={handleNavClick}>
                <Link href="/admin/sales-channels/social">
                  <Share2 />
                  <span>Social Commerce</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Analytics (GA4)" onClick={handleNavClick}>
                <Link href="/admin/sales-channels/analytics">
                  <BarChart />
                  <span>Analytics (GA4)</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#e1e3e5] p-4 bg-white">
         <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings (Alt+S)" onClick={handleNavClick}>
                <Link href="/admin/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => { handleLogout(); handleNavClick(); }} tooltip="Sign Out">
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  // Defer dynamic rendering until after hydration to avoid errors
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Keyboard Shortcuts Implementation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            router.push('/admin');
            break;
          case 'o':
            e.preventDefault();
            router.push('/admin/orders');
            break;
          case 'p':
            e.preventDefault();
            router.push('/admin/products');
            break;
          case 'c':
            e.preventDefault();
            router.push('/admin/categories');
            break;
          case 's':
            e.preventDefault();
            router.push('/admin/settings');
            break;
          case 't':
            e.preventDefault();
            router.push('/admin/theme');
            break;
          case 'r':
            e.preventDefault();
            router.push('/admin/promotions');
            break;
          case 'u':
            e.preventDefault();
            router.push('/admin/customers');
            break;
          case 'z':
            e.preventDefault();
            router.push('/admin/size-chart');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Fetch Store Config for Branding
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) return;
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Authenticated",
        description: "Credentials verified. Enforcing studio role...",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "Admin session terminated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out.",
      });
    }
  };

  // Authoritatively restricted to strictly UID 'ulyu5w9XtYeVTmceUfOZLZwDQxF2'
  const isAdmin = user && user.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';

  if (!hasMounted) {
    return <div className="min-h-screen bg-[#f6f6f7]" />;
  }

  if (loading) {
    return <div className="min-h-screen bg-[#f6f6f7]" />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f6f7] p-4 text-center">
        <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-8 shadow-2xl overflow-hidden relative">
          {storeConfig?.logoUrl ? (
            <Image src={storeConfig.logoUrl} alt="Logo" width={64} height={64} className="object-cover" />
          ) : (
            "F"
          )}
        </div>
        
        {user && !isAdmin ? (
          <div className="max-w-sm space-y-6">
            <div className="bg-red-50 border border-red-100 p-8 rounded-sm">
              <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-headline font-bold mb-2 uppercase tracking-tight">Access Denied</h1>
              <p className="text-gray-500 text-xs leading-relaxed uppercase tracking-widest font-bold">
                Your account ({user.email}) does not have authorized studio privileges.
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full border-black font-bold uppercase text-[10px] tracking-widest"
            >
              Sign Out & Return
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-headline font-bold mb-3 tracking-tight">Command Center</h1>
            <p className="text-gray-500 text-sm mb-10 max-w-xs leading-relaxed uppercase tracking-widest font-bold text-[10px]">
              Authentication required to access studio operations.
            </p>

            <form onSubmit={handleEmailLogin} className="w-full max-w-sm space-y-4 mb-8 bg-white p-8 border border-[#e1e3e5] shadow-sm">
              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Staff Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@fslno.com" 
                    className="pl-10 h-12 bg-[#f9fafb] border-[#e1e3e5]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Passkey</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12 bg-[#f9fafb] border-[#e1e3e5]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-black text-white h-12 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-black/90 transition-all rounded-none"
              >
                {isLoggingIn ? "Authorizing..." : "Enter Dashboard"}
              </Button>
            </form>
          </>
        )}
        
        <p className="mt-8 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Security Level V1.0</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f6f6f7]">
        <AppSidebar storeConfig={storeConfig} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-[#e1e3e5] flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <SidebarTrigger />
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
                <input 
                  type="text" 
                  placeholder="Search studio..." 
                  className="w-full h-9 pl-10 pr-4 bg-[#f1f2f3] border-none rounded-md text-sm focus:ring-1 focus:ring-black outline-none" 
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-[#f1f2f3] rounded-md transition-colors">
                <Bell className="h-5 w-5 text-[#5c5f62]" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-200 border border-[#e1e3e5] overflow-hidden relative group">
                <Image src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="Admin" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                   <Settings className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
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
