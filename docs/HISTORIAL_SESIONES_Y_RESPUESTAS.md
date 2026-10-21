# Registro y Archivo Histórico de Decisiones Técnicas y Respuestas

**Proyecto**: Lean CRM (Omnicanal + WhatsApp Dual + LightRAG + Listmonk en PostgreSQL)  
**Ubicación**: `/home/cmansilla/Descargas/pycode/lean_crm`  
**Fecha de consolidación**: 21 de Octubre de 2026  

---

## 1. Síntesis de Respuestas y Decisiones Previas

### Sesión 1: Auditoría y Tasación de DeskcommCRM
* **Análisis de Código**: 1,400,768 líneas en 7,027 archivos, 176 tablas en Supabase, 2,499 archivos de pruebas.
* **Tasación del Activo**: $1.4M–$2.1M USD en costo de reemplazo (R&D); $400k–$800k USD valor comercial.
* **Benchmark Competitivo**:
  * *Chatwoot*: Líder en soporte helpdesk, pero sin embudos de venta ni agentes ejecutores en pipeline.
  * *Twenty*: Excelente CRM relacional B2B, sin WhatsApp nativo ni agentes conversacionales.
  * *Kommo*: Referente SaaS en embudos por WhatsApp, pero costoso y cerrado.
  * *Evolution API + Typebot*: Stack modular pero carece de modelo relacional CRM y multi-tenancy.

### Sesión 2: Estrategia White-Label, Meta vs. WAHA y LightRAG
* **White-Label**: Arquitectura de 3 capas (Capa 0: Global, Capa 1: Reseller en `platform_branding`, Capa 2: Tenant en `settings.branding`). Derivación dinámica de paletas accesibles (WCAG AA).
* **WhatsApp Dual**: Meta Cloud API oficial (0% riesgo de baneo, ventana 24h) + WAHA NOWEB (emulación sin costo por conversación).
* **LightRAG**: Reemplazo de búsqueda vectorial plana por grafo semántico de 2 niveles (Low-Level: atributos y precios exactos; High-Level: relaciones y comparativas).

### Sesión 3: Decisión de Desarrollo Propio Lean (Clean-Slate)
* **Veredicto**: Descartado podar DeskcommCRM por complejidad extrema y código en portugués. Aprobado desarrollo propio desde cero replicando solo los patrones validados de WhatsApp e idempotencia.
* **Esquema Inicial**: Reducción de 176 tablas a un núcleo limpio en PostgreSQL puro con `pgvector`.

### Sesión 4: Auditoría de Vacíos Críticos y Correcciones
* **Notas de Voz**: Incorporación de Groq Whisper Large v3 (<400ms) para transcribir el 50% de tráfico que entra por audio.
* **Salida de Audio**: Transcodificación a `.ogg` codec `opus` mono 16kHz con cabecera `voice: true`.
* **Función SQL Recursiva**: Creación de `fn_lightrag_query` con `WITH RECURSIVE` en Postgres puro.
* **TCO / OpEx Mensual**: Calculado en $120–$275 USD/mes para 50 clientes (margen >88%).

### Sesión 5: Omnicanalidad (Email/Listmonk) y WhatsApp Multi-Número
* **Email Inbound/Outbound**: Webhooks Inbound Parse (Resend/Postmark) + SMTP/API transaccional.
* **Campañas de Correo**: Integración nativa con Listmonk compartiendo base de datos PostgreSQL.
* **WhatsApp Multi-Número**: Relación `organizations 1 ──< N whatsapp_instances` para segmentar Ventas, Soporte y Sucursales bajo un Customer 360 unificado.
* **Aprobación de 19 Capacidades**: Consolidación total de funcionalidades comerciales y operativas.

### Sesión 6: Metodología de Desarrollo Rigurosa
* **Adopción del Framework**: SDD (EARS) + TDD (Red-Green-Refactor) + EDD (Mutation & Red-Teaming).
