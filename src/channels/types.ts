export interface InboundMessage {
  instanceId: string;
  externalMessageId: string;
  fromPhone: string; // E.164
  senderName?: string;
  messageType: "text" | "audio" | "image" | "document" | "interactive";
  content: string;
  mediaUrl?: string;
  timestamp: Date;
  rawPayload: Record<string, unknown>;
}

export interface OutboundMessagePayload {
  toPhone: string; // E.164 sin '+' ni sufijos
  content: string;
  messageType?: "text" | "audio" | "image" | "document";
  mediaUrl?: string;
  voiceNote?: boolean; // Solo para audios en Meta Cloud (requiere ogg/opus)
}

export interface ChannelAdapter {
  provider: "meta" | "waha";
  send(payload: OutboundMessagePayload, credentials: Record<string, unknown>): Promise<{ success: boolean; externalId?: string; error?: string }>;
  verifyWebhookSignature?(rawBody: string, signature: string, secret: string): boolean;
  parseWebhookPayload(body: Record<string, unknown>): InboundMessage[];
}
