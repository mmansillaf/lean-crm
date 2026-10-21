import crypto from "node:crypto";
import type { ChannelAdapter, InboundMessage, OutboundMessagePayload } from "../types";

export function toE164Digits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export interface MetaCredentials {
  phoneNumberId: string;
  accessToken: string;
  appSecret?: string;
}

export const metaAdapter: ChannelAdapter = {
  provider: "meta",

  async send(payload: OutboundMessagePayload, rawCreds: Record<string, unknown>) {
    const creds = rawCreds as unknown as MetaCredentials;
    if (!creds.phoneNumberId || !creds.accessToken) {
      return { success: false, error: "missing_meta_credentials" };
    }

    const recipient = toE164Digits(payload.toPhone);
    const url = `https://graph.facebook.com/v21.0/${creds.phoneNumberId}/messages`;

    let body: Record<string, unknown>;

    if (payload.mediaUrl && payload.messageType === "audio") {
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "audio",
        audio: {
          link: payload.mediaUrl,
          voice: payload.voiceNote ?? true, // Bolha de voz en WhatsApp si es true
        },
      };
    } else if (payload.mediaUrl && payload.messageType === "image") {
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "image",
        image: {
          link: payload.mediaUrl,
          caption: payload.content || undefined,
        },
      };
    } else {
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: { body: payload.content },
      };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: JSON.stringify(data.error || data) };
      }

      const externalId = data.messages?.[0]?.id;
      return { success: true, externalId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  verifyWebhookSignature(rawBody: string, signatureHeader: string, appSecret: string): boolean {
    if (!signatureHeader || !appSecret) return false;
    const [algo, signature] = signatureHeader.split("=");
    if (algo !== "sha256" || !signature) return false;

    const hmac = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(hmac, "hex"));
    } catch {
      return false;
    }
  },

  parseWebhookPayload(body: Record<string, unknown>): InboundMessage[] {
    const messages: InboundMessage[] = [];
    const entry = (body.entry as Array<any>) || [];

    for (const e of entry) {
      for (const change of e.changes || []) {
        const val = change.value;
        if (!val || !val.messages) continue;

        const instanceId = val.metadata?.phone_number_id || "unknown";
        const contacts = val.contacts || [];

        for (const msg of val.messages) {
          const senderContact = contacts.find((c: any) => c.wa_id === msg.from);
          const fromPhone = msg.from;
          const externalMessageId = msg.id;
          const timestamp = new Date(Number(msg.timestamp) * 1000);

          let messageType: InboundMessage["messageType"] = "text";
          let content = "";
          let mediaUrl: string | undefined;

          if (msg.type === "text") {
            content = msg.text?.body || "";
          } else if (msg.type === "audio") {
            messageType = "audio";
            mediaUrl = msg.audio?.id; // Requiere descarga autenticada con token
            content = "[Nota de voz]";
          } else if (msg.type === "image") {
            messageType = "image";
            mediaUrl = msg.image?.id;
            content = msg.image?.caption || "[Imagen]";
          } else if (msg.type === "interactive") {
            messageType = "interactive";
            content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "";
          }

          messages.push({
            instanceId,
            externalMessageId,
            fromPhone,
            senderName: senderContact?.profile?.name,
            messageType,
            content,
            mediaUrl,
            timestamp,
            rawPayload: msg,
          });
        }
      }
    }

    return messages;
  },
};
