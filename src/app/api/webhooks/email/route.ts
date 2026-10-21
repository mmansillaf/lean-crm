import { NextRequest, NextResponse } from "next/server";
import { emailAdapter } from "@/channels/email/adapter";
import { listmonk } from "@/channels/email/listmonk";
import { db } from "@/db";
import { emailAccounts, contacts, conversations, messages, listmonkSyncSubscribers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { processInboundAgentTurn } from "@/ai/agent/turn";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = emailAdapter.parseInboundWebhook(body);
  if (!email) {
    return NextResponse.json({ error: "unparseable_email" }, { status: 400 });
  }

  // 1. Buscar cuenta de correo por dirección de destino
  let account = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.emailAddress, email.accountEmail.toLowerCase()))
    .limit(1)
    .then((r) => r[0]);

  // Si no se encuentra exacta, buscar cualquiera activa en la org
  if (!account) {
    account = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.isActive, true))
      .limit(1)
      .then((r) => r[0]);
  }

  if (!account) {
    return NextResponse.json({ error: "no_active_email_account" }, { status: 404 });
  }

  const organizationId = account.organizationId;

  // 2. Buscar o crear contacto por email
  let contact = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.organizationId, organizationId), eq(contacts.email, email.from)))
    .limit(1)
    .then((r) => r[0]);

  if (!contact) {
    const inserted = await db
      .insert(contacts)
      .values({
        organizationId,
        email: email.from,
        fullName: email.fromName || null,
      })
      .returning();
    contact = inserted[0];
  }

  // 3. Buscar o crear conversación de correo
  let conv = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, organizationId),
        eq(conversations.channelType, "email"),
        eq(conversations.contactId, contact.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!conv) {
    const inserted = await db
      .insert(conversations)
      .values({
        organizationId,
        channelType: "email",
        emailAccountId: account.id,
        contactId: contact.id,
        status: "bot",
        lastMessagePreview: email.subject + ": " + email.textBody.substring(0, 100),
        lastCustomerMessageAt: email.timestamp,
        isWithin24h: true,
      })
      .returning();
    conv = inserted[0];
  } else {
    await db
      .update(conversations)
      .set({
        lastMessagePreview: email.subject + ": " + email.textBody.substring(0, 100),
        lastCustomerMessageAt: email.timestamp,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conv.id));
  }

  // 4. Registrar mensaje entrante con idempotencia
  const existingMsg = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.organizationId, organizationId), eq(messages.externalId, email.messageId)))
    .limit(1);

  if (existingMsg.length === 0) {
    await db.insert(messages).values({
      organizationId,
      conversationId: conv.id,
      externalId: email.messageId,
      senderType: "customer",
      content: `Asunto: ${email.subject}\n\n${email.textBody}`,
      messageType: "text",
      status: "received",
      metadata: { subject: email.subject, html: email.htmlBody },
    });
  }

  // 5. Sincronizar automáticamente con Listmonk
  listmonk.upsertSubscriber({
    email: email.from,
    name: email.fromName,
    attribs: { source: "lean_crm_inbound_email" },
  }).then(async (res) => {
    if (res.ok && res.subscriberId) {
      await db
        .insert(listmonkSyncSubscribers)
        .values({
          organizationId,
          contactId: contact.id,
          listmonkSubscriberId: res.subscriberId,
          email: email.from,
          status: "enabled",
        })
        .onConflictDoNothing();
    }
  }).catch(() => {});

  return NextResponse.json({ status: "ok", conversationId: conv.id }, { status: 200 });
}
