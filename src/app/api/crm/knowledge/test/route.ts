import { NextRequest, NextResponse } from "next/server";
import { getEmbedding } from "@/ai/embeddings";
import { searchLightRag } from "@/ai/lightrag/search";
import { generateText } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

async function resolveOrgId(req: NextRequest): Promise<string> {
  const param = req.nextUrl.searchParams.get("organizationId") || req.headers.get("x-organization-id");
  if (param) return param;
  const defaultOrg = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, "algoritmo-juridico"))
    .limit(1)
    .then((r) => r[0]);
  return defaultOrg?.id || "211bd937-74bf-4280-b27a-ea08cd62bb8b";
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { query, mode = "agent", organizationId } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const orgId = organizationId || (await resolveOrgId(req));

    // 1. Vectorizar la consulta
    const queryEmbedding = await getEmbedding(query);

    // 2. Búsqueda en Grafo LightRAG
    const lightRagResult = await searchLightRag(orgId, queryEmbedding, {
      topEntities: 4,
      matchThreshold: 0.12,
    });

    if (mode === "search") {
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        mode: "search",
        hits: lightRagResult.facts,
        relations: lightRagResult.relations,
        formattedContext: lightRagResult.formattedPromptContext,
        latencyMs,
      });
    }

    // 3. Modo Agente: Simulación comercial
    const defaultProvider = process.env.OPENAI_API_KEY?.startsWith("sk-")
      ? "openai"
      : process.env.GROQ_API_KEY
      ? "groq"
      : "openai";

    let model: any;
    if (defaultProvider === "groq") {
      const groq = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      });
      model = groq("qwen/qwen3.8-27b");
    } else {
      model = openai("gpt-4o-mini");
    }

    const systemPrompt = `
Eres el asesor comercial y de soporte técnico oficial de Algoritmo Jurídico SAC en WhatsApp.
Tu idioma obligatorio es el ESPAÑOL. Responde SIEMPRE en español, de forma cordial, profesional y concisa.

FUENTES EXCLUSIVAS DE INFORMACIÓN (TUS ÚNICOS 3 SITIOS WEB):
1. Portal Corporativo y Buscador de Normas: https://algoritmojuridico.com/buscador
2. Plataforma IA Legal Especializada: https://servicios.algoritmojuridico.com/ialegal/
3. Buscador de Procesos Constitucionales (TC 2016-2026): https://procesosconstitucionales.algoritmojuridico.com/

CATÁLOGO COMERCIAL Y TARIFAS DE SUSCRIPCIÓN OFICIALES:
- Suscripción por 6 meses: S/ 250 PEN (Soles).
- Suscripción por 1 año: S/ 450 PEN (Soles).
- Planes Corporativos / Multi-cuenta: En caso de requerir más de 3 cuentas para un estudio jurídico o institución, activa de inmediato [HUMAN_HANDOFF] para que un asesor comercial le brinde una propuesta personalizada.

${lightRagResult.formattedPromptContext}

REGLAS ESTRICTAS DE OPERACIÓN:
1. IDIOMA: Responde SIEMPRE en español. Jamás uses inglés.
2. CONCISIÓN: Responde en 2 o 3 párrafos cortos o viñetas (ideal para lectura rápida en WhatsApp).
3. FIDELIDAD LEGAL: Responde con los datos exactos de la base de conocimiento verificada de arriba. Si te preguntan por Derecho Tributario o el IGV, menciona claramente la Ley del Impuesto a la Renta (LIR), IGV (crédito fiscal, bancarización, detracciones), Código Tributario y procedimientos ante SUNAT.
4. PLANES Y PRECIOS: Si te preguntan por precios, planes o suscripciones, ofrece claramente los planes oficiales (6 meses a S/ 250 y 1 año a S/ 450). Si solicitan más de 3 accesos/cuentas o convenio institucional, transfiere inmediatamente al asesor.
5. INTENCIÓN DE COMPRA Y PAGO (CHECKOUT): Si el cliente expresa intención de contratar, solicita pagar o pide el enlace de compra (ej: 'quiero pagar el de 6 meses', 'pásame el link', 'cómo me suscribo', 'quiero comprar'), confirma cordialmente su elección e incluye exactamente el token: [CHECKOUT_TRIGGER] en el lugar donde deba ir el enlace de pago.
`.trim();

    const { text: rawOutput } = await generateText({
      model,
      system: systemPrompt,
      prompt: query,
      temperature: 0.2,
      maxTokens: 500,
    });

    let finalOutput = rawOutput
      .replace(/\[HUMAN_HANDOFF\]/g, "")
      .replace(/\[CHECKOUT_TRIGGER\]/g, ">>link-compra-izipay<<")
      .trim();

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      mode: "agent",
      answer: finalOutput,
      hits: lightRagResult.facts,
      relations: lightRagResult.relations,
      latencyMs,
    });
  } catch (error: any) {
    console.error("[KNOWLEDGE_TEST_ERR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
