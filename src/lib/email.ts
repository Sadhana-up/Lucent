import { Resend } from "resend";
import { formatCurrency } from "@/lib/utils";

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const devEmailOverride = process.env.DEV_EMAIL_OVERRIDE?.trim() || undefined;
const emailFrom =
  process.env.EMAIL_FROM?.trim() || "Lucent <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Send an email via Resend.
 *
 * In development, if DEV_EMAIL_OVERRIDE is set, the message is redirected to
 * that inbox and the real recipient is shown in the subject. This lets you
 * exercise the full auth email flow (verification, reset, 2FA OTP) with a
 * temporary/dev inbox without sending anything to real users.
 *
 * In production DEV_EMAIL_OVERRIDE is always ignored — emails go to the real
 * recipient using the verified EMAIL_FROM address.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log(`[AUTH EMAIL][NO_PROVIDER] to=${to} subject=${subject}`);
    return;
  }

  const isProd = process.env.NODE_ENV === "production";
  const recipient = !isProd && devEmailOverride ? devEmailOverride : to;
  const effectiveSubject =
    !isProd && devEmailOverride ? `[DEV → ${to}] ${subject}` : subject;
  const fromAddress =
    !isProd && devEmailOverride ? "Lucent <onboarding@resend.dev>" : emailFrom;

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: recipient,
    subject: effectiveSubject,
    html,
  });

  if (error) {
    console.error("[Email Error]", {
      name: error.name,
      statusCode: error.statusCode,
      message: error.message,
      subject,
      recipient: recipient.includes("@") ? recipient.split("@")[1] : "unknown",
    });
    throw error;
  } else if (!isProd && devEmailOverride) {
    console.log(
      `[Email] Redirected from ${to} → ${recipient} | Subject: ${subject}`,
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface SellerOrderEmailItem {
  title: string;
  quantity: number;
  price: number;
}

/**
 * Notify a seller that one of their products was purchased. Contains the
 * product name(s), the buyer's location and phone number, and other order
 * details the seller needs to fulfil the order.
 */
export async function sendNewOrderSellerEmail({
  to,
  storeName,
  orderNumber,
  items,
  buyerName,
  buyerEmail,
  contactPhone,
  shippingAddress,
  notes,
}: {
  to: string;
  storeName: string;
  orderNumber: string;
  items: SellerOrderEmailItem[];
  buyerName: string;
  buyerEmail: string;
  contactPhone: string;
  shippingAddress: string;
  notes?: string | null;
}) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#1e293b">${escapeHtml(item.title)}</td>
          <td style="padding:8px 0;color:#64748b;text-align:center">${item.quantity}</td>
          <td style="padding:8px 0;color:#1e293b;text-align:right">${formatCurrency(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join("");

  const notesRow = notes
    ? `<p style="color:#64748b;margin:16px 0 0"><strong style="color:#1e293b">Buyer notes:</strong> ${escapeHtml(notes)}</p>`
    : "";

  await sendEmail({
    to,
    subject: `New order ${orderNumber} — ${storeName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h2 style="color:#1e293b">You have a new order</h2>
        <p style="color:#64748b">
          A buyer has purchased the following from <strong style="color:#1e293b">${escapeHtml(storeName)}</strong>.
        </p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="border-bottom:2px solid #e2e8f0">
              <th style="text-align:left;padding-bottom:8px;color:#1e293b">Product</th>
              <th style="text-align:center;padding-bottom:8px;color:#1e293b">Qty</th>
              <th style="text-align:right;padding-bottom:8px;color:#1e293b">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="border-top:2px solid #e2e8f0">
              <td style="padding-top:8px;color:#1e293b;font-weight:700" colspan="2">Total</td>
              <td style="padding-top:8px;color:#6366f1;font-weight:700;text-align:right">${formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-top:8px">
          <h3 style="color:#1e293b;margin:0 0 8px;font-size:15px">Buyer information</h3>
          <p style="color:#64748b;margin:4px 0">Name: <strong style="color:#1e293b">${escapeHtml(buyerName)}</strong></p>
          <p style="color:#64748b;margin:4px 0">Email: <strong style="color:#1e293b">${escapeHtml(buyerEmail)}</strong></p>
          <p style="color:#64748b;margin:4px 0">Phone: <strong style="color:#1e293b">${escapeHtml(contactPhone)}</strong></p>
          <p style="color:#64748b;margin:4px 0">Location: <strong style="color:#1e293b">${escapeHtml(shippingAddress)}</strong></p>
        </div>

        <p style="color:#64748b;margin-top:16px">
          Order reference: <strong style="color:#1e293b">${escapeHtml(orderNumber)}</strong>
        </p>
        ${notesRow}

        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          Please sign in to your seller dashboard to review and fulfil this order.
        </p>
      </div>
    `,
  });
}
