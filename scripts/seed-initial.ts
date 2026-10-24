import { db } from "../src/db/index.js";
import { organizations, users, organizationMembers } from "../src/db/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Iniciando sembrado inicial de datos...");

  // 1. Crear Organización por defecto si no existe
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "algoritmo-juridico"),
  });

  if (!org) {
    const [insertedOrg] = await db
      .insert(organizations)
      .values({
        name: "Algoritmo Jurídico",
        slug: "algoritmo-juridico",
        branding: {
          primary_color: "#2563eb",
          logo_url: null,
        },
      })
      .returning();
    org = insertedOrg;
    console.log(`Organización creada: ${org.name} (ID: ${org.id})`);
  } else {
    console.log(`Organización existente: ${org.name} (ID: ${org.id})`);
  }

  // 2. Crear Usuario Administrador si no existe
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@algoritmojuridico.com";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123456";

  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const [insertedUser] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        fullName: "Administrador Algoritmo Jurídico",
      })
      .returning();
    adminUser = insertedUser;
    console.log(`Usuario administrador creado: ${adminUser.email}`);
  } else {
    console.log(`Usuario administrador existente: ${adminUser.email}`);
  }

  // 3. Vincular como Miembro Admin
  const existingMember = await db.query.organizationMembers.findFirst({
    where: (om, { and, eq }) =>
      and(
        eq(om.organizationId, org!.id),
        eq(om.userId, adminUser!.id)
      ),
  });

  if (!existingMember) {
    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: adminUser.id,
      role: "admin",
    });
    console.log(`Membresía admin asignada al usuario ${adminUser.email}`);
  }

  console.log("Sembrado finalizado con éxito.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error durante el sembrado:", err);
  process.exit(1);
});
