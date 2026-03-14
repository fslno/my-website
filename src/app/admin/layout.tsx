
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Menu as MenuIcon,
  Loader2,
  Volume2,
  VolumeX,
  Monitor,
  Star,
  MessageSquareQuote
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
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function AppSidebar({ storeConfig }: { storeConfig: any }) {
  const { isMobile, setOpenMobile } = useSidebar();
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
      await auth.signOut();
      toast({
        title: "Signed out",
        description: "Your session is closed.",
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
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-[#e1e3e5] admin-sidebar-bg">
      <SidebarHeader className="admin-header-height flex items-center px-6 border-b border-[#e1e3e5] admin-sidebar-bg">
        <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm overflow-hidden relative">
            {storeConfig?.logoUrl ? (
              <Image src={storeConfig.logoUrl} alt="Logo" fill className="object-cover" />
            ) : (
              "F"
            )}
          </div>
          <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden font-admin-headline">
            {storeConfig?.businessName || "FSLNO"} Admin
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-4 admin-sidebar-bg overflow-x-hidden">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Home" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Orders" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/orders">
                  <ShoppingBag />
                  <span>Orders</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Products" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/products">
                  <BarChart3 />
                  <span>Products</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Categories" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/categories">
                  <Tag />
                  <span>Categories</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Promotions" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/promotions">
                  <TicketPercent />
                  <span>Promotions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Reviews" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/reviews">
                  <Star />
                  <span>Reviews</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Testimonials" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/testimonials">
                  <Star />
                  <span>Testimonials</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Size Chart" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/size-chart">
                  <Ruler />
                  <span>Size Chart</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Customers" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/customers">
                  <Users />
                  <span>Customers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] uppercase tracking-widest font-bold font-admin-headline">Store Settings</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Storefront" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/storefront">
                  <Monitor />
                  <span>Storefront</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Styles" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/theme">
                  <Palette />
                  <span>Theme Engine</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Footer" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/footer">
                  <MenuIcon />
                  <span>Footer Editor</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Emails" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/notifications">
                  <MailWarning />
                  <span>Notifications</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Shipping" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/shipping">
                  <Truck />
                  <span>Shipping & Pickup</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Payments" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/payments">
                  <CreditCard />
                  <span>Payments</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Domain" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/domain">
                  <Globe />
                  <span>Domain</span>
                </Link>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] uppercase tracking-widest font-bold font-admin-headline">Channels</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Google" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/sales-channels/google">
                  <RefreshCw />
                  <span>Google Sync</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Social" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/sales-channels/social">
                  <Share2 />
                  <span>Social Commerce</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Analytics" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/sales-channels/analytics">
                  <BarChart />
                  <span>Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#e1e3e5] p-4 admin-sidebar-bg">
         <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => { handleLogout(); handleNavClick(); }} tooltip="Sign Out" className="font-admin-body">
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
  const { user, isUserLoading: loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const [hasMounted, setHasMounted] = useState(false);
  const [newOrderDetected, setNewOrderDetected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionStartTime = useRef(new Date());

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'notifications') : null, [db]);
  const { data: notificationConfig } = useDoc(configRef);

  useEffect(() => {
    if (!db || !user || !hasMounted) return;

    // Listen for new orders strictly created after the session start
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>', sessionStartTime.current),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          setNewOrderDetected(true);
          
          if (notificationConfig?.orderAlarmEnabled && !isAudioMuted) {
            audioRef.current?.play().catch(e => {
              console.warn("Autoplay prevented. Audio alert suppressed until interaction.", e);
            });
          }

          toast({
            title: "New Order Manifested",
            description: "A high-fidelity transaction has just been registered.",
            duration: 10000,
          });

          // Reset pulse after a delay
          setTimeout(() => setNewOrderDetected(false), 5000);
        }
      });
    });

    return () => unsubscribe();
  }, [db, user, hasMounted, notificationConfig, isAudioMuted, toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd': e.preventDefault(); router.push('/admin'); break;
          case 'o': e.preventDefault(); router.push('/admin/orders'); break;
          case 'p': e.preventDefault(); router.push('/admin/products'); break;
          case 'c': e.preventDefault(); router.push('/admin/categories'); break;
          case 's': e.preventDefault(); router.push('/admin/settings'); break;
          case 't': e.preventDefault(); router.push('/admin/theme'); break;
          case 'r': e.preventDefault(); router.push('/admin/promotions'); break;
          case 'u': e.preventDefault(); router.push('/admin/customers'); break;
          case 'z': e.preventDefault(); router.push('/admin/size-chart'); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  
  const { data: storeConfig } = useDoc(storeConfigRef);
  const { data: theme } = useDoc(themeRef);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) return;
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Logged In", description: "Identity confirmed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password." });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Signed out", description: "Admin session closed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to sign out." });
    }
  };

  const isAdmin = user && user.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';

  if (!hasMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
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
                Your account ({user.email}) does not have admin permissions.
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="w-full border-black font-bold uppercase text-[10px] tracking-widest">Sign Out</Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-headline font-bold mb-3 tracking-tight">Admin Login</h1>
            <form onSubmit={handleEmailLogin} className="w-full max-w-sm space-y-4 mb-8 bg-white p-8 border border-[#e1e3e5] shadow-sm">
              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="email" type="email" placeholder="admin@fslno.ca" className="pl-10 h-12 bg-[#f9fafb] border-[#e1e3e5]" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-10 h-12 bg-[#f9fafb] border-[#e1e3e5]" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" disabled={isLoggingIn} className="w-full bg-black text-white h-12 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-black/90 transition-all rounded-none">
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
            </form>
          </>
        )}
        <p className="mt-8 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Admin Panel v1.0</p>
      </div>
    );
  }

  const adminThemeStyles = `
    :root {
      --admin-primary: ${theme?.adminPrimaryColor || '#000000'};
      --admin-accent: #FFFFFF;
      --admin-header-h: ${theme?.adminHeaderHeight || 64}px;
      --admin-font-headline: "${theme?.adminHeadlineFont || 'Inter'}", sans-serif;
      --admin-font-body: "${theme?.adminBodyFont || 'Inter'}", sans-serif;
    }
    .admin-viewport { background-color: var(--admin-accent); font-family: var(--admin-font-body); height: 100dvh; width: 100%; display: flex; flex-direction: row; overflow: hidden; }
    .admin-header-height { height: var(--admin-header-h); }
    .admin-sidebar-bg { background-color: white; }
    .font-admin-headline { font-family: var(--admin-font-headline); }
    .font-admin-body { font-family: var(--admin-font-body); }
    .admin-sidebar-bg [data-sidebar="menu-button"]:hover,
    .admin-sidebar-bg [data-sidebar="menu-button"][data-active="true"] { 
      background-color: var(--admin-primary) !important; 
      color: white !important; 
    }
    .admin-sidebar-bg [data-sidebar="menu-button"]:hover svg,
    .admin-sidebar-bg [data-sidebar="menu-button"][data-active="true"] svg {
      color: white !important;
    }
    @keyframes order-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)); }
      100% { transform: scale(1); }
    }
    .animate-order-pulse {
      animation: order-pulse 1s infinite;
      color: #3b82f6 !important;
    }
  `;

  return (
    <SidebarProvider>
      <style dangerouslySetInnerHTML={{ __html: adminThemeStyles }} />
      <div className="flex min-h-screen w-full admin-viewport">
        <AppSidebar storeConfig={storeConfig} />

        <main className="flex-1 flex flex-col min-w-0 relative max-w-full h-screen overflow-hidden">
          <header className="admin-header-height bg-white/80 backdrop-blur-md border-b border-[#e1e3e5] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 w-full shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
              <SidebarTrigger className="h-9 w-9 shrink-0" />
              <div className="relative w-full hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196] " />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full h-9 pl-10 pr-4 bg-[#f1f2f3] border-none rounded-md text-sm focus:ring-1 focus:ring-black outline-none font-admin-body" 
                />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="p-2 hover:bg-[#f1f2f3] rounded-md transition-colors"
                title={isAudioMuted ? "Unmute Order Alarm" : "Mute Order Alarm"}
              >
                {isAudioMuted ? <VolumeX className="h-5 w-5 text-red-400" /> : <Volume2 className="h-5 w-5 text-[#5c5f62]" />}
              </button>
              <button className="p-2 hover:bg-[#f1f2f3] rounded-md transition-colors relative">
                <Bell className={cn("h-5 w-5 text-[#5c5f62]", newOrderDetected && "animate-order-pulse")} />
                {newOrderDetected && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-white" />}
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-200 border border-[#e1e3e5] overflow-hidden relative group">
                {user.photoURL && <Image src={user.photoURL} alt="Admin" fill className="object-cover" />}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full font-admin-body bg-inherit scrollbar-hide">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Hidden Audio Engine for Order Alerts */}
      <audio 
        ref={audioRef} 
        src={notificationConfig?.orderAlarmUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'} 
        preload="auto"
      />
    </SidebarProvider>
  );
}
