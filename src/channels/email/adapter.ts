import type { InboundEmail, OutboundEmailPayload } from "./types";

export interface EmailAccountSettings {
  apiKey?: string; // Para Resend / SendGrid / Postmark
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

export const emailAdapter = {
  /**
   * Parseo de webhook Inbound Parse (ej. Resend / Postmark / SendGrid).
   */
  parseInboundWebhook(body: Record<string, unknown>): InboundEmail | null {
    // Formato estándar Resend Webhook / Generic Inbound Parse
    const data = (body.data as Record<string, unknown>) || body;

    const fromRaw = String(data.from || data.sender || "");
    if (!fromRaw) return null;

    // Extraer email y nombre de "Nombre <email@dominio.com>"
    let fromEmail = fromRaw;
    let fromName: string | undefined;

    const match = fromRaw.match(/(.*)<(.*)>/);
    if (match) {
      fromName = match[1].trim().replace(/^["']|["']$/g, "");
      fromEmail = match[2].trim();
    }

    const toRaw = String(data.to || data.recipient || "");
    let accountEmail = toRaw;
    const toMatch = toRaw.match(/<(.*)>/);
    if (toMatch) accountEmail = toMatch[1].trim();

    const subject = String(data.subject || "(Sin asunto)");
    const textBody = String(data.text || data.text_body || data.stripped_text || data.html || "");
    const htmlBody = data.html ? String(data.html) : undefined;
    const messageId = String(data.message_id || data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`);

    return {
      accountEmail,
      from: fromEmail.toLowerCase(),
      fromName,
      subject,
      textBody,
      htmlBody,
      messageId,
      timestamp: new Date(),
    };
  },

  /**
   * Envío saliente vía Resend REST API o simulación SMTP.
   */
  async send(
    fromAddress: string,
    displayName: string,
    payload: OutboundEmailPayload,
    settings: EmailAccountSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const from = displayName ? `${displayName} <${fromAddress}>` : fromAddress;

    // Si tiene apiKey de Resend
    if (settings.apiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: payload.to,
            subject: payload.subject,
            text: payload.textBody,
            html: payload.htmlBody,
            headers: payload.replyToMessageId ? { "In-Reply-To": payload.replyToMessageId } : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: JSON.stringify(data) };
        }
        return { success: true, messageId: data.id };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Fallback Mock para testing / SMTP
    const mockId = `res_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return { success: true, messageId: mockId };
  },
};
