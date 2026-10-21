# Flujo de Trabajo Maestro: SDD (EARS) + TDD + EDD para Lean CRM

Este documento define la metodología de desarrollo rigurosa para implementar las 19 características aprobadas de **Lean CRM**, garantizando cero deuda técnica, ausencia de alucinaciones y verificación empírica constante.

---

## 1. Ciclo de Vida por Componente (4 Fases Estrictas)

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ FASE 0: Contrato de Cambio (Trigger, Alcance, Guardrails)               │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
  ┌───────────────────────────────────┴────────────────────────────────────┐
  │ FASE 1: SDD + EARS (Formalización de Requisitos en Sintaxis Canónica)   │
  │   - Ubiquitous / Event-driven / State-driven / Unwanted / Optional     │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
  ┌───────────────────────────────────┴────────────────────────────────────┐
  │ FASE 2: TDD (Test-Driven Development)                                  │
  │   1. Escribir Test derivado de EARS (Fase ROJA)                        │
  │   2. Ejecutar y confirmar fallo (Evidencia empírica)                   │
  │   3. Escribir código mínimo en producción (Fase VERDE)                 │
  │   4. Refactorizar y verificar regresión                                │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
  ┌───────────────────────────────────┴────────────────────────────────────┐
  │ FASE 3: EDD (Evidence & Evaluation-Driven Development)                 │
  │   - Mutation Testing (Romper lógica y validar que el test chille)      │
  │   - Red-Teaming (Inyección de prompts, fallos de red, payloads basura) │
  │   - Reporte con evidencia de comandos ejecutados                       │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Aplicación Práctica del Framework en los Módulos de Lean CRM

### 2.1 Módulo 1: WhatsApp Dual (Meta Cloud API & WAHA)
* **EARS (SDD)**:
  * *Event-driven*: **Cuando** llega un webhook de Meta Cloud API con firma `X-Hub-Signature-256`, **el sistema debe** verificarla contra `app_secret` usando `timingSafeEqual`.
  * *Unwanted behavior*: **Si** la firma no coincide o el cuerpo es malformado, **el sistema debe** responder HTTP 401 y no registrar el mensaje.
  * *State-driven*: **Mientras** la conversación esté en estado `human`, **el sistema debe** almacenar los mensajes entrantes pero **no debe** disparar la respuesta autónoma del bot.
  * *Event-driven*: **Cuando** se reciba un mensaje con un `(organization_id, external_id)` ya existente, **el sistema debe** descartarlo por idempotencia sin reejecutar side-effects.
* **TDD**:
  1. `tests/channels/meta-signature.test.ts` (Verificar rechazo de firmas falsas y aceptación de válidas).
  2. `tests/channels/idempotency.test.ts` (Verificar deduplicación de reintentos de Meta).
* **EDD**:
  1. Red-teaming con payloads truncados y números sin formato E.164.

### 2.2 Módulo 2: Motor LightRAG en PostgreSQL
* **EARS (SDD)**:
  * *Ubiquitous*: **El sistema debe** almacenar entidades con embedding vectorial en `knowledge_entities` y aristas de conexión en `knowledge_relations`.
  * *Event-driven*: **Cuando** el agente invoque `fn_lightrag_query` con un vector de consulta, **el sistema debe** retornar los $K$ nodos más cercanos y expandir el grafo hasta 2 saltos (`WITH RECURSIVE`).
  * *Unwanted behavior*: **Si** la similitud de cosseno es menor al umbral `match_threshold` (0.45), **el sistema debe** excluir el nodo y declarar vacío en ese nivel.
* **TDD**:
  1. `tests/ai/lightrag-query.test.ts` (Verificar que una consulta sobre "Plan Pro" retorne sus nodos hijos vinculados por la arista "incluye").
* **EDD**:
  1. Mutación en la condición de parada recursiva para verificar prevención de bucles infinitos en grafos cíclicos.

### 2.3 Módulo 3: Email Inbound/Outbound y Listmonk
* **EARS (SDD)**:
  * *Event-driven*: **Cuando** un webhook Inbound Parse entregue un correo, **el sistema debe** buscar el contacto por email y crear la conversación bajo `channel_type: 'email'`.
  * *Event-driven*: **Cuando** un lead pase a etapa `qualified`, **el sistema debe** emitir una petición `POST /api/subscribers` hacia Listmonk.
  * *Unwanted behavior*: **Si** Listmonk no responde, **el sistema debe** encolar el evento y reintentar con backoff exponencial sin bloquear la mutación del lead.
* **TDD**:
  1. `tests/email/inbound-parser.test.ts`
  2. `tests/email/listmonk-sync.test.ts`

---

## 3. Protocolo de Ejecución: Sprint por Sprint

Para cada uno de los sprints del plan de 10 semanas:

1. **Definición de Especificación EARS**: Se redacta en `docs/specs/[modulo].ears.md`.
2. **Suite de Pruebas Rojas**: Se programa el archivo `tests/[modulo].test.ts` antes de tocar `src/`.
3. **Pase a Verde**: Se codifica la lógica mínima en `src/` hasta que `npm test` pase con 100% de éxito.
4. **Verificación EDD**: Se ejecutan pruebas de estrés/mutación y se adjunta la salida del comando como evidencia incontestable.
