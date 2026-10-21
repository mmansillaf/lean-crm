import { NextRequest, NextResponse } from "next/server";
import { wahaAdapter } from "@/channels/waha/adapter";
import { processInboundAgentTurn } from "@/ai/agent/turn";
import { db } from "@/db";
import { whatsappInstances } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = wahaAdapter.parseWebhookPayload(body);

  for (const msg of messages) {
    // Buscar la instancia de WAHA por session name
    const instance = await db
      .select()
      .from(whatsappInstances)
      .where(eq(whatsappInstances.name, msg.instanceId))
      .limit(1)
      .then((r) => r[0]);

    if (instance) {
      const queryEmbedding = new Array(1536).fill(0.01);

      await processInboundAgentTurn(instance.organizationId, instance.id, msg, {
        queryEmbedding,
      });
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
