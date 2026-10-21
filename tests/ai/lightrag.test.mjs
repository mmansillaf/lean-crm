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
      ["Clinica LightRAG Test", `lightrag-org-${Date.now()}`]
    );
    const orgId = orgRes.rows[0].id;

    const sourceRes = await pool.query(
      "insert into knowledge_sources (organization_id, name, source_type, status) values ($1, 'Tarifario Dental', 'text', 'ready') returning id",
      [orgId]
    );
    const sourceId = sourceRes.rows[0].id;

    // 2. Extraer entidades y relaciones simuladas
    const mockExtracted = {
      entities: [
        { name: "Ortodoncia Invisible", type: "tratamiento", description: "Costo $1,200 USD en 6 cuotas" },
        { name: "Limpieza Ultrasonica", type: "servicio_incluido", description: "Gratuita en la primera cita" },
        { name: "Seguro Dental Plus", type: "cobertura", description: "Cubre 20% de descuento en ortodoncia" },
      ],
      relations: [
        { sourceEntity: "Ortodoncia Invisible", targetEntity: "Limpieza Ultrasonica", relationType: "incluye", description: "Viene con limpieza sin costo" },
        { sourceEntity: "Seguro Dental Plus", targetEntity: "Ortodoncia Invisible", relationType: "aplica_descuento", description: "Aplica 20% descuento" },
      ],
    };

    // Generador de embedding mock determinista
    const mockEmbedder = async (text) => {
      const arr = new Array(1536).fill(0.01);
      if (text.includes("Ortodoncia")) arr[0] = 0.99; // Similitud alta
      return arr;
    };

    // 3. Ingestar en la base de datos
    const ingestRes = await ingestKnowledgeDocument(orgId, sourceId, mockExtracted, mockEmbedder);
    assert.equal(ingestRes.entitiesCount, 3);
    assert.equal(ingestRes.relationsCount, 2);

    // 4. Consultar con vector que busca "Ortodoncia"
    const queryVec = new Array(1536).fill(0.01);
    queryVec[0] = 0.99;

    const searchResult = await searchLightRag(orgId, queryVec, { matchThreshold: 0.40, topEntities: 2, maxHops: 2 });

    assert.ok(searchResult.facts.length > 0, "No encontró entidades semilla");
    assert.ok(searchResult.formattedPromptContext.includes("Ortodoncia Invisible"));
    assert.ok(searchResult.formattedPromptContext.includes("CONOCIMIENTO LIGHTRAG"));
  });
});
