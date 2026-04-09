'use client';

import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getLivePath } from '@/lib/paths';
import { validateStockLevels, decrementStockLevels } from '@/lib/inventory-controller';

interface PayPalPaymentProps {
  amount: number;
  orderData: any;
  onSuccess: (orderId: string) => void;
  validate: () => boolean;
  clientId?: string;
  existingOrderId?: string | null;
}

const ENV_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

/**
 * PayPal Payment Component.
 * Shows payment buttons and saves order details.
 * Uses isolated stacking context to stay behind fixed UI elements.
 */
export function PayPalPayment({ amount, orderData, onSuccess, validate, clientId, existingOrderId }: PayPalPaymentProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const activeClientId = clientId || ENV_CLIENT_ID;
  const [buttonShape, setButtonShape] = React.useState<'rect' | 'pill'>('rect');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const rootStyles = getComputedStyle(document.documentElement);
      const radius = rootStyles.getPropertyValue('--btn-radius').trim();
      const radiusValue = parseInt(radius, 10);
      if (radiusValue > 16 || radius.includes('%')) {
        setButtonShape('pill');
      } else {
        setButtonShape('rect');
      }
    }
  }, []);

  const callbacks = React.useRef({ onSuccess, validate, orderData });
  React.useEffect(() => {
    callbacks.current = { onSuccess, validate, orderData };
  }, [onSuccess, validate, orderData]);

  // Wait for security keys to load
  if (!activeClientId || activeClientId === 'pending' || activeClientId === 'fslno_sample_key') {
    return (
      <div 
        className="p-8 border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-3"
        style={{ borderRadius: 'var(--btn-radius)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Checking security keys...</p>
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
        "disable-funding": "paylater" // Disabled for this store
      }}
    >
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-0 isolate">
        <PayPalButtons
          style={{ 
            layout: 'vertical', 
            shape: buttonShape,
            color: 'gold',
            label: 'paypal',
            height: 50
          }}
          disabled={false}
          forceReRender={[amount, activeClientId]}
          onClick={(data, actions) => {
            if (!callbacks.current.validate()) {
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
            if (!db) throw new Error("Database not initialized");
            
            try {
              const currentOrderData = callbacks.current.orderData;
              // 0. Check Stock Levels
              const stockResult = await validateStockLevels(db, currentOrderData.items || []);
              if (!stockResult.success) {
                toast({
                  variant: "destructive",
                  title: "Inventory Error",
                  description: stockResult.message
                });
                throw new Error(stockResult.message);
              }

              // 1. Generate a temporary Reference for PayPal Metadata
              const tempRefId = `PAYPAL_PENDING_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

              // 2. Initiate PayPal transaction tied to our Temp Ref
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "CAD",
                      value: amount.toFixed(2),
                    },
                    custom_id: tempRefId,
                    description: `FSLNO Order Ref: ${tempRefId.substring(0, 12)}`
                  },
                ],
              });
            } catch (err) {
              console.error("[PAYPAL] Order Failed:", err);
              throw err;
            }
          }}
          onApprove={async (data, actions) => {
            if (!actions.order || !db) return;
            
            try {
              const details = await actions.order.capture();
              const purchaseUnit = details.purchase_units?.[0];
              const tempRefId = purchaseUnit?.custom_id;

              if (tempRefId) {
                const currentOrderData = callbacks.current.orderData;
                
                // 1. Create actual order document in Firestore
                const orderPayload = {
                  ...currentOrderData,
                  paymentStatus: 'paid',
                  status: currentOrderData.isAllDigital ? 'delivered' : 'awaiting_processing',
                  viewed: false,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  paypalTransactionId: details.id,
                  payerEmail: details.payer?.email_address || 'unknown',
                  tempReferenceId: tempRefId
                };

                const orderDocRef = await addDoc(collection(db, 'orders'), orderPayload);
                const firestoreId = orderDocRef.id;

                // 2. Update Stock Levels (Deduction)
                await decrementStockLevels(db, currentOrderData.items || []);
                
                callbacks.current.onSuccess(firestoreId);
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
              description: "Payment cancelled by user."
            });
          }}
          onError={(err) => {
            console.error("[PAYPAL] Payment Error:", err);
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
