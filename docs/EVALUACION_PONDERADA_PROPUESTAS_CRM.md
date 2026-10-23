# Evaluación Ponderada y Matriz Pros/Cons: Módulos de Expansión Lean CRM
**Proyecto:** Lean CRM (Algoritmo Jurídico SAC)  
**Fecha:** 2026-10-23  
**Metodología de Ponderación:** Score = (Impacto × 0.45) + (ROI × 0.35) - (Esfuerzo × 0.20) normalizado a escala 1 - 10.

---

## 1. Matriz Integral de Evaluación, Ponderación y Pros/Cons

| # | Categoría | Propuesta | Pros | Contras / Riesgos | Imp (1-5) | Esf (1-5) | ROI (1-5) | Score (1-10) | Prioridad |
|:---:|---|---|---|---|:---:|:---:|:---:|:---:|:---:|
| **1** | WhatsApp / IA | **Transcripción Voz (Whisper STT)** | Cero fricción para clientes que envían audio; costo mensual ~$0 (Groq free tier); código base ya testeado. | Requiere manejo de descarga de binarios OGG de WAHA. | 5 | 1 | 5 | **9.6** | **P0 - Inmediato** |
| **2** | WhatsApp / UX | **Mensajes Interactivos (Botones/Listas)** | Reduce errores tipográficos; guía al lead directamente; alta tasa de conversión; respuesta con 1 toque. | Algunos clientes escriben texto ignorando los botones; UI de WAHA requiere validar payload. | 5 | 2 | 5 | **9.2** | **P0 - Inmediato** |
| **3** | Operación Inbox | **Notas Internas Privadas** | Permite coordinación legal confidencial entre abogados sin salir del CRM; historial unificado. | Riesgo de enviar nota privada a WhatsApp si falla el filtro en backend. | 4 | 1 | 4 | **8.6** | **P0 - Inmediato** |
| **4** | Operación Inbox | **Respuestas Rápidas (Snippets `/`)** | Estandariza respuestas legales frecuentes; reduce tiempo de tipeo humano en un 70%. | Mantenimiento de la biblioteca de plantillas; posibles respuestas desactualizadas. | 4 | 2 | 4 | **8.2** | **P1 - Corto plazo** |
| **5** | Inteligencia CRM | **Badge Lead Scoring en Vivo** | Priorización visual inmediata de prospectos de alto valor; lógica matemática ya construida. | Requiere afinar umbrales según conversión real histórica. | 4 | 1 | 4 | **8.6** | **P0 - Inmediato** |
| **6** | Calidad / Post-Venta | **Encuesta CSAT / NPS de Cierre** | Medición objetiva de satisfacción; detección temprana de quejas P0; recolección de reseñas positivas. | Riesgo de fatiga si se dispara frecuentemente al mismo contacto. | 4 | 2 | 5 | **8.7** | **P1 - Corto plazo** |
| **7** | Automatización | **Recuperación Leads Inactivos** | Reactiva prospectos fríos en 24h/48h automáticamente; rescata ventas sin intervención humana. | Si el mensaje es muy insistente puede generar opt-outs (`STOP`/bloqueos). | 5 | 2 | 5 | **9.2** | **P0 - Inmediato** |
| **8** | Datos / LegalTech | **Filtro DNI / RUC Automático** | Cero errores en razón social y condición fiscal (SUNAT); agiliza contratos y facturación. | Dependencia de API externa (posible caída o costo por consulta en alto volumen). | 4 | 2 | 4 | **8.2** | **P1 - Corto plazo** |
| **9** | Conversión | **Agendamiento (Cal.com / Google)** | Elimina el ping-pong de "¿a qué hora puedes?"; sincronización automática de videollamadas. | Requiere que los abogados mantengan su calendario de Google al día. | 5 | 3 | 4 | **8.0** | **P1 - Corto plazo** |
| **10** | Documental | **Cotizaciones PDF al Vuelo** | Imagen corporativa de alto nivel; envía propuesta con términos y QR en segundos por chat. | Requiere diseñar plantilla HTML/CSS rígida para que no se rompa el layout. | 4 | 3 | 4 | **7.6** | **P2 - Mediano plazo** |
| **11** | Analítica | **Métricas & SLA Dashboard** | Visibilidad total de embudo, tiempos de respuesta humana y efectividad del bot. | No genera ventas directas; requiere histórico de datos para ser útil. | 3 | 3 | 3 | **6.4** | **P2 - Mediano plazo** |
| **12** | Infraestructura | **Redis Pub/Sub para SSE** | Escalabilidad horizontal; soporte para múltiples réplicas y workers sin perder eventos. | Sobrecarga de infraestructura en etapa temprana (1 contenedor adicional). | 3 | 3 | 3 | **6.4** | **P2 - Mediano plazo** |
| **13** | Alertas | **Notificaciones Telegram** | Aviso inmediato en el celular del abogado cuando se requiere intervención humana. | Requiere que los abogados instalen y revisen Telegram activamente. | 4 | 2 | 3 | **7.5** | **P2 - Mediano plazo** |
| **14** | Captación | **Webhook Meta Ads** | Contacto en < 60 segundos con prospectos de Facebook/Instagram; máxima conversión. | Requiere campañas pagadas activas y permisos aprobados en Meta Business. | 4 | 4 | 4 | **6.8** | **P3 - Futuro** |
| **15** | Pagos | **Webhooks de Pago (Izipay)** | Cierre de ventas automático; confirmación inmediata sin enviar vouchers por foto. | Requiere alta comercial y homologación técnica de credenciales Izipay IPN. | 5 | 4 | 5 | **8.0** | **P3 - Al final** |

---

## 2. Roadmap Recomendado por Fases

### Fase 1: Despliegue Inmediato (Score > 8.5 | Esfuerzo Mínimo)
* **1. Transcripción de Voz (Groq Whisper)**
* **2. Mensajes Interactivos (Botones de 1 toque)**
* **3. Recuperación de Leads Inactivos (Cron 24h/48h)**
* **4. Notas Internas Privadas en Inbox**
* **5. Badge de Lead Scoring en Vivo**

### Fase 2: Automatización Comercial y Calidad (Score 8.0 - 8.5)
* **6. Encuesta CSAT / NPS de Cierre**
* **7. Respuestas Rápidas (Snippets `/`)**
* **8. Filtro DNI / RUC Automático (SUNAT/RENIEC)**
* **9. Agendamiento de Citas (Cal.com / Google Calendar)**

### Fase 3: Escalabilidad y Cierre Financiero (Score ≤ 8.0)
* **10. Generador de Cotizaciones PDF al Vuelo**
* **11. Webhooks de Pago con Izipay (IPN)**
* **12. Notificaciones Push Telegram**
* **13. Dashboard de Métricas & SLA**
* **14. Redis Pub/Sub**
* **15. Webhook Instantáneo de Meta Ads**
