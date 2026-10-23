import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, contacts, messages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        contactName: contacts.fullName,
        phone: contacts.phone,
        email: contacts.email,
        channel: conversations.channelType,
        status: conversations.status,
        isBlocked: contacts.isBlocked,
        metadata: contacts.metadata,
        lastMessage: conversations.lastMessagePreview,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .orderBy(desc(conversations.updatedAt))
      .limit(50);

    return NextResponse.json({ conversations: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
