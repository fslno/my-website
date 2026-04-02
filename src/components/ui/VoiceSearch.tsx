'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  className?: string;
  placeholder?: string;
}

export function VoiceSearch({ onResult, className, placeholder }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError('Error recognizing speech.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setIsListening(false);
    }
  }, [onResult]);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={startListening}
        disabled={isListening}
        className={cn(
          "h-8 w-8 rounded-full transition-all duration-300",
          isListening ? "text-red-500 animate-pulse bg-red-50" : "text-gray-400 hover:text-black hover:bg-gray-100"
        )}
        title="Voice Search"
      >
        {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
      </Button>
      
      {isListening && (
        <div className="absolute left-10 whitespace-nowrap bg-black text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full animate-in fade-in slide-in-from-left-2 z-50">
          Listening...
        </div>
      )}
      
      {error && !isListening && (
        <div className="absolute left-10 whitespace-nowrap bg-red-50 text-red-500 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-red-100 z-50 flex items-center gap-2">
          <XCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
