'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  useAuth, 
  initiateEmailSignIn, 
  initiateEmailSignUp,
  initiateGoogleSignIn
} from '@/firebase';
import { Loader2, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const auth = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) return;
    setIsLoading(true);
    
    try {
      initiateEmailSignIn(auth, email, password);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password || !name) return;
    setIsLoading(true);

    try {
      initiateEmailSignUp(auth, email, password);
      onOpenChange(false);
      resetForm();
      toast({
        title: "Account Created",
        description: "Welcome to FSLNO Studio. You can now track your orders.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create account."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!auth) return;
    initiateGoogleSignIn(auth);
    onOpenChange(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white border-none rounded-none p-0 overflow-hidden shadow-2xl">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-3 mb-2 text-primary">
              <ShieldCheck className="h-6 w-6" />
              <DialogTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Studio Identity</DialogTitle>
            </div>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Sign in to track orders and manage your selection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGoogleSignIn}
              className="w-full h-12 border-black font-bold uppercase tracking-widest text-[10px] rounded-none flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.75c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-white px-2 text-muted-foreground">Or email protocol</span>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 h-12 p-1 mb-8 rounded-none border">
                <TabsTrigger value="login" className="font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none">Join Studio</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="email" 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          className="pl-10 h-12 rounded-none uppercase text-xs" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password" 
                          required 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="pl-10 h-12 rounded-none text-xs" 
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-none hover:bg-black/90 transition-all"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Access Account"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Full Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          required 
                          value={name} 
                          onChange={(e) => setName(e.target.value.toUpperCase())} 
                          className="pl-10 h-12 rounded-none uppercase text-xs" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="email" 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          className="pl-10 h-12 rounded-none uppercase text-xs" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password" 
                          required 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="pl-10 h-12 rounded-none text-xs" 
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-none hover:bg-black/90 transition-all"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Profile"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
