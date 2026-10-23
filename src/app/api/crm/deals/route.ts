import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals, contacts, pipelines } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select({
        id: deals.id,
        title: deals.title,
        stageId: deals.stageId,
        valueCents: deals.valueCents,
        currency: deals.currency,
        createdAt: deals.createdAt,
        contactName: contacts.fullName,
        contactPhone: contacts.phone,
        pipelineName: pipelines.name,
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .leftJoin(pipelines, eq(deals.pipelineId, pipelines.id))
      .orderBy(desc(deals.createdAt));

    return NextResponse.json({ deals: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { dealId, stageId } = await req.json();
    if (!dealId || !stageId) {
      return NextResponse.json({ error: "dealId and stageId are required" }, { status: 400 });
    }

    const updated = await db
      .update(deals)
      .set({ stageId })
      .where(eq(deals.id, dealId))
      .returning();

    return NextResponse.json({ success: true, deal: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, stageId, valueCents, currency, contactId, organizationId, pipelineId } = await req.json();

    if (!title || !contactId || !organizationId || !pipelineId) {
      return NextResponse.json(
        { error: "title, contactId, organizationId and pipelineId are required" },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(deals)
      .values({
        organizationId,
        pipelineId,
        contactId,
        title,
        stageId: stageId || "lead",
        valueCents: valueCents || 0,
        currency: currency || "USD",
      })
      .returning();

    return NextResponse.json({ success: true, deal: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
