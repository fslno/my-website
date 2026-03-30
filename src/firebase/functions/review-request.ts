/**
 * @fileOverview Firebase Cloud Function for automated post-purchase review requests.
 */

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Authoritatively initialize the Admin SDK for background tasks
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Orchestrates the review request dispatch protocol.
 */
export const orderDeliveredReviewRequest = onDocumentUpdated("orders/{orderId}", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) return;

  // Authoritative Check: Detect transition to 'delivered' status
  if (beforeData.status !== 'delivered' && afterData.status === 'delivered') {
    const db = getFirestore();
    const orderId = event.params.orderId;
    const { email, customer, items } = afterData;

    // Logic for scheduling: Orchestrate a 2-day temporal delay
    const sendAt = new Date();
    sendAt.setDate(sendAt.getDate() + 2);

    const emailManifest = {
      to: email,
      from: "FSLNO <goal@feiselinosportjerseys.ca>",
      replyTo: "goal@feiselinosportjerseys.ca",
      message: {
        subject: `Review your archive purchase: Order #${orderId.substring(0, 8)}`,
        html: `
          <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 4px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="text-transform: uppercase; font-size: 24px; letter-spacing: -0.02em; margin: 0; font-weight: 900;">Order Review</h1>
              <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #999; letter-spacing: 0.3em; margin-top: 10px;">Operational Status: Delivered</p>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 30px; color: #333;">
              Hi ${customer?.name || 'there'},<br/><br/>
              Your selection from the archive has been delivered. We invite you to share your feedback on the pieces below.
            </p>

            <div style="margin: 40px 0;">
              ${items.map((item: any) => `
                <div style="display: flex; gap: 24px; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #f5f5f5; padding-bottom: 24px;">
                  <img src="${item.image}" style="width: 100px; height: 125px; object-fit: cover; border: 1px solid #f0f0f0;" />
                  <div>
                    <p style="font-size: 12px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 0.05em;">${item.name}</p>
                    <p style="font-size: 10px; color: #666; margin: 4px 0 12px 0; text-transform: uppercase;">Size: ${item.size || 'OS'}</p>
                    <a href="https://fslno.ca/products/${item.id}?review=true" style="display: inline-block; padding: 10px 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; background: #000; color: #fff; text-decoration: none; letter-spacing: 0.2em;">Leave Review</a>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="border-top: 2px solid #000; padding-top: 30px; margin-top: 60px; text-align: center;">
              <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">
                FEISELINO (FSLNO) STUDIO OPERATIONS
              </p>
              <p style="font-size: 9px; color: #ccc; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 8px;">
                © ${new Date().getFullYear()} ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        `,
      },
      deliveryDate: sendAt,
      status: 'scheduled'
    };

    // Dispatch to the mail collection for the automated messaging extension
    await db.collection("mail").add(emailManifest);
    
    console.log(`[FORENSIC] Review request scheduled for order ${orderId} to ${email}`);
  }
});
