import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, contacts, organizations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const orgParam = req.nextUrl.searchParams.get("organizationId") || req.headers.get("x-organization-id");
    
    let orgId = orgParam;
    if (!orgId) {
      const defaultOrg = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, "algoritmo-juridico"))
        .limit(1)
        .then((r) => r[0]);
      orgId = defaultOrg?.id;
    }

    const query = db
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
      .leftJoin(contacts, eq(conversations.contactId, contacts.id));

    const list = orgId
      ? await query.where(eq(conversations.organizationId, orgId)).orderBy(desc(conversations.updatedAt)).limit(50)
      : await query.orderBy(desc(conversations.updatedAt)).limit(50);

    return NextResponse.json({ conversations: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
