# Especificación Técnica: White-Label, Meta Cloud API vs WAHA y Upgrade a LightRAG

## 1. Arquitectura White-Label y Comercialización B2B

El sistema DeskcommCRM ya implementa una arquitectura de marca en capas (`lib/branding/resolve.ts`), diseñada con aislamiento multi-tenant nativo.

### 1.1 Modelo de Resolución de Marca (3 Capas)
1. **Capa 0 (Entorno / Global)**: Variables de entorno (`APP_NAME`, `APP_LOGO_URL`, `APP_ACCENT_HEX`). Marca por defecto de la plataforma matriz.
2. **Capa 1 (Instalación / Reseller)**: Tabla `platform_branding` en Postgres. Permite a la agencia configurar nombre comercial, logotipo y paleta cromática corporativa.
3. **Capa 2 (Organización / Cliente Final)**: Columna `organizations.settings.branding`. Cada cliente empresarial sube sus logos (claro/oscuro) y define su color de acento (`accent_hex`, `accent_dark_hex`).
4. **Cálculo Dinámico de Contraste**: Motor `lib/branding/contraste.ts` genera automáticamente rampas CSS con ratio de contraste WCAG AA sin recompilar frontend.

### 1.2 Brechas para Comercialización y Solución Requerida
| Brecha Actual | Requisito White-Label Comercial | Solución Técnica |
|---|---|---|
| **Enrutamiento por Dominio** | Cada tenant requiere acceder por su propio subdominio (ej: `empresa.tuplataforma.com`) | Middleware en `proxy.ts` que resuelva el `tenant_id` a partir del `Host` header contra una tabla `custom_domains`. |
| **I18n Incompleto** | Código, logs y partes de la UI en portugués | Completar `lib/i18n/traducoes/es.json` y abstraer vocabulario de negocio (`vocabulary` en `pipelines`). |
| **Facturación y Planes** | Facturación acoplada a Asaas (Brasil) y Stripe básico | Implementar módulo de suscripciones recurrentes con control de cuotas (`ai_budget`, número de agentes y números de WhatsApp) por tenant. |

---

## 2. Comparativa Profunda: Meta Cloud API vs WAHA NOWEB

DeskcommCRM ya cuenta con adaptadores nativos para ambos medios (`lib/channels/adapters/meta-cloud.ts` y `lib/channels/adapters/waha.ts`).

### 2.1 Matriz Comparativa Exhaustiva

| Parámetro | Meta Cloud API (Oficial) | WAHA NOWEB (Emulación Web) |
|---|---|---|
| **Mecanismo de Conexión** | Graph API oficial de Meta vía Webhooks y REST | Emulación del protocolo WhatsApp Web (socket WebSocket directo a servidores de WhatsApp) |
| **Riesgo de Baneo** | **0%** (Línea oficial verificada en Meta Business Manager) | **Medio-Alto** (Meta detecta patrones de automatización masiva no autorizados) |
| **Modelo de Costos** | Pago por conversación iniciada (Ventana de 24h, tarificación Meta) | **Gratis / Costo fijo** de servidor (WAHA Plus o licencia única self-hosted) |
| **Ventana de 24 Horas** | **Estricta**: Fuera de 24h solo se envían plantillas pre-aprobadas (Templates de Utilidad/Marketing) | **Sin restricción técnica**: Permite enviar mensajes de texto libre en cualquier momento (sujeto a baneo por reporte) |
| **Rendimiento y Latencia** | Alta estabilidad, SLA garantizado por Meta, latencia 200–500ms | Depende de la VPS local y estabilidad del socket, latencia 300–800ms |
| **Capacidades Interactivas** | Botones de respuesta rápida, listas interactivas, Flows nativos, catálogos | Simulación de botones vía texto/listas según compatibilidad de la librería |
| **Facilidad de Onboarding** | Requiere cuenta en Meta Business Manager, verificación y tarjeta de crédito | **Inmediato**: Escaneo de código QR en pantalla |

### 2.2 Estrategia Híbrida Recomendada (Dual-Channel)
* **Líneas Oficiales (Meta Cloud API)**: Reservadas para atención al cliente entrante, transacciones críticas, soporte técnico y usuarios que ya interactuaron.
* **Líneas Secundarias (WAHA NOWEB)**: Para prospección activa, recordatorios informales y pruebas de bajo costo, aislando el número principal de cualquier riesgo.

---

## 3. CRM con Agentes de IA y Conocimiento Óptimo: De Vector RAG a LightRAG

### 3.1 Estado Actual del RAG en DeskcommCRM
* **Almacenamiento**: PostgreSQL + extensión `vector` (`public.ai_chunks`).
* **Consulta**: Función RPC `fn_buscar_trechos_das_fontes` que ejecuta búsqueda por distancia coseno (`c.embedding <=> p_embedding`) sobre chunks planos de texto (500–1000 tokens).
* **Deficiencias del Enfoque Actual**:
  1. *Preguntas puntuales exactas*: Pierde precisión en códigos de producto, SKUs, precios o cláusulas contractuales específicas si el chunk diluye la entidad.
  2. *Preguntas relativas/complejas*: Incapaz de responder consultas como "¿En qué se diferencia el Plan Pro del Enterprise respecto a límites de agentes y soporte?", ya que los chunks vectoriales están fragmentados y carecen de relaciones explícitas.

### 3.2 Arquitectura LightRAG (Dual-Level Graph + Vector RAG)
LightRAG combina grafos de conocimiento con vectores a dos niveles:

```
                  ┌──────────────────────────────────────────────┐
                  │              Consulta de Usuario             │
                  └──────────────────────┬───────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
   ┌─────────────────────────────────┐       ┌─────────────────────────────────┐
   │        Low-Level Retrieval      │       │       High-Level Retrieval      │
   │   (Entidades puntuales, SKUs,   │       │   (Temas globales, relaciones,  │
   │    términos exactos, precios)   │       │   comparativas, resúmenes)      │
   └────────────────┬────────────────┘       └────────────────┬────────────────┘
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │      Grafo de Conocimiento (Entidades)  │
                    │      + Embeddings de Texto y Vínculos   │
                    └────────────────────┬────────────────────┘
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │    Prompt Aumentado -> Agente de IA     │
                    └─────────────────────────────────────────┘
```

### 3.3 Esquema SQL para Soportar LightRAG en DeskcommCRM
```sql
-- 1. Nodos del Grafo (Entidades)
create table public.ai_knowledge_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  source_id uuid references ai_knowledge_sources(id) on delete cascade,
  name text not null,
  entity_type text not null, -- 'product', 'policy', 'price', 'condition', 'person'
  description text not null,
  embedding public.vector(1536), -- Vector para recuperación por entidad
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

-- 2. Aristas del Grafo (Relaciones entre Entidades)
create table public.ai_knowledge_relations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  source_id uuid references ai_knowledge_sources(id) on delete cascade,
  source_entity_id uuid not null references ai_knowledge_entities(id) on delete cascade,
  target_entity_id uuid not null references ai_knowledge_entities(id) on delete cascade,
  relation_type text not null, -- 'includes', 'requires', 'costs', 'replaces', 'conflicts_with'
  description text not null,
  weight real not null default 1.0,
  created_at timestamptz not null default now()
);

-- 3. Resúmenes de Alto Nivel (Comunidades / Contexto Global)
create table public.ai_knowledge_communities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  summary text not null,
  embedding public.vector(1536),
  entity_ids uuid[] not null,
  created_at timestamptz not null default now()
);
```

### 3.4 Pipeline de Extracción e Ingestión
1. **Paso 1: Chunking con Ventana Deslizante**: Textos divididos en fragmentos de 400 tokens con 100 tokens de solapamiento.
2. **Paso 2: Extracción con LLM (Zero-Shot Entity-Relation)**:
   * Prompt especializado instruye al modelo extraer: `(Entidad A) -[Relación]-> (Entidad B)` y su descripción semántica.
3. **Paso 3: Indexación Dual**:
   * Textos y entidades se indexan vectorialmente.
   * Relaciones se almacenan en la tabla relacional de aristas.

### 3.5 Algoritmo de Recuperación en el Turno del Agente (`searchKnowledge`)
En `lib/agent-engine/agent/search-knowledge.ts`:
1. **Low-level Query**: Buscar los $K$ nodos de entidades más cercanos semánticamente a la consulta. Extraer sus atributos y aristas directas (1-hop).
2. **High-level Query**: Buscar los $N$ resúmenes comunitarios más cercanos para proporcionar el contexto estructural/relativo.
3. **Fusión de Contexto**: Concatenar:
   * Hechos exactos (Low-level: precios, políticas, compatibilidad).
   * Contexto relacional (High-level: condiciones generales, comparativas).
4. **Respuesta Garantizada**: El agente responde con precisión factual milimétrica en preguntas puntuales y con coherencia contextual en preguntas relativas.
