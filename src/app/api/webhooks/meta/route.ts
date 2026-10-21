import { NextRequest, NextResponse } from "next/server";
import { metaAdapter } from "@/channels/meta/adapter";
import { processInboundAgentTurn } from "@/ai/agent/turn";
import { db } from "@/db";
import { whatsappInstances } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";
  const appSecret = process.env.META_WA_APP_SECRET;

  // Validación de firma HMAC si está configurado el app secret
  if (appSecret && metaAdapter.verifyWebhookSignature) {
    const isValid = metaAdapter.verifyWebhookSignature(rawBody, signature, appSecret);
    if (!isValid) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = metaAdapter.parseWebhookPayload(body);

  for (const msg of messages) {
    // Buscar la instancia por phone_number_id
    const instance = await db
      .select()
      .from(whatsappInstances)
      .where(eq(whatsappInstances.phoneNumber, msg.instanceId))
      .limit(1)
      .then((r) => r[0]);

    if (instance) {
      // Vector cero provisional si no se pasa embedding directo (el turn resolverá)
      const queryEmbedding = new Array(1536).fill(0.01);

      await processInboundAgentTurn(instance.organizationId, instance.id, msg, {
        queryEmbedding,
      });
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
