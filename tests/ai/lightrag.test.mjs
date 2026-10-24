import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { ingestKnowledgeDocument } from "../../src/ai/lightrag/extract.ts";
import { searchLightRag } from "../../src/ai/lightrag/search.ts";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/lean_crm";

test("TDD Suite: Motor LightRAG en PostgreSQL", async (t) => {
  const pool = new pg.Pool({ connectionString });

  t.after(async () => {
    await pool.end();
  });

  await t.test("Ingesta e indexación de Grafo de Conocimiento y consulta recursiva", async () => {
    // 1. Crear organización y fuente
    const orgRes = await pool.query(
      "insert into organizations (name, slug) values ($1, $2) returning id",
      ["Estudio Jurídico LightRAG Test", `lightrag-legal-${Date.now()}`]
    );
    const orgId = orgRes.rows[0].id;

    const sourceRes = await pool.query(
      "insert into knowledge_sources (organization_id, name, source_type, status) values ($1, 'Catálogo Servicios Jurídicos', 'text', 'ready') returning id",
      [orgId]
    );
    const sourceId = sourceRes.rows[0].id;

    // 2. Extraer entidades y relaciones legales simuladas
    const mockExtracted = {
      entities: [
        { name: "Buscador Constitucional", type: "plataforma", description: "Indexa jurisprudencia del Tribunal Constitucional 2016-2026" },
        { name: "Suscripción Anual", type: "plan", description: "Tarifa oficial de S/ 450 Soles por 12 meses" },
        { name: "Asistencia IA Legal", type: "servicio", description: "Consultas especializadas en amparos y derecho constitucional" },
      ],
      relations: [
        { sourceEntity: "Suscripción Anual", targetEntity: "Buscador Constitucional", relationType: "habilita_acceso", description: "Incluye acceso a todo el buscador" },
        { sourceEntity: "Asistencia IA Legal", targetEntity: "Buscador Constitucional", relationType: "consulta_fuente", description: "Utiliza sentencias como contexto legal" },
      ],
    };

    // Generador de embedding mock determinista
    const mockEmbedder = async (text) => {
      const arr = new Array(1536).fill(0.01);
      if (text.includes("Constitucional")) arr[0] = 0.99; // Similitud alta
      return arr;
    };

    // 3. Ingestar en la base de datos
    const ingestRes = await ingestKnowledgeDocument(orgId, sourceId, mockExtracted, mockEmbedder);
    assert.equal(ingestRes.entitiesCount, 3);
    assert.equal(ingestRes.relationsCount, 2);

    // 4. Consultar con vector que busca "Constitucional"
    const queryVec = new Array(1536).fill(0.01);
    queryVec[0] = 0.99;

    const searchResult = await searchLightRag(orgId, queryVec, { matchThreshold: 0.40, topEntities: 2, maxHops: 2 });

    assert.ok(searchResult.facts.length > 0, "No encontró entidades semilla");
    assert.ok(searchResult.formattedPromptContext.includes("Buscador Constitucional"));
    assert.ok(searchResult.formattedPromptContext.includes("CONOCIMIENTO LIGHTRAG"));
  });
});
