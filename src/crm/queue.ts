import { redis } from "@/lib/redis";
import { processInboundAgentTurn, type AgentTurnOptions } from "@/ai/agent/turn";
import type { InboundMessage } from "@/channels/types";
import { getEmbedding } from "@/ai/embeddings";

export interface QueuedWhatsAppJob {
  organizationId: string;
  instanceId: string;
  message: InboundMessage;
  options: AgentTurnOptions;
  enqueuedAt: number;
  attempts: number;
}

const QUEUE_KEY = "crm:whatsapp_inbound_queue";
const DLQ_KEY = "crm:whatsapp_dlq";

const globalForQueue = global as unknown as {
  workerStarted?: boolean;
  activeWorkers?: number;
};

export async function enqueueWhatsAppTurn(
  organizationId: string,
  instanceId: string,
  message: InboundMessage,
  options: AgentTurnOptions = {}
): Promise<{ ok: boolean; enqueued: boolean }> {
  try {
    // 1. Candado atómico de idempotencia en Redis (60 segundos)
    const lockKey = `crm:lock:${organizationId}:${message.externalMessageId}`;
    const acquired = await redis.set(lockKey, "1", "EX", 60, "NX");
    if (!acquired) {
      // Mensaje ya encolado o procesándose actualmente
      return { ok: true, enqueued: false };
    }

    // 2. Pre-calcular embedding vectorial o pasar texto para el worker
    if (!options.queryEmbedding && message.content) {
      try {
        options.queryEmbedding = await getEmbedding(message.content);
      } catch {
        // El worker calculará el embedding si falla aquí
      }
    }

    const job: QueuedWhatsAppJob = {
      organizationId,
      instanceId,
      message,
      options,
      enqueuedAt: Date.now(),
      attempts: 0,
    };

    await redis.rpush(QUEUE_KEY, JSON.stringify(job));

    // Asegurar que el worker esté activo
    ensureWorkerStarted();

    return { ok: true, enqueued: true };
  } catch (err) {
    console.error("[REDIS_QUEUE_ERROR] Fallback síncrono por fallo en Redis:", err);
    // Fallback inmediato si Redis falla
    await processInboundAgentTurn(organizationId, instanceId, message, options);
    return { ok: true, enqueued: false };
  }
}

export function ensureWorkerStarted() {
  if (globalForQueue.workerStarted) return;
  globalForQueue.workerStarted = true;
  globalForQueue.activeWorkers = 0;

  // Lanzar bucle de procesamiento continuo
  processQueueLoop().catch((err) => {
    console.error("[QUEUE_LOOP_FATAL]", err);
    globalForQueue.workerStarted = false;
  });
}

const MAX_CONCURRENT_TURNS = 5;

async function processQueueLoop() {
  let idleDelay = 250;

  while (true) {
    try {
      if ((globalForQueue.activeWorkers || 0) >= MAX_CONCURRENT_TURNS) {
        // Pausa breve si estamos al tope de concurrencia
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }

      // Pop del inicio de la cola
      const rawJob = await redis.lpop(QUEUE_KEY);
      if (!rawJob) {
        // Cola vacía: backoff exponencial adaptativo (250ms -> 2000ms max) para evitar saturar Redis
        await new Promise((r) => setTimeout(r, idleDelay));
        idleDelay = Math.min(Math.round(idleDelay * 1.5), 2000);
        continue;
      }

      // Al recibir un trabajo, restablecer la velocidad de respuesta inmediata
      idleDelay = 250;

      const job: QueuedWhatsAppJob = JSON.parse(rawJob);
      if (job.message) {
        job.message.timestamp = job.message.timestamp ? new Date(job.message.timestamp) : new Date();
      }
      globalForQueue.activeWorkers = (globalForQueue.activeWorkers || 0) + 1;

      // Procesar de forma asíncrona sin bloquear la lectura de la cola
      (async () => {
        try {
          await processInboundAgentTurn(
            job.organizationId,
            job.instanceId,
            job.message,
            job.options
          );
        } catch (turnErr) {
          console.error(`[QUEUE_JOB_FAILED] Reintento ${job.attempts + 1}:`, turnErr);
          job.attempts += 1;
          if (job.attempts < 3) {
            // Reintentar en cola con retardo
            await redis.rpush(QUEUE_KEY, JSON.stringify(job));
          } else {
            // Mandar a Dead Letter Queue para auditoría
            await redis.rpush(DLQ_KEY, JSON.stringify({ ...job, failedAt: Date.now() }));
          }
        } finally {
          globalForQueue.activeWorkers = Math.max(0, (globalForQueue.activeWorkers || 1) - 1);
        }
      })();
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
