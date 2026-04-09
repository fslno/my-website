'use client';

import React, { useState } from 'react';
import { 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/paths';
import { validateStockLevels, decrementStockLevels } from '@/lib/inventory-controller';

interface StripePaymentProps {
  amount: number;
  orderData: any;
  onSuccess: (orderId: string) => void;
  validate: () => boolean;
  existingOrderId?: string | null;
}

export function StripePayment({ amount, orderData, onSuccess, validate, existingOrderId }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const db = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !db) return;

    if (!validate()) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please check all required fields before payment."
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 0. Inventory Check
      const stockResult = await validateStockLevels(db, orderData.items || []);
      if (!stockResult.success) {
        throw new Error(stockResult.message);
      }

      // 1. Generate a temporary Reference for Stripe Metadata
      const tempRefId = `PENDING_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // 2. Create PaymentIntent on server
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          currency: 'cad',
          orderData: { ...orderData, id: tempRefId } // Pass metadata info
        }),
      });

      const { clientSecret, error: intentError } = await response.json();
      if (intentError) throw new Error(intentError);

      // 3. Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: orderData.customer.name,
            email: orderData.email,
            address: {
              line1: orderData.customer.billing.address,
              city: orderData.customer.billing.city,
              postal_code: orderData.customer.billing.postalCode,
              state: orderData.customer.billing.province,
              country: orderData.customer.billing.country === 'Canada' ? 'CA' : 'US',
            }
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent.status === 'succeeded') {
        // 4. Create actual order document in Firestore
        const orderPayload = {
          ...orderData,
          status: orderData.isAllDigital ? 'delivered' : 'awaiting_processing',
          paymentStatus: 'paid',
          viewed: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          stripePaymentIntentId: result.paymentIntent.id,
          tempReferenceId: tempRefId
        };
        
        const orderDocRef = await addDoc(collection(db, 'orders'), orderPayload);

        // 5. Update Stock Levels (Deduction)
        await decrementStockLevels(db, orderData.items || []);

        onSuccess(orderDocRef.id);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.message || "An unexpected error occurred."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="p-4 bg-white border border-gray-200 shadow-sm" style={{ borderRadius: 'var(--btn-radius)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Lock className="h-3 w-3" /> Secure Card Entry
          </p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-gray-100 rounded-sm" />
            <div className="w-6 h-4 bg-gray-100 rounded-sm" />
            <div className="w-6 h-4 bg-gray-100 rounded-sm" />
          </div>
        </div>
        <div className="py-3 px-2 border border-gray-100 bg-gray-50/50" style={{ borderRadius: 'calc(var(--btn-radius) / 2)' }}>
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#000000',
                  fontFamily: 'Inter, sans-serif',
                  '::placeholder': { color: '#aab7c4' },
                },
                invalid: { color: '#ef4444' },
              },
            }} 
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={cn(
          "w-full h-12 bg-black text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          isProcessing ? "opacity-70" : "hover:bg-zinc-800"
        )}
        style={{ borderRadius: 'var(--btn-radius)' }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Pay C${amount.toFixed(2)}
          </>
        )}
      </button>

      <p className="text-[8px] text-center text-muted-foreground uppercase font-bold tracking-widest flex items-center justify-center gap-2">
        <ShieldCheck className="h-3 w-3" /> PCI Compliant • 256-bit SSL Encryption
      </p>
    </form>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
