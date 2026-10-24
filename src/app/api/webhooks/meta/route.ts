import { NextRequest, NextResponse } from "next/server";
import { metaAdapter } from "@/channels/meta/adapter";
import { enqueueWhatsAppTurn } from "@/crm/queue";
import { db } from "@/db";
import { whatsappInstances } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { isPhoneBlacklisted } from "@/crm/blacklist";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.META_WA_VERIFY_TOKEN || "super_secure_verify_token";

  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const isMetaEnabled = process.env.META_WA_ENABLED === "true";

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";
  const appSecret = process.env.META_WA_APP_SECRET;

  // 1. Validación de firma HMAC si está configurado el app secret
  if (appSecret && metaAdapter.verifyWebhookSignature) {
    const isValid = metaAdapter.verifyWebhookSignature(rawBody, signature, appSecret);
    if (!isValid) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  // 2. Comprobación de interruptor: Deshabilitado preventivamente hasta activación en web de Meta
  if (!isMetaEnabled) {
    console.warn("[META_WA_STANDBY] Webhook de Meta recibido pero el canal se encuentra en standby (META_WA_ENABLED=false).");
    return NextResponse.json({ status: "meta_disabled_standby" }, { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = metaAdapter.parseWebhookPayload(body);
  let enqueuedCount = 0;
  let blockedCount = 0;

  for (const msg of messages) {
    // Buscar la instancia por número o identificador
    const instance = await db
      .select()
      .from(whatsappInstances)
      .where(
        or(
          eq(whatsappInstances.phoneNumber, msg.instanceId),
          eq(whatsappInstances.name, msg.instanceId)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (instance && instance.isActive) {
      if (!msg.content || msg.content.length === 0) continue;

      // Descarte O(1) en Blacklist
      const blacklisted = await isPhoneBlacklisted(instance.organizationId, msg.fromPhone);
      if (blacklisted) {
        blockedCount++;
        continue;
      }

      // Encolado desacoplado en Redis con cálculo de embedding real
      await enqueueWhatsAppTurn(instance.organizationId, instance.id, msg);
      enqueuedCount++;
    }
  }

  const finalStatus = blockedCount > 0 && enqueuedCount === 0 ? "blocked" : "enqueued";
  return NextResponse.json({ status: finalStatus }, { status: 200 });
}
