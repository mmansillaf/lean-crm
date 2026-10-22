import { NextRequest, NextResponse } from "next/server";
import { wahaAdapter } from "@/channels/waha/adapter";
import { processInboundAgentTurn } from "@/ai/agent/turn";
import { db } from "@/db";
import { whatsappInstances } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getEmbedding } from "@/ai/embeddings";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = wahaAdapter.parseWebhookPayload(body);

  for (const msg of messages) {
    // Buscar la instancia de WAHA por session name o primera instancia de tipo waha
    let instance = await db
      .select()
      .from(whatsappInstances)
      .where(
        or(
          eq(whatsappInstances.name, msg.instanceId),
          eq(whatsappInstances.provider, "waha")
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (instance) {
      const queryEmbedding = await getEmbedding(msg.content);

      await processInboundAgentTurn(instance.organizationId, instance.id, msg, {
        queryEmbedding,
      });
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
