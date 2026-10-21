const nodemailer = require('nodemailer');

// Configure transporter from environment variables or fallback to test/logging mode
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || '"Aura Atelier Pakistan" <concierge@auraatelier.pk>';

let transporter = null;
if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: Number(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  console.log('[MAILER] Production SMTP Transporter initialized successfully.');
} else {
  console.log('[MAILER] Live SMTP not configured in .env. Order emails will be logged and prepared gracefully.');
}

// Format Pakistani currency cleanly
function formatPKR(val) {
  const num = Number(val) || 0;
  return `Rs. ${num.toLocaleString('en-PK')}`;
}

// Generate luxury HTML email templates
function generateEmailHTML(order, type = 'placed') {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsRows = items.map(it => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #1c1917;">
        <strong>${it.name}</strong><br/>
        <span style="color: #78716c; font-size: 11px;">Size: ${it.size} | Color: ${it.color} | Qty: ${it.quantity}</span>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 13px; font-weight: bold; color: #1c1917;">
        ${formatPKR(it.price * it.quantity)}
      </td>
    </tr>
  `).join('');

  let title = 'Commission Confirmed';
  let bannerText = 'Thank you for choosing Aura Atelier. Your bespoke order has been registered in our Lahore flagship ledger.';
  
  if (type === 'confirmed') {
    title = 'Order Confirmed & Allocated';
    bannerText = 'Your commission has been verified by our master tailors and is being prepared with white-glove artisan care.';
  } else if (type === 'dispatched') {
    title = 'Dispatched for Delivery';
    bannerText = `Your parcel has been handed over to ${order.courier_name || 'TCS Express'} under tracking reference: <strong>${order.courier_tracking_number || 'Pending'}</strong>.`;
  } else if (type === 'delivered') {
    title = 'Delivered to Destination';
    bannerText = 'Your order has been signed for and safely delivered. We hope you cherish your bespoke garment.';
  } else if (type === 'cancelled') {
    title = 'Order Cancellation Notice';
    bannerText = 'Your commission has been cancelled as requested. If payment was made, a refund will be processed within 2 business days.';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title} - Aura Atelier Pakistan</title>
      <style>
        body { font-family: 'Georgia', serif; background-color: #faf9f6; color: #1c1917; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #1c1917; padding-bottom: 20px; margin-bottom: 25px; }
        .logo { font-size: 24px; letter-spacing: 0.25em; text-transform: uppercase; font-weight: bold; color: #1c1917; }
        .tagline { font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase; color: #78716c; margin-top: 5px; }
        .banner { background: #f5f5f4; border-left: 3px solid #d4af37; padding: 15px; margin-bottom: 25px; font-size: 13px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .totals-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .footer { text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #e7e5e4; padding-top: 20px; margin-top: 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AURA ATELIER</div>
          <div class="tagline">HAUTE COUTURE & READY-TO-WEAR — PAKISTAN</div>
        </div>

        <h2 style="font-size: 20px; margin-bottom: 10px; font-weight: normal; color: #1c1917;">${title}</h2>
        <div class="banner">${bannerText}</div>

        <table style="width: 100%; margin-bottom: 20px; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <tr>
            <td>
              <strong>Order ID:</strong> ${order.id}<br/>
              <strong>Date:</strong> ${order.created_at || new Date().toLocaleDateString()}<br/>
              <strong>Payment:</strong> ${order.payment_method || 'Cash on Delivery'} (${order.payment_status || 'Pending'})
            </td>
            <td style="text-align: right;">
              <strong>Delivery To:</strong><br/>
              ${order.customer_name}<br/>
              ${order.address}, ${order.city}<br/>
              Phone: ${order.customer_phone}
            </td>
          </tr>
        </table>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #1c1917; padding-bottom: 5px; margin-bottom: 10px;">Itemized Garments</h3>
        <table class="details-table">
          ${itemsRows}
        </table>

        <table class="totals-table">
          <tr>
            <td style="font-size: 12px; color: #78716c;">Subtotal:</td>
            <td style="text-align: right; font-size: 12px; font-weight: 600;">${formatPKR(order.subtotal)}</td>
          </tr>
          ${order.discount_amount > 0 ? `
          <tr>
            <td style="font-size: 12px; color: #15803d;">Voucher Discount (${order.coupon_code || ''}):</td>
            <td style="text-align: right; font-size: 12px; font-weight: 600; color: #15803d;">-${formatPKR(order.discount_amount)}</td>
          </tr>` : ''}
          <tr>
            <td style="font-size: 12px; color: #78716c;">Express Delivery Charges:</td>
            <td style="text-align: right; font-size: 12px; font-weight: 600;">${order.delivery_fee === 0 ? 'Complimentary' : formatPKR(order.delivery_fee)}</td>
          </tr>
          <tr>
            <td style="padding-top: 10px; font-size: 16px; font-weight: bold; border-top: 1px solid #1c1917;">Total Payable:</td>
            <td style="padding-top: 10px; text-align: right; font-size: 18px; font-weight: bold; border-top: 1px solid #1c1917; color: #1c1917;">${formatPKR(order.total_amount)}</td>
          </tr>
        </table>

        <div class="footer">
          <p>Aura Atelier Flagship: 12-C, MM Alam Road, Gulberg III, Lahore, Pakistan</p>
          <p>For WhatsApp tailoring assistance: +92 300 4562872 | Email: concierge@auraatelier.pk</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendOrderNotification(order, type = 'placed') {
  const subjectMap = {
    placed: `Order Confirmed #${order.id} - Aura Atelier Pakistan`,
    confirmed: `Order Verification Complete #${order.id} - Aura Atelier`,
    dispatched: `Dispatched via ${order.courier_name || 'Courier'} #${order.id} - Aura Atelier`,
    delivered: `Delivered Successfully #${order.id} - Aura Atelier`,
    cancelled: `Order Cancellation Notice #${order.id} - Aura Atelier`
  };

  const subject = subjectMap[type] || `Order Update #${order.id}`;
  const html = generateEmailHTML(order, type);

  console.log(`[EMAIL DISPATCH] Triggered '${type}' notification for Order #${order.id} to ${order.customer_email}`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: mailFrom,
        to: order.customer_email,
        subject,
        html
      });
      console.log(`[EMAIL DISPATCH SUCCESS] Delivered to ${order.customer_email}`);
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send email via SMTP:`, err.message);
    }
  } else {
    console.log(`[EMAIL SIMULATION] SMTP not configured. Stored email payload for #${order.id} to ${order.customer_email}.`);
  }
}

async function sendStatusUpdateEmail(order, status, note) {
  const typeMap = {
    'Confirmed': 'confirmed',
    'Processing': 'confirmed',
    'Shipped': 'dispatched',
    'Delivered': 'delivered',
    'Cancelled': 'cancelled'
  };
  const type = typeMap[status] || 'confirmed';
  return sendOrderNotification(order, type);
}

async function sendPaymentReceivedEmail(order, details) {
  console.log(`[EMAIL PAYMENT VERIFICATION] Order #${order.id}: Bank proof received (${details?.referenceNumber}). Notifying customer & accounts.`);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: mailFrom,
        to: order.customer_email,
        subject: `Payment Verification Pending #${order.id} - Aura Atelier`,
        html: `<p>Dear ${order.customer_name}, we received your bank transfer reference: <strong>${details?.referenceNumber}</strong>. Our accounts team will reconcile this against our statement and update your order status shortly.</p>`
      });
    } catch (err) {
      console.error('[EMAIL ERROR]', err.message);
    }
  }
}

async function sendAdminOrderNotification(order) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@atelier.com';
  console.log(`[ADMIN NOTIFICATION] Incoming order #${order.id} for Rs. ${order.total_amount?.toLocaleString('en-PK')} from ${order.customer_name} (${order.city})`);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: mailFrom,
        to: adminEmail,
        subject: `[NEW ORDER ALERT] #${order.id} - ${order.customer_name} (${order.city}) - Rs. ${order.total_amount?.toLocaleString('en-PK')}`,
        html: generateEmailHTML(order, 'placed')
      });
    } catch (err) {
      console.error('[ADMIN EMAIL ERROR]', err.message);
    }
  }
}

async function sendReviewInvitationEmail(order, item) {
  console.log(`[REVIEW INVITATION EMAIL] Sending review invitation for order #${order.id} (${item?.name}) to ${order.customer_email}`);
  if (transporter) {
    try {
      const reviewUrl = `http://localhost:5000/shop?reviewOrderId=${encodeURIComponent(order.id)}&reviewProductId=${encodeURIComponent(item.product_id || item.id)}`;
      await transporter.sendMail({
        from: mailFrom,
        to: order.customer_email,
        subject: `Your Appraisal of "${item.name}" - Aura Atelier Pakistan`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #ffffff; border: 1px solid #e7e5e4;">
            <h2 style="text-align: center; font-size: 20px; letter-spacing: 0.2em; text-transform: uppercase;">AURA ATELIER</h2>
            <p style="text-align: center; color: #78716c; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">Exclusive Patron Appraisal Request</p>
            <div style="border-top: 1px solid #d4af37; margin: 20px 0;"></div>
            <p>Dear ${order.customer_name},</p>
            <p>We hope you are thoroughly delighted with your recent order <strong>#${order.id}</strong>. As an esteemed patron of our atelier, your appraisal regarding the craftsmanship of <strong>"${item.name}"</strong> helps maintain our dedication to sartorial excellence.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" style="background-color: #1c1917; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: bold; border-radius: 6px; display: inline-block;">
                Submit Verified Appraisal
              </a>
            </p>
            <p style="font-size: 11px; color: #a8a29e; text-align: center;">Verified Purchase Reference: ${order.id}</p>
          </div>
        `
      });
    } catch (err) {
      console.error('[REVIEW EMAIL ERROR]', err.message);
    }
  }
}

module.exports = {
  sendOrderNotification,
  sendStatusUpdateEmail,
  sendPaymentReceivedEmail,
  sendAdminOrderNotification,
  sendReviewInvitationEmail,
  formatPKR
};

