'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { translations, Locale } from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  multiLanguageEnabled: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useFirestore();
  
  // Fetch store config for primary language and multi-language toggle
  const storeConfigRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'store');
  }, [db]);

  const { data: storeConfig, isLoading } = useDoc(storeConfigRef);

  const [userLocale, setUserLocale] = useState<Locale | null>(null);

  // Load user preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fslno_locale') as Locale;
    if (saved) {
      setUserLocale(saved);
    }
  }, []);

  // Determine final locale
  const locale: Locale = useMemo(() => {
    // If multi-language is enabled and user has a preference, use it
    if (storeConfig?.multiLanguageEnabled && userLocale) {
      return userLocale;
    }
    // Fallback to primary language from DB, or English
    return (storeConfig?.primaryLanguage as Locale) || 'English';
  }, [storeConfig, userLocale]);

  const setLocale = (newLocale: Locale) => {
    setUserLocale(newLocale);
    localStorage.setItem('fslno_locale', newLocale);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[locale] || entry['English'] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      locale, 
      setLocale, 
      t, 
      multiLanguageEnabled: !!storeConfig?.multiLanguageEnabled,
      isLoading 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
