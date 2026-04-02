'use client';

import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getLivePath } from '@/lib/paths';

interface PayPalPaymentProps {
  amount: number;
  orderData: any;
  onSuccess: (orderId: string) => void;
  validate: () => boolean;
  clientId?: string;
}

const ENV_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

/**
 * PayPal Payment Component.
 * Shows payment buttons and saves order details.
 * Uses isolated stacking context to stay behind fixed UI elements.
 */
export function PayPalPayment({ amount, orderData, onSuccess, validate, clientId }: PayPalPaymentProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const activeClientId = clientId || ENV_CLIENT_ID;

  // Wait for security keys to load
  if (!activeClientId || activeClientId === 'pending' || activeClientId === 'fslno_sample_key') {
    return (
      <div className="p-8 border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-3">
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
            if (!db) throw new Error("Database not initialized");
            
            try {
              // 0. Check Stock Levels
              // Make sure items are in stock before payment starts
              const items = orderData.items || [];
              for (const item of items) {
                const productRef = doc(db, getLivePath(`products/${item.id}`));
                const productSnap = await getDoc(productRef);
                
                if (productSnap.exists()) {
                  const productData = productSnap.data();
                  const variants = productData.variants || [];
                  let currentStock = 0;
                  
                  if (variants.length > 0) {
                    const variant = variants.find((v: any) => v.size === item.size);
                    if (!variant) {
                      toast({
                        variant: "destructive",
                        title: "Inventory Error",
                        description: `Size ${item.size} of ${item.name} no longer available.`
                      });
                      throw new Error("Product size not found");
                    }
                    currentStock = Number(variant.stock) || 0;
                  } else {
                    // Fallback to root inventory for non-variant products
                    currentStock = Number(productData.inventory) || 0;
                  }

                  const requestedQty = Number(item.quantity) || 1;

                  if (currentStock < requestedQty) {
                    toast({
                      variant: "destructive",
                      title: "Inventory Shortage",
                      description: `${item.name}${item.size ? ` (${item.size})` : ""} is out of stock or insufficient. Available: ${currentStock}`
                    });
                    throw new Error("Out of stock");
                  }
                } else {
                  toast({
                    variant: "destructive",
                    title: "Product Error",
                    description: `${item.name} is no longer in our catalog.`
                  });
                  throw new Error("Product not found");
                }
              }

              // 1. Create the order details
              const payload = {
                ...orderData,
                status: 'awaiting_processing',
                paymentStatus: 'awaiting_payment',
                viewed: false, // Mark as new order
                createdAt: serverTimestamp()
              };

              // 2. Save to database
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
                    description: `FSLNO Order #${docRef.id.substring(0, 6)}`
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
              const firestoreId = purchaseUnit?.custom_id;

              if (firestoreId) {
                // Update order to paid status
                await updateDoc(doc(db, 'orders', firestoreId), {
                  paymentStatus: 'paid',
                  status: 'awaiting_processing',
                  updatedAt: serverTimestamp(),
                  paypalTransactionId: details.id,
                  payerEmail: details.payer?.email_address || 'unknown'
                });

                // Update Stock Levels
                try {
                  const items = orderData.items || [];
                  for (const item of items) {
                    const productRef = doc(db, getLivePath(`products/${item.id}`));
                    const productSnap = await getDoc(productRef);
                    
                    if (productSnap.exists()) {
                      const productData = productSnap.data();
                      const variants = productData.variants || [];
                      const deductQty = Number(item.quantity) || 1;
                      
                      let updatePayload: any = {
                        updatedAt: serverTimestamp()
                      };

                      if (variants.length > 0) {
                        const updatedVariants = variants.map((v: any) => {
                          if (v.size === item.size) {
                            const currentStock = Number(v.stock) || 0;
                            return { ...v, stock: Math.max(0, currentStock - deductQty) };
                          }
                          return v;
                        });

                        // Calculate new total inventory
                        const newTotalInventory = updatedVariants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0);
                        
                        updatePayload.variants = updatedVariants;
                        updatePayload.inventory = newTotalInventory;
                      } else {
                        // Direct inventory deduction
                        const currentInventory = Number(productData.inventory) || 0;
                        updatePayload.inventory = Math.max(0, currentInventory - deductQty);
                      }

                      await updateDoc(productRef, updatePayload);
                    }
                  }
                } catch (invErr) {
                  console.error("[INVENTORY] Deduction Failure:", invErr);
                }
                
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
