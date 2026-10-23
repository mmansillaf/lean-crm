import { redis } from "@/lib/redis";
import { db } from "@/db";
import { contacts, conversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { crmEvents } from "./events";

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\+]/g, "").trim();
}

export function getBlacklistKey(organizationId: string): string {
  return `crm:blacklist:${organizationId}`;
}

export async function isPhoneBlacklisted(organizationId: string, phone: string): Promise<boolean> {
  if (!phone) return false;
  const cleanPhone = normalizePhone(phone);
  const key = getBlacklistKey(organizationId);

  try {
    // 1. Verificación O(1) en Redis
    const isMember = await redis.sismember(key, cleanPhone);
    if (isMember === 1) return true;

    // También chequear con prefijo '+' por si se guardó con él
    const isMemberWithPlus = await redis.sismember(key, `+${cleanPhone}`);
    if (isMemberWithPlus === 1) return true;
  } catch {
    // Si Redis no responde, consultar directamente la base de datos
  }

  // 2. Fallback a PostgreSQL
  try {
    const contact = await db
      .select({ isBlocked: contacts.isBlocked })
      .from(contacts)
      .where(
        and(
          eq(contacts.organizationId, organizationId),
          eq(contacts.phone, cleanPhone)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (contact?.isBlocked) {
      // Repoblar Redis para futuras consultas
      try {
        await redis.sadd(key, cleanPhone);
      } catch {}
      return true;
    }
  } catch (err) {
    console.error("[BLACKLIST_CHECK_ERR]", err);
  }

  return false;
}

export async function blockContact(
  organizationId: string,
  contactId: string,
  phone: string
): Promise<void> {
  const cleanPhone = normalizePhone(phone);
  const key = getBlacklistKey(organizationId);

  // 1. Actualizar contacto en PostgreSQL
  await db
    .update(contacts)
    .set({ isBlocked: true })
    .where(and(eq(contacts.organizationId, organizationId), eq(contacts.id, contactId)));

  // 2. Actualizar conversación a 'blocked'
  await db
    .update(conversations)
    .set({ status: "blocked", updatedAt: new Date() })
    .where(and(eq(conversations.organizationId, organizationId), eq(conversations.contactId, contactId)));

  // 3. Añadir a Redis
  try {
    await redis.sadd(key, cleanPhone, `+${cleanPhone}`);
  } catch (err) {
    console.error("[REDIS_BLOCK_ERR]", err);
  }

  // 4. Notificar por SSE a los clientes del CRM
  crmEvents.emit("inbox_update", {
    type: "contact_blocked",
    contactId,
    phone: cleanPhone,
    conversationStatus: "blocked",
  });
}

export async function unblockContact(
  organizationId: string,
  contactId: string,
  phone: string
): Promise<void> {
  const cleanPhone = normalizePhone(phone);
  const key = getBlacklistKey(organizationId);

  // 1. Actualizar contacto en PostgreSQL
  await db
    .update(contacts)
    .set({ isBlocked: false })
    .where(and(eq(contacts.organizationId, organizationId), eq(contacts.id, contactId)));

  // 2. Restaurar conversación a 'bot'
  await db
    .update(conversations)
    .set({ status: "bot", updatedAt: new Date() })
    .where(and(eq(conversations.organizationId, organizationId), eq(conversations.contactId, contactId)));

  // 3. Remover de Redis
  try {
    await redis.srem(key, cleanPhone, `+${cleanPhone}`);
  } catch (err) {
    console.error("[REDIS_UNBLOCK_ERR]", err);
  }

  // 4. Notificar por SSE
  crmEvents.emit("inbox_update", {
    type: "contact_unblocked",
    contactId,
    phone: cleanPhone,
    conversationStatus: "bot",
  });
}
