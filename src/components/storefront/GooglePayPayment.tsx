'use client';

import React, { useState, useEffect } from 'react';
import { 
  PaymentRequestButtonElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import type { PaymentRequest } from '@stripe/stripe-js';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/paths';
import { validateStockLevels, decrementStockLevels } from '@/lib/inventory-controller';

interface GooglePayPaymentProps {
  amount: number;
  orderData: any;
  onSuccess: (orderId: string) => void;
  validate: () => boolean;
}

export function GooglePayPayment({ amount, orderData, onSuccess, validate }: GooglePayPaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const db = useFirestore();
  const { toast } = useToast();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stripe && amount > 0) {
      const pr = stripe.paymentRequest({
        country: 'CA',
        currency: 'cad',
        total: {
          label: 'Feiselino (FSLNO) Sport Jerseys',
          amount: Math.round(amount * 100), 
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result && !result.applePay) {
          setPaymentRequest(pr);
        }
        setLoading(false);
      });

      pr.on('paymentmethod', async (ev) => {
        if (!validate() || !db) {
          ev.complete('fail');
          return;
        }

        try {
          // 0. Inventory Check
          const stockResult = await validateStockLevels(db, orderData.items || []);
          if (!stockResult.success) {
            throw new Error(stockResult.message);
          }

          // 1. Generate a temporary Reference for Stripe Metadata
          const tempRefId = `GOOGLE_PAY_PENDING_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

          // 2. Create PaymentIntent on server
          const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              amount, 
              currency: 'cad', 
              orderData: { ...orderData, id: tempRefId }
            }),
          });

          const { clientSecret, error: intentError } = await response.json();
          if (intentError) throw new Error(intentError);

          // 3. Confirm with the PaymentMethod
          const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (confirmError) {
            ev.complete('fail');
            toast({ variant: "destructive", title: "Payment Failed", description: confirmError.message });
          } else if (paymentIntent.status === 'succeeded') {
            ev.complete('success');
            
            // 4. Create actual order document in Firestore
            const orderPayload = {
              ...orderData,
              status: orderData.isAllDigital ? 'delivered' : 'awaiting_processing',
              paymentStatus: 'paid',
              viewed: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              stripePaymentIntentId: paymentIntent.id,
              tempReferenceId: tempRefId
            };
            const orderDocRef = await addDoc(collection(db, 'orders'), orderPayload);

            // 5. Update Stock Levels (Deduction)
            await decrementStockLevels(db, orderData.items || []);

            onSuccess(orderDocRef.id);
          }
        } catch (err: any) {
          ev.complete('fail');
          toast({ variant: "destructive", title: "Internal Error", description: err.message });
        }
      });
    }
  }, [stripe, amount]);

  if (loading) {
    return (
      <div className="h-[48px] bg-gray-50 flex items-center justify-center animate-pulse rounded-md">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!paymentRequest) {
    return (
      <div className="p-4 bg-zinc-50 border border-dashed border-zinc-200 text-center" style={{ borderRadius: 'var(--btn-radius)' }}>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
          Google Pay is available on Chrome/Android with stored cards.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PaymentRequestButtonElement 
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'default',
              theme: 'light',
              height: '48px',
            },
          },
        }} 
      />
      <p className="text-[9px] text-center mt-2 text-gray-400 uppercase font-bold tracking-widest leading-none">
        Express checkout enabled
      </p>
    </div>
  );
}
