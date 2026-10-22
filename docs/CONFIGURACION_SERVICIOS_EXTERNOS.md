# CONFIGURACIÓN DE SERVICIOS EXTERNOS & GUÍA DE CONECTIVIDAD
**Proyecto:** Lean CRM Omnicanal  

---

## 1. Listmonk (Servidor Remoto de Campañas)

* **Estado:** Integración nativa vía API REST.
* **URL Base Ejemplo:** `http://localhost:9000` (o URL de tu servidor Listmonk)
* **Usuario:** `admin`
* **Contraseña:** `your_listmonk_password`
* **Configuración en `.env`:**
  ```env
  LISTMONK_URL=http://localhost:9000
  LISTMONK_USER=admin
  LISTMONK_PASSWORD=your_listmonk_password
  ```

---

## 2. Groq API (Whisper Transcripción de Audio STT)

* **Proveedor:** Groq Cloud API
* **Modelo STT:** `whisper-large-v3`
* **Latencia estimada:** ~250ms por nota de voz.
* **Configuración en `.env`:**
  ```env
  TRANSCRIPTION_PROVIDER=groq
  GROQ_API_KEY=your_groq_api_key_here
  TRANSCRIPTION_MODEL=whisper-large-v3
  ```

---

## 3. Estado del Número de WhatsApp (Conectividad Dual)

Para activar el canal de WhatsApp existen dos rutas:

### Opción A: Meta Cloud API (Canal Oficial)
Requiere cuenta Meta Business y número dedicado que no esté registrado en la app de WhatsApp regular.
* Datos requeridos en `.env`:
  * `META_WA_ENABLED=true`
  * `META_WA_PHONE_NUMBER_ID=your_phone_number_id`
  * `META_WA_ACCESS_TOKEN=your_access_token`
  * `META_WA_APP_SECRET=your_app_secret`
  * `META_WA_VERIFY_TOKEN=your_verify_token`

### Opción B: WAHA NOWEB (Emulación Local)
* Requiere levantar el contenedor WAHA en Docker Compose:
  ```bash
  docker compose --profile whatsapp-local up -d waha
  ```
* Escanear el código QR desde WhatsApp Web en `http://localhost:3001/dashboard`.
