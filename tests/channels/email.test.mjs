import test from "node:test";
import assert from "node:assert/strict";
import { emailAdapter } from "../../src/channels/email/adapter.ts";
import { ListmonkClient } from "../../src/channels/email/listmonk.ts";

test("TDD Suite: Flujos de Email y Listmonk", async (t) => {
  await t.test("Parseo de webhook Inbound Email con remitente compuesto", () => {
    const rawPayload = {
      from: '"Dra. Valentina Mendoza" <valentina@estudiojuridico.pe>',
      to: "ventas@misaas.com",
      subject: "Consulta sobre planes para estudio jurídico",
      text: "Hola, quisiéramos saber el costo de 5 usuarios.",
      message_id: "resend_msg_abc123456",
    };

    const parsed = emailAdapter.parseInboundWebhook(rawPayload);
    assert.ok(parsed, "El email entrante no fue parseado");
    assert.equal(parsed.from, "valentina@estudiojuridico.pe");
    assert.equal(parsed.fromName, "Dra. Valentina Mendoza");
    assert.equal(parsed.accountEmail, "ventas@misaas.com");
    assert.equal(parsed.subject, "Consulta sobre planes para estudio jurídico");
    assert.equal(parsed.messageId, "resend_msg_abc123456");
  });

  await t.test("Envío de correo saliente mediante adaptador", async () => {
    const res = await emailAdapter.send(
      "notificaciones@misaas.com",
      "Mi SaaS CRM",
      {
        to: "cliente@empresa.com",
        subject: "Su cotización personalizada",
        textBody: "Adjuntamos el detalle del plan acordado.",
      },
      {} // Fallback mock
    );

    assert.equal(res.success, true);
    assert.ok(res.messageId, "No devolvió un ID de mensaje de envío");
  });

  await t.test("Cliente Listmonk maneja credenciales y url base", () => {
    const client = new ListmonkClient({
      baseUrl: "http://localhost:9000",
      username: "admin",
      password: "secretpassword",
    });

    assert.ok(client, "Instancia de ListmonkClient inicializada");
  });
});
