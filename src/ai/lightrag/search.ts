import { pool } from "@/db";

export interface LightRagHit {
  entity_name: string;
  entity_type: string;
  entity_desc: string;
  similarity: number;
  relationship_path: string;
  target_entity: string;
  target_desc: string;
}

export interface LightRagResult {
  facts: Array<{ entity: string; type: string; description: string; score: number }>;
  relations: Array<{ from: string; path: string; to: string; detail: string }>;
  formattedPromptContext: string;
}

export async function searchLightRag(
  organizationId: string,
  queryEmbedding: number[],
  options: {
    matchThreshold?: number;
    topEntities?: number;
    maxHops?: number;
  } = {}
): Promise<LightRagResult> {
  const defaultThreshold = process.env.LIGHTRAG_MATCH_THRESHOLD
    ? parseFloat(process.env.LIGHTRAG_MATCH_THRESHOLD)
    : process.env.OPENAI_API_KEY?.startsWith("sk-")
    ? 0.35
    : 0.14;

  const threshold = options.matchThreshold ?? defaultThreshold;
  const topEntities = options.topEntities ?? 3;
  const maxHops = options.maxHops ?? 2;

  const vecStr = `[${queryEmbedding.join(",")}]`;

  const query = `
    select
      entity_name,
      entity_type,
      entity_desc,
      similarity,
      relationship_path,
      target_entity,
      target_desc
    from public.fn_lightrag_query(
      $1::uuid,
      $2::vector,
      $3::real,
      $4::int,
      $5::int
    );
  `;

  const { rows } = await pool.query<LightRagHit>(query, [
    organizationId,
    vecStr,
    threshold,
    topEntities,
    maxHops,
  ]);

  const factsMap = new Map<string, { entity: string; type: string; description: string; score: number }>();
  const relations: LightRagResult["relations"] = [];

  for (const r of rows) {
    if (!factsMap.has(r.entity_name)) {
      factsMap.set(r.entity_name, {
        entity: r.entity_name,
        type: r.entity_type,
        description: r.entity_desc,
        score: r.similarity,
      });
    }

    if (r.relationship_path && r.target_entity && r.target_entity !== r.entity_name) {
      relations.push({
        from: r.entity_name,
        path: r.relationship_path,
        to: r.target_entity,
        detail: r.target_desc,
      });
    }
  }

  const facts = Array.from(factsMap.values());

  // Formatear bloque para inyección en el prompt del sistema
  let formattedContext = "=== CONOCIMIENTO LIGHTRAG (BASE VERIFICADA) ===\n";

  if (facts.length === 0) {
    formattedContext += "No se encontraron entidades directas para esta consulta en la base de datos.\n";
  } else {
    formattedContext += "[DATOS PUNTUALES Y ATRIBUTOS EXACTOS]\n";
    for (const f of facts) {
      formattedContext += `- ${f.entity} (${f.type}): ${f.description}\n`;
    }

    if (relations.length > 0) {
      formattedContext += "\n[RELACIONES, CONDICIONES Y COMPARATIVAS]\n";
      for (const rel of relations) {
        formattedContext += `- ${rel.from} -> [${rel.path}] -> ${rel.to} (Detalle: ${rel.detail})\n`;
      }
    }
  }

  return {
    facts,
    relations,
    formattedPromptContext: formattedContext,
  };
}
