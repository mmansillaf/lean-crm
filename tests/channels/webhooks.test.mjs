import test from "node:test";
import assert from "node:assert/strict";
import { metaAdapter } from "../../src/channels/meta/adapter.ts";
import { wahaAdapter } from "../../src/channels/waha/adapter.ts";
import crypto from "node:crypto";

test("TDD Suite: Canales WhatsApp Dual & Webhooks", async (t) => {
  await t.test("[EVT-META-02] Firma HMAC-SHA256 válida debe ser aceptada", () => {
    const secret = "test_meta_secret_123";
    const body = JSON.stringify({ test: "data" });
    const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const signatureHeader = `sha256=${hmac}`;

    const isValid = metaAdapter.verifyWebhookSignature(body, signatureHeader, secret);
    assert.equal(isValid, true, "La firma HMAC válida no fue aceptada");
  });

  await t.test("[UNW-META-01] Firma HMAC-SHA256 alterada o falsa debe ser rechazada", () => {
    const secret = "test_meta_secret_123";
    const body = JSON.stringify({ test: "data" });
    const signatureHeader = "sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

    const isValid = metaAdapter.verifyWebhookSignature(body, signatureHeader, secret);
    assert.equal(isValid, false, "Una firma falsa debió ser rechazada");
  });

  await t.test("[EVT-META-03] Parseo de payload oficial de Meta Cloud API", () => {
    const mockPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID_123",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "15550234567",
                  phone_number_id: "PHONE_ID_999",
                },
                contacts: [{ profile: { name: "Carlos M." }, wa_id: "51999888777" }],
                messages: [
                  {
                    from: "51999888777",
                    id: "wamid.HBgLMTE...",
                    timestamp: "1729548000",
                    text: { body: "Hola, me interesa el plan pro" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const parsed = metaAdapter.parseWebhookPayload(mockPayload);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].fromPhone, "51999888777");
    assert.equal(parsed[0].content, "Hola, me interesa el plan pro");
    assert.equal(parsed[0].senderName, "Carlos M.");
  });

  await t.test("[EVT-WAHA-01] Parseo de payload WAHA NOWEB y descarte de fromMe: true", () => {
    // 1. Mensaje entrante de cliente -> debe parsear
    const incomingWaha = {
      event: "message",
      session: "ventas-lima",
      payload: {
        id: "false_51999888777@c.us_3EB0...",
        from: "51999888777@c.us",
        body: "Quiero una cotización",
        fromMe: false,
        hasMedia: false,
        _data: { notifyName: "Roberto" },
      },
    };

    const parsedIn = wahaAdapter.parseWebhookPayload(incomingWaha);
    assert.equal(parsedIn.length, 1);
    assert.equal(parsedIn[0].fromPhone, "51999888777");
    assert.equal(parsedIn[0].content, "Quiero una cotización");

    // 2. Mensaje propio del operador (fromMe: true) -> debe ignorar
    const outgoingEcho = {
      event: "message",
      session: "ventas-lima",
      payload: {
        id: "true_51999888777@c.us_3EB0...",
        from: "51999888777@c.us",
        body: "Respuesta mía",
        fromMe: true,
      },
    };

    const parsedOut = wahaAdapter.parseWebhookPayload(outgoingEcho);
    assert.equal(parsedOut.length, 0, "No debe procesar mensajes fromMe: true");
  });
});
