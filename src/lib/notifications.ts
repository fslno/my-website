import { Firestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

interface NotificationConfig {
  enabled: boolean;
  subject: string;
  body: string;
}

const DEFAULT_TEMPLATES: Record<string, NotificationConfig> = {
  orderConfirmation: {
    enabled: true,
    subject: "Confirmed / Confirmée: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nYour order #{{order_id}} is confirmed. Our studio is preparing your pieces.\n\nYOUR SELECTION:\n{{product_manifest}}\n\nTotal: {{order_total}}\n\nWe will notify you when items ship.\n\n---\n\nBonjour {{customer_name}},\n\nVotre commande #{{order_id}} est confirmée. Notre studio prépare vos articles.\n\nVOTRE SÉLECTION:\n{{product_manifest}}\n\nTotal: {{order_total}}\n\nNous vous informerons lors de l'expédition."
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
  },
  paid: {
    enabled: true,
    subject: "Payment Received / Paiement Reçu: #{{order_id}}",
    body: "Hi {{customer_name}},\n\nWe've received your payment of {{order_total}} for order #{{order_id}}.\n\nThank you!\n\n---\n\nBonjour {{customer_name}},\n\nNous avons bien reçu votre paiement de {{order_total}} pour la commande #{{order_id}}.\n\nMerci!"
  },
  invoice: {
    enabled: true,
    subject: "{{invoice_number}} - Official Transmission / Transmission Officielle",
    body: "Hi {{customer_name}},\n\nPlease find your invoice {{invoice_number}} for {{order_total}} below.\n\nItems:\n{{product_manifest}}\n\n<div style=\"background-color: #f8fafc; padding: 25px; border: 1px solid #f1f5f9; margin-top: 30px;\">\n  <div style=\"font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; letter-spacing: 0.1em;\">Payment Breakdown / Récapitulatif</div>\n  <div style=\"display: flex; flex-direction: column; gap: 8px; font-size: 12px; font-weight: 700; color: #475569;\">\n    <div style=\"display: flex; justify-content: space-between;\"><span>Subtotal / Sous-total:</span> <span>{{subtotal}}</span></div>\n    <div style=\"display: flex; justify-content: space-between;\"><span>Shipping / Expédition:</span> <span>{{shipping_fee}}</span></div>\n    <div style=\"display: flex; justify-content: space-between;\"><span>Tax / Taxe:</span> <span>{{tax}}</span></div>\n    <div style=\"display: flex; justify-content: space-between;\"><span>Processing / Frais:</span> <span>{{processing_fee}}</span></div>\n    <div style=\"display: flex; justify-content: space-between; font-size: 14px; color: #000; font-weight: 900; border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 8px;\"><span>TOTAL:</span> <span>{{order_total}}</span></div>\n  </div>\n  <div style=\"margin-top: 15px; font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;\">Method / Méthode: {{payment_method}}</div>\n</div>\n\nRegards,\nFeiselino (FSLNO) Sport Jerseys\n\n---\n\nBonjour {{customer_name}},\n\nVeuillez trouver ci-dessous votre facture {{invoice_number}} d'un montant de {{order_total}}.\n\nCordialement,\nFeiselino (FSLNO) Sport Jerseys"
  },
  newsletterWelcome: {
    enabled: true,
    subject: "Welcome / Bienvenue - Feiselino (FSLNO) Sport Jerseys",
    body: "Hi {{customer_name}},\n\nYou are now part of our community. You'll be the first to receive updates on new drops, exclusive collections, and archival releases.\n\nRegards,\nFeiselino (FSLNO) Sport Jerseys Team\n\n---\n\nBonjour {{customer_name}},\n\nVous faites maintenant partie de notre communauté. Vous serez les premiers à recevoir des nouvelles sur les nouveaux lancements, les collections exclusives et les sorties d'archives.\n\nCordialement,\nL'équipe Feiselino (FSLNO) Sport Jerseys"
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

    // 1. Fetch live configs (Store Identity + Notification Templates)
    const [notifSnap, storeSnap] = await Promise.all([
      getDoc(doc(db, 'config', 'notifications')),
      getDoc(doc(db, 'config', 'store'))
    ]);

    const notifConfig = notifSnap.exists() ? notifSnap.data() : {};
    const storeConfig = storeSnap.exists() ? storeSnap.data() : {};
    
    const template = notifConfig[type] || DEFAULT_TEMPLATES[type];
    
    if (!template || template.enabled === false) {
      console.log(`[NOTIFICATIONS] Template ${type} is disabled or missing.`);
      return;
    }

    // 2. Prepare Global Identity Variables
    const businessIdentity = {
      business_name: storeConfig.businessName || 'Feiselino (FSLNO) Sport Jerseys',
      business_email: storeConfig.email || PRIMARY_STAFF_EMAIL,
      business_phone: storeConfig.phone || '',
      business_address: storeConfig.address || 'Guelph, ON',
      business_logo: storeConfig.logoUrl || ''
    };

    // Merge global identity into variables so templates can use them
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
    const senderName = notifConfig.senderName || storeConfig.businessName || 'Feiselino (FSLNO) Sport Jerseys';
    
    // Wraps the body in a branded layout
    const formattedHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 8px; color: #1a1c1e;">
        ${businessIdentity.business_logo ? `<img src="${businessIdentity.business_logo}" style="height: 40px; margin-bottom: 30px;" />` : `<h1 style="font-size: 24px; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 30px; text-transform: uppercase;">${businessIdentity.business_name}</h1>`}
        <div style="line-height: 1.6; font-size: 14px;">
          ${body.replace(/\n/g, '<br/>')}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.8;">
          Feiselino (FSLNO) Sport Jerseys Team &bull; ${businessIdentity.business_address}<br/>
          ${businessIdentity.business_phone ? `Phone: ${businessIdentity.business_phone} &bull; ` : ''}
          ${businessIdentity.business_email ? `Email: ${businessIdentity.business_email}` : ''}<br/>
          &copy; ${new Date().getFullYear()} ${businessIdentity.business_name}. All Rights Reserved.
        </div>
      </div>
    `;

    const mailPayload = {
      message: {
        subject: subject,
        text: body,
        html: formattedHtml
      },
      from: `${senderName} <${senderEmail}>`,
      replyTo: senderEmail,
      createdAt: serverTimestamp(),
    };

    // 5. Queue for Customer
    await addDoc(collection(db, 'mail'), {
      ...mailPayload,
      to: [to],
    });

    // 6. Queue for Staff (if any)
    const finalStaffEmails = Array.from(new Set([...staffCopyEmails, PRIMARY_STAFF_EMAIL]));
    
    if (finalStaffEmails.length > 0) {
      // Specialized Staff Layout for New Orders
      let staffSubject = `[STAFF ALERT] ${subject}`;
      let staffHtml = formattedHtml;

      if (type === 'orderConfirmation') {
        staffSubject = `[ORDER RECEIVED] ${variables.customer_name} - ${variables.order_total} (${variables.payment_method || 'PENDING'})`;
        staffHtml = `
          <div style="font-family: 'Inter', sans-serif; color: #1a1c1e;">
            <div style="background-color: #000; color: #fff; padding: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; font-size: 14px;">
              [ STAFF FULFILLMENT BRIEF ]
            </div>
            <div style="padding: 30px; border: 1px solid #eee; border-top: none;">
              <div style="margin-bottom: 30px; display: grid; grid-template-cols: 1fr 1fr; gap: 20px;">
                <div>
                  <div style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Customer</div>
                  <div style="font-weight: 800; font-size: 14px;">${variables.customer_name}</div>
                  <div style="font-size: 10px; color: #666;">${to}</div>
                </div>
                <div>
                  <div style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Status</div>
                  <div style="font-weight: 800; font-size: 14px; color: #ef4444;">NEW ORDER</div>
                </div>
              </div>

              <div style="margin-bottom: 30px;">
                <div style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Payment Details</div>
                <div style="font-weight: 800; font-size: 12px; display: flex; justify-content: between;">
                  <span>TOTAL:</span> <span>${variables.order_total}</span>
                </div>
                <div style="font-weight: 700; font-size: 11px; color: #666; margin-top: 5px;">
                  METHOD: ${variables.payment_method?.toUpperCase() || 'UNKNOWN'}
                </div>
              </div>

              <div style="margin-bottom: 30px;">
                <div style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Shipping Destination</div>
                <div style="font-weight: 700; font-size: 11px; white-space: pre-line; color: #1a1c1e;">
                  ${variables.shipping_address || 'PICKUP / NO ADDRESS PROVIDED'}
                </div>
              </div>

              <div style="margin-bottom: 30px;">
                <div style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Fulfillment Manifest</div>
                ${variables.product_manifest || variables.product_list}
              </div>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dotted #ccc; text-align: center;">
                <a href="https://feiselinosportjerseys.ca/admin/orders/${variables.order_id}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">Open Order Details</a>
              </div>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; font-size: 9px; color: #94a3b8; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
              This is an automated administrative broadcast. Unauthorized decryption prohibited.
            </div>
          </div>
        `;
      }

      await addDoc(collection(db, 'mail'), {
        ...mailPayload,
        message: {
          ...mailPayload.message,
          subject: staffSubject,
          html: staffHtml
        },
        to: finalStaffEmails,
      });
    }

    console.log(`[NOTIFICATIONS] Queued ${type} for ${to} using sender ${senderEmail}`);
  } catch (error) {
    console.error("[NOTIFICATIONS] Failed to queue email:", error);
  }
}

export function formatProductList(items: any[]) {
  return items.map(item => `- ${item.name} (${item.size || 'N/A'}) x${item.quantity}`).join('\n');
}

export function formatProductListHtml(items: any[]) {
  return items.map(item => `
    <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center; border-bottom: 1px solid #f8fafc; padding-bottom: 15px;">
      <div style="width: 60px; height: 80px; background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 4px; overflow: hidden; position: relative;">
        ${item.image ? `<img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name}" />` : ''}
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #1a1c1e; margin-bottom: 4px;">
          ${item.name}
        </div>
        <div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center;">
          <span>SIZE: ${item.size || 'N/A'} &bull; QTY: ${item.quantity}</span>
          <span style="color: #1a1c1e;">C$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        ${(item.customName || item.customNumber) ? `
          <div style="margin-top: 6px; padding: 6px; background-color: #f0f9ff; border: 1px solid #bae6fd; font-size: 10px; color: #0369a1; font-weight: 800; text-transform: uppercase;">
            CUSTOM: ${item.customName || ''} ${item.customNumber ? `#${item.customNumber}` : ''}
          </div>
        ` : ''}
        ${item.specialNote ? `
          <div style="margin-top: 4px; font-size: 9px; color: #64748b; font-style: italic;">
            Note: "${item.specialNote}"
          </div>
        ` : ''}
        <div style="margin-top: 8px;">
          ${item.productId ? `
            <a href="https://feiselinosportjerseys.ca/products/${item.productId}" style="font-size: 10px; color: #000; font-weight: 800; text-decoration: none; border-bottom: 1px solid #000; text-transform: uppercase;">View Item</a>
          ` : `
            <span style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">No Link Available</span>
          `}
        </div>
      </div>
    </div>
  `).join('');
}
