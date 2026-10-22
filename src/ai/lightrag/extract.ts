import { generateText } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { pool } from "@/db";
import { getEmbedding } from "../embeddings";

export function getDefaultModel() {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")) {
    return openai("gpt-4o-mini");
  }
  if (process.env.GROQ_API_KEY) {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
    });
    return groq("qwen/qwen3.8-27b");
  }
  return openai("gpt-4o-mini");
}

export interface ExtractedEntity {
  name: string;
  type: string; // 'plan', 'product', 'policy', 'price', 'feature'
  description: string;
}

export interface ExtractedRelation {
  sourceEntity: string;
  targetEntity: string;
  relationType: string; // 'includes', 'requires', 'costs', 'replaces'
  description: string;
}

export interface ExtractionResult {
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
}

export async function extractGraphFromText(
  text: string,
  model = getDefaultModel()
): Promise<ExtractionResult> {
  const prompt = `
Analiza el siguiente texto y extrae entidades clave y las relaciones directas entre ellas para construir un grafo de conocimiento (Knowledge Graph).

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "entities": [
    { "name": "Nombre Exacto", "type": "tipo_de_entidad", "description": "Descripción concisa con datos concretos (precios, límites, etc)" }
  ],
  "relations": [
    { "sourceEntity": "Nombre Entidad A", "targetEntity": "Nombre Entidad B", "relationType": "tipo_relacion", "description": "Detalle de la relación" }
  ]
}

TEXTO A ANALIZAR:
${text}
`.trim();

  try {
    const { text: resultJson } = await generateText({
      model,
      prompt,
      temperature: 0.1,
      maxTokens: 3000,
    });

    const jsonMatch = resultJson.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { entities: [], relations: [] };
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      relations: Array.isArray(parsed.relations) ? parsed.relations : [],
    };
  } catch (err) {
    console.warn("Error parseando grafo:", err);
    return { entities: [], relations: [] };
  }
}

/**
 * Ingesta completa de una fuente en PostgreSQL (Entidades + Relaciones)
 */
export async function ingestKnowledgeDocument(
  organizationId: string,
  knowledgeSourceId: string,
  extracted: ExtractionResult,
  embeddingGenerator: (text: string) => Promise<number[]>
) {
  const entityIdMap = new Map<string, string>();

  // 1. Insertar entidades y sus embeddings
  for (const ent of extracted.entities) {
    const vector = await embeddingGenerator(`${ent.name}: ${ent.description}`);
    const vecStr = `[${vector.join(",")}]`;

    const res = await pool.query(
      `insert into public.knowledge_entities (organization_id, source_id, name, entity_type, description, embedding)
       values ($1, $2, $3, $4, $5, $6::vector)
       on conflict (organization_id, name)
       do update set description = excluded.description, embedding = excluded.embedding
       returning id`,
      [organizationId, knowledgeSourceId, ent.name, ent.type, ent.description, vecStr]
    );

    entityIdMap.set(ent.name.toLowerCase().trim(), res.rows[0].id);
  }

  // 2. Insertar relaciones
  for (const rel of extracted.relations) {
    const sourceEntId = entityIdMap.get(rel.sourceEntity.toLowerCase().trim());
    const targetEntId = entityIdMap.get(rel.targetEntity.toLowerCase().trim());

    if (sourceEntId && targetEntId && sourceEntId !== targetEntId) {
      await pool.query(
        `insert into public.knowledge_relations (organization_id, source_id, source_entity_id, target_entity_id, relation_type, description)
         values ($1, $2, $3, $4, $5, $6)
         on conflict do nothing`,
        [organizationId, knowledgeSourceId, sourceEntId, targetEntId, rel.relationType, rel.description]
      );
    }
  }

  return {
    entitiesCount: extracted.entities.length,
    relationsCount: extracted.relations.length,
  };
}
