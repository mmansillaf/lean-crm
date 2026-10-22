import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { parsePdfFile } from "../../src/ai/pdf/parser.ts";
import { getEmbedding } from "../../src/ai/embeddings.ts";

test("TDD Suite: Parser de PDF y Generación de Embeddings", async (t) => {
  await t.test("parsePdfFile extrae texto y páginas correctamente de PDF generado", async () => {
    const pdfPath = path.resolve(process.cwd(), "docs/Algoritmo_Juridico_Servicios.pdf");
    const parsed = await parsePdfFile(pdfPath);

    assert.ok(parsed.pageCount >= 1, "Debe tener al menos 1 página");
    assert.ok(parsed.text.length > 500, "Debe contener texto extraído");
    assert.ok(parsed.text.includes("Algoritmo Jurídico") || parsed.text.includes("Algoritmo Juridico"), "Debe contener entidades clave");
  });

  await t.test("getEmbedding retorna vector L2 normalizado de 1536 dimensiones", async () => {
    const vec = await getEmbedding("Analizador de Contratos IA");
    assert.equal(vec.length, 1536, "Debe tener exactamente 1536 dimensiones");

    // Verificar norma unitaria aproximada
    let norm = 0;
    for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
    const len = Math.sqrt(norm);
    assert.ok(Math.abs(len - 1.0) < 0.01, `El vector debe ser unitario (norma=${len})`);
  });
});
