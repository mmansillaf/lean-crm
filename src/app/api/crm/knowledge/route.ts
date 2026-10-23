import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeSources, knowledgeEntities, knowledgeRelations } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const orgId = "211bd937-74bf-4280-b27a-ea08cd62bb8b"; // Algoritmo Jurídico SAC

    // 1. Obtener fuentes con conteo de entidades de la organización
    const sources = await db
      .select({
        id: knowledgeSources.id,
        name: knowledgeSources.name,
        sourceType: knowledgeSources.sourceType,
        status: knowledgeSources.status,
        createdAt: knowledgeSources.createdAt,
      })
      .from(knowledgeSources)
      .where(eq(knowledgeSources.organizationId, orgId))
      .orderBy(desc(knowledgeSources.createdAt))
      .limit(20);

    // 2. Muestreo de relaciones del grafo de la organización
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
      .where(eq(knowledgeRelations.organizationId, orgId))
      .limit(15);

    // 3. Conteo total de entidades y relaciones de la organización
    const totalEntities = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeEntities)
      .where(eq(knowledgeEntities.organizationId, orgId))
      .then((r) => Number(r[0]?.count || 0));

    const totalRelations = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeRelations)
      .where(eq(knowledgeRelations.organizationId, orgId))
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
