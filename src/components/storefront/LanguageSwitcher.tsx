'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Locale } from '@/lib/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Languages, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const locales: { label: string; value: Locale }[] = [
  { label: 'English', value: 'English' },
  { label: 'ትግርኛ', value: 'Tigrigna' },
  { label: 'Français', value: 'French' },
  { label: 'Español', value: 'Spanish' },
  { label: 'Deutsch', value: 'German' },
  { label: '日本語', value: 'Japanese' },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, multiLanguageEnabled } = useLanguage();

  if (!multiLanguageEnabled) return null;

  const currentLocale = locales.find(l => l.value === locale) || locales[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-9 px-2 flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] hover:bg-black/5 transition-all",
            className
          )}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocale.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px] rounded-none border-2 border-black/5 shadow-2xl">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => setLocale(l.value)}
            className="flex items-center justify-between py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-black hover:text-white transition-colors"
          >
            {l.label}
            {locale === l.value && <Check className="h-3 w-3" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
