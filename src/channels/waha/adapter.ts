import type { ChannelAdapter, InboundMessage, OutboundMessagePayload } from "../types";

export interface WahaCredentials {
  baseUrl: string; // ej: http://localhost:3001
  session?: string;
  apiKey?: string;
}

export const wahaAdapter: ChannelAdapter = {
  provider: "waha",

  async send(payload: OutboundMessagePayload, rawCreds: Record<string, unknown>) {
    const creds = rawCreds as unknown as WahaCredentials;
    const baseUrl = creds.baseUrl || "http://localhost:3001";
    const session = creds.session || "default";

    // Formato WAHA para destinatario: teléfono con @c.us o @lid
    let chatId = payload.toPhone;
    if (chatId.includes(":")) {
      chatId = chatId.replace(/:[0-9]+@/, "@");
    }
    if (!chatId.includes("@")) {
      chatId = `${chatId.replace(/\D/g, "")}@c.us`;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const apiKey = creds.apiKey || process.env.WAHA_API_KEY;
    if (apiKey) headers["X-Api-Key"] = String(apiKey);

    try {
      let endpoint = `${baseUrl}/api/sendText`;
      let body: Record<string, unknown>;

      if (payload.mediaUrl && payload.messageType === "audio") {
        endpoint = `${baseUrl}/api/sendVoice`;
        body = {
          session,
          chatId,
          file: { url: payload.mediaUrl },
        };
      } else if (payload.mediaUrl && payload.messageType === "image") {
        endpoint = `${baseUrl}/api/sendImage`;
        body = {
          session,
          chatId,
          file: { url: payload.mediaUrl },
          caption: payload.content || "",
        };
      } else {
        body = {
          session,
          chatId,
          text: payload.content,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: JSON.stringify(data) };
      }

      return { success: true, externalId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  parseWebhookPayload(body: Record<string, unknown>): InboundMessage[] {
    const event = body.event as string;
    if (event !== "message" && event !== "message.any") return [];

    const payload = body.payload as Record<string, unknown>;
    if (!payload) return [];

    // Ignorar mensajes enviados por nosotros (fromMe: true)
    if (payload.fromMe) return [];

    const rawFrom = String(payload.from || "");
    // Ignorar grupos, canales y estados de difusión
    if (
      rawFrom.includes("@g.us") ||
      rawFrom.includes("@broadcast") ||
      rawFrom.includes("@newsletter") ||
      Boolean((payload as any).participant)
    ) {
      return [];
    }

    let fromPhone = rawFrom
      .replace("@c.us", "")
      .replace("@s.whatsapp.net", "")
      .replace(/@.+/, "")
      .replace(/\D/g, "");

    // Si viene de un LID, extraer el número de teléfono real desde los campos alternativos de Baileys
    const altJid =
      (payload._data as any)?.key?.participantAlt ||
      (payload._data as any)?.key?.remoteJidAlt ||
      (payload._data as any)?.fromAlt ||
      (payload as any)?.fromAlt;

    if (altJid && typeof altJid === "string") {
      const parsedAlt = altJid.replace("@s.whatsapp.net", "").replace("@c.us", "").replace(/\D/g, "");
      if (parsedAlt && parsedAlt.length >= 8) {
        fromPhone = parsedAlt;
      }
    }

    if (!fromPhone || fromPhone.length < 7) return [];

    const externalMessageId = String(payload.id || "");
    const timestamp = payload.timestamp ? new Date(Number(payload.timestamp) * 1000) : new Date();

    let messageType: InboundMessage["messageType"] = "text";
    let content = String(
      payload.body ||
        payload.text ||
        (payload as any).caption ||
        (payload._data as any)?.body ||
        (payload._data as any)?.text ||
        (payload.message as any)?.conversation ||
        (payload.message as any)?.extendedTextMessage?.text ||
        ""
    ).trim();
    let mediaUrl: string | undefined;

    if (payload.hasMedia) {
      const media = payload.media as Record<string, unknown> | undefined;
      mediaUrl = media?.url as string;
      const mimetype = String(media?.mimetype || "");

      if (mimetype.startsWith("audio/")) {
        messageType = "audio";
        content = "[Nota de voz]";
      } else if (mimetype.startsWith("image/")) {
        messageType = "image";
        content = content || "[Imagen]";
      }
    }

    const senderName =
      (payload as any)?.pushName ||
      (payload._data as any)?.notifyName ||
      undefined;

    return [
      {
        instanceId: String(body.session || "default"),
        externalMessageId,
        fromPhone,
        senderName,
        messageType,
        content,
        mediaUrl,
        timestamp,
        rawPayload: payload,
      },
    ];
  },
};
