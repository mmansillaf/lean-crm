# Manual de Inicio Operativo: Lean CRM & WhatsApp WAHA

Este manual detalla los pasos para iniciar el sistema bajo demanda (sin persistencia tras reiniciar la PC).

---

## 1. Flujo Rápido de Inicio (3 Comandos)

Abre una terminal y ejecuta:

```bash
# 1. Iniciar Docker bajo demanda (no persistirá tras reiniciar la PC)
systemctl start docker.socket

# 2. Entrar a la carpeta del proyecto y levantar servicios
cd /home/cmansilla/Descargas/pycode/lean_crm
docker compose up -d

# 3. Iniciar el servidor web y webhooks del CRM
npm run dev
```

El sistema estará listo y disponible en:
* **Panel CRM:** `http://localhost:3000` (Inbox en `/inbox`, Kanban en `/kanban`)
* **Dashboard WAHA:** `http://localhost:3001/dashboard` (Usuario: `admin` | Password: `adminpassword2026`)

---

## 2. Verificación de Estado Operativo

Para confirmar que la base de datos y la sesión de WhatsApp están conectadas:

```bash
# Verificar contenedores activos
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar sesión de WhatsApp en WAHA
curl -s http://127.0.0.1:3001/api/sessions -H "X-Api-Key: waha_crm_secret_key_2026"
```
> Si el estado devuelve `"status": "WORKING"`, el bot está en línea y responderá automáticamente los mensajes entrantes.

---

## 3. Comandos de Diagnóstico y Pruebas

```bash
# Ejecutar suite de pruebas completa (34 tests)
npm test

# Ver logs de mensajes en tiempo real en WAHA
docker logs -f lean_crm_waha
```

---

## 4. Apagado Limpio del Sistema

Cuando termines tu jornada o pruebas:

```bash
cd /home/cmansilla/Descargas/pycode/lean_crm

# Detener los contenedores sin borrar datos
docker compose down

# Opcional: Detener el socket de Docker
systemctl stop docker.socket docker.service
```
> Los datos de PostgreSQL y la sesión de WhatsApp se conservan intactos en los volúmenes locales `pgdata` y `wahadata`.
