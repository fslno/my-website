import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminFieldValue } from '@/lib/firebase-admin';
import { 
  queueNotificationServer, 
  formatProductListHtml, 
  formatPriceBreakdownHtml 
} from '@/lib/notifications-server';

/**
 * HELPER: Processes a single lead or order unit for recovery
 * Sequential processing avoids Firestore write-load spikes and parsing issues.
 */
async function processUnit(
  db: any, 
  FieldValue: any, 
  doc: any, 
  isLead: boolean, 
  twoHoursAgo: Date, 
  targetId: string | null, 
  existingEmailsWithOrders: Set<string>,
  dynamicBaseUrl: string
) {
  const data = doc.data();
  const id = doc.id;
  const email = data.email?.toLowerCase();
  
  if (!email) return false;

  // 1. Threshold Check (Last activity > 2 hours)
  if (!targetId) {
    const lastActivity = data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : null);
    if (!lastActivity || lastActivity > twoHoursAgo) return false;
  }

  // 2. Safety Check: 24h order window
  if (isLead && existingEmailsWithOrders.has(email)) {
    await doc.ref.update({ abandonedEmailSent: true, conversionType: 'pre_recovery_order' });
    return false;
  }

  console.log(`[RECOVERY-LOG] Syncing ${isLead ? 'Lead' : 'Order'} ${id} (${email})`);

  // 3. Prepare Notification Variables
  const variables = {
    order_id: isLead ? `LEAD-${id.slice(0, 8)}`.toUpperCase() : id,
    customer_name: (isLead ? data.name : data.customer?.name) || 'Customer',
    order_total: `C$${Number(data.total || 0).toFixed(2)}`,
    product_manifest: formatProductListHtml(data.items || [], dynamicBaseUrl),
    price_breakdown: formatPriceBreakdownHtml(data),
    shipping_address: data.deliveryMethod === 'pickup' 
      ? 'Store Pickup' 
      : `${data.customer?.shipping?.address || data.address || ''}\n${data.customer?.shipping?.city || data.city || ''}, ${data.customer?.shipping?.province || data.province || ''} ${data.customer?.shipping?.postalCode || data.postalCode || ''}`.trim() || 'Not Provided',
    to: email
  };

  // 4. Dispatch Email
  await queueNotificationServer(db, 'abandonedCart', email, variables);

  // 5. Update Record State
  await doc.ref.update({
    abandonedEmailSent: true,
    updatedAt: FieldValue.serverTimestamp(),
    recoveryEmailSentAt: FieldValue.serverTimestamp()
  });

  return true;
}

/**
 * API Route: /api/admin/process-abandoned
 */
export async function POST(req: NextRequest) {
  // FORCE PARSE REFRESH: v2.0.1
  const searchParams = req.nextUrl.searchParams;
  const _force = searchParams.get('refresh');

  try {
    const db = getAdminDb();
    const FieldValue = getAdminFieldValue();
    
    let targetId: string | null = null;
    let targetType: 'lead' | 'order' | null = null;
    
    try {
      const body = await req.json();
      targetId = body.targetId || null;
      targetType = body.targetType || null;
    } catch (e) {
      // Body empty is valid for batch automation
    }

    // 1. Automation Cooldown (5 mins)
    const statusRef = db.collection('config').doc('automation-status');
    const statusSnap = await statusRef.get();
    const now = Date.now();
    
    if (statusSnap.exists && !targetId) {
      const lastProcessed = statusSnap.data()?.lastProcessedAt?.toDate?.()?.getTime() || 0;
      if (now - lastProcessed < 5 * 60 * 1000) {
        return NextResponse.json({ success: true, processed: 0, message: "Automation cooldown active." });
      }
    }

    // 2. Prep Context
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    const domainSnap = await db.collection('config').doc('domain').get();
    const domainData = domainSnap.exists ? domainSnap.data() : {};
    const primaryDomain = (domainData?.primaryDomain || 'fslno.ca').trim();
    const dynamicBaseUrl = primaryDomain.includes('localhost') ? `http://${primaryDomain}` : `https://${primaryDomain}`;

    const existingEmailsWithOrders = new Set<string>();
    const recentOrders = await db.collection('orders').where('createdAt', '>', new Date(now - 24 * 60 * 60 * 1000)).get();
    recentOrders.docs.forEach((d: any) => {
      if (d.data().email) existingEmailsWithOrders.add(d.data().email.toLowerCase());
    });

    // 3. Identification
    let orderDocs: any[] = [];
    let leadDocs: any[] = [];

    if (targetId) {
      if (targetType === 'order') {
        const doc = await db.collection('orders').doc(targetId).get();
        if (doc.exists) orderDocs = [doc];
      } else if (targetType === 'lead') {
        const doc = await db.collection('leads').doc(targetId).get();
        if (doc.exists) leadDocs = [doc];
      } else {
        const oDoc = await db.collection('orders').doc(targetId).get();
        if (oDoc.exists) orderDocs = [oDoc];
        const lDoc = await db.collection('leads').doc(targetId).get();
        if (lDoc.exists) leadDocs = [lDoc];
      }
    } else {
      const oSnap = await db.collection('orders')
        .where('paymentStatus', '==', 'awaiting_payment')
        .where('abandonedEmailSent', '==', false)
        .limit(10).get();
      orderDocs = oSnap.docs;

      const lSnap = await db.collection('leads')
        .where('status', '==', 'lead')
        .where('abandonedEmailSent', '==', false)
        .limit(10).get();
      leadDocs = lSnap.docs;
    }

    // 4. Execution Loop (Sequential)
    let processedCount = 0;
    const itemsToProcess = [
      ...orderDocs.map(doc => ({ doc, isLead: false })),
      ...leadDocs.map(doc => ({ doc, isLead: true }))
    ];

    for (const item of itemsToProcess) {
       const success = await processUnit(
         db, FieldValue, item.doc, item.isLead, 
         twoHoursAgo, targetId, existingEmailsWithOrders, dynamicBaseUrl
       );
       if (success) processedCount++;
    }

    // 5. Update Global Automation Status
    await statusRef.set({
      lastProcessedAt: FieldValue.serverTimestamp(),
      lastProcessedCount: processedCount
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      message: `Recovery logic complete. Units processed: ${processedCount}.`
    });

  } catch (err: any) {
    console.error("[RECOVERY-API-ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
