
/**
 * @fileOverview Firebase Cloud Function for automated post-purchase review requests.
 * 
 * Logic:
 * - Triggered when an order status is updated to 'delivered'.
 * - Schedules a review request email manifest to be dispatched 2 days later.
 */

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Orchestrates the review request dispatch protocol.
 * Monitors order updates and identifies transitions to 'delivered'.
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
      message: {
        subject: `How is the fit? Share your thoughts on your FSLNO Studio selection`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #000;">
            <h1 style="text-transform: uppercase; font-size: 24px; letter-spacing: -0.02em;">Selection Feedback</h1>
            <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #666; letter-spacing: 0.2em;">Order #${orderId.substring(0, 8)}</p>
            
            <p style="font-size: 14px; line-height: 1.6; margin: 30px 0;">
              Hi ${customer?.name || 'there'},<br/><br/>
              Now that you've had a few days with your archive pieces, we'd love to hear your thoughts on the silhouette and fit. Your feedback helps us refine the studio experience.
            </p>

            <div style="margin: 40px 0;">
              ${items.map((item: any) => `
                <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
                  <img src="${item.image}" style="width: 80px; height: 100px; object-fit: cover; border: 1px solid #eee;" />
                  <div>
                    <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 0;">${item.name}</p>
                    <a href="https://fslno.ca/products/${item.id}?review=true" style="display: inline-block; margin-top: 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #000; text-decoration: underline; letter-spacing: 0.1em;">Leave Review</a>
                  </div>
                </div>
              `).join('')}
            </div>

            <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; margin-top: 60px;">
              © ${new Date().getFullYear()} FSLNO STUDIO. ALL RIGHTS RESERVED.
            </p>
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
