'use client';

import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PayPalPaymentProps {
  amount: number;
  orderData: any;
  onSuccess: (orderId: string) => void;
  validate: () => boolean;
  clientId?: string;
}

const ENV_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

/**
 * Official PayPal Orchestration Component.
 * Manifests high-fidelity payment buttons with archival synchronization.
 */
export function PayPalPayment({ amount, orderData, onSuccess, validate, clientId }: PayPalPaymentProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const activeClientId = clientId || ENV_CLIENT_ID;

  // Logical Gate: Verification state before manifestation
  if (!activeClientId || activeClientId === 'pending' || activeClientId === 'fslno_sample_key') {
    return (
      <div className="p-8 border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Validating security keys...</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider 
      options={{ 
        clientId: activeClientId, 
        currency: "CAD",
        intent: "capture",
        components: "buttons",
        "disable-funding": "paylater" // Authoritatively removed per directive
      }}
    >
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <PayPalButtons
          style={{ 
            layout: 'vertical', 
            shape: 'rect',
            color: 'gold',
            label: 'paypal',
            height: 50
          }}
          disabled={false}
          forceReRender={[amount, activeClientId]}
          onClick={(data, actions) => {
            if (!validate()) {
              toast({
                variant: "destructive",
                title: "Incomplete Form",
                description: "Please check all required fields."
              });
              return actions.reject();
            }
            return actions.resolve();
          }}
          createOrder={async (data, actions) => {
            try {
              // 1. Construct the pending manifest
              const payload = {
                ...orderData,
                status: 'pending',
                paymentStatus: 'pending',
                createdAt: serverTimestamp()
              };

              // 2. Ingest into archival database
              const docRef = await addDoc(collection(db, 'orders'), payload);

              // 3. Initiate PayPal transaction tied to our Doc ID
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "CAD",
                      value: amount.toFixed(2),
                    },
                    custom_id: docRef.id,
                    description: `FSLNO Archive Order #${docRef.id.substring(0, 6)}`
                  },
                ],
              });
            } catch (err) {
              console.error("[PAYPAL] Order Ingestion Failed:", err);
              throw err;
            }
          }}
          onApprove={async (data, actions) => {
            if (!actions.order) return;
            
            try {
              const details = await actions.order.capture();
              const firestoreId = details.purchase_units[0].custom_id;

              if (firestoreId) {
                // Synchronize success state back to archival record
                await updateDoc(doc(db, 'orders', firestoreId), {
                  paymentStatus: 'paid',
                  status: 'processing',
                  updatedAt: serverTimestamp(),
                  paypalTransactionId: details.id,
                  payerEmail: details.payer.email_address
                });
                
                onSuccess(firestoreId);
              }
            } catch (err) {
              console.error("[PAYPAL] Capture Sync Failure:", err);
              toast({
                variant: "destructive",
                title: "Payment Sync Error",
                description: "Payment captured but record sync failed. Contact studio."
              });
            }
          }}
          onCancel={() => {
            toast({
              title: "Payment Cancelled",
              description: "Transaction aborted by participant."
            });
          }}
          onError={(err) => {
            console.error("[PAYPAL] Forensic Error:", err);
            toast({
              variant: "destructive",
              title: "Payment failed",
              description: "Payment failed. Please try again."
            });
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
