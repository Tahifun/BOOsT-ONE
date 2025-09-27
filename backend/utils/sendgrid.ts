import logger from './logger.js'

// utils/sendgrid.ts
// Robustes Typing ohne .default-Typabh�ngigkeit
import * as sgMail from "@sendgrid/mail";

const API_KEY = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY || "";
let initialized = false;

export function initSendgrid() {
  if (!initialized) {
    try {
      if (API_KEY) (sgMail as any).setApiKey(API_KEY);
      initialized = true;
      // eslint-disable-next-line no-console
      logger.debug("? SendGrid initialized");
    } catch {
      // ignore
    }
  }
}

export async function sendEmail(opts: {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  initSendgrid();
  const from = opts.from || process.env.SENDGRID_FROM || "no-reply@example.com";
  await (sgMail as any).send({
    to: opts.to,
    from,
    subject: opts.subject,
    text: opts.text ?? "",
    html: opts.html ?? `<p>${opts.text ?? ""}</p>`,
  });
}

export default { initSendgrid, sendEmail };
