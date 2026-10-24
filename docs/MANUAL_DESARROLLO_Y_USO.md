# Manual de Instalación, Desarrollo y Capacidades del Sistema

## 1. Requerimientos del Sistema y Versiones

| Componente | Versión Mínima Requerida | Propósito |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.18.0` (Recomendado v22 LTS) | Runtime del servidor de aplicaciones |
| **npm** | `>= 10.0.0` | Gestor de paquetes de Node.js |
| **Docker & Docker Compose** | Docker `>= 24.0.0`, Compose `>= v2.20.0` | Orquestación de servicios en contenedores |
| **PostgreSQL con pgvector** | `16` (`pgvector/pgvector:pg16`) | Base de datos relacional y vector store |
| **Redis** | `7-alpine` | Colas de concurrencia y mensajería en tiempo real |
| **Listmonk** *(Opcional)* | `v3.0.0+` (`listmonk/listmonk:latest`) | Motor de campañas de correo masivo |
| **WAHA** *(Opcional)* | `devlikeapro/waha:latest` | Gateway para WhatsApp Web local (NOWEB) |

---

## 2. Instalación y Puesta en Marcha (Modo Desarrollo)

### Paso 1: Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO> lean_crm
cd lean_crm
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

### Paso 3: Configuración de Variables de Entorno
Copia la plantilla de entorno:
```bash
cp .env.example .env
```

Configura los valores requeridos en el archivo `.env`. Para desarrollo local mínimo, utiliza los valores por defecto sin requerir API keys externas inmediatamente:

```env
# Base de Datos (PostgreSQL 16)
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/lean_crm

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Autenticación (Auth.js v5)
# Generar clave con: openssl rand -base64 32
AUTH_SECRET=tu_secreto_aleatorio_minimo_32_caracteres_aqui
AUTH_TRUST_HOST=true

# Meta Cloud API (Opcional - Mantener false si no está activo)
META_WA_ENABLED=false
META_WA_PHONE_NUMBER_ID=
META_WA_ACCESS_TOKEN=
META_WA_APP_SECRET=
META_WA_VERIFY_TOKEN=token_de_verificacion_webhook

# Proveedores de IA y RAG (Requerido para Agente Autónomo y LightRAG)
OPENAI_API_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# Configuración de Modelos y Embeddings
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
LIGHTRAG_TOP_ENTITIES=3
LIGHTRAG_MAX_HOPS=2
TRANSCRIPTION_PROVIDER=groq
TRANSCRIPTION_MODEL=whisper-large-v3

# Listmonk (Campañas de Correo)
LISTMONK_URL=http://127.0.0.1:9000
LISTMONK_USER=admin
LISTMONK_PASSWORD=tu_password_listmonk
```

> [!WARNING]
> Nunca incluyas claves de API reales ni credenciales de producción en archivos `.env` versionados. Verifica que `.env` esté incluido en `.gitignore`.

### Paso 4: Levantar Infraestructura con Docker
Inicia los servicios base (PostgreSQL con pgvector y Redis):
```bash
docker compose up -d postgres redis
```

Verificar que los contenedores estén saludables:
```bash
docker ps --filter "name=lean_crm"
```

### Paso 5: Sincronizar Base de Datos y Sembrado Inicial
Aplica el esquema de Drizzle a PostgreSQL y crea el usuario administrador por defecto:
```bash
# Sincronizar esquema Drizzle ORM
npm run db:push

# Sembrar organización inicial y usuario administrador
npm run db:seed
```

Credenciales creadas por el comando `db:seed`:
Configurables en tu `.env` mediante `ADMIN_INITIAL_EMAIL` y `ADMIN_INITIAL_PASSWORD`. Por defecto, si no se especifican en `.env`, el script autogenera una clave segura temporal y la muestra en la consola.

---

## 3. Inicio, Detención y Comandos de Ciclo de Vida

### Iniciar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará accesible en: `http://localhost:3000`

### Detener el Servidor
Presiona `Ctrl + C` en la terminal donde corre Next.js.

### Detener Contenedores de Base de Datos
```bash
# Detener contenedores manteniendo datos
npm run db:down
# o directamente:
docker compose down
```

### Reiniciar y Destruir Volúmenes (Limpieza total)
```bash
# ADVERTENCIA: Elimina los datos de PostgreSQL y Redis
docker compose down -v
```

### Studio de Base de Datos Visual (Drizzle Studio)
```bash
npm run db:studio
```
Acceso a la interfaz gráfica de tablas en: `https://local.drizzle.studio`

---

## 4. Ejecución de Pruebas y Auditoría

### Suite de Pruebas Automatizadas
Ejecuta la batería completa de pruebas unitarias y de integración (34 tests de concurrencia, audio STT, LightRAG y CRM):
```bash
npm test
```

### Compilación y Verificación de Tipos para Producción
```bash
npm run build
```

---

## 5. Módulos y Capacidades del Sistema

```
                      ┌────────────────────────────────────────┐
                      │            Next.js 15 App              │
                      │       (React 19 / Server Actions)      │
                      └──────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌─────────────────┐            ┌───────────────────┐            ┌───────────────────┐
│     Auth.js     │            │  Bandeja Omnicanal│            │     LightRAG      │
│     (v5 JWT)    │            │     & WhatsApp    │            │(pgvector + Grafo) │
└─────────────────┘            └─────────┬─────────┘            └─────────┬─────────┘
                                         │                                │
                       ┌─────────────────┴─────────────────┐              │
                       ▼                                   ▼              ▼
              ┌─────────────────┐                 ┌─────────────────────────────┐
              │  Redis 7 Alpine │                 │ PostgreSQL 16 (pgvector)    │
              │  (Colas & PubSub│                 │ Relacional + Grafo + Embeds │
              └─────────────────┘                 └─────────────────────────────┘
```

### A. Autenticación y Seguridad Multitenant
- **Módulo**: `src/auth.ts`, `src/middleware.ts`, `src/app/login/page.tsx`.
- **Mecanismo**: Sesiones basadas en JWT cifrado en cookies `httpOnly`, `sameSite: lax`.
- **Seguridad**: Passwords hasheados con `bcryptjs` (coste 10). Aislamiento estricto por `organization_id` en todas las consultas de contactos, tratos, mensajes y documentos de conocimiento.

### B. Bandeja de Entrada Omnicanal (Inbox)
- **Módulo**: `src/app/(dashboard)/inbox/page.tsx`, `src/crm/queue.ts`, `src/channels/whatsapp/meta.ts`.
- **WhatsApp Oficial (Meta Cloud API)**: Enrutamiento mediante cola Redis con conmutador seguro (`META_WA_ENABLED=false` por defecto).
- **Audio STT**: Transcripción automática de notas de voz en formato OGG/Opus vía Whisper API (Groq/OpenAI) con detección segura de magic bytes (`OggS`).
- **Enrutamiento Inteligente**: Detección de intención del remitente (`sales`, `support`, `billing`) y asignación a agentes.

### C. Motor LightRAG (Grafo de Conocimiento Legal y Comercial)
- **Módulo**: `src/ai/rag/lightrag.ts`, `scripts/init-db.sql`.
- **Indexación Vectorial**: Embeddings en PostgreSQL con índice HNSW (`vector(1536)`).
- **Recorrido de Grafos**: Consulta recursiva SQL (CTE `graph_traverse`) que navega entidades y relaciones a múltiples saltos (hops) sin latencia externa.

### D. Pipeline de Ventas y CRM (Deals)
- **Módulo**: `src/app/(dashboard)/pipeline/page.tsx`, `src/app/api/crm/deals/route.ts`.
- **Funcionalidad**: Gestión de oportunidades comerciales en etapas (`lead`, `qualified`, `proposal`, `won`, `lost`), cálculo dinámico de valor ponderado y probabilidades de cierre.

### E. Campañas Masivas (Email Marketing)
- **Módulo**: `src/channels/email/listmonk.ts`, `src/app/(dashboard)/campaigns/page.tsx`.
- **Integración**: Conexión nativa con Listmonk mediante API REST autenticada, sincronización de listas y suscriptores, y fallback a base de datos compartida.

---

## 6. Procedimiento para Publicar en Repositorio GitHub

Para publicar el proyecto en tu cuenta de GitHub, sigue los siguientes pasos:

1. **Crear repositorio en GitHub** (público o privado) desde la web de GitHub o con `gh repo create`.
2. **Vincular el origen remoto**:
   ```bash
   git remote add origin https://github.com/mmansillaf/<NOMBRE_DEL_REPOSITORIO>.git
   ```
3. **Verificar que ningún secreto esté rastreado**:
   ```bash
   git status
   git check-ignore .env
   ```
4. **Hacer commit y push**:
   ```bash
   git add .
   git commit -m "feat: initial commit lean crm with auth, lightrag, and multi-channel support"
   git branch -M main
   git push -u origin main
   ```
*(La máquina local ya cuenta con las credenciales de GitHub configuradas en el helper de almacenamiento).*
