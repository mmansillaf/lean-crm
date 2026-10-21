import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { generatePaymentLink } from "../../src/crm/payment-links.ts";
import { getAvailableMeetingSlots } from "../../src/crm/calendar.ts";
import { assignLeadRoundRobin } from "../../src/crm/round-robin.ts";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/lean_crm";

test("TDD Suite: Capacidades Comerciales (Round-Robin, Pagos & Calendario)", async (t) => {
  const pool = new pg.Pool({ connectionString });

  t.after(async () => {
    await pool.end();
  });

  await t.test("Generación de enlace de pago dinámico Stripe y Mercado Pago", () => {
    const linkStripe = generatePaymentLink({
      title: "Plan Pro Anual",
      amountCents: 50000,
      currency: "USD",
      contactPhone: "+51999888777",
      organizationSlug: "clinica-dental",
      provider: "stripe",
    });
    assert.ok(linkStripe.startsWith("https://buy.stripe.com/clinica-dental-"));
    assert.ok(linkStripe.includes("amount=50000"));

    const linkMP = generatePaymentLink({
      title: "Consulta Dental",
      amountCents: 15000,
      currency: "PEN",
      contactPhone: "+51999888777",
      organizationSlug: "clinica-dental",
      provider: "mercadopago",
    });
    assert.ok(linkMP.startsWith("https://mpago.la/pay/clinica-dental-"));
    assert.ok(linkMP.includes("amount=150.00"));
  });

  await t.test("Consulta de horarios disponibles para agendamiento", () => {
    const slots = getAvailableMeetingSlots(new Date());
    assert.equal(slots.length, 4);
    assert.ok(slots[0].formattedTime.length > 0);
  });

  await t.test("Asignación Round-Robin distribuye al agente con menor carga", async () => {
    // 1. Crear organización y 2 agentes
    const orgRes = await pool.query(
      "insert into organizations (name, slug) values ($1, $2) returning id",
      ["Agencia Inmobiliaria RR", `rr-org-${Date.now()}`]
    );
    const orgId = orgRes.rows[0].id;

    const u1 = await pool.query(
      "insert into users (email, password_hash, full_name) values ($1, 'hash', 'Asesor Juan') returning id",
      [`juan-${Date.now()}@inmuebles.com`]
    );
    const u2 = await pool.query(
      "insert into users (email, password_hash, full_name) values ($1, 'hash', 'Asesora Maria') returning id",
      [`maria-${Date.now()}@inmuebles.com`]
    );

    await pool.query(
      "insert into organization_members (organization_id, user_id, role) values ($1, $2, 'agent'), ($1, $3, 'agent')",
      [orgId, u1.rows[0].id, u2.rows[0].id]
    );

    // Asignar primer lead -> debe retornar uno de los 2
    const assigned = await assignLeadRoundRobin(orgId);
    assert.ok(assigned, "No retornó agente disponible");
    assert.ok(assigned.userId === u1.rows[0].id || assigned.userId === u2.rows[0].id);
  });
});
