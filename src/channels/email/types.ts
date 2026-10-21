export interface InboundEmail {
  accountEmail: string;
  from: string;
  fromName?: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  messageId: string;
  attachments?: Array<{ filename: string; contentType: string; url: string }>;
  timestamp: Date;
}

export interface OutboundEmailPayload {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  replyToMessageId?: string;
  attachments?: Array<{ filename: string; content: string | Buffer; contentType: string }>;
}
