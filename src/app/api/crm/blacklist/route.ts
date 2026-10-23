import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { blockContact, unblockContact } from "@/crm/blacklist";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, contactId, action } = await req.json();

    if (!action || !["block", "unblock"].includes(action)) {
      return NextResponse.json({ error: "action must be 'block' or 'unblock'" }, { status: 400 });
    }

    let targetContactId = contactId;
    let organizationId: string | null = null;
    let phone: string | null = null;

    if (conversationId) {
      const conv = await db
        .select({
          contactId: conversations.contactId,
          organizationId: conversations.organizationId,
          phone: contacts.phone,
        })
        .from(conversations)
        .innerJoin(contacts, eq(conversations.contactId, contacts.id))
        .where(eq(conversations.id, conversationId))
        .limit(1)
        .then((r) => r[0]);

      if (!conv) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      targetContactId = conv.contactId;
      organizationId = conv.organizationId;
      phone = conv.phone;
    } else if (contactId) {
      const contact = await db
        .select({
          id: contacts.id,
          organizationId: contacts.organizationId,
          phone: contacts.phone,
        })
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1)
        .then((r) => r[0]);

      if (!contact) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }

      organizationId = contact.organizationId;
      phone = contact.phone;
    } else {
      return NextResponse.json({ error: "conversationId or contactId is required" }, { status: 400 });
    }

    if (!organizationId || !targetContactId || !phone) {
      return NextResponse.json({ error: "Missing required contact details" }, { status: 400 });
    }

    if (action === "block") {
      await blockContact(organizationId, targetContactId, phone);
      return NextResponse.json({ success: true, status: "blocked", phone });
    } else {
      await unblockContact(organizationId, targetContactId, phone);
      return NextResponse.json({ success: true, status: "bot", phone });
    }
  } catch (error: any) {
    console.error("[BLACKLIST_API_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
