import { 
  Firestore, 
  doc, 
  getDoc, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';

export interface CartItem {
  id: string;
  name: string;
  size?: string;
  quantity: number;
}

/**
 * Validates that all items in the cart are in stock before payment begins.
 * Returns { success: true } or { success: false, message: string }
 */
export async function validateStockLevels(db: Firestore, items: CartItem[]) {
  // IDs of virtual products that have no physical inventory
  const VIRTUAL_PRODUCT_IDS = ['electronic-gift-card', 'digital-gift-card', 'gift-card'];

  try {
    for (const item of items) {
      // Skip inventory check for virtual products (e.g. gift cards)
      if (VIRTUAL_PRODUCT_IDS.includes(item.id)) continue;

      const productRef = doc(db, 'products', item.id);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return { success: false, message: `${item.name} is no longer available.` };
      }

      const data = productSnap.data();
      const variants = data.variants || [];
      const requestedQty = Number(item.quantity) || 1;

      if (variants.length > 0 && item.size) {
        const variant = variants.find((v: any) => v.size === item.size);
        if (!variant) {
          return { success: false, message: `Size ${item.size} of ${item.name} is no longer available.` };
        }
        if ((Number(variant.stock) || 0) < requestedQty) {
          return { success: false, message: `Insufficient stock for ${item.name} (${item.size}). Available: ${variant.stock}` };
        }
      } else {
        const rootInventory = Number(data.inventory) || 0;
        if (rootInventory < requestedQty) {
          return { success: false, message: `Insufficient stock for ${item.name}. Available: ${rootInventory}` };
        }
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error("[INVENTORY] validation error:", err);
    return { success: false, message: "Inventory check failed. Please try again." };
  }
}

/**
 * Atomically decrements stock for a list of items using a Firestore transaction.
 */
export async function decrementStockLevels(db: Firestore, items: CartItem[]) {
  // IDs of virtual products that have no physical inventory to decrement
  const VIRTUAL_PRODUCT_IDS = ['electronic-gift-card', 'digital-gift-card', 'gift-card'];

  // Filter out virtual products — they don't need stock decrements
  const physicalItems = items.filter(item => !VIRTUAL_PRODUCT_IDS.includes(item.id));

  if (physicalItems.length === 0) return { success: true };

  try {
    await runTransaction(db, async (transaction) => {
      const productSnapshots = await Promise.all(
        physicalItems.map(item => transaction.get(doc(db, 'products', item.id)))
      );

      for (let i = 0; i < physicalItems.length; i++) {
        const item = physicalItems[i];
        const snap = productSnapshots[i];
        
        if (!snap.exists()) continue;

        const data = snap.data();
        const variants = data.variants || [];
        const deductQty = Number(item.quantity) || 1;
        
        const updatePayload: any = {
          updatedAt: serverTimestamp()
        };

        if (variants.length > 0 && item.size) {
          const updatedVariants = variants.map((v: any) => {
            if (v.size === item.size) {
              const currentStock = Number(v.stock) || 0;
              return { 
                ...v, 
                stock: Math.max(0, currentStock - deductQty) 
              };
            }
            return v;
          });

          // Update root inventory count based on variants
          const newTotalInventory = updatedVariants.reduce(
            (acc: number, v: any) => acc + (Number(v.stock) || 0), 
            0
          );

          updatePayload.variants = updatedVariants;
          updatePayload.inventory = newTotalInventory;
        } else {
          // Direct inventory deduction
          const currentInventory = Number(data.inventory) || 0;
          updatePayload.inventory = Math.max(0, currentInventory - deductQty);
        }

        transaction.update(snap.ref, updatePayload);
      }
    });
    return { success: true };
  } catch (err) {
    console.error("[INVENTORY] transaction failed:", err);
    return { success: false, error: err };
  }
}
