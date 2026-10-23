import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeSources, knowledgeEntities, knowledgeRelations } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Obtener fuentes con conteo de entidades
    const sources = await db
      .select({
        id: knowledgeSources.id,
        name: knowledgeSources.name,
        sourceType: knowledgeSources.sourceType,
        status: knowledgeSources.status,
        createdAt: knowledgeSources.createdAt,
      })
      .from(knowledgeSources)
      .orderBy(desc(knowledgeSources.createdAt))
      .limit(20);

    // 2. Muestreo de relaciones del grafo
    const relations = await db
      .select({
        id: knowledgeRelations.id,
        relationType: knowledgeRelations.relationType,
        description: knowledgeRelations.description,
        sourceName: sql<string>`src_e.name`,
        targetName: sql<string>`tgt_e.name`,
      })
      .from(knowledgeRelations)
      .innerJoin(sql`knowledge_entities as src_e`, sql`src_e.id = ${knowledgeRelations.sourceEntityId}`)
      .innerJoin(sql`knowledge_entities as tgt_e`, sql`tgt_e.id = ${knowledgeRelations.targetEntityId}`)
      .limit(15);

    // 3. Conteo total de entidades y relaciones
    const totalEntities = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeEntities)
      .then((r) => Number(r[0]?.count || 0));

    const totalRelations = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeRelations)
      .then((r) => Number(r[0]?.count || 0));

    return NextResponse.json({
      sources,
      relations,
      stats: {
        totalSources: sources.length,
        totalEntities,
        totalRelations,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
