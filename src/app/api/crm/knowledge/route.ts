import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeSources, knowledgeEntities, knowledgeRelations } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { extractGraphFromText, ingestKnowledgeDocument, type ExtractedEntity, type ExtractedRelation } from "@/ai/lightrag/extract";
import { getEmbedding } from "@/ai/embeddings";

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
      .limit(40);

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

export async function DELETE(req: NextRequest) {
  try {
    const orgId = "211bd937-74bf-4280-b27a-ea08cd62bb8b"; // Algoritmo Jurídico SAC
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const reset = searchParams.get("reset") === "true";

    if (reset) {
      await db.delete(knowledgeSources).where(eq(knowledgeSources.organizationId, orgId));
      return NextResponse.json({ success: true, message: "Base de conocimiento reseteada con éxito" });
    }

    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }

    const deleted = await db
      .delete(knowledgeSources)
      .where(and(eq(knowledgeSources.id, id), eq(knowledgeSources.organizationId, orgId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Fuente no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (error: any) {
    console.error("[KNOWLEDGE_DELETE_ERR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = "211bd937-74bf-4280-b27a-ea08cd62bb8b"; // Algoritmo Jurídico SAC
    const contentType = req.headers.get("content-type") || "";

    let documentName = "";
    let sourceType = "text";
    let textPages: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
      }

      documentName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.toLowerCase().endsWith(".pdf")) {
        sourceType = "pdf";
        const { parsePdfBuffer } = await import("@/ai/pdf/parser");
        const parsed = await parsePdfBuffer(buffer);
        textPages = parsed.pages.map((p) => p.text).filter((t) => t.length > 0);
        if (textPages.length === 0 && parsed.text) {
          textPages = [parsed.text];
        }
      } else {
        sourceType = "text";
        textPages = [buffer.toString("utf-8")];
      }
    } else {
      const body = await req.json();
      documentName = body.name || `Documento_${Date.now()}`;
      sourceType = body.sourceType || "text";
      const content = body.content || "";
      if (!content.trim()) {
        return NextResponse.json({ error: "El contenido no puede estar vacío" }, { status: 400 });
      }
      textPages = [content];
    }

    // 1. Crear registro de fuente en estado 'indexing'
    const [sourceRecord] = await db
      .insert(knowledgeSources)
      .values({
        organizationId: orgId,
        name: documentName,
        sourceType,
        status: "indexing",
      })
      .returning();

    // 2. Extraer grafo por páginas/secciones con LLM
    const allEntities: ExtractedEntity[] = [];
    const allRelations: ExtractedRelation[] = [];

    for (const pageText of textPages) {
      if (pageText.trim().length < 20) continue;
      const extracted = await extractGraphFromText(pageText);
      allEntities.push(...extracted.entities);
      allRelations.push(...extracted.relations);
    }

    // Deduplicar entidades por nombre
    const uniqueMap = new Map<string, ExtractedEntity>();
    for (const ent of allEntities) {
      const key = ent.name.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ent);
      }
    }

    const consolidatedExtraction = {
      entities: Array.from(uniqueMap.values()),
      relations: allRelations,
    };

    // 3. Ingestar vectores y relaciones en PostgreSQL
    const result = await ingestKnowledgeDocument(
      orgId,
      sourceRecord.id,
      consolidatedExtraction,
      getEmbedding
    );

    // 4. Marcar fuente como 'ready'
    await db
      .update(knowledgeSources)
      .set({ status: "ready" })
      .where(eq(knowledgeSources.id, sourceRecord.id));

    return NextResponse.json({
      success: true,
      source: sourceRecord,
      stats: {
        entitiesCount: result.entitiesCount,
        relationsCount: result.relationsCount,
      },
    });
  } catch (error: any) {
    console.error("[KNOWLEDGE_POST_ERR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

