export type Branch = {
  id: string;
  slug: string;
  nombre: string;
};

export type MenuCatalog = {
  restaurante: Branch;
  productos: Array<{ id: string; nombre: string; imageUrl?: string | null }>;
  tamanos: Array<{ id: string; nombre: string }>;
  modificadores: Array<{ id: string; nombre: string }>;
};

export type CreateOrderPayload = {
  externalOrderId: string;
  tipoPedido: "LOCAL" | "DOMICILIO" | "DELIVERY";
  canal: "EXTERNAL_APP";
  notas?: string;
  cliente?: { nombre: string; telefono: string; direccion: string };
  items: Array<{
    productoId: string;
    tamanoId?: string;
    cantidad: number;
    notas?: string;
    modificadores: Array<{ modificadorId: string }>;
  }>;
};

const parseJson = async <T>(response: Response): Promise<T> => {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const typed = json as { error?: string; code?: string };
    const message = typed.error ?? `HTTP ${response.status}`;
    const code = typed.code ? ` (${typed.code})` : "";
    throw new Error(`${message}${code}`);
  }
  return json as T;
};

export const apiClient = {
  async getBranches(): Promise<Branch[]> {
    const response = await fetch("/api/public/integraciones/pedidos/restaurantes");
    const json = await parseJson<{ data: Branch[] }>(response);
    return json.data ?? [];
  },

  async getMenuBySlug(slug: string): Promise<{ data: MenuCatalog; degraded?: boolean }> {
    const response = await fetch(`/api/public/integraciones/pedidos/menu/${encodeURIComponent(slug)}`);
    const json = await parseJson<{ data: MenuCatalog; degraded?: boolean }>(response);
    return { data: json.data, degraded: json.degraded };
  },

  async createOrder(input: {
    apiKey: string;
    restauranteSlug: string;
    idempotencyKey: string;
    payload: CreateOrderPayload;
  }): Promise<Record<string, unknown>> {
    const response = await fetch("/api/public/integraciones/pedidos/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": input.apiKey,
        "x-restaurante-slug": input.restauranteSlug,
        "x-idempotency-key": input.idempotencyKey
      },
      body: JSON.stringify(input.payload)
    });
    return parseJson<Record<string, unknown>>(response);
  },

  async getOrderStatus(input: {
    apiKey: string;
    restauranteSlug: string;
    orderId: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    const response = await fetch(`/api/public/integraciones/pedidos/orders/${encodeURIComponent(input.orderId)}`, {
      headers: {
        "x-api-key": input.apiKey,
        "x-restaurante-slug": input.restauranteSlug,
        "x-idempotency-key": input.idempotencyKey
      }
    });
    return parseJson<Record<string, unknown>>(response);
  }
};
