import "dotenv/config";
import path from "path";
import { pool } from "../src/db";
import { parsePdfFile } from "../src/ai/pdf/parser";
import { extractGraphFromText, ingestKnowledgeDocument, type ExtractedEntity, type ExtractedRelation } from "../src/ai/lightrag/extract";
import { getEmbedding } from "../src/ai/embeddings";

async function main() {
  console.log("=== INGESTIÓN DE BASE DE CONOCIMIENTO (PDF / LIGHTRAG) ===");

  const pdfPath = path.resolve(process.cwd(), "docs/Algoritmo_Juridico_Servicios.pdf");
  console.log(`1. Leyendo archivo PDF: ${pdfPath}`);

  const parsedPdf = await parsePdfFile(pdfPath);
  console.log(`   PDF procesado: ${parsedPdf.pageCount} páginas, ${parsedPdf.text.length} caracteres.`);

  // 2. Obtener o crear organización por defecto
  let orgRes = await pool.query("select id from organizations limit 1");
  let orgId: string;

  if (orgRes.rows.length === 0) {
    const newOrg = await pool.query(
      "insert into organizations (name, slug) values ($1, $2) returning id",
      ["Algoritmo Jurídico SAC", "algoritmo-juridico"]
    );
    orgId = newOrg.rows[0].id;
    console.log(`2. Organización creada: ${orgId}`);
  } else {
    orgId = orgRes.rows[0].id;
    console.log(`2. Organización existente: ${orgId}`);
  }

  // 3. Crear registro de fuente de conocimiento
  const sourceRes = await pool.query(
    `insert into knowledge_sources (organization_id, name, source_type, status)
     values ($1, $2, $3, 'indexing')
     returning id`,
    [orgId, "Algoritmo Juridico - Servicios y Ecosistema 2026.pdf", "pdf"]
  );
  const sourceId = sourceRes.rows[0].id;
  console.log(`3. Fuente registrada con ID: ${sourceId}`);

  // 4. Extracción de entidades y relaciones ontológicas por sección/página
  console.log("4. Extrayendo Grafo de Conocimiento (Entidades y Relaciones con LLM)...");
  const allEntities: ExtractedEntity[] = [];
  const allRelations: ExtractedRelation[] = [];

  for (let i = 0; i < parsedPdf.pages.length; i++) {
    const pageText = parsedPdf.pages[i].text;
    console.log(`   Procesando Página ${i + 1}/${parsedPdf.pages.length} (${pageText.length} caracteres)...`);
    const pageExtracted = await extractGraphFromText(pageText);
    console.log(`     -> ${pageExtracted.entities.length} entidades, ${pageExtracted.relations.length} relaciones.`);
    allEntities.push(...pageExtracted.entities);
    allRelations.push(...pageExtracted.relations);
  }

  // Deduplicar entidades por nombre en minúsculas
  const uniqueEntitiesMap = new Map<string, (typeof allEntities)[0]>();
  for (const ent of allEntities) {
    const key = ent.name.toLowerCase().trim();
    if (!uniqueEntitiesMap.has(key)) {
      uniqueEntitiesMap.set(key, ent);
    }
  }
  const extracted = {
    entities: Array.from(uniqueEntitiesMap.values()),
    relations: allRelations,
  };

  console.log(`   Total consolidado: ${extracted.entities.length} entidades y ${extracted.relations.length} relaciones.`);
  for (const ent of extracted.entities) {
    console.log(`   - [${ent.type}] ${ent.name}: ${ent.description.slice(0, 75)}...`);
  }

  // 5. Ingesta vectorial y relacional en PostgreSQL
  console.log("5. Generando embeddings y guardando en PostgreSQL pgvector...");
  const result = await ingestKnowledgeDocument(orgId, sourceId, extracted, getEmbedding);

  await pool.query("update knowledge_sources set status = 'ready' where id = $1", [sourceId]);

  console.log(`\n✔ INGESTA COMPLETADA: ${result.entitiesCount} entidades y ${result.relationsCount} relaciones listas.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Error durante la ingesta:", err);
  process.exit(1);
});
