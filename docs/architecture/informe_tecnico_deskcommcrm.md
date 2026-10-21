# Informe Técnico Valorado: DeskcommCRM

## 1. Ficha Técnica y Estado del Repositorio

| Parámetro | Dato Verificado |
|---|---|
| **Repositorio** | `melgarafael/DeskcommCRM` |
| **Licencia** | MIT (Comercial, modificación y distribución sin regalías) |
| **Última Versión / Tag** | `v1.86.0` (Tags continuos de v1.0.0 a v1.86.0) |
| **Actividad Reciente** | PR #2711 mergeado hoy (21-Oct-2026) |
| **Volumen de Código** | **1,400,768 líneas** en 7,027 archivos |
| **Desglose de Lenguajes** | TS: 1,006,001 LOC (5,095 archivos) · TSX: 219,189 LOC (1,259 archivos) · SQL: 134,368 LOC (537 migraciones) · Shell: 35,424 LOC (130 scripts) |
| **Base de Datos** | PostgreSQL (Supabase) · **176 tablas** relacionales · RLS multi-tenant mandatorio |
| **Frameworks Core** | Next.js 16 (App Router + Turbopack) · React 19 · Tailwind CSS v4 · Shadcn/UI |
| **Integraciones Mensajería**| WAHA Plus (NOWEB engine) · Meta Cloud API · Zernio · Redes Sociales nativas |
| **Motor de IA / Protocolos** | Vercel AI SDK (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`) · MCP (Model Context Protocol) Server interno nativo |
| **Telefonía / VoIP** | Perfil Asterisk opcional (SIP Trunking, PJSIP, ARI, voice agent) |
| **Infraestructura Despliegue**| Docker Compose, Caddy, Traefik, Cloudflare Tunnel, scripts automatizados para Ubuntu x86_64 y ARM64 (Oracle Ampere) |
| **Suite de Pruebas** | **2,499 archivos de test** (1,601 tests unitarios Vitest + E2E Playwright + shell tests + invariantes DB) |

---

## 2. Estudio y Análisis Arquitectónico

### 2.1 Modelo de Datos y Multi-Tenancy
* **Aislamiento Multi-Tenant**: Toda tabla tenant-aware implementa la columna `organization_id uuid not null references organizations(id) on delete cascade`.
* **Seguridad en Capa de Datos (RLS)**: Cada consulta ejecuta bajo políticas `tenant_isolation_<tabla>_all` usando la función de seguridad `fn_user_org_ids()`.
* **Idempotencia y Event Sourcing Ligero**:
  * La tabla `event_log` y transacciones en Postgres manejan eventos sin triggers HTTP bloqueantes.
  * Claves de idempotencia de 24h vía tabla `public.idempotency_keys` para APIs y webhooks externos.

### 2.2 Sistema Nervioso de IA y Servidor MCP
* **Arquitectura MCP First**: Las operaciones clave del CRM están modeladas como herramientas MCP (`lib/mcp/tools/`):
  * Leads, pipelines y deals
  * Agendamiento y calendario con cálculo de disponibilidad
  * Catálogo de productos, checkout y propuestas comerciales
  * Escalación y handoff IA $\rightarrow$ Humano con trazabilidad auditada
  * Privacidad y cumplimiento LGPD (anonimización y borrado)
* **Flywheel de Aprendizaje**: Transición de conversaciones resueltas hacia la base de conocimiento vectorial (RAG por tenant) con límites presupuestarios (`ai_budget`) por organización.

### 2.3 Capa de Comunicaciones (WhatsApp & VoIP)
* **WhatsApp Engine**: Soporte dual:
  1. *WAHA Plus (NOWEB)*: Emulación Web sin navegador pesado, gestión multi-instancia, webhooks firmados con HMAC-SHA512.
  2. *Meta Cloud API Oficial*: Conexión directa mediante Graph API para empresas con requerimientos de cero riesgo de baneo.
* **Voz y Telefonía**: Soporte nativo para PBX Asterisk vía ARI y PJSIP, habilitando agentes de voz telefónicos en perfil aislado de Docker Compose.

---

## 3. Validación Técnica y Auditoría de Riesgos

### 3.1 Puntos Fuertes Validados
1. **Rigor de Ingeniería Extremo**: Más de 2,400 archivos de prueba. La suite incluye tests de cercas (`cercas`), pruebas de invariantes de base de datos y validaciones de migración preflight.
2. **Hardening de Producción**: Error boundaries dedicados en todas las capas de Next.js, sanitización de PII en logs y Sentry antes de enviar traces.
3. **Despliegue Auto-Contenido**: Scripts de aprovisionamiento listos para VPS (Caddy con TLS automático, Docker Compose sin compilación en destino).

### 3.2 Vulnerabilidades y Deuda Técnica Detectadas
1. **Riesgo Operativo en WAHA (WhatsApp Web)**: Uso de emulación de sesión WhatsApp. Aunque cuenta con throttling anti-ban y detección de STOP, sigue sujeto al riesgo de bloqueo de números por parte de Meta si se usa para cold outreach masivo.
2. **Dependencia Fuerte de Supabase**: Aunque soporta stack local con Docker, el código está fuertemente acoplado a la API y librerías de Supabase (`@supabase/ssr`, GoTrue, Storage, Realtime).
3. **Ausencia de Rate Limiting Uniforme en Borde**: Ciertas rutas expuestas sin sesión dependen únicamente de la validación criptográfica (HMAC o Bearer) sin capa WAF/Rate Limiting por IP previa en instalaciones sin Cloudflare.
4. **Curva de Complejidad**: Repositorio de 1.4 millones de líneas de código; la incorporación de nuevos desarrolladores requiere comprender convenciones estrictas documentadas en portugués.

---

## 4. Valoración Económica y Tasación del Activo

| Criterio | Estimación de Mercado |
|---|---|
| **Esfuerzo de Ingeniería Acumulado** | ~18,000 a 24,000 horas de desarrollo senior especializado |
| **Costo de Reconstrucción (R&D Replacement Cost)** | **$1,400,000 – $2,100,000 USD** (calculado a tasa de $80–$110/hr para equipo senior Fullstack/AI/DevOps) |
| **Valor Comercial como Producto SaaS / On-Premise** | **$400,000 – $800,000 USD** (como base tecnológica para una empresa de software B2B o white-label) |
| **Ahorro de Licenciamiento Anual (vs Kommo/Intercom)** | Para una empresa de 15 agentes + IA: Ahorro recurrente de **$18,000 a $45,000 USD/año** |

---

## 5. Benchmarking Competitivo

| Solución | Tipo | WhatsApp | Motor de IA / Agentes | Arquitectura / Stack | Ventajas Clave | Desventajas vs DeskcommCRM |
|---|---|---|---|---|---|---|
| **DeskcommCRM** | Open Source (MIT) | WAHA NOWEB + Meta Cloud API | Agentes autónomos MCP, RAG multi-tenant, Flywheel | Next.js 16, Supabase, Postgres RLS, Tailwind 4 | CRM de ventas completo, nativo en WhatsApp, agentes con permisos de escritura/movimiento de pipeline | Ecosistema en portugués, alta complejidad |
| **Chatwoot** | Open Source (MIT/EE) | Vía Meta Cloud o Evolution API | Básico (requiere conectar n8n/Dify para agentes complejos) | Ruby on Rails + Vue.js | Líder mundial en helpdesk omnichannel (Email, Web, Telegram, WA) | Enfoque en tickets/soporte al cliente, no en funil de ventas ni agentes ejecutores |
| **Twenty CRM** | Open Source (AGPL/APL) | No nativo (requiere integraciones de terceros) | En desarrollo temprano | NestJS, React, GraphQL, Postgres | Excelente CRM B2B tradicional estilo Salesforce | Sin soporte nativo de WhatsApp ni flujos conversacionales |
| **Kommo (AmoCRM)** | Propietario (SaaS) | Nativo (Partner oficial Meta + bots) | Salesbot básico + integraciones LLM propietarias | Propietaria Cloud | UI comercial madura, referencia del mercado en funiles de chat | Costo por usuario elevado, vendor lock-in, sin control de datos |
| **Evolution API + Typebot** | Open Source (Stack compuesto) | Baileys + Meta Cloud API | Flujos por nodos (Typebot) con bloques de OpenAI | Node.js / NestJS / Docker | Muy modular, estándar en automatizadores no-code en LatAm | No es un CRM: carece de customer 360, pipelines relacionales, auditoría y multi-tenancy nativo |

---

## 6. Opciones para Mejorarlo, Personalizarlo y Optimizarlo

### 6.1 Mejoras Arquitectónicas y de Rendimiento
1. **Desacoplamiento de Supabase a Postgres Puro**:
   * Implementar adaptador agnóstico para permitir despliegues en PostgreSQL estándar con pgvector sin requerir los servicios de Supabase (GoTrue/PostgREST).
2. **Caché Distribuido con Valkey/Redis**:
   * Migrar contadores de ventana fija a deslizante (sliding window) con scripts Lua en Redis/Valkey para rate limiting de alto tráfico en webhooks.
3. **Queue Engine Robusto**:
   * Reemplazar el consumo de `event_log` por polling cron con un worker basado en BullMQ o PgBoss para latencias sub-segundo en procesamiento de mensajes entrantes.

### 6.2 Personalización y Marca Blanca (Whitelabel)
1. **Multilingüismo Completo (I18n)**:
   * Aunque cuenta con diccionarios parciales, la terminología del código y los logs están en portugués. Estandarizar interfaces al 100% en Español e Inglés.
2. **Motor de Theming Dinámico**:
   * Configuración de logo, paleta de colores corporativos y dominio personalizado por tenant directamente desde la base de datos sin recompilar CSS.
3. **Vocabularios Verticales**:
   * Explotar el campo `vocabulary` para empaquetar plantillas listas para usar: Salud (Pacientes, Citas), Inmobiliaria (Propiedades, Visitas), Legal (Casos, Expedientes).

### 6.3 Optimización del Motor de IA
1. **Enrutador de Modelos por Costo/Latencia**:
   * Clasificador ligero (Flash / Haiku) para triage de intenciones; derivación a modelos Frontier (Sonnet / GPT-4o) solo en negociaciones complejas o análisis documental.
2. **Soporte de LLMs Locales / Privados**:
   * Conector nativo compatible con Ollama / vLLM para clientes corporativos con restricciones estrictas de soberanía de datos que no pueden enviar chats a APIs externas.

---

## 7. Plan de Investigación y Trabajo

### Fase 1: Auditoría y Banco de Pruebas Local (Semanas 1–2)
* **Hito 1.1**: Despliegue de entorno sandbox local (`docker-compose.yml` + Supabase local + WAHA sandbox).
* **Hito 1.2**: Ejecución completa de la suite de pruebas (`pnpm cercas`, `pnpm test:unit`, `pnpm test:invariants`).
* **Hito 1.3**: Simulación de carga en webhooks de WhatsApp (100 msgs/segundo) para medir puntos de saturación en `event_log`.

### Fase 2: Localización y Adaptación al Mercado Objetivo (Semanas 3–4)
* **Hito 2.1**: Revisión y completado de las traducciones en Español (`lib/i18n/traducoes/es.json`).
* **Hito 2.2**: Integración de pasarelas de pago hispanohablantes (Mercado Pago, Stripe LatAm, Kushki) complementando Asaas (exclusivo de Brasil).
* **Hito 2.3**: Adaptación de formatos de número telefónico y validaciones de identificación fiscal local (RUC, RUT, DNI, RFC).

### Fase 3: Optimización de Agentes IA y MCP (Semanas 5–6)
* **Hito 3.1**: Calibración de guardrails y prompts para reducir consumo de tokens por turno de agente.
* **Hito 3.2**: Implementación de herramientas MCP adicionales para consultas a ERPs externos vía REST/GraphQL.
* **Hito 3.3**: Pruebas adversariales en los prompts del agente para evitar inyecciones y alucinaciones en cotizaciones.

### Fase 4: Endurecimiento y Empaquetado para Producción (Semanas 7–8)
* **Hito 4.1**: Configuración de CI/CD para builds multi-arquitectura optimizadas (AMD64 y ARM64).
* **Hito 4.2**: Creación de instalador automatizado en un solo comando para proveedores cloud globales (AWS Lightsail, DigitalOcean, Hetzner, Oracle Cloud).
* **Hito 4.3**: Pruebas de penetración y escaneo SAST/DAST sobre las rutas expuestas y el servidor MCP.
