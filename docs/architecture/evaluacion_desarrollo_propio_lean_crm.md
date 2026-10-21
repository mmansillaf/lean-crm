# Evaluación y Arquitectura: Desarrollo Propio de CRM Lean con WhatsApp Dual y LightRAG en PostgreSQL

## 1. Evaluación y Ponderación Estratégica

### 1.1 Comparativa: Fork & Poda vs. Desarrollo Propio Inspirado (Clean-Slate)

| Criterio | Opción A: Fork y "Podar" DeskcommCRM | Opción B: Desarrollo Propio Lean (Recomendada) |
|---|---|---|
| **Punto de Partida** | 1,400,000 LOC, 176 tablas, 531 migraciones | 0 LOC, diseño limpio desde patrones validados |
| **Tiempo de MVP** | 6–8 semanas (eliminando roturas en cadena) | **4–6 semanas** (arquitectura directa al objetivo) |
| **Deuda Técnica** | Muy alta (código legado en PT-BR, acoplamiento Supabase) | **Cero** (código en TS/ES estricto, 100% documentado) |
| **Dependencia de BD** | Fuerte acoplamiento a Supabase (GoTrue, Auth, Storage) | **PostgreSQL Estándar** con `pgvector` (agnóstico) |
| **Complejidad del Modelo** | 176 tablas (Asterisk, Nuvemshop, Asaas, etc.) | **12 tablas esenciales** |
| **Control y White-Label** | Alto esfuerzo para limpiar marcas y flujos residuales | **100% nativo**, optimizado para tu portafolio |
| **Mantenibilidad** | Crítica (cada actualización rompe dependencias huérfanas) | **Óptima** (~10,000 a 15,000 LOC totales) |

### 1.2 Veredicto Ponderado
**Desarrollar una versión propia limpia es un 40% más rápido y un 300% más mantenible** que intentar limpiar el repositorio de DeskcommCRM. Se deben extraer los adaptadores probados de WhatsApp (`lib/channels/adapters/`) y reconstruir la capa de datos y el motor LightRAG sobre PostgreSQL puro.

---

## 2. Arquitectura del CRM Lean Propio

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    CANALES DE ENTRADA                  │
                               │   Meta Cloud API (Webhook)   │   WAHA NOWEB (Webhook)  │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │               API Gateway / Next.js Route              │
                               │       - Verificación HMAC / Token de Seguridad         │
                               │       - Idempotencia (deduplicación de mensajes)       │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                    PostgreSQL Core                     │
                               │  - Multi-tenancy (org_id)                              │
                               │  - CRM: Contactos, Conversaciones, Mensajes, Funiles   │
                               │  - LightRAG: Entidades, Aristas, Chunks (pgvector)     │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                 Motor de Agentes de IA                 │
                               │         - Triage de Intención (Clasificador)           │
                               │         - Recuperación Dual LightRAG (Low/High Level)  │
                               │         - Invocación LLM (OpenAI / Anthropic / Gemini) │
                               │         - Guardrails y Handoff a Humano                │
                               └────────────────────────────────────────────────────────┘
```

---

## 3. Esquema Relacional Mínimo Viable (12 Tablas en PostgreSQL)

### 3.1 Tenancy y Usuarios
1. `organizations`: Empresas/tenants registrados.
2. `users`: Operadores humanos y administradores.
3. `organization_members`: Vínculo usuario $\leftrightarrow$ organización con roles (`admin`, `agent`).

### 3.2 CRM y Mensajería
4. `contacts`: Clientes y leads (nombre, teléfono E.164, email, metadatos JSONB).
5. `conversations`: Hilos de chat asociados a un canal y a un contacto.
6. `messages`: Registro de mensajes entrantes/salientes (`external_id` único, texto, estado de entrega, autor: `human`, `ai`, `customer`).
7. `whatsapp_instances`: Configuración de canales (credenciales Meta Cloud API o endpoint/sesión WAHA).
8. `pipelines`: Embudos de venta con etapas (`stages`).
9. `deals`: Tarjetas del Kanban vinculadas a contactos y etapas.

### 3.3 Motor LightRAG en PostgreSQL
10. `knowledge_sources`: Documentos subidos (PDF, FAQ, texto, catálogo).
11. `knowledge_entities`: Nodos del grafo (entidades, precios, productos, términos) con embedding.
12. `knowledge_relations`: Aristas del grafo (relaciones semánticas entre entidades).
13. `knowledge_chunks`: Segmentos de texto con vector de 1536 dimensiones (`pgvector`).

---

## 4. Componentes a Reutilizar Directamente de DeskcommCRM

No es necesario escribir todo desde cero; los siguientes módulos de DeskcommCRM son directamente transportables:

1. **Adaptador Meta Cloud API**: `lib/channels/adapters/meta-cloud.ts` y `lib/channels/meta/ingest.ts` (manejo de webhooks, tokens y payloads de Meta).
2. **Adaptador WAHA**: `lib/channels/adapters/waha.ts` y `lib/waha/client.ts` (conexión por API REST y recepción de eventos).
3. **Mapeo E.164 y Anti-duplicados**: `lib/channels/adapters/meta-cloud.ts:toE164Digits()` e idempotencia con clave compuesta `(organization_id, external_id)`.
4. **Lógica de Handoff Humano**: Estados de conversación para silenciar la IA cuando un agente humano interviene.

---

## 5. Algoritmo LightRAG Nativo en PostgreSQL

### 5.1 Ingesta y Construcción del Grafo
```
Texto Original ──► Extractor LLM (JSON Structured Output)
                     ├─► Entidades: [ { name: "Plan Pro", type: "plan", desc: "$50/mes, 5 agentes" } ]
                     └─► Relaciones: [ { source: "Plan Pro", target: "Soporte 24/7", rel: "includes" } ]
                     │
                     ▼
           Insert en PostgreSQL
           - knowledge_entities (con embedding vectorial)
           - knowledge_relations (aristas relacionales)
```

### 5.2 Consulta Dual en Tiempo Real
1. **Paso 1 (Low-level)**: Búsqueda vectorial sobre `knowledge_entities` para extraer los términos o productos clave mencionados por el usuario.
2. **Paso 2 (High-level)**: Consulta SQL sobre `knowledge_relations` para expandir el grafo 1 o 2 saltos (`JOIN` de aristas).
3. **Paso 3 (Inyección)**: Generar el contexto enriquecido para el prompt del sistema:
   ```text
   DATOS PUNTUALES RECUPERADOS:
   - Entidad: Plan Pro (Precio: $50/mes, Capacidad: 5 agentes)
   RELACIONES Y CONDICIONES:
   - Plan Pro -> incluye -> Soporte 24/7
   - Plan Pro -> requiere -> Pago anual para descuento 20%
   ```

---

## 6. Plan de Ejecución y Estimación de Tiempos

| Sprint | Enfoque | Entregable |
|---|---|---|
| **Sprint 1 (Semana 1–2)** | Infraestructura & Base de Datos | PostgreSQL + `pgvector`, Drizzle ORM, multi-tenancy, autenticación básica, tablas de CRM. |
| **Sprint 2 (Semana 3)** | WhatsApp Dual (Meta + WAHA) | Integración de webhooks, recepción y envío bidireccional probado en ambas vías. |
| **Sprint 3 (Semana 4)** | Pipeline & Interfaz CRM | Bandeja de entrada compartida (Chat en vivo) + Kanban de leads. |
| **Sprint 4 (Semana 5)** | Motor LightRAG | Ingesta de documentos, extracción de entidades/aristas y búsqueda dual en Postgres. |
| **Sprint 5 (Semana 6)** | Agente Autónomo & Handoff | Agente respondiendo en WhatsApp con conocimiento LightRAG y derivación a humanos. |
