# Especificación EARS: Fase 2 — Webhooks de WhatsApp Dual (Meta Cloud API & WAHA)

## 1. Cláusulas EARS

### 1.1 Meta Cloud API Webhook (`/api/webhooks/meta`)
* `[EVT-META-01]` **Cuando** Meta envíe una petición `GET` con `hub.mode = 'subscribe'` y `hub.verify_token`, **el sistema debe** comparar el token contra `META_WA_VERIFY_TOKEN` y responder con el reto `hub.challenge` en texto plano y status 200.
* `[UNW-META-01]` **Si** el `hub.verify_token` no coincide, **el sistema debe** responder HTTP 403 Forbidden.
* `[EVT-META-02]` **Cuando** Meta envíe una petición `POST` con cabecera `X-Hub-Signature-256`, **el sistema debe** validar el HMAC-SHA256 con `timingSafeEqual`.
* `[EVT-META-03]` **Cuando** el webhook contenga mensajes válidos, **el sistema debe** llamar a `processInboundAgentTurn` para procesar el mensaje y enrutar la respuesta.

### 1.2 WAHA Webhook (`/api/webhooks/waha`)
* `[EVT-WAHA-01]` **Cuando** WAHA envíe un evento `POST` con `event: 'message'`, **el sistema debe** parsear el remitente E.164, ignorar mensajes `fromMe: true` y disparar el turno del agente.
* `[UNW-WAHA-01]` **Si** el evento es `session.status` o distinto a un mensaje entrante, **el sistema debe** responder HTTP 200 sin ejecutar el agente.
