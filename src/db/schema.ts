import {
  pgTable,
  uuid,
  text,
  boolean,
  bigint,
  jsonb,
  real,
  timestamp,
  uniqueIndex,
  index,
  customType,
} from "drizzle-orm/pg-core";

// Tipo vector para pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(val: number[]): string {
    return `[${val.join(",")}]`;
  },
  fromDriver(val: string): number[] {
    return val.slice(1, -1).split(",").map(Number);
  },
});

// 1. Organizaciones (Tenants)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  branding: jsonb("branding").default({ primary_color: "#2563eb", logo_url: null }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Usuarios
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Miembros
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // 'admin', 'agent', 'viewer'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Instancias de WhatsApp
export const whatsappInstances = pgTable("whatsapp_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider").notNull(), // 'meta', 'waha'
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  department: text("department").default("sales").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  credentials: jsonb("credentials").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Cuentas de Correo
export const emailAccounts = pgTable("email_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  emailAddress: text("email_address").notNull(),
  displayName: text("display_name").notNull(),
  provider: text("provider").notNull(), // 'resend', 'smtp', 'sendgrid', 'postmark'
  settings: jsonb("settings").default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Contactos
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  phone: text("phone"),
  email: text("email"),
  fullName: text("full_name"),
  companyName: text("company_name"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Pipelines
export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  stages: jsonb("stages").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Deals
export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  pipelineId: uuid("pipeline_id").references(() => pipelines.id, { onDelete: "cascade" }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  stageId: text("stage_id").notNull(),
  valueCents: bigint("value_cents", { mode: "number" }).default(0).notNull(),
  currency: text("currency").default("USD").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Conversaciones
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  channelType: text("channel_type").default("whatsapp").notNull(), // 'whatsapp', 'email'
  instanceId: uuid("instance_id").references(() => whatsappInstances.id, { onDelete: "set null" }),
  emailAccountId: uuid("email_account_id").references(() => emailAccounts.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
  status: text("status").default("bot").notNull(), // 'bot', 'human', 'closed'
  assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  lastMessagePreview: text("last_message_preview"),
  lastCustomerMessageAt: timestamp("last_customer_message_at", { withTimezone: true }),
  isWithin24h: boolean("is_within_24h").default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Mensajes
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  externalId: text("external_id").notNull(), // Idempotencia
  senderType: text("sender_type").notNull(), // 'customer', 'ai', 'human'
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  messageType: text("message_type").notNull(), // 'text', 'audio', 'image', 'document', 'interactive'
  mediaUrl: text("media_url"),
  status: text("status").notNull(), // 'received', 'sent', 'delivered', 'read', 'failed'
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. Fuentes de Conocimiento
export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  sourceType: text("source_type").notNull(), // 'pdf', 'url', 'text', 'faq'
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. LightRAG: Entidades
export const knowledgeEntities = pgTable(
  "knowledge_entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    sourceId: uuid("source_id").references(() => knowledgeSources.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    entityType: text("entity_type").notNull(),
    description: text("description").notNull(),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("idx_org_entity_name").on(t.organizationId, t.name)]
);

// 12. LightRAG: Relaciones
export const knowledgeRelations = pgTable(
  "knowledge_relations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
    sourceId: uuid("source_id").references(() => knowledgeSources.id, { onDelete: "cascade" }),
    sourceEntityId: uuid("source_entity_id").references(() => knowledgeEntities.id, { onDelete: "cascade" }).notNull(),
    targetEntityId: uuid("target_entity_id").references(() => knowledgeEntities.id, { onDelete: "cascade" }).notNull(),
    relationType: text("relation_type").notNull(),
    description: text("description").notNull(),
    weight: real("weight").default(1.0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_relations_nodes").on(t.sourceEntityId, t.targetEntityId)]
);

// 13. LightRAG: Chunks de texto
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  sourceId: uuid("source_id").references(() => knowledgeSources.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: vector("embedding"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 14. Sincronización Listmonk
export const listmonkSyncSubscribers = pgTable("listmonk_sync_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
  listmonkSubscriberId: bigint("listmonk_subscriber_id", { mode: "number" }).notNull(),
  email: text("email").notNull(),
  status: text("status").default("enabled").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
});

// 15. Campañas Omnicanal
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  channel: text("channel").notNull(), // 'whatsapp', 'email'
  status: text("status").default("draft").notNull(), // 'draft', 'scheduled', 'running', 'completed', 'failed'
  totalRecipients: bigint("total_recipients", { mode: "number" }).default(0).notNull(),
  sentCount: bigint("sent_count", { mode: "number" }).default(0).notNull(),
  deliveredCount: bigint("delivered_count", { mode: "number" }).default(0).notNull(),
  failedCount: bigint("failed_count", { mode: "number" }).default(0).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
