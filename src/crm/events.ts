import { EventEmitter } from "node:events";

class CrmEventEmitter extends EventEmitter {}

// Instancia global en Node.js para que persista entre invocaciones en Next.js
const globalForEvents = global as unknown as { crmEvents?: CrmEventEmitter };

export const crmEvents = globalForEvents.crmEvents || new CrmEventEmitter();

// Incrementar límite de oyentes para clientes concurrentes de SSE
crmEvents.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.crmEvents = crmEvents;
}
