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
import { 
  useAuth, 
  useFirestore, 
  initiateEmailSignIn, 
  initiateEmailSignUp 
} from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('login');
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
    if (!auth || !db || !email || !password || !name) return;
    setIsLoading(true);

    try {
      await initiateEmailSignUp(auth, email, password);
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
      </DialogContent>
    </Dialog>
  );
}
