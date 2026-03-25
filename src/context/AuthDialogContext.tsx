'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthDialog } from '@/components/storefront/AuthDialog';

interface AuthDialogContextType {
  isOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
}

const AuthDialogContext = createContext<AuthDialogContextType | undefined>(undefined);

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAuth = () => setIsOpen(true);
  const closeAuth = () => setIsOpen(false);

  return (
    <AuthDialogContext.Provider value={{ isOpen, openAuth, closeAuth }}>
      {children}
      <AuthDialog open={isOpen} onOpenChange={setIsOpen} />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (context === undefined) {
    throw new Error('useAuthDialog must be used within an AuthDialogProvider');
  }
  return context;
}
