# ESTADO DEL PROYECTO LEAN CRM (CHECKPOINT DE REINICIO)
**Fecha:** 2026-10-22  
**Ruta:** `/home/cmansilla/Descargas/pycode/lean_crm`  
**Rama Git:** `master` (Limpio)  

---

## 1. Resumen de Componentes y Estado Operativo

| Componente | Estado | Detalle |
|---|:---:|---|
| **PostgreSQL 16 + pgvector** | 🟢 ACTIVO | Contenedor `lean_crm_postgres` en puerto 5432. 16 tablas relacionales + función recursiva `fn_lightrag_query`. |
| **Suite de Pruebas** | 🟢 31/31 PASS | EARS, TDD, EDD y E2E sin fallos (`npm test`). |
| **Compilación Frontend** | 🟢 BUILD OK | Next.js 15 compilado exitosamente (`next build`, 12 rutas listas). |
| **Listmonk (Email Campaigns)** | 🟢 CONECTADO | `https://newsletter.vilmamonroy.com` (`cmansilla` / `ENERO1l%`). Validado vía API. |
| **Groq API (Whisper STT)** | 🟢 ACTIVO | Clave `gsk_XiVMs...` validada HTTP 200. Modelo `whisper-large-v3`. |
| **WhatsApp Dual-Engine** | 🟡 LISTO | Adaptadores Meta y WAHA programados. Pendiente vincular número (QR o Meta App). |
| **Archivo `.env`** | 🟢 CONFIGURADO | Con permisos `600` en la raíz del proyecto. |

---

## 2. Mapa de Rutas Web y Webhooks

* `/inbox` — Live Chat Omnicanal con toggle Bot / Agente Humano.
* `/kanban` — Pipeline comercial con tarjetas de Deals y valor monetario.
* `/knowledge` — Visualizador de Nodos y Relaciones de Grafo LightRAG.
* `/campaigns` — Difusión masiva Listmonk y WhatsApp.
* `/settings` — Configuración White-Label, Multi-número y Cuentas de Correo.
* `/api/webhooks/meta` — Inbound Webhook oficial Meta Cloud API con firma HMAC.
* `/api/webhooks/waha` — Inbound Webhook WAHA NOWEB con descarte `fromMe`.
* `/api/webhooks/email` — Inbound Webhook de correo con auto-sincronización Listmonk.

---

## 3. Comandos para Reanudar tras el Reinicio

```bash
cd /home/cmansilla/Descargas/pycode/lean_crm

# 1. Asegurar contenedor de base de datos arriba:
docker compose up -d postgres

# 2. (Opcional) Levantar WAHA para escanear QR de WhatsApp:
docker compose --profile whatsapp-local up -d waha

# 3. Iniciar el servidor web interactivo:
npm run dev

# 4. Verificar tests en cualquier momento:
npm test
```
