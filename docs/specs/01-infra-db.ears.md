# Especificación EARS: Fase 1 — Infraestructura & Modelo de Datos (16 Tablas)

## 1. Cláusulas EARS

### 1.1 Ubiquitous (Requisitos Universales)
* `[UBI-01]` El sistema debe ejecutar sobre PostgreSQL 16 con las extensiones `uuid-ossp` y `vector` habilitadas.
* `[UBI-02]` El sistema debe forzar aislamiento multi-tenant exigiendo `organization_id uuid not null references organizations(id) on delete cascade` en toda tabla operativa.
* `[UBI-03]` El sistema debe garantizar idempotencia única para mensajes mediante la clave compuesta `unique (organization_id, external_id)`.

### 1.2 Event-driven (Disparadores y Eventos)
* `[EVT-01]` **Cuando** se inserte una entidad en `knowledge_entities`, **el sistema debe** asociar su vector de 1536 dimensiones con un índice HNSW usando métrica coseno (`vector_cosine_ops`).
* `[EVT-02]` **Cuando** se invoque `fn_lightrag_query(org_id, embedding, threshold, top_k, max_hops)`, **el sistema debe** recuperar recursivamente las entidades y sus relaciones semánticas sin generar ciclos infinitos.
* `[EVT-03]` **Cuando** un contacto sea creado o actualizado, **el sistema debe** almacenar su número telefónico estrictamente en formato E.164.

### 1.3 State-driven (Comportamiento según Estado)
* `[STA-01]` **Mientras** una conversación tenga `status = 'human'`, **el sistema debe** permitir inserción de mensajes pero bloquear cualquier respuesta automática de agentes de IA.
* `[STA-02]` **Mientras** una instancia de WhatsApp tenga `is_active = false`, **el sistema debe** rechazar peticiones de envío saliente con error descriptivo.

### 1.4 Unwanted Behavior (Manejo de Errores y Excepciones)
* `[UNW-01]` **Si** una inserción de mensaje intenta duplicar un `external_id` dentro de la misma organización, **el sistema debe** rechazar la inserción con código SQL `23505` (`unique_violation`) y evitar side-effects.
* `[UNW-02]` **Si** se intenta crear un registro operativo sin `organization_id`, **el sistema debe** abortar con error `23502` (`not_null_violation`).

### 1.5 Optional Features (Capacidades Opcionales / Extensiones)
* `[OPT-01]` **Donde** Listmonk esté activo en la infraestructura, **el sistema debe** sincronizar los suscriptores en la tabla `listmonk_sync_subscribers`.
