import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, conversations, contacts, whatsappInstances } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { wahaAdapter } from "@/channels/waha/adapter";
import { metaAdapter } from "@/channels/meta/adapter";
import { crmEvents } from "@/crm/events";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  try {
    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ messages: messageList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { conversationId, content } = await req.json();
    if (!conversationId || !content) {
      return NextResponse.json({ error: "conversationId and content are required" }, { status: 400 });
    }

    const session = await auth();
    const senderId = session?.user?.id || null;

    // Obtener conversación y contacto
    const conv = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
      .then((r) => r[0]);

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const contact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, conv.contactId))
      .limit(1)
      .then((r) => r[0]);

    if (!contact || !contact.phone) {
      return NextResponse.json({ error: "Contact phone not found" }, { status: 400 });
    }

    // Determinar adaptador de canal (Meta Cloud API o WAHA)
    let instance: typeof whatsappInstances.$inferSelect | undefined;
    if (conv.instanceId) {
      instance = await db
        .select()
        .from(whatsappInstances)
        .where(eq(whatsappInstances.id, conv.instanceId))
        .limit(1)
        .then((r) => r[0]);
    }

    const adapter = instance?.provider === "meta" ? metaAdapter : wahaAdapter;
    const creds = (instance?.credentials as Record<string, unknown>) || {
      baseUrl: process.env.WAHA_BASE_URL || "http://localhost:3001",
      session: "default",
      apiKey: process.env.WAHA_API_KEY,
    };

    const sendResult = await adapter.send(
      {
        toPhone: contact.phone,
        content,
        messageType: "text",
      },
      creds
    );

    const externalId = sendResult.externalId || `agent_${Date.now()}`;

    // Registrar en BD como mensaje de operador humano con trazabilidad de senderId
    const inserted = await db
      .insert(messages)
      .values({
        organizationId: conv.organizationId,
        conversationId: conv.id,
        externalId,
        senderType: "human",
        senderId,
        content,
        messageType: "text",
        status: sendResult.success ? "sent" : "failed",
      })
      .returning();

    // Actualizar preview en conversación
    await db
      .update(conversations)
      .set({
        lastMessagePreview: content,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conv.id));

    // Notificar por SSE a todos los oyentes activos
    crmEvents.emit("inbox_update", {
      type: "new_message",
      conversationId: conv.id,
      message: inserted[0],
    });

    return NextResponse.json({ success: true, message: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { conversationId, status } = await req.json();
    if (!conversationId || !status) {
      return NextResponse.json({ error: "conversationId and status are required" }, { status: 400 });
    }

    await db
      .update(conversations)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    crmEvents.emit("inbox_update", {
      type: "status_change",
      conversationId,
      status,
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
