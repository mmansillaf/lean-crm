# REGISTRO TÉCNICO DE REMEDIACIÓN: FASES 1 Y 2
**Fecha de Implementación:** 2026-10-22  
**Alcance:** Seguridad WAHA/PostgreSQL, Concurrencia Atómica en Base de Datos, Endpoints de Negocio y Server-Sent Events (SSE) en Frontend  
**Estado de Verificación:** 100% PASS (34/34 Tests Unitarios/E2E, Next.js 15.1.7 Build OK)

---

## 1. Fase 1: Inmediata - Seguridad y Robustez Concurrente

### 1.1 Hardening de Seguridad WAHA & Dashboard
* **Archivos Modificados:**
  - `docker-compose.yml`: Eliminadas directivas inseguras `WAHA_NO_API_KEY: "true"` y `WAHA_DASHBOARD_NO_PASSWORD: "true"`. Configuradas variables protegidas `WAHA_API_KEY`, `WAHA_DASHBOARD_USERNAME` y `WAHA_DASHBOARD_PASSWORD`.
  - `.env`: Parametrizadas credenciales `WAHA_API_KEY=waha_crm_secret_key_2026`, `WAHA_DASHBOARD_USER=admin`, `WAHA_DASHBOARD_PASS=adminpassword2026`.
  - `src/channels/waha/adapter.ts`: Inyección automática de cabecera HTTP `X-Api-Key` en todas las llamadas salientes hacia WAHA (`sendText`, `sendVoice`).
  - `src/app/api/crm/messages/route.ts`: Paso explícito de `apiKey: process.env.WAHA_API_KEY` al enviar respuestas desde el CRM.

### 1.2 Concurrencia Atómica en PostgreSQL (Eliminación de Try/Catch)
* **Archivos Modificados:**
  - `scripts/init-db.sql`: Añadida restricción formal de unicidad `constraint uq_conv_org_instance_contact unique (organization_id, instance_id, contact_id)`.
  - `src/db/schema.ts`:
    - `contacts`: Definidos índices de unicidad `uq_org_phone` y `uq_org_email`.
    - `conversations`: Definido `uniqueIndex("uq_conv_org_instance_contact").on(t.organizationId, t.instanceId, t.contactId)`.
    - `messages`: Definido `uniqueIndex("messages_organization_id_external_id_key").on(t.organizationId, t.externalId)`.
  - `src/ai/agent/turn.ts`:
    - `contacts`: Migrado a inserción atómica `.onConflictDoUpdate({ target: [contacts.organizationId, contacts.phone], set: { fullName: sql'COALESCE(...)' } })`.
    - `conversations`: Migrado a inserción atómica `.onConflictDoUpdate({ target: [conversations.organizationId, conversations.instanceId, conversations.contactId], set: { lastMessagePreview, updatedAt } })`.
    - `messages`: Migrado a inserción atómica `.onConflictDoNothing({ target: [messages.organizationId, messages.externalId] })`.

---

## 2. Fase 2: Mediano Plazo - Completitud UI, APIs & SSE en Vivo

### 2.1 Nuevos Endpoints de Negocio
* **Archivos Creados:**
  - `src/app/api/crm/deals/route.ts`:
    - `GET`: Listado completo de oportunidades unidas con información del contacto (nombre, teléfono), pipeline y formateo de montos.
    - `PATCH`: Actualización en tiempo real de la etapa del negocio (`stageId`) para soporte interactivo en el embudo.
    - `POST`: Creación de nuevas oportunidades comerciales vinculadas a un contacto y pipeline.
  - `src/app/api/crm/knowledge/route.ts`:
    - `GET`: Retorna fuentes indexadas de LightRAG, conteo total de nodos de conocimiento (`knowledgeEntities`), aristas (`knowledgeRelations`) y muestreo de relaciones semánticas del grafo en PostgreSQL.

### 2.2 Sincronización en Tiempo Real con Server-Sent Events (SSE)
* **Arquitectura de Eventos:**
  - `src/crm/events.ts`: Singleton reactivo en memoria `crmEvents` (`EventEmitter`) con soporte para hasta 100 oyentes simultáneos en el runtime de Node.js.
  - `src/app/api/crm/events/route.ts`: Endpoint streaming HTTP (`text/event-stream; charset=utf-8`) con handshake inicial `connected`, latidos periódicos (`ping` cada 15s) y despacho de eventos `update`.
  - **Emisión Reactiva de Eventos:**
    - `src/ai/agent/turn.ts`: Emite evento al recibir mensaje entrante del cliente y al responder la IA.
    - `src/app/api/crm/messages/route.ts`: Emite evento al enviar respuesta de operador humano y al conmutar estado de Handoff (`bot` / `human`).

### 2.3 Hidratación Frontend con Datos de Producción
* **Archivos Actualizados:**
  - `src/app/(dashboard)/inbox/page.tsx`:
    - Conectado a `/api/crm/events` mediante `EventSource` para actualización instantánea sin retardo.
    - Indicador visual interactivo de estado de conexión: `Live SSE` (verde pulsante) o `Polling` (reserva ante pérdida de señal).
    - Polling preventivo relajado a 15 segundos (reduciendo en 80% la carga sobre PostgreSQL).
  - `src/app/(dashboard)/kanban/page.tsx`:
    - Convertido a componente dinámico del cliente (`"use client"`).
    - Conectado a `/api/crm/deals` para cargar los leads reales de la base de datos.
    - Botón de acción interactiva **"Avanzar"** con actualización optimista y persistencia en BD vía `PATCH /api/crm/deals`.
  - `src/app/(dashboard)/knowledge/page.tsx`:
    - Convertido a componente dinámico del cliente (`"use client"`).
    - Conectado a `/api/crm/knowledge` para mostrar las fuentes reales de Algoritmo Jurídico SAC y el visor de aristas del grafo semántico.

---

## 3. Matriz de Validación y Evidencia de Pruebas

| Prueba | Comando / Endpoint | Resultado | Detalle |
|---|---|:---:|---|
| **Suite TDD Completa** | `npm test` | **PASS** | 34 pruebas pasadas, 0 fallos, 0 omitidos (31.42s). |
| **Compilación Next.js** | `npm run build` | **PASS** | 16 rutas generadas (11 dinámicas `ƒ`, 5 estáticas `○`). Exit code 0. |
| **Unicidad BD** | `uq_conv_org_instance_contact` | **PASS** | Constraint verificado en tabla `conversations` de PostgreSQL. |
| **API Deals** | `GET /api/crm/deals` | **PASS** | Retorna deals con join a contacts. |
| **API Knowledge** | `GET /api/crm/knowledge` | **PASS** | Retorna fuentes, entidades y relaciones del grafo. |
| **Stream SSE** | `GET /api/crm/events` | **PASS** | Retorna stream `text/event-stream` con handshake `connected`. |
