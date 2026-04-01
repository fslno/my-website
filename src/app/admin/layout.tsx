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
  Receipt,
  Package,
  Megaphone
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

// Memoize AppSidebar to prevent unnecessary re-renders when dashboard data or layout state changes
const AppSidebar = React.memo(function AppSidebar({ storeConfig, storeLoading, unviewedOrdersCount = 0 }: { storeConfig: any, storeLoading?: boolean, unviewedOrdersCount?: number }) {
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
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-2 p-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9px] h-5 uppercase tracking-widest font-bold font-admin-headline px-6 opacity-30">Inventory & Logistics</SidebarGroupLabel>
          <SidebarMenu className="gap-0">
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
                  <Package />
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
              <SidebarMenuButton size="sm" asChild tooltip="Customers" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/customers">
                  <Users />
                  <span>Customers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-2 p-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9px] h-5 uppercase tracking-widest font-bold font-admin-headline px-6 opacity-30">Marketing & Data</SidebarGroupLabel>
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
              <SidebarMenuButton size="sm" asChild tooltip="Promotions" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/promotions">
                  <Megaphone />
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
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-2 p-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9px] h-5 uppercase tracking-widest font-bold font-admin-headline px-6 opacity-30">Online Store</SidebarGroupLabel>
          <SidebarMenu className="gap-0">
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Styles" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/theme">
                  <Palette />
                  <span>Theme</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
              <SidebarMenuButton size="sm" asChild tooltip="Domain" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/domain">
                  <Globe />
                  <span>Domain</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-2 p-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9px] h-5 uppercase tracking-widest font-bold font-admin-headline px-6 opacity-30">Sales Channels</SidebarGroupLabel>
          <SidebarMenu className="gap-0">
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
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-2 p-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9px] h-5 uppercase tracking-widest font-bold font-admin-headline px-6 opacity-30">Operations & Logistics</SidebarGroupLabel>
          <SidebarMenu className="gap-0">
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild tooltip="Size Chart" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/size-chart">
                  <Ruler />
                  <span>Size Chart</span>
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
              <SidebarMenuButton size="sm" asChild tooltip="Emails" onClick={handleNavClick} className="font-admin-body">
                <Link href="/admin/notifications">
                  <MailWarning />
                  <span>Notifications</span>
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
});

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
  const [isTestLoading, setIsTestLoading] = useState(false);

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
      if (!isAudioMuted) {
        // Force play with maximum volume if possible
        if (audioRef.current) {
          audioRef.current.volume = 1.0;
          audioRef.current.play().catch(e => console.warn("Order audio prevented", e));
        }
      }
      toast({ 
        className: "bg-black border-black text-white rounded-none shadow-2xl",
        title: "🚨 NEW ORDER RECEIVED", 
        description: "A new order just arrived. Check the portal immediately.", 
        duration: 5000 
      });
      
      // Haptic feedback for mobile
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 30, 100, 30, 200]);
      }
      
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

  const [shouldLoadListeners, setShouldLoadListeners] = useState(false);

  useEffect(() => {
    if (!hasMounted) return;
    // Defer non-critical real-time listeners to ensure initial dashboard paint is ultra-fast
    const timer = setTimeout(() => setShouldLoadListeners(true), 1500);
    return () => clearTimeout(timer);
  }, [hasMounted]);

  useEffect(() => {
    if (!db || !user || !hasMounted || !isAdmin || !shouldLoadListeners) return;

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
              new Notification("🚨 NEW ORDER RECEIVED", {
                body: `Order #${change.doc.id.slice(-6)} just arrived!`,
                icon: "/icon.png",
                tag: "new-order",
                requireInteraction: true,
                renotify: true,
                silent: false,
                vibrate: [200, 100, 200]
              } as any);
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
              new Notification("⭐ NEW CUSTOMER REVIEW", {
                body: `A new review was submitted for ${reviewData.productName || 'a product'}.`,
                icon: "/icon.png",
                tag: "new-review",
                requireInteraction: true,
                renotify: true,
                silent: false,
                vibrate: [100, 50, 100]
              } as any);
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
      // Dynamic tab title and PWA badge update
      if (count > 0) {
        document.title = `(${count}) ${adminName} Admin`;
        if ('setAppBadge' in navigator) {
          navigator.setAppBadge(count).catch(console.error);
        }
      } else {
        document.title = `${adminName} Admin`;
        if ('clearAppBadge' in navigator) {
          navigator.clearAppBadge().catch(console.error);
        }
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

  const adminLogo = storeConfig?.adminLogoUrl || storeConfig?.logoUrl;
  const adminName = storeConfig?.adminBusinessName || storeConfig?.businessName || "Feiselino (FSLNO)";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <img src="/icon.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse opacity-50" />
      </div>
    );
  }

  // Auth Guard
  const isLoginPage = pathname === '/admin/login';
  if (!user || !isAdmin) {
    if (!isLoginPage) {
      router.replace('/admin/login');
      return (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <img src="/icon.png" alt="Redirecting" className="w-16 h-16 object-contain animate-pulse opacity-30" />
        </div>
      );
    }
    // If we are on the login page, just render children (which will be the login page content)
    return <>{children}</>;
  }

  // If we are logged in and on the login page, redirect to admin root
  if (isLoginPage) {
    router.replace('/admin');
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <img src="/icon.png" alt="Redirecting" className="w-16 h-16 object-contain animate-pulse opacity-30" />
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
    
    @keyframes pulse-ring {
      0% { transform: scale(0.33); opacity: 1; }
      80%, 100% { opacity: 0; }
    }
    
    .animate-pulse-ring {
      animation: pulse-ring 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
    }
  `;

  const testAlert = () => {
    setIsTestLoading(true);
    triggerAlert('order', 'test-' + Date.now());
    setTimeout(() => setIsTestLoading(false), 1000);
  };

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
              {/* Notification Status Indicator */}
              <div className="flex items-center">
                {notificationPermission === 'granted' ? (
                  <Button 
                    onClick={() => setIsAudioMuted(!isAudioMuted)} 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-9 px-3 gap-2 border-[#e1e3e5] font-bold uppercase text-[9px] tracking-widest transition-all duration-300",
                      isAudioMuted ? "text-red-500 hover:text-red-600" : "text-emerald-600 hover:text-emerald-700"
                    )}
                  >
                    {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    {isAudioMuted ? "ALERTS MUTED" : "ALERTS ACTIVE"}
                  </Button>
                ) : (
                  <Button 
                    onClick={enableNotifications} 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 gap-2 border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 font-bold uppercase text-[9px] tracking-widest relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-orange-200/20 animate-pulse-ring rounded-full scale-[3] pointer-events-none" />
                    <ShieldAlert className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">ENABLE SYSTEM ALERTS (ON TOP)</span>
                  </Button>
                )}
                
                {notificationPermission === 'granted' && !isAudioMuted && (
                  <Button 
                    onClick={testAlert} 
                    variant="ghost" 
                    size="icon" 
                    disabled={isTestLoading}
                    className="h-9 w-9 text-[#5c5f62] hover:text-black ml-1 relative"
                    title="Administrative Priority Check"
                  >
                    <Bell className={cn("h-4 w-4", isTestLoading && "animate-bounce", (newOrderDetected || newReviewDetected) && "text-red-600 animate-pulse")} />
                    {(newOrderDetected || newReviewDetected) && <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full animate-ping" />}
                  </Button>
                )}
              </div>

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

