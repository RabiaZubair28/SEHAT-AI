import { Injectable, Logger } from '@nestjs/common';

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * WhatsApp Cloud API delivery. Configure with WHATSAPP_PHONE_NUMBER_ID and
 * WHATSAPP_ACCESS_TOKEN (optionally WHATSAPP_API_BASE_URL). Meta charges per
 * conversation, so costs must be disclosed before deployment (SH-09).
 * When not configured, delivery fails clearly and is recorded as failed.
 */
@Injectable()
export class NutritionAdvisorWhatsAppService {
  private readonly logger = new Logger(NutritionAdvisorWhatsAppService.name);

  get configured() {
    return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
  }

  async sendDocument(
    toE164: string,
    pdf: Buffer,
    filename: string,
    caption: string,
  ): Promise<WhatsAppSendResult> {
    if (!this.configured) {
      return { ok: false, error: 'WhatsApp service is not configured on the server. Download the PDF and share it manually.' };
    }
    const base = (process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com/v21.0').replace(/\/$/, '');
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const headers = { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` };

    try {
      const form = new FormData();
      form.append('messaging_product', 'whatsapp');
      form.append('type', 'application/pdf');
      form.append('file', new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }), filename);
      const upload = await fetch(`${base}/${phoneId}/media`, { method: 'POST', headers, body: form });
      const uploaded = await upload.json();
      if (!upload.ok || !uploaded?.id) {
        return { ok: false, error: `Upload failed: ${uploaded?.error?.message ?? upload.status}`.slice(0, 300) };
      }

      const send = await fetch(`${base}/${phoneId}/messages`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toE164.replace('+', ''),
          type: 'document',
          document: { id: uploaded.id, filename, caption: caption.slice(0, 1000) },
        }),
      });
      const sent = await send.json();
      if (!send.ok) {
        return { ok: false, error: `Send failed: ${sent?.error?.message ?? send.status}`.slice(0, 300) };
      }
      return { ok: true, messageId: sent?.messages?.[0]?.id };
    } catch (err) {
      this.logger.warn(`WhatsApp delivery error: ${err?.message ?? err}`);
      return { ok: false, error: 'Could not reach the WhatsApp service. Please try again.' };
    }
  }
}

/** Normalise Pakistani mobile numbers to +92XXXXXXXXXX, or null if invalid. */
export function normalizePkMobile(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/[^\d+]/g, '');
  let n = digits;
  if (n.startsWith('+92')) n = n.slice(3);
  else if (n.startsWith('0092')) n = n.slice(4);
  else if (n.startsWith('92') && n.length === 12) n = n.slice(2);
  else if (n.startsWith('0')) n = n.slice(1);
  return /^3\d{9}$/.test(n) ? `+92${n}` : null;
}

export const maskPhone = (e164: string | null) =>
  e164 ? `${e164.slice(0, 4)}•••••${e164.slice(-3)}` : null;
