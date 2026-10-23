-- Extensiones obligatorias
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- 1. Tenancy y Organizaciones
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  branding jsonb default '{"primary_color": "#2563eb", "logo_url": null}'::jsonb,
  created_at timestamptz not null default now()
);

-- 2. Usuarios del CRM
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- 3. Membresía y Roles en la Organización
create table if not exists public.organization_members (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'agent', 'viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- 4. Instancias de WhatsApp (Multi-Número por Cuenta)
create table if not exists public.whatsapp_instances (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('meta', 'waha')),
  name text not null, -- ej: "Ventas Principal", "Soporte Técnico"
  phone_number text not null, -- E.164
  department text not null default 'sales', -- 'sales', 'support', 'billing', 'general'
  is_active boolean not null default true,
  credentials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. Cuentas de Correo (Inbound & Outbound Email)
create table if not exists public.email_accounts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email_address text not null,
  display_name text not null,
  provider text not null check (provider in ('resend', 'smtp', 'sendgrid', 'postmark')),
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, email_address)
);

-- 6. Contactos / Leads (Normalizados en formato E.164)
create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  phone text,
  email text,
  full_name text,
  company_name text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint uq_org_phone unique (organization_id, phone),
  constraint uq_org_email unique (organization_id, email)
);

-- 7. Embudos de Venta (Pipelines)
create table if not exists public.pipelines (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  stages jsonb not null default '[{"id": "lead", "name": "Nuevo Lead"}, {"id": "contacted", "name": "Contactado"}, {"id": "qualified", "name": "Calificado"}, {"id": "won", "name": "Cerrado Ganado"}, {"id": "lost", "name": "Perdido"}]'::jsonb,
  created_at timestamptz not null default now()
);

-- 8. Deals / Negocios en el Kanban
create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  title text not null,
  stage_id text not null,
  value_cents bigint not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- 9. Conversaciones Omnicanal (WhatsApp y Email)
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_type text not null check (channel_type in ('whatsapp', 'email')),
  instance_id uuid references public.whatsapp_instances(id) on delete set null,
  email_account_id uuid references public.email_accounts(id) on delete set null,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null check (status in ('bot', 'human', 'closed')) default 'bot',
  assigned_user_id uuid references public.users(id) on delete set null,
  last_message_preview text,
  last_customer_message_at timestamptz,
  is_within_24h boolean default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint uq_conv_org_instance_contact unique (organization_id, instance_id, contact_id)
);

-- 10. Mensajes Omnicanal
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  external_id text not null, -- ID de Meta, WAHA o Message-ID de correo para idempotencia
  sender_type text not null check (sender_type in ('customer', 'ai', 'human')),
  sender_id uuid references public.users(id) on delete set null,
  content text not null,
  message_type text not null check (message_type in ('text', 'audio', 'image', 'document', 'interactive')),
  media_url text,
  status text not null check (status in ('received', 'queued', 'sent', 'delivered', 'read', 'failed')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, external_id)
);

-- 11. Fuentes de Conocimiento (Archivos, Textos, Catálogos)
create table if not exists public.knowledge_sources (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('pdf', 'url', 'text', 'faq')),
  status text not null check (status in ('pending', 'indexing', 'ready', 'failed')) default 'pending',
  created_at timestamptz not null default now()
);

-- 12. LightRAG: Nodos de Entidades
create table if not exists public.knowledge_entities (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid references public.knowledge_sources(id) on delete cascade,
  name text not null,
  entity_type text not null,
  description text not null,
  embedding public.vector(1536),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index if not exists idx_knowledge_entities_embedding 
  on public.knowledge_entities using hnsw (embedding vector_cosine_ops);

-- 13. LightRAG: Aristas y Relaciones entre Entidades
create table if not exists public.knowledge_relations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid references public.knowledge_sources(id) on delete cascade,
  source_entity_id uuid not null references public.knowledge_entities(id) on delete cascade,
  target_entity_id uuid not null references public.knowledge_entities(id) on delete cascade,
  relation_type text not null,
  description text not null,
  weight real not null default 1.0,
  created_at timestamptz not null default now()
);
create index if not exists idx_knowledge_relations_nodes 
  on public.knowledge_relations (source_entity_id, target_entity_id);

-- 14. LightRAG: Chunks de Respaldo Vectorial
create table if not exists public.knowledge_chunks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid references public.knowledge_sources(id) on delete cascade,
  content text not null,
  embedding public.vector(1536),
  created_at timestamptz not null default now()
);
create index if not exists idx_knowledge_chunks_embedding 
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- 15. Sincronización con Listmonk
create table if not exists public.listmonk_sync_subscribers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  listmonk_subscriber_id bigint not null,
  email text not null,
  status text not null default 'enabled',
  last_synced_at timestamptz not null default now(),
  unique (organization_id, contact_id)
);

-- 16. Campañas (Difusión WhatsApp y Email)
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('whatsapp', 'email')),
  status text not null check (status in ('draft', 'scheduled', 'running', 'completed', 'failed')) default 'draft',
  total_recipients integer not null default 0,
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

-- Función SQL Recursiva para Consulta de Grafo LightRAG
create or replace function public.fn_lightrag_query(
  p_org_id uuid,
  p_query_embedding public.vector,
  p_match_threshold real default 0.45,
  p_top_entities int default 3,
  p_max_hops int default 2
)
returns table (
  entity_name text,
  entity_type text,
  entity_desc text,
  similarity real,
  relationship_path text,
  target_entity text,
  target_desc text
)
language sql stable
as $$
with recursive
seed_entities as (
  select
    e.id,
    e.name,
    e.entity_type,
    e.description,
    (1 - (e.embedding <=> p_query_embedding))::real as similarity
  from public.knowledge_entities e
  where e.organization_id = p_org_id
    and (1 - (e.embedding <=> p_query_embedding)) >= p_match_threshold
  order by e.embedding <=> p_query_embedding asc
  limit p_top_entities
),
graph_traverse as (
  select
    s.id as current_entity_id,
    s.name as root_name,
    s.entity_type as root_type,
    s.description as root_desc,
    s.similarity as root_similarity,
    ''::text as rel_path,
    s.name as target_name,
    s.description as target_desc,
    0 as current_depth
  from seed_entities s
  union all
  select
    r.target_entity_id as current_entity_id,
    gt.root_name,
    gt.root_type,
    gt.root_desc,
    gt.root_similarity,
    case
      when gt.rel_path = '' then r.relation_type
      else gt.rel_path || ' -> ' || r.relation_type
    end,
    te.name as target_name,
    te.description as target_desc,
    gt.current_depth + 1
  from graph_traverse gt
  join public.knowledge_relations r
    on r.source_entity_id = gt.current_entity_id
   and r.organization_id = p_org_id
  join public.knowledge_entities te
    on te.id = r.target_entity_id
  where gt.current_depth < p_max_hops
)
select distinct
  root_name,
  root_type,
  root_desc,
  root_similarity,
  rel_path,
  target_name,
  target_desc
from graph_traverse;
$$;
