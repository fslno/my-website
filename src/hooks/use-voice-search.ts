import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceSearchProps {
  onResult: (transcript: string) => void;
  lang?: string;
}

export function useVoiceSearch({ onResult, lang = 'en-US' }: UseVoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  // Cleanup on unmount to prevent leaks and "aborted" errors
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({ 
        variant: "destructive", 
        title: "Voice Search Not Supported", 
        description: "Your browser does not support the Web Speech API. Please try Chrome or Safari." 
      });
      return;
    }

    // Toggle behavior: if already listening, stop it.
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    // Initialize only if not exists or to ensure clean state
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      toast({ 
        title: "Voice Search Found", 
        description: `Searching for: "${transcript}"` 
      });
    };

    recognition.onerror = (event: any) => {
      // "aborted" is a common error when the service is disconnected intentionally or via tab switch
      if (event.error === 'aborted') {
        console.warn("Speech Recognition aborted.");
        setIsListening(false);
        return;
      }

      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast({
          variant: "destructive",
          title: "Microphone Blocked",
          description: "Please enable microphone access in your browser settings."
        });
      } else if (event.error !== 'no-speech') {
        toast({
          variant: "destructive",
          title: "Voice Search Error",
          description: `Could not process your voice command (${event.error}). Please try again.`
        });
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Speech Recognition Start Error:", e);
      setIsListening(false);
    }
  }, [onResult, lang, toast, isListening]);

  return {
    isListening,
    startVoiceSearch
  };
}
