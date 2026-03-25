import { Firestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

interface NotificationConfig {
  enabled: boolean;
  subject: string;
  body: string;
}

const DEFAULT_TEMPLATES: Record<string, NotificationConfig> = {
  orderConfirmation: {
    enabled: true,
    subject: "Order Confirmed: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} is confirmed. Our studio is preparing your pieces.\n\nYOUR SELECTION:\n{{product_list}}\n\nTotal: {{order_total}}\n\nWe will notify you when items ship."
  },
  statusChanged: {
    enabled: true,
    subject: "Update: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} status updated to: {{status}}.\n\nRegards,\nThe Team"
  },
  shipped: {
    enabled: true,
    subject: "Shipped: Order #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order has shipped.\n\nCARRIER: {{courier}}\nTRACKING: {{tracking_number}}\n\nTrack here: https://fslno.ca/track/{{tracking_number}}\n\nThanks for shopping."
  },
  paid: {
    enabled: true,
    subject: "Payment Received: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nWe've received your payment of {{order_total}} for order #{{order_id}}.\n\nThank you!"
  }
};

export async function queueNotification(
  db: Firestore, 
  type: string, 
  to: string, 
  variables: Record<string, string>,
  staffCopyEmails: string[] = []
) {
  try {
    const PRIMARY_STAFF_EMAIL = 'goal@feiselinosportjerseys.ca';

    // 1. Fetch live config or use defaults
    const configRef = doc(db, 'config', 'notifications');
    const configSnap = await getDoc(configRef);
    const config = configSnap.exists() ? configSnap.data() : {};
    
    const template = config[type] || DEFAULT_TEMPLATES[type];
    
    if (!template || template.enabled === false) {
      console.log(`[NOTIFICATIONS] Template ${type} is disabled or missing.`);
      return;
    }

    // 2. Perform variable replacement
    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, value || '');
      body = body.replace(placeholder, value || '');
    });

    // 3. Prepare common fields
    const senderEmail = config.senderEmail || PRIMARY_STAFF_EMAIL;
    const senderName = config.senderName || 'FSLNO Store';
    
    const mailPayload = {
      message: {
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br/>')
      },
      from: `${senderName} <${senderEmail}>`,
      replyTo: senderEmail,
      createdAt: serverTimestamp(),
    };

    // 4. Queue for Customer
    await addDoc(collection(db, 'mail'), {
      ...mailPayload,
      to: [to],
    });

    // 5. Queue for Staff (if any)
    // Always include the primary staff email
    const finalStaffEmails = Array.from(new Set([...staffCopyEmails, PRIMARY_STAFF_EMAIL]));
    
    if (finalStaffEmails.length > 0) {
      await addDoc(collection(db, 'mail'), {
        ...mailPayload,
        message: {
          ...mailPayload.message,
          subject: `[STAFF ALERT] ${subject}`
        },
        to: finalStaffEmails,
      });
    }

    console.log(`[NOTIFICATIONS] Queued ${type} for ${to}`);
  } catch (error) {
    console.error("[NOTIFICATIONS] Failed to queue email:", error);
  }
}

export function formatProductList(items: any[]) {
  return items.map(item => `- ${item.name} (${item.size || 'N/A'}) x${item.quantity}`).join('\n');
}
