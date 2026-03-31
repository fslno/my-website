'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  Palette,
  Truck,
  CreditCard,
  BarChart3,
  Bell,
  Tag,
  Ruler,
  Globe,
  Share2,
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
  Zap,
  PanelBottom,
  Receipt
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
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useIsAdmin } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function AppSidebar({ storeConfig, storeLoading, unviewedOrdersCount = 0 }: { storeConfig: any, storeLoading?: boolean, unviewedOrdersCount?: number }) {
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
        description: "Session closed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Logout failed.",
      });
    }
  };

  const adminLogo = storeConfig?.adminLogoUrl || storeConfig?.logoUrl;
  const adminName = storeConfig?.adminBusinessName || storeConfig?.businessName || "DASHBOARD";

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-[#e1e3e5] admin-sidebar-bg">
      <SidebarHeader className="admin-header-height flex items-center px-6 border-b border-[#e1e3e5] admin-sidebar-bg">
        <Link href="/" className="flex items-center gap-2" onClick={handleNavClick}>
          <div className={cn("w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm overflow-hidden relative", (!adminLogo && !storeLoading) ? "bg-black text-white border border-white/10" : "")}>
            {storeLoading ? null : adminLogo ? (
              <NextImage src={adminLogo} alt="Logo" fill className="object-contain" />
            ) : (
              "F"
            )}
          </div>
          <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden font-admin-headline">
            {adminName}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-0 admin-sidebar-bg overflow-y-auto scrollbar-hide">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0">
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Home" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Orders" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/orders" className="flex items-center justify-between w-full pr-1">
                  <div className="flex items-center gap-2">
                    <ShoppingBag />
                    <span>Orders</span>
                  </div>
                  {unviewedOrdersCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-red-600 text-white text-[8px] font-black uppercase tracking-tighter px-1 h-4 rounded-none border-none">NEW</Badge>
                      <Badge variant="destructive" className="h-4 px-1 min-w-[16px] rounded-full text-[9px] font-bold border-none">
                        {unviewedOrdersCount > 99 ? '99+' : unviewedOrdersCount}
                      </Badge>
                    </div>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Products" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/products">
                  <BarChart3 />
                  <span>Products</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Categories" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/categories">
                  <Tag />
                  <span>Categories</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Promotions" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/promotions">
                  <TicketPercent />
                  <span>Promotions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Reviews" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/reviews">
                  <Star />
                  <span>Reviews</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Testimonials" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/testimonials">
                  <Star />
                  <span>Testimonials</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Size Chart" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/size-chart">
                  <Ruler />
                  <span>Size Chart</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Customers" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/customers">
                  <Users />
                  <span>Customers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-0 p-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9px] h-5 uppercase tracking-widest font-bold font-admin-headline">Sales Channels</SidebarGroupLabel>
          <SidebarMenu className="gap-0">
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Analytics" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/sales-channels/analytics">
                  <BarChart3 />
                  <span>Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Google Sync" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/sales-channels/google">
                  <Globe />
                  <span>Google Sync</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Social Commerce" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/sales-channels/social">
                  <Share2 />
                  <span>Social Commerce</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Invoices" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/invoices">
                  <Receipt />
                  <span>Invoices</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-0 p-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9px] h-5 uppercase tracking-widest font-bold font-admin-headline">Settings</SidebarGroupLabel>
          <SidebarMenu className="gap-0">
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Storefront" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/storefront">
                  <Monitor />
                  <span>Storefront</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Footer Editor" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/footer">
                  <PanelBottom />
                  <span>Footer</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Styles" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/theme">
                  <Palette />
                  <span>Theme</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Emails" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/notifications">
                  <MailWarning />
                  <span>Notifications</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Domain" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/domain">
                  <Globe />
                  <span>Domain</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Payments" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/payments">
                  <CreditCard />
                  <span>Payments</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Shipping" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/shipping">
                  <Truck />
                  <span>Shipping</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Webhooks" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/shipping/webhooks">
                  <Zap />
                  <span>Webhooks</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#e1e3e5] p-0 admin-sidebar-bg">
        <SidebarMenu className="gap-0">
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild tooltip="Settings" onClick={handleNavClick} className="font-admin-body">
              <Link href="/admin/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" onClick={() => { handleLogout(); handleNavClick(); }} tooltip="Sign Out" className="font-admin-body text-destructive">
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
  const isAdmin = useIsAdmin();
  const pathname = usePathname();
  const [unviewedOrdersCount, setUnviewedOrdersCount] = useState(0);

  const [hasMounted, setHasMounted] = useState(false);
  const [newOrderDetected, setNewOrderDetected] = useState(false);
  const [newReviewDetected, setNewReviewDetected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reviewAudioRef = useRef<HTMLAudioElement>(null);
  const sessionStartTime = useRef(new Date());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const alertedOrderIds = useRef<Set<string>>(new Set());
  const alertedReviewIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    setHasMounted(true);
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast({ variant: "destructive", title: "Unsupported", description: "Browser notifications not supported." });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    // satisfy mobile audio autoplay policy
    if (audioRef.current) {
      audioRef.current.muted = true;
      audioRef.current.play().then(() => {
        audioRef.current!.pause();
        audioRef.current!.muted = false;
      }).catch(e => console.warn("Audio init failed", e));
    }

    if (permission === 'granted') {
      toast({ title: "Alerts Enabled", description: "Notifications and sound are active." });
    } else {
      toast({ variant: "destructive", title: "Permission Denied", description: "Please enable notifications in settings." });
    }
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'notifications') : null, [db]);
  const { data: notificationConfig } = useDoc(configRef);


  const triggerAlert = useCallback((type: 'order' | 'review' = 'order', id?: string) => {
    if (id) {
      if (type === 'order' && alertedOrderIds.current.has(id)) return;
      if (type === 'review' && alertedReviewIds.current.has(id)) return;
      
      if (type === 'order') alertedOrderIds.current.add(id);
      else alertedReviewIds.current.add(id);
    }

    if (type === 'order') {
      setNewOrderDetected(true);
      if (notificationConfig?.orderAlarmEnabled && !isAudioMuted) {
        audioRef.current?.play().catch(e => console.warn("Order audio prevented", e));
      }
      toast({ 
        className: "bg-black border-black text-white rounded-none",
        title: "🚨 NEW ORDER RECEIVED", 
        description: "An order has just been received in Feiselino (FSLNO). Check orders portal immediately.", 
        duration: 2000 
      });
      setTimeout(() => setNewOrderDetected(false), 5000);
    } else {
      setNewReviewDetected(true);
      if (notificationConfig?.reviewAlarmEnabled && !isAudioMuted) {
        reviewAudioRef.current?.play().catch(e => console.warn("Review audio prevented", e));
      }
      toast({ 
        className: "bg-black border-black text-white rounded-none",
        title: "⭐ NEW REVIEW", 
        description: "Customer review received.", 
        duration: 2000 
      });
      setTimeout(() => setNewReviewDetected(false), 5000);
    }
  }, [notificationConfig, isAudioMuted, toast]);

  useEffect(() => {
    if (!db || !user || !hasMounted || !isAdmin) return;

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>', sessionStartTime.current),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderData = change.doc.data();
          const createdAt = orderData.createdAt?.toDate?.() || orderData.createdAt;
          if (createdAt > sessionStartTime.current && !alertedOrderIds.current.has(change.doc.id)) {
            triggerAlert('order', change.doc.id);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("New Order Received", {
                body: `Order #${change.doc.id.slice(-6)} just arrived!`,
                icon: "/logo.png"
              });
            }
          }
        }
      });
    });

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('createdAt', '>', sessionStartTime.current),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const reviewData = change.doc.data();
          const createdAt = reviewData.createdAt?.toDate?.() || reviewData.createdAt;
          if (createdAt > sessionStartTime.current && !alertedReviewIds.current.has(change.doc.id)) {
            triggerAlert('review', change.doc.id);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("New Customer Review", {
                body: `A new review was submitted for ${reviewData.productName || 'a product'}.`,
                icon: "/logo.png"
              });
            }
          }
        }
      });
    });

    const unviewedOrdersQuery = query(
      collection(db, 'orders'),
      where('viewed', '==', false)
    );

    const unsubscribeUnviewed = onSnapshot(unviewedOrdersQuery, (snapshot) => {
      const count = snapshot.size;
      setUnviewedOrdersCount(count);
      // Dynamic tab title update
      if (count > 0) {
        document.title = `(${count}) ${adminName} Admin`;
      } else {
        document.title = `${adminName} Admin`;
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeReviews();
      unsubscribeUnviewed();
    };
  }, [db, user, hasMounted, isAdmin, triggerAlert]);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);

  const { data: storeConfig, isLoading: storeLoading } = useDoc(storeConfigRef);
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
      toast({ title: "Signed in", description: "Identity confirmed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Invalid email or password." });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!hasMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <img src="/icon.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse opacity-50" />
      </div>
    );
  }

  const adminLogo = storeConfig?.adminLogoUrl || storeConfig?.logoUrl;
  const adminName = storeConfig?.adminBusinessName || storeConfig?.businessName || "Feiselino (FSLNO)";

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
        {user && !isAdmin ? (
          <div className="max-w-sm space-y-6">
            <div className="bg-red-50 border border-red-100 p-8 rounded-sm">
              <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-headline font-bold mb-2 uppercase tracking-tight">Access Denied</h1>
              <p className="text-gray-500 text-xs leading-relaxed uppercase tracking-widest font-bold">
                Account ({user.email}) lacks permissions.
              </p>
            </div>
            <Button onClick={() => signOut(auth!)} variant="outline" className="w-full border-black font-bold uppercase text-[10px] tracking-widest">Sign Out</Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-headline font-bold mb-3 tracking-tight">Sign In</h1>
            <p className="mb-6 text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">{adminName} Admin</p>
            <form onSubmit={handleEmailLogin} className="w-full max-w-sm space-y-4 mb-8 bg-white p-8 border border-[#e1e3e5] shadow-sm">
              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="email" type="email" placeholder="admin@example.com" className="pl-10 h-12 bg-[#f9fafb] border-[#e1e3e5]" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
                {isLoggingIn ? "Signing in..." : "Sign In"}
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
      --admin-accent: ${theme?.adminAccentColor || '#f6f6f7'};
      --admin-text: ${theme?.adminTextColor || '#1a1c1e'};
      --admin-base-size: ${theme?.adminBaseFontSize || 14}px;
      --admin-header-h: ${theme?.adminHeaderHeight || 64}px;
      
      --font-headline: "${theme?.adminHeadlineFont || 'Inter'}", sans-serif !important;
      --font-body: "${theme?.adminBodyFont || 'Inter'}", sans-serif !important;
      --admin-font-headline: "${theme?.adminHeadlineFont || 'Inter'}", sans-serif;
      --admin-font-body: "${theme?.adminBodyFont || 'Inter'}", sans-serif;
      
      --admin-sb-bg: ${theme?.adminSidebarBg || '#FFFFFF'};
      --admin-sb-head-size: ${theme?.adminSidebarHeaderSize || 10}px;
      --admin-sb-head-color: ${theme?.adminSidebarHeaderColor || '#8c9196'};
      --admin-sb-item-size: ${theme?.adminSidebarItemSize || 14}px;
      --admin-sb-item-color: ${theme?.adminSidebarItemColor || '#1a1c1e'};
      --admin-sb-active-bg: ${theme?.adminSidebarActiveBg || '#000000'};
      --admin-sb-active-text: ${theme?.adminSidebarActiveText || '#FFFFFF'};
    }
    
    .admin-viewport { 
      background-color: var(--admin-accent); 
      color: var(--admin-text);
      font-size: var(--admin-base-size);
      font-family: var(--admin-font-body); 
      height: 100dvh; 
      width: 100%; 
      display: flex; 
      flex-direction: row; 
      overflow: hidden; 
    }

    .admin-header-height { height: var(--admin-header-h); }
    
    .admin-sidebar-bg { 
      background-color: var(--admin-sb-bg) !important; 
    }
    
    [data-sidebar="group-label"] {
      font-size: var(--admin-sb-head-size) !important;
      color: var(--admin-sb-head-color) !important;
      font-family: var(--admin-font-headline) !important;
    }
    
    [data-sidebar="menu-button"] {
      font-size: var(--admin-sb-item-size) !important;
      color: var(--admin-sb-item-color) !important;
    }
    
    [data-sidebar="menu-button"]:hover,
    [data-sidebar="menu-button"][data-active="true"] { 
      background-color: var(--admin-sb-active-bg) !important; 
      color: var(--admin-sb-active-text) !important; 
    }
    
    [data-sidebar="menu-button"]:hover svg,
    [data-sidebar="menu-button"][data-active="true"] svg {
      color: var(--admin-sb-active-text) !important;
    }

    .font-admin-headline { font-family: var(--admin-font-headline); }
    .font-admin-body { font-family: var(--admin-font-body); }
  `;

  return (
    <SidebarProvider>
      <style dangerouslySetInnerHTML={{ __html: adminThemeStyles }} />
      <div className="flex min-h-screen w-full admin-viewport">
        <AppSidebar storeConfig={storeConfig} storeLoading={storeLoading} unviewedOrdersCount={unviewedOrdersCount} />

        <main className="flex-1 flex flex-col min-w-0 relative max-w-full h-screen overflow-hidden bg-white">
          <header className="admin-header-height bg-white/80 backdrop-blur-md border-b border-[#e1e3e5] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 w-full shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
              <SidebarTrigger className="h-9 w-9 shrink-0" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="p-2 hover:bg-[#f1f2f3] rounded-md transition-colors"
              >
                {isAudioMuted ? <VolumeX className="h-5 w-5 text-red-400" /> : <Volume2 className="h-5 w-5 text-[#5c5f62]" />}
              </button>
              <button className="p-2 hover:bg-[#f1f2f3] rounded-md transition-colors relative">
                <Bell className={cn("h-5 w-5 text-[#5c5f62]")} />
                {(newOrderDetected || newReviewDetected) && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-white" />}
              </button>
              {notificationPermission !== 'granted' && (
                <Button 
                  onClick={enableNotifications} 
                  variant="outline" 
                  size="sm" 
                  className="hidden md:flex h-9 px-3 gap-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold uppercase text-[9px] tracking-widest animate-pulse"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Enable Alerts
                </Button>
              )}
              {notificationPermission !== 'granted' && (
                <button 
                  onClick={enableNotifications} 
                  className="md:hidden p-2 bg-red-50 rounded-md text-red-600 animate-pulse border border-red-200"
                >
                  <ShieldAlert className="h-5 w-5" />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-gray-200 border border-[#e1e3e5] overflow-hidden relative group">
                {user.photoURL && <NextImage src={user.photoURL} alt="Admin" fill className="object-cover" />}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-5 w-full font-admin-body bg-white scrollbar-hide">
            <div className="max-w-7xl mx-auto w-full min-w-0">
              {children}
            </div>
          </div>
        </main>
      </div>

      <audio
        ref={audioRef}
        src={notificationConfig?.orderAlarmUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'}
        preload="auto"
      />
      <audio
        ref={reviewAudioRef}
        src={notificationConfig?.reviewAlarmUrl || 'https://assets.mixkit.co/active_storage/sfx/2210/2210-preview.mp3'}
        preload="auto"
      />
    </SidebarProvider>
  );
}

