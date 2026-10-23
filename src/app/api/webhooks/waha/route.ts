import { NextRequest, NextResponse } from "next/server";
import { wahaAdapter } from "@/channels/waha/adapter";
import { enqueueWhatsAppTurn } from "@/crm/queue";
import { db } from "@/db";
import { whatsappInstances } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
    console.log("[WAHA_WEBHOOK_EVENT]", body.event, "SESSION:", body.session);
    console.log("[WAHA_PAYLOAD]", JSON.stringify(body.payload));
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Ignorar eventos que no sean mensaje entrante (ej. message.any para evitar duplicados)
  if (body.event !== "message") {
    return NextResponse.json({ status: "skipped_event" }, { status: 200 });
  }

  const messages = wahaAdapter.parseWebhookPayload(body);

  for (const msg of messages) {
    // Buscar la instancia de WAHA por session name ("default") con prioridad en la organización activa
    let instance = await db
      .select()
      .from(whatsappInstances)
      .where(
        and(
          eq(whatsappInstances.provider, "waha"),
          eq(whatsappInstances.name, msg.instanceId || "default")
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!instance) {
      instance = await db
        .select()
        .from(whatsappInstances)
        .where(eq(whatsappInstances.provider, "waha"))
        .limit(1)
        .then((r) => r[0]);
    }

    if (instance) {
      // Ignorar mensajes sin contenido de texto
      if (!msg.content || msg.content.length === 0) continue;

      // Encolar de forma asíncrona en Redis para desacople inmediato
      await enqueueWhatsAppTurn(instance.organizationId, instance.id, msg);
    }
  }

  return NextResponse.json({ status: "enqueued" }, { status: 200 });
}
