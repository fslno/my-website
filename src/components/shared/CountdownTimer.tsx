'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  endTime: string;
  className?: string;
  onExpire?: () => void;
  variant?: 'minimal' | 'full';
}

export function CountdownTimer({ endTime, className, onExpire, variant = 'full' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
        if (onExpire) onExpire();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (!timeLeft) return null;

  if (variant === 'minimal') {
    return (
      <div className={cn("inline-flex items-center font-mono font-bold tracking-tighter", className)}>
        <span>{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="mx-0.5">:</span>
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="mx-0.5">:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="mx-0.5">:</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-4 gap-2 sm:gap-4", className)}>
      {[
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HRS', value: timeLeft.hours },
        { label: 'MIN', value: timeLeft.minutes },
        { label: 'SEC', value: timeLeft.seconds },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded min-w-[3rem] sm:min-w-[4rem] h-10 sm:h-12 flex items-center justify-center">
            <span className="text-lg sm:text-2xl font-black font-mono">
              {String(item.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] mt-1 opacity-60">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
