# Especificación Maestra Consolidada: CRM Omnicanal Lean, WhatsApp Multi-Número, Email Marketing (Listmonk) y LightRAG

## 1. Arquitectura de Flujos de Correo Electrónico y Campañas

### 1.1 Inbound & Outbound Transaccional (Atención y Ventas por Email)
* **Entrada (Inbound Email)**:
  * Mecanismo: Webhook Inbound Parse (vía Resend Webhooks, Postmark o SendGrid Inbound).
  * Funcionamiento: Los correos enviados a `ventas@empresa.com` o respuestas de clientes disparan un webhook HTTP POST con el payload estructurado (remitente, asunto, cuerpo HTML/texto, adjuntos).
  * Integración con Agente IA: El agente de IA procesa el correo entrante con la misma base de conocimiento LightRAG, genera un borrador formal o responde directamente según la política del tenant.
* **Salida (Outbound Email)**:
  * Envío transaccional vía API REST (Resend) o SMTP dedicado con autenticación DKIM/SPF/DMARC por tenant.
  * Capacidad de adjuntar cotizaciones generadas en PDF y propuestas comerciales firmadas digitalmente.

### 1.2 Campañas de Email Masivo con Listmonk
* **Por qué Listmonk**: Es el motor open-source de newsletters y mailings de mayor rendimiento del mercado (desarrollado en Go, ligero, maneja millones de envíos, corre sobre PostgreSQL).
* **Integración con Lean CRM**:
  * **Base de Datos Compartida o API REST**: Listmonk se despliega en el mismo `docker-compose.yml` compartiendo el clúster PostgreSQL (o con BD separada `listmonk` en la misma instancia).
  * **Sincronización Bidireccional**:
    1. Cuando un contacto cambia de etapa en el CRM (ej: a "Calificado" o "Cliente Activo"), un trigger/hook lo suscribe a la lista correspondiente en Listmonk (`POST /api/subscribers`).
    2. Las métricas de apertura, clics y rebotes de Listmonk se reflejan en el Customer 360 del contacto en el CRM.

---

## 2. Arquitectura de WhatsApp Multi-Número por Cuenta / Cliente

### 2.1 ¿Es Posible?
**Sí, es 100% posible y es un requerimiento estándar en operaciones B2B.** Un mismo cliente o tenant puede conectar:
1. Número de Ventas (ej: WhatsApp Meta Cloud API).
2. Número de Soporte Técnico (ej: WhatsApp WAHA).
3. Números por Sucursal o País (ej: Número México +52, Número Perú +51, Número Colombia +57).

### 2.2 Implementación en el Modelo de Datos
La relación entre Organización e Instancias es de uno a muchos (`organizations 1 ──< N whatsapp_instances`):

```sql
-- Cada organización puede tener N instancias de WhatsApp activas
create table public.whatsapp_instances (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('meta', 'waha')),
  name text not null, -- ej: "Ventas Lima", "Soporte Post-Venta"
  phone_number text not null, -- E.164
  department text not null default 'general', -- 'sales', 'support', 'billing'
  is_active boolean not null default true,
  credentials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Las conversaciones quedan aisladas por instancia y contacto
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  instance_id uuid not null references public.whatsapp_instances(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel_type text not null default 'whatsapp', -- 'whatsapp', 'email'
  unique (organization_id, instance_id, contact_id)
);
```

### 2.3 Enrutamiento y Experiencia de Usuario
* **Customer 360 Unificado**: Aunque el cliente hable con dos números distintos de la misma empresa (Ventas y Soporte), en el CRM se consolidan bajo el mismo perfil de contacto.
* **Agentes de IA Especializados por Número**:
  * Al número de Ventas se le vincula un agente de IA con prompt persuasivo y catálogo comercial.
  * Al número de Soporte se le vincula un agente de IA con manuales técnicos y políticas de garantía.

---

## 3. Matriz Consolidada de Características y Capacidades (Todas Incluidas)

| Categoría | Capacidad | Detalle de Implementación |
|---|---|---|
| **Canales WhatsApp** | **1. WhatsApp Dual-Engine** | Meta Cloud API oficial (Graph v21) + WAHA NOWEB en paralelo. |
| | **2. Multi-Número por Tenant** | Múltiples números asignables a distintas áreas (Ventas, Soporte, Sucursales). |
| | **3. Control Ventana 24h** | Columna generada en BD; bloqueo de texto libre y requerimiento de plantillas aprobadas fuera de plazo. |
| | **4. Pipeline de Notas de Voz** | STT ultrarrápido con Groq Whisper Large v3 (<400ms) y salida de audio nativa OGG/Opus. |
| | **5. Broadcast con Anti-Ban** | Campañas de difusión con pausas aleatorias (jitter) y rotación de instancias. |
| **Canales Correo** | **6. Inbound/Outbound Email** | Webhook parser para recepción de correos + envío SMTP/Resend con soporte PDF. |
| | **7. Campañas con Listmonk** | Integración nativa con Listmonk para mailings masivos, segmentación y tracking. |
| **CRM Comercial** | **8. Customer 360** | Perfil omnicanal consolidado (WhatsApp multi-número, correo, deals y notas). |
| | **9. Live Inbox Compartido** | Bandeja de entrada en tiempo real con conmutador `bot` $\leftrightarrow$ `human`. |
| | **10. Kanban de Ventas** | Embudos configurables con indexación fraccional y drag & drop de deals. |
| | **11. Rotación Round-Robin** | Distribución equitativa de leads entre vendedores humanos disponibles tras handoff. |
| | **12. Links de Pago en Chat** | Generación de enlaces dinámicos de Stripe / Mercado Pago desde el flujo de venta. |
| **Inteligencia & IA** | **13. LightRAG en PostgreSQL** | Búsqueda dual: atributos exactos + relaciones contextuales con `fn_lightrag_query`. |
| | **14. Agente Autónomo con Guardrails** | Delimitación estricta `<customer_message>`, cero alucinaciones y handoff auditado. |
| | **15. Lead Scoring Predictivo** | Clasificación de temperatura de compra (Frío, Tibio, Caliente) en cada turno. |
| | **16. Agendamiento Nativo** | Conexión con Cal.com / Google Calendar para reservar citas dentro de la conversación. |
| | **17. Enriquecimiento de Leads** | Extracción automática de información corporativa a partir del dominio o documento fiscal. |
| | **18. Copiloto de Sugerencias** | Generación de borradores en pantalla para que el agente humano los apruebe con 1 clic. |
| **White-Label** | **19. Multi-Tenancy & Branding** | Aislamiento estricto por `organization_id`, subdominios personalizados y temas CSS dinámicos. |

---

## 4. Plan de Trabajo Ajustado (10 Semanas)

```
                       PLAN DE IMPLEMENTACIÓN INTEGRAL (10 SEMANAS)
 Sem 1–2  ──► [Infraestructura Docker: Postgres + pgvector + Listmonk + DDL 16 Tablas]
 Sem 3    ──► [Capa WhatsApp Multi-Número: Meta Cloud API + WAHA]
 Sem 4    ──► [Capa de Correo: Inbound Webhooks + Resend/SMTP + Listmonk Sync]
 Sem 5    ──► [Motor LightRAG: Ingesta de Documentos y Función Recursiva SQL]
 Sem 6    ──► [Runtime del Agente Autónomo: Guardrails, Lead Scoring & Handoff]
 Sem 7    ──► [Frontend UI: Live Inbox Omnicanal (WA + Email) + Kanban Drag & Drop]
 Sem 8    ──► [Capacidades Comerciales: Round-Robin, Links de Pago & Calendar]
 Sem 9    ──► [Pipeline de Voz Groq Whisper & Enriquecimiento Web de Leads]
 Sem 10   ──► [White-Label, Subdominios Dinámicos, Pruebas E2E & Hardening para Producción]
```
