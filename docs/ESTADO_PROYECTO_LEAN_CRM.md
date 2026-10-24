# ESTADO DEL PROYECTO LEAN CRM (CHECKPOINT DE REINICIO)
**Fecha:** 2026-10-22  
**Ruta:** `/home/cmansilla/Descargas/pycode/lean_crm`  
**Rama Git:** `master`  

---

## 1. Resumen de Componentes y Estado Operativo

| Componente | Estado | Detalle |
|---|:---:|---|
| **Estilos & UI (Tailwind + PostCSS)** | 🟢 CORREGIDO | Agregados `tailwind.config.js` y `postcss.config.mjs`. Compilación de CSS con diseño utilitario activo (16KB). |
| **PostgreSQL 16 + pgvector** | 🟢 ACTIVO | Contenedor `lean_crm_postgres` en puerto 5432. 16 tablas relacionales + función `fn_lightrag_query`. |
| **Suite de Pruebas** | 🟢 31/31 PASS | EARS, TDD, EDD y E2E sin fallos (`npm test`). |
| **Compilación Frontend** | 🟢 BUILD OK | Next.js 15 compilado exitosamente (`next build`, 12 rutas listas). |
| **Listmonk (Email Campaigns)** | 🟢 CONECTADO | Configurable vía `LISTMONK_URL` en `.env`. Validado vía API. |
| **Groq API (Whisper STT)** | 🟢 ACTIVO | Clave configurada y validada en `.env`. Modelo `whisper-large-v3`. |
| **WhatsApp Dual-Engine** | 🟢 LISTO | Webhooks Meta y WAHA funcionales. Pendiente vincular número real. |
| **Archivo `.env`** | 🟢 CONFIGURADO | Permisos `600` en la raíz del proyecto. |

---

## 2. Próximo Paso Definido (Roadmap Inmediato)

**Objetivo:** Permitir que el agente responda por WhatsApp sobre un documento PDF vía LightRAG.

1. **Parser PDF:** Instalar e implementar extractor de texto (`pdf-parse` o equivalente).
2. **Embeddings Reales:** Reemplazar vectores dummy en `turn.ts` y webhooks con generador real (`text-embedding-3-small`).
3. **Pipeline de Ingesta:** Endpoint/script para cargar PDF, extraer entidades/relaciones con `extractGraphFromText` y poblar `knowledge_sources` / `knowledge_entities`.

---

## 3. Comandos para Reanudar tras el Reinicio

```bash
cd /home/cmansilla/Descargas/pycode/lean_crm

# 1. Asegurar contenedor de base de datos arriba:
docker compose up -d postgres

# 2. Iniciar el servidor de desarrollo:
npm run dev

# 3. Verificar tests:
npm test
```
