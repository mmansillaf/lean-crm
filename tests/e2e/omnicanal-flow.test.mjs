import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { ingestKnowledgeDocument } from "../../src/ai/lightrag/extract.ts";
import { searchLightRag } from "../../src/ai/lightrag/search.ts";
import { evaluateLeadScore } from "../../src/ai/agent/scoring.ts";
import { sanitizeAndGuardPrompt } from "../../src/ai/agent/guardrails.ts";
import { assignLeadRoundRobin } from "../../src/crm/round-robin.ts";
import { generatePaymentLink } from "../../src/crm/payment-links.ts";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/lean_crm";

test("TDD Suite E2E: Flujo Omnicanal Completo (WhatsApp Dual + LightRAG + Handoff + Email + Pagos)", async (t) => {
  const pool = new pg.Pool({ connectionString });

  t.after(async () => {
    await pool.end();
  });

  await t.test("Simulación End-to-End del Ciclo de Vida del Lead", async () => {
    // PASO 1: Creación de Organización y Pipeline
    const orgRes = await pool.query(
      "insert into organizations (name, slug) values ($1, $2) returning id",
      ["E2E Omnichannel Corp", `e2e-org-${Date.now()}`]
    );
    const orgId = orgRes.rows[0].id;

    const pipelineRes = await pool.query(
      "insert into pipelines (organization_id, name) values ($1, 'Ventas B2B') returning id",
      [orgId]
    );
    const pipelineId = pipelineRes.rows[0].id;

    // PASO 2: Configuración Multi-Número (Instancia Ventas Meta + Instancia Soporte WAHA)
    const instVentasRes = await pool.query(
      "insert into whatsapp_instances (organization_id, provider, name, phone_number, department) values ($1, 'meta', 'Ventas Meta', '+51999888001', 'sales') returning id",
      [orgId]
    );
    const instVentasId = instVentasRes.rows[0].id;

    const instSoporteRes = await pool.query(
      "insert into whatsapp_instances (organization_id, provider, name, phone_number, department) values ($1, 'waha', 'Soporte WAHA', '+51999888002', 'support') returning id",
      [orgId]
    );
    const instSoporteId = instSoporteRes.rows[0].id;

    assert.ok(instVentasId && instSoporteId, "Instancias multi-número creadas");

    // PASO 3: Agentes Humanos para Round-Robin
    const userAgent = await pool.query(
      "insert into users (email, password_hash, full_name) values ($1, 'hash', 'Agente Rodrigo') returning id",
      [`rodrigo-${Date.now()}@e2e.com`]
    );
    await pool.query(
      "insert into organization_members (organization_id, user_id, role) values ($1, $2, 'agent')",
      [orgId, userAgent.rows[0].id]
    );

    // PASO 4: Ingesta de Base de Conocimiento LightRAG
    const sourceRes = await pool.query(
      "insert into knowledge_sources (organization_id, name, source_type, status) values ($1, 'Catalogo E2E', 'text', 'ready') returning id",
      [orgId]
    );
    const sourceId = sourceRes.rows[0].id;

    const mockGraph = {
      entities: [
        { name: "Plan Enterprise", type: "plan", description: "Costo $5,000 USD al año con soporte 24/7" },
        { name: "SLA Garantizado", type: "beneficio", description: "99.9% de uptime y asesor dedicado" },
      ],
      relations: [
        { sourceEntity: "Plan Enterprise", targetEntity: "SLA Garantizado", relationType: "incluye", description: "Cuenta con SLA empresarial" },
      ],
    };

    const mockEmbed = async () => new Array(1536).fill(0.01);
    await ingestKnowledgeDocument(orgId, sourceId, mockGraph, mockEmbed);

    // PASO 5: Llegada de mensaje de WhatsApp entrante
    const rawCustomerMessage = "Hola, quisiera precio y comprar el Plan Enterprise";

    // 5.1 Guardrails
    const guardrail = sanitizeAndGuardPrompt(rawCustomerMessage);
    assert.equal(guardrail.isSafe, true);

    // 5.2 Lead Scoring
    const scoring = evaluateLeadScore(guardrail.sanitizedInput);
    assert.equal(scoring.temperature, "hot");
    assert.ok(scoring.score >= 60);

    // 5.3 Consulta LightRAG
    const queryVec = new Array(1536).fill(0.01);
    const ragResult = await searchLightRag(orgId, queryVec);
    assert.ok(ragResult.formattedPromptContext.includes("Plan Enterprise"));

    // PASO 6: Creación del Contacto, Conversación y Deal en Pipeline
    const contactRes = await pool.query(
      "insert into contacts (organization_id, phone, email, full_name) values ($1, '+51999123456', 'lead@empresa.com', 'Comprador E2E') returning id",
      [orgId]
    );
    const contactId = contactRes.rows[0].id;

    const convRes = await pool.query(
      "insert into conversations (organization_id, instance_id, contact_id, channel_type, status) values ($1, $2, $3, 'whatsapp', 'bot') returning id",
      [orgId, instVentasId, contactId]
    );
    const convId = convRes.rows[0].id;

    const dealRes = await pool.query(
      "insert into deals (organization_id, pipeline_id, contact_id, title, stage_id, value_cents) values ($1, $2, $3, 'Oportunidad Plan Enterprise', 'qualified', 500000) returning id",
      [orgId, pipelineId, contactId]
    );
    assert.ok(dealRes.rows[0].id, "Deal creado con éxito en pipeline");

    // PASO 7: Handoff a Humano & Round-Robin
    await pool.query("update conversations set status = 'human' where id = $1", [convId]);
    const assignedAgent = await assignLeadRoundRobin(orgId);
    assert.equal(assignedAgent.userId, userAgent.rows[0].id);

    // PASO 8: Generación de Link de Pago para Cierre
    const paymentUrl = generatePaymentLink({
      title: "Plan Enterprise E2E",
      amountCents: 500000,
      currency: "USD",
      contactPhone: "+51999123456",
      organizationSlug: "e2e-corp",
      provider: "stripe",
    });
    assert.ok(paymentUrl.includes("amount=500000"));

    // PASO 9: Contacto envía correo -> Verificación de Ficha 360 Unificada
    const emailConv = await pool.query(
      "insert into conversations (organization_id, contact_id, channel_type, status) values ($1, $2, 'email', 'human') returning id",
      [orgId, contactId]
    );
    assert.ok(emailConv.rows[0].id, "Conversación de correo unificada en el mismo contacto");

    // Comprobación de que el contacto tiene 2 conversaciones activas (WhatsApp + Email)
    const allConvs = await pool.query(
      "select channel_type from conversations where contact_id = $1 order by channel_type asc",
      [contactId]
    );
    assert.equal(allConvs.rows.length, 2);
    assert.equal(allConvs.rows[0].channel_type, "email");
    assert.equal(allConvs.rows[1].channel_type, "whatsapp");
  });
});
