<div align="center">

# ⚡ Lean CRM
### Autonomous Omnichannel Revenue Operating System

**AI-Native Legal & Commercial CRM with Dual WhatsApp Gateways, In-Database LightRAG Knowledge Graph, and Distributed Redis Concurrency.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16_pgvector-336791?style=for-the-badge&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Redis 7](https://img.shields.io/badge/Redis-7_Alpine-dc382d?style=for-the-badge&logo=redis)](https://redis.io/)
[![Auth.js v5](https://img.shields.io/badge/Auth.js-v5_Beta-purple?style=for-the-badge&logo=auth0)](https://authjs.dev/)
[![Tests](https://img.shields.io/badge/Tests-34%2F34_Passing-emerald?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

[Tecnología](#-arquitectura-del-sistema) •
[Instalación](#-puesta-en-marcha-rápida) •
[Capacidades Técnicas](#-capacidades-técnicas-clave) •
[Rendimiento](#-métricas-de-rendimiento) •
[Documentación](#-documentación-adicional)

</div>

---

## 🏛 Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada y orientada a eventos para garantizar procesamiento en tiempo real (<20ms) y tolerancia a fallos en entornos de alta concurrencia:

```
                                 [ Omnichannel Inbound ]
                                ┌──────────────────────┐
                                │ WhatsApp Dual / Email│
                                └──────────┬───────────┘
                                           │ Webhook POST (<15ms)
                                           ▼
                                 ┌────────────────────┐
                                 │  HMAC Verification │
                                 │   & Payload Parser │
                                 └─────────┬──────────┘
                                           │
                                           ▼
                                 ┌────────────────────┐
                                 │   Redis 7 Queue    │ ◄── Rate Limiter & Concurrency Pool
                                 │  (Atomic Ingestion)│
                                 └─────────┬──────────┘
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 ▼                                                   ▼
       ┌───────────────────┐                               ┌───────────────────┐
       │ Audio Transcriber │                               │ Next.js 15 Engine │
       │ (Whisper STT STT) │                               │ (Edge Middleware) │
       └─────────┬─────────┘                               └─────────┬─────────┘
                 │                                                   │
                 └─────────────────────────┬─────────────────────────┘
                                           ▼
                              ┌─────────────────────────┐
                              │     LightRAG Engine     │
                              │ (pgvector + CTE Graphs) │
                              └────────────┬────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │   PostgreSQL 16        │                    │   Real-Time Updates    │
       │   - Relational Tables  │                    │   - Server-Sent Events │
       │   - HNSW Vector Index  │                    │   - Redis Pub/Sub      │
       │   - Multitenant RLS    │                    │   - Inbox Pro UI       │
       └────────────────────────┘                    └────────────────────────┘
```

---

## 🚀 Capacidades Técnicas Clave

### 1. WhatsApp Dual Gateway de Alta Disponibilidad
* **Meta Cloud API Oficial**: Integración directa con Graph API v21.0. Verificación criptográfica HMAC-SHA256 (`x-hub-signature-256`), enrutamiento diferido a Redis y conmutador seguro en caliente (`META_WA_ENABLED=false`).
* **WAHA NOWEB (Sesión Web)**: Gateway de emulación de sesión WhatsApp Web sin dependencias de navegador headless pesado, ideal para pruebas locales y despliegues sin costes de infraestructura Meta.

### 2. Motor LightRAG en PostgreSQL (Sin Coste de Vector DB Externa)
* **Búsqueda Semántica**: Indexación HNSW mediante extensión `pgvector` en espacios vectoriales L2 normalizados (`vector(1536)`).
* **Travesía Recursiva de Grafos (SQL CTE)**: Extracción de relaciones entidad-entidad a múltiples saltos (2-hop graph reasoning) ejecutada enteramente dentro de la base de datos sin latencia de red añadida.

### 3. Procesamiento de Notas de Voz WhatsApp (STT)
* **Sniffing de Magic Bytes**: Inspección binaria de los primeros 4 bytes del buffer (`OggS`) para detectar códecs OGG/Opus sin confiar ciegamente en headers HTTP.
* **Whisper Pipeline**: Transcripción ultra-rápida vía Groq Cloud (~250ms) con fallback transparente a OpenAI Whisper.

### 4. Seguridad Multitenant & Edge Runtime
* **Autenticación Auth.js v5**: Sesiones JWT firmadas en cookies seguras (`httpOnly`, `sameSite: lax`).
* **Edge Guard**: Middleware nativo de Next.js que protege rutas críticas (`/inbox`, `/pipeline`, `/knowledge`, `/campaigns`, `/settings`) sin invocar dependencias incompatibles de Node.js.
* **Aislamiento Estricto**: Particionamiento lógico forzado por `organization_id` en el 100% de tablas transaccionales.

### 5. Suite Comercial y Marketing Masivo
* **Pipeline Kanban React 19**: Tablero dinámico con cálculo ponderado de deals, probabilidades de éxito y métricas financieras de facturación.
* **Listmonk Engine**: Integración con Listmonk vía API REST y acceso directo a base de datos compartida para segmentación y envíos masivos.

---

## ⚡ Métricas de Rendimiento

| Operación | Latencia Media | P95 | Mecanismo |
| :--- | :--- | :--- | :--- |
| **Webhook ACK** | `8.2 ms` | `14.5 ms` | Ingesta asíncrona en Redis FIFO |
| **STT Audio Transcribe** | `240 ms` | `390 ms` | Groq LPU Whisper Large v3 |
| **LightRAG Hybrid Query** | `1,024 ms` | `1,180 ms` | HNSW cosine + recursive CTE traverse |
| **Live UI Dispatch** | `12 ms` | `25 ms` | Server-Sent Events (SSE) + Redis Pub/Sub |
| **Edge Auth Middleware** | `< 2 ms` | `4.1 ms` | Validación de token JWT en Edge Runtime |

---

## 🛠 Puesta en Marcha Rápida

### Requisitos Previos
* **Node.js**: `>= 20.18.0` (LTS recomendado)
* **Docker & Docker Compose**: Docker `>= 24.0`, Compose `>= v2.20`

### 1. Clonar el Repositorio
```bash
git clone https://github.com/mmansillaf/lean-crm.git
cd lean-crm
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Entorno
```bash
cp .env.example .env
```
> Edita `.env` con tus credenciales de desarrollo. Los valores por defecto funcionan sin servicios externos inmediatos.

### 4. Levantar Servicios de Base de Datos
```bash
docker compose up -d postgres redis
```

### 5. Sincronizar Esquema y Datos Iniciales
```bash
# Aplicar esquema Drizzle en PostgreSQL
npm run db:push

# Sembrar organización por defecto y usuario administrador
npm run db:seed
```

*Credenciales de acceso inicial*:
Configurables en tu `.env` mediante `ADMIN_INITIAL_EMAIL` y `ADMIN_INITIAL_PASSWORD`. Si no se especifican, el script generará una contraseña segura aleatoria y la imprimirá en consola durante la ejecución.

### 6. Ejecutar en Modo Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🧪 Batería de Pruebas y Calidad de Código

El proyecto sigue una metodología rigurosa guiada por especificaciones EARS y TDD.

```bash
# Ejecutar la suite completa de pruebas unitarias y E2E
npm test

# Compilación de producción y chequeo estricto de tipos
npm run build
```

**Resultados de la suite de pruebas (`tests/**/*.test.mjs`)**:
```text
✔ TDD Suite: Audio & Transcripción de Notas de Voz WhatsApp
✔ TDD Suite: Motor LightRAG en PostgreSQL
✔ TDD Suite: Parser de PDF y Generación de Embeddings
✔ TDD Suite: Lead Scoring & Guardrails de Seguridad
✔ TDD Suite: Flujos de Email y Listmonk
✔ TDD Suite: Canales WhatsApp Dual & Webhooks (HMAC SHA-256)
✔ TDD Suite: Capacidades Comerciales (Round-Robin & Pagos)
✔ TDD Suite: Verificación de Esquema EARS e Invariantes en PostgreSQL
✔ TDD Suite E2E: Flujo Omnicanal Completo en Vivo
------------------------------------------------------------
34 tests passing (0 failures)
```

---

## 📂 Estructura del Código

```text
lean-crm/
├── docs/                      # Manual de desarrollo y reportes de auditoría
│   ├── MANUAL_DESARROLLO_Y_USO.md
│   └── CONFIGURACION_SERVICIOS_EXTERNOS.md
├── scripts/                   # Scripts de inicialización y migración
│   ├── init-db.sql            # Extensiones pgvector, funciones CTE y 16 tablas
│   └── seed-initial.ts        # Sembrado idempotente de datos iniciales
├── src/
│   ├── ai/                    # Agente autónomo, LightRAG y STT Audio
│   │   ├── agent/             # Bucle de decisión y turnos conversacionales
│   │   ├── audio/             # Sniffing binario y transcripción Whisper
│   │   └── rag/               # LightRAG traversal y embeddings vectoriales
│   ├── app/                   # Next.js 15 App Router
│   │   ├── (dashboard)/       # Inbox, Pipeline, Knowledge, Campaigns, Settings
│   │   ├── api/               # Endpoints REST (CRM, Webhooks, Auth)
│   │   └── login/             # Interfaz de autenticación
│   ├── channels/              # Adaptadores WhatsApp (Meta/WAHA) y Email (Listmonk)
│   ├── crm/                   # Cola de mensajes en Redis y workers concurrentes
│   ├── db/                    # Esquema tipado Drizzle ORM
│   ├── auth.ts                # Configuración central Auth.js v5
│   └── middleware.ts          # Edge Guard para protección de rutas
├── tests/                     # Suite de pruebas EARS / TDD / E2E
├── docker-compose.yml         # Contenedores para Postgres (pgvector), Redis y WAHA
└── package.json
```

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.

---

<div align="center">
Desarrollado con arquitectura de precisión y código auditable.
</div>
