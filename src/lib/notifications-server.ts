import { getAdminFieldValue } from './firebase-admin';

/**
 * @fileOverview Email Sender.
 * This sends emails from the server without slowing down the website.
 */

interface NotificationConfig {
  enabled: boolean;
  subject: string;
  body: string;
}

const DEFAULT_TEMPLATES: Record<string, NotificationConfig> = {
  orderConfirmation: {
    enabled: true,
    subject: "Confirmed / Confirmée: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} is confirmed. Our studio is preparing your pieces.\n\nYOUR ITEMS:\n{{product_manifest}}\n\nTotal: {{order_total}}\n\nWe will notify you when items ship.\n\n---\n\nBonjour {{customer_name}},\n\nVotre commande #{{order_id}} est confirmée. Notre studio prépare vos articles.\n\nVOTRE SÉLECTION:\n{{product_manifest}}\n\nTotal: {{order_total}}\n\nNous vous informerons lors de l'expédition."
  },
  statusChanged: {
    enabled: true,
    subject: "Update / Mise à jour: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} status updated to: {{status}}.\n\n---\n\nBonjour {{customer_name}},\n\nLe statut de votre commande #{{order_id}} a été mis à jour: {{status}}."
  },
  shipped: {
    enabled: true,
    subject: "Shipped / Expédiée: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order has shipped.\n\nCARRIER: {{courier}}\nTRACKING: {{tracking_number}}\n\nTrack here: https://track.aftership.com/{{tracking_number}}\n\nSHIPPING TO:\n{{shipping_address}}\n\nThanks for shopping.\n\n---\n\nBonjour {{customer_name}},\n\nVotre commande a été expédiée.\n\nTRANSPORTEUR: {{courier}}\nSUIVI: {{tracking_number}}\n\nSuivez ici: https://track.aftership.com/{{tracking_number}}\n\nEXPÉDIÉ À:\n{{shipping_address}}\n\nMerci de votre confiance."
  }
};

/**
 * Send an email from the server.
 */
export async function queueNotificationServer(
  db: any,
  type: string,
  to: string,
  variables: Record<string, string>,
  staffCopyEmails: string[] = []
) {
  try {
    // 1. Fetch live configs
    const [notifSnap, storeSnap] = await Promise.all([
      db.collection('config').doc('notifications').get(),
      db.collection('config').doc('store').get()
    ]);

    const notifConfig = notifSnap.exists ? (notifSnap.data() || {}) : {};
    const PRIMARY_STAFF_EMAIL = notifConfig.adminEmail || 'goal@feiselinosportjerseys.ca';
    const storeConfig = storeSnap.exists ? (storeSnap.data() || {}) : {};
    
    const template = notifConfig[type] || DEFAULT_TEMPLATES[type];
    
    if (!template || template.enabled === false) {
      console.log(`[NOTIFICATIONS-SERVER] Template ${type} is disabled or missing.`);
      return;
    }

    // 2. Prepare Global Identity Variables
    const businessIdentity = {
      business_name: storeConfig.businessName || 'Feiselino (FSLNO) Teams',
      business_email: storeConfig.email || PRIMARY_STAFF_EMAIL,
      business_phone: storeConfig.phone || '',
      business_address: storeConfig.address || 'Guelph, ON',
      business_logo: storeConfig.logoUrl || ''
    };

    const finalVariables = { ...businessIdentity, ...variables };

    // 3. Perform variable replacement
    let subject = template.subject;
    let body = template.body;

    Object.entries(finalVariables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, String(value || ''));
      body = body.replace(placeholder, String(value || ''));
    });

    // 4. Prepare common fields
    const senderEmail = notifConfig.senderEmail || storeConfig.email || PRIMARY_STAFF_EMAIL;
    const senderName = notifConfig.senderName || storeConfig.businessName || 'Feiselino (FSLNO) Teams';
    
    const formattedHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 8px; color: #1a1c1e;">
        ${businessIdentity.business_logo ? `<img src="${businessIdentity.business_logo}" style="height: 40px; margin-bottom: 30px;" />` : `<h1 style="font-size: 24px; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 30px; text-transform: uppercase;">${businessIdentity.business_name}</h1>`}
        <div style="line-height: 1.6; font-size: 14px;">
          ${body.replace(/\n/g, '<br/>')}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.8;">
          Feiselino (FSLNO) Teams Team &bull; ${businessIdentity.business_address}<br/>
          ${businessIdentity.business_phone ? `Phone: ${businessIdentity.business_phone} &bull; ` : ''}
          ${businessIdentity.business_email ? `Email: ${businessIdentity.business_email}` : ''}<br/>
          &copy; ${new Date().getFullYear()} ${businessIdentity.business_name}. All Rights Reserved.
        </div>
      </div>
    `;

    const FieldValue = getAdminFieldValue();
    const mailPayload = {
      message: {
        subject: subject,
        text: body,
        html: formattedHtml
      },
      from: `${senderName} <${senderEmail}>`,
      replyTo: senderEmail,
      createdAt: FieldValue.serverTimestamp(),
    };

    // 5. Queue for Customer
    await db.collection('mail').add({
      ...mailPayload,
      to: [to],
    });

    // 6. Queue for Staff
    const finalStaffEmails = Array.from(new Set([...staffCopyEmails, PRIMARY_STAFF_EMAIL]));
    const isOrderType = type === 'orderConfirmation';
    const staffAlertsEnabled = (notifConfig.orderNotificationsEnabled !== false);

    if (finalStaffEmails.length > 0 && (isOrderType ? staffAlertsEnabled : true)) {
      await db.collection('mail').add({
        ...mailPayload,
        message: {
          ...mailPayload.message,
          subject: `[FSLNO SPORT] ${subject}`
        },
        to: finalStaffEmails,
      });
    }

    console.log(`[NOTIFICATIONS-SERVER] Email for ${type} sent to ${to}`);
  } catch (error) {
    console.error("[NOTIFICATIONS-SERVER] Failed to send email:", error);
  }
}
