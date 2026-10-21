export interface ListmonkSubscriberInput {
  email: string;
  name?: string;
  attribs?: Record<string, unknown>;
  lists?: number[];
}

export class ListmonkClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(options: { baseUrl?: string; username?: string; password?: string } = {}) {
    this.baseUrl = options.baseUrl || process.env.LISTMONK_URL || "http://localhost:9000";
    const user = options.username || process.env.LISTMONK_USER || "admin";
    const pass = options.password || process.env.LISTMONK_PASSWORD || "adminpassword";
    this.authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  }

  /**
   * Crear o actualizar un suscriptor en Listmonk
   */
  async upsertSubscriber(input: ListmonkSubscriberInput): Promise<{ ok: boolean; subscriberId?: number; error?: string }> {
    const url = `${this.baseUrl}/api/subscribers`;

    const body = {
      email: input.email.toLowerCase().trim(),
      name: input.name || "",
      status: "enabled",
      lists: input.lists || [1], // Lista 1 por defecto
      attribs: input.attribs || {},
      preconfirm_subscriptions: true,
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        // Si el suscriptor ya existe (HTTP 409 o mensaje de conflicto), Listmonk devuelve el registro o error
        if (data.message?.includes("already exists") || res.status === 409) {
          return { ok: true, subscriberId: data.data?.id };
        }
        return { ok: false, error: JSON.stringify(data) };
      }

      return { ok: true, subscriberId: data.data?.id };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Consultar listas disponibles en Listmonk
   */
  async getLists(): Promise<Array<{ id: number; name: string; type: string }>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/lists`, {
        headers: { Authorization: this.authHeader },
      });
      const data = await res.json();
      return data.data?.results || [];
    } catch {
      return [];
    }
  }
}

export const listmonk = new ListmonkClient();
