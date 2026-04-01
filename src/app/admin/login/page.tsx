'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useIsAdmin } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SplashScreen } from '@/components/layout/SplashScreen';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Artificial delay for smooth splash screen transition
    const timer = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isUserLoading && user && isAdmin) {
      router.replace('/admin');
    }
  }, [user, isAdmin, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) return;

    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ 
        title: "Access Granted", 
        description: "Welcome back, Admin.",
        className: "bg-black text-white border-none rounded-none"
      });
      // Navigation is handled by the useEffect above
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: "Invalid credentials or insufficient permissions.",
        className: "rounded-none"
      });
      setIsLoggingIn(false);
    }
  };

  if (!isReady || isUserLoading) {
    return <SplashScreen isVisible={true} />;
  }

  // If already logged in and an admin, we'll be redirected by the useEffect
  if (user && isAdmin) {
    return <SplashScreen isVisible={true} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black px-4 py-12 selection:bg-white/20 selection:text-white">
      {/* Background Aesthetic Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-white/[0.02] blur-[150px]" />
      </div>

      <div className="w-full max-w-[400px] space-y-12 relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">
        {/* Branding */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="group relative">
            <div className="absolute -inset-2 bg-white rounded-sm blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
            <div className="relative w-24 h-24 bg-white flex items-center justify-center p-5 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
              <img src="/icon.png" alt="FSLNO" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white font-headline drop-shadow-sm">
              Admin Portal
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-white/10" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Secure Access</p>
              <div className="h-[1px] w-8 bg-white/10" />
            </div>
          </div>
        </div>

        {/* Error State for non-admins */}
        {user && !isAdmin && (
          <div className="p-6 bg-red-50 border border-red-100 text-center animate-in zoom-in duration-300">
            <ShieldAlert className="h-8 w-8 text-red-600 mx-auto mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-4">
              Account lacks administrative authorization.
            </p>
            <Button 
              variant="outline" 
              onClick={() => auth?.signOut()}
              className="h-10 w-full border-red-200 text-red-600 font-bold uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-700 transition-all"
            >
              Sign Out
            </Button>
          </div>
        )}

        {/* Login Form */}
        {!user && (
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2 group">
                <Label 
                  htmlFor="email" 
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-focus-within:text-white transition-colors"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 flex items-center justify-center text-white/10 group-focus-within:text-white transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@fslno.ca" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-10 border-0 border-b-2 border-white/5 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-white transition-all text-sm font-medium text-white placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <Label 
                  htmlFor="password" 
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-focus-within:text-white transition-colors"
                >
                  Access Key
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 flex items-center justify-center text-white/10 group-focus-within:text-white transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 pl-10 border-0 border-b-2 border-white/5 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-white transition-all text-sm font-medium text-white placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-none hover:bg-neutral-200 transition-all flex items-center justify-center group"
            >
              {isLoggingIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Connect to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="pt-12 text-center border-t border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/10">
            &copy; {new Date().getFullYear()} Feiselino Sport Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
