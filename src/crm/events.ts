import { EventEmitter } from "node:events";
import { redis, redisSubscriber } from "@/lib/redis";

class CrmEventEmitter extends EventEmitter {
  override emit(eventName: string | symbol, ...args: any[]): boolean {
    // 1. Emitir localmente en este proceso
    const localResult = super.emit(eventName, ...args);

    // 2. Publicar en Redis para que todas las réplicas/ventanas reciban el evento
    try {
      if (redis.status === "ready" || redis.status === "connect") {
        redis.publish(
          "crm:events_channel",
          JSON.stringify({ event: String(eventName), payload: args[0] })
        ).catch(() => {});
      }
    } catch {
      // Fallback seguro a emisión local
    }

    return localResult;
  }
}

const globalForEvents = global as unknown as {
  crmEvents?: CrmEventEmitter;
  redisSubInitialized?: boolean;
};

export const crmEvents = globalForEvents.crmEvents || new CrmEventEmitter();
crmEvents.setMaxListeners(200);

// Configurar el suscriptor de Redis solo una vez
if (!globalForEvents.redisSubInitialized) {
  try {
    redisSubscriber.connect().then(() => {
      redisSubscriber.subscribe("crm:events_channel", (err) => {
        if (!err) {
          globalForEvents.redisSubInitialized = true;
        }
      });

      redisSubscriber.on("message", (channel, message) => {
        if (channel === "crm:events_channel") {
          try {
            const parsed = JSON.parse(message);
            // Emitir como EventEmitter base sin re-publicar a Redis
            EventEmitter.prototype.emit.call(crmEvents, parsed.event, parsed.payload);
          } catch {
            // Ignorar errores de parseo
          }
        }
      });
    }).catch(() => {
      // Fallback a eventos locales si Redis aún no está listo
    });
  } catch {
    // Continuar en modo local
  }
}

// Conectar cliente principal de publicación
if (redis.status === "wait") {
  redis.connect().catch(() => {});
}

if (process.env.NODE_ENV !== "production") {
  globalForEvents.crmEvents = crmEvents;
}
