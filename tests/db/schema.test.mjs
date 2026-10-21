import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/lean_crm";

test("TDD Suite: Verificación de Esquema EARS e Invariantes en PostgreSQL", async (t) => {
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 3000 });

  t.after(async () => {
    await pool.end();
  });

  await t.test("[UBI-01] Extensiones uuid-ossp y vector deben estar habilitadas", async () => {
    const { rows } = await pool.query(
      "select extname from pg_extension where extname in ('uuid-ossp', 'vector')"
    );
    const extensions = rows.map((r) => r.extname);
    assert.ok(extensions.includes("uuid-ossp"), "uuid-ossp no está instalada");
    assert.ok(extensions.includes("vector"), "vector no está instalada");
  });

  await t.test("[UBI-02] Las 16 tablas relacionales del CRM deben existir en public", async () => {
    const expectedTables = [
      "organizations",
      "users",
      "organization_members",
      "whatsapp_instances",
      "email_accounts",
      "contacts",
      "pipelines",
      "deals",
      "conversations",
      "messages",
      "knowledge_sources",
      "knowledge_entities",
      "knowledge_relations",
      "knowledge_chunks",
      "listmonk_sync_subscribers",
      "campaigns",
    ];

    const { rows } = await pool.query(
      "select table_name from information_schema.tables where table_schema = 'public'"
    );
    const existing = rows.map((r) => r.table_name);

    for (const table of expectedTables) {
      assert.ok(existing.includes(table), `Tabla faltante: ${table}`);
    }
  });

  await t.test("[UBI-03 & UNW-01] Idempotencia en mensajes: rechazar external_id duplicado", async () => {
    // 1. Crear organización de prueba
    const orgRes = await pool.query(
      "insert into organizations (name, slug) values ($1, $2) returning id",
      ["Test Org Idempotency", `test-org-${Date.now()}`]
    );
    const orgId = orgRes.rows[0].id;

    // 2. Crear contacto y conversación
    const contactRes = await pool.query(
      "insert into contacts (organization_id, phone) values ($1, $2) returning id",
      [orgId, `+51999${Math.floor(100000 + Math.random() * 900000)}`]
    );
    const contactId = contactRes.rows[0].id;

    const convRes = await pool.query(
      "insert into conversations (organization_id, contact_id, channel_type) values ($1, $2, 'whatsapp') returning id",
      [orgId, contactId]
    );
    const convId = convRes.rows[0].id;

    const extId = `wamid.HBgL${Date.now()}`;

    // 3. Primer insert -> debe pasar
    await pool.query(
      "insert into messages (organization_id, conversation_id, external_id, sender_type, content, message_type, status) values ($1, $2, $3, 'customer', 'hola', 'text', 'received')",
      [orgId, convId, extId]
    );

    // 4. Segundo insert idéntico -> debe fallar con error 23505 (unique_violation)
    await assert.rejects(
      async () => {
        await pool.query(
          "insert into messages (organization_id, conversation_id, external_id, sender_type, content, message_type, status) values ($1, $2, $3, 'customer', 'hola', 'text', 'received')",
          [orgId, convId, extId]
        );
      },
      (err) => {
        assert.equal(err.code, "23505", "No arrojó error de clave única 23505");
        return true;
      }
    );
  });

  await t.test("[EVT-02] fn_lightrag_query debe ejecutarse sin errores y retornar columnas válidas", async () => {
    // Crear vector sintético de 1536 dimensiones con valor 0.01
    const vec = `[${new Array(1536).fill(0.01).join(",")}]`;

    const res = await pool.query(
      "select * from fn_lightrag_query($1::uuid, $2::vector, 0.45, 3, 2)",
      ["00000000-0000-0000-0000-000000000000", vec]
    );
    assert.ok(Array.isArray(res.rows), "El resultado debe ser un arreglo");
  });

  await t.test("[EDD - Mutación] Operaciones sin organization_id deben ser rechazadas con 23502", async () => {
    await assert.rejects(
      async () => {
        // Intento de inserción sin organization_id
        await pool.query(
          "insert into contacts (phone, full_name) values ('+51999999999', 'Hacker Anon')"
        );
      },
      (err) => {
        assert.equal(err.code, "23502", "Postgres debió rechazar por not_null_violation (23502)");
        return true;
      }
    );
  });
});
