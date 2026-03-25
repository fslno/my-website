'use client';

import React from 'react';
import { useUser } from '@/firebase';
import { Loader2, LayoutDashboard, ShoppingBag, User, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuthDialog } from '@/context/AuthDialogContext';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { openAuth } = useAuthDialog();
  const pathname = usePathname();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      toast({ title: "Signed out", description: "You have been signed out." });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Sign out failed." });
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-28 sm:pt-40 pb-24 px-4 flex flex-col items-center justify-center text-center">
        <User className="h-12 w-12 text-gray-200 mb-6" />
        <h1 className="text-3xl font-headline font-bold uppercase mb-4 tracking-tighter">Welcome</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 max-w-xs mb-8">Sign in to view your orders, manage your profile, and more.</p>
        <Button 
          onClick={openAuth}
          className="bg-black text-white px-10 h-14 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none hover:bg-black/90 transition-all font-headline shadow-lg"
        >
          Sign In / Sign Up
        </Button>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/account', icon: LayoutDashboard },
    { name: 'Orders', href: '/account/orders', icon: ShoppingBag },
    { name: 'Profile', href: '/account/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-28 sm:pt-40 pb-24 max-w-[1440px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-8">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Welcome back</span>
              <p className="text-xl font-headline font-bold uppercase tracking-tight truncate">{user.displayName || user.email?.split('@')[0] || 'Member'}</p>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between p-4 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 group border-l-2",
                      isActive 
                        ? "bg-gray-50 border-black text-black" 
                        : "border-transparent text-gray-400 hover:text-black hover:bg-gray-50/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4", isActive ? "text-black" : "text-gray-300 group-hover:text-black")} />
                      {item.name}
                    </div>
                    <ChevronRight className={cn("h-3 w-3 transition-transform duration-300", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1")} />
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-4 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all duration-300 border-l-2 border-transparent mt-4"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 animate-in fade-in slide-in-from-right-4 duration-500">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
