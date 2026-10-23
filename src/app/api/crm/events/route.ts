import { NextRequest } from "next/server";
import { crmEvents } from "@/crm/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const conversationId = req.nextUrl.searchParams.get("conversationId");

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Evento inicial de confirmación de handshake
      controller.enqueue(encoder.encode(`event: connected\ndata: {"status":"connected"}\n\n`));

      const onUpdate = (data: any) => {
        try {
          if (!conversationId || !data.conversationId || data.conversationId === conversationId) {
            controller.enqueue(
              encoder.encode(`event: update\ndata: ${JSON.stringify(data)}\n\n`)
            );
          }
        } catch {
          // Si el canal está cerrado, omitir
        }
      };

      crmEvents.on("inbox_update", onUpdate);

      // Latido (ping) periódico para evitar timeouts de proxy/navegador
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      cleanup = () => {
        crmEvents.off("inbox_update", onUpdate);
        clearInterval(pingInterval);
      };
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  req.signal.addEventListener("abort", () => {
    if (cleanup) cleanup();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
