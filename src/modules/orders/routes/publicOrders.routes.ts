import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../../../config/env.js";
import { IntegrationAuthGuard } from "../../auth/integrationAuth.js";
import {
  createExternalOrderBodySchema,
  externalOrderHeadersSchema
} from "../contracts/createExternalOrder.contract.js";
import type { OrdersRepository } from "../repositories/orders.repository.js";
import { OrderIngestionService } from "../services/orderIngestion.service.js";

const renderUiPage = (title: string, heading: string, description: string, badge: string): string => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        --bg: #faf6f2;
        --bg-soft: #f3ebe4;
        --surface: #fffaf6;
        --surface-muted: #f7efe9;
        --text: #352f2f;
        --muted: #7d6f6d;
        --border: #e8d8cf;
        --brand: #dc2626;
        --brand-soft: #f97316;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 15% 12%, rgba(249, 115, 22, 0.2), transparent 24%),
          radial-gradient(circle at 86% 8%, rgba(220, 38, 38, 0.16), transparent 22%),
          linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 100%);
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        width: min(720px, 100%);
        border: 1px solid var(--border);
        background: linear-gradient(145deg, rgba(255, 250, 246, 0.96), rgba(247, 239, 233, 0.94));
        border-radius: 28px;
        box-shadow: 0 24px 50px -24px rgba(127, 29, 29, 0.34);
        padding: 28px;
      }
      .badge {
        display: inline-block;
        border-radius: 999px;
        border: 1px solid rgba(220, 38, 38, 0.28);
        color: #7f1d1d;
        background: rgba(249, 115, 22, 0.12);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
        padding: 6px 12px;
      }
      h1 {
        margin: 14px 0 10px;
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.1;
      }
      p {
        margin: 0;
        color: var(--muted);
        font-size: 16px;
      }
      .actions {
        margin-top: 22px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .btn {
        border-radius: 999px;
        padding: 10px 16px;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
      }
      .btn-primary {
        color: #fff;
        background: linear-gradient(135deg, var(--brand-soft), var(--brand));
      }
      .btn-secondary {
        color: var(--text);
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.8);
      }
      code {
        display: block;
        margin-top: 18px;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.68);
        font-size: 13px;
        color: #5b5252;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <span class="badge">${badge}</span>
      <h1>${heading}</h1>
      <p>${description}</p>
      <div class="actions">
        <a class="btn btn-primary" href="/login">Ir a login</a>
        <a class="btn btn-secondary" href="/register">Ir a registro</a>
        <a class="btn btn-secondary" href="/health">Health</a>
        <a class="btn btn-secondary" href="/api/public/integraciones/pedidos/contract">Contrato API</a>
      </div>
      <code>RecivimOS UI Gateway · Fastify + Prisma · tenant-scoped integration</code>
    </main>
  </body>
</html>`;

export const registerPublicOrdersRoutes = (app: FastifyInstance, repository: OrdersRepository): void => {
  const authGuard = new IntegrationAuthGuard(repository);
  const ingestionService = new OrderIngestionService(repository);

  app.get("/", async (_request, reply) => {
    return reply
      .type("text/html; charset=utf-8")
      .status(200)
      .send(
        renderUiPage(
          "RecivimOS",
          "RecivimOS",
          "Portal de recepcion e integracion de pedidos externos, con estilo visual alineado al ecosistema ServimOS.",
          "ecosistema operativo"
        )
      );
  });

  app.get("/login", async (_request, reply) => {
    return reply
      .type("text/html; charset=utf-8")
      .status(200)
      .send(
        renderUiPage(
          "RecivimOS · Login",
          "Acceso RecivimOS",
          "Pantalla de acceso del producto de recepcion. Esta vista es informativa para enrutar autenticacion del canal externo.",
          "login"
        )
      );
  });

  app.get("/register", async (_request, reply) => {
    return reply
      .type("text/html; charset=utf-8")
      .status(200)
      .send(
        renderUiPage(
          "RecivimOS · Registro",
          "Registro RecivimOS",
          "Alta de operadores o integraciones de recepcion, separada de ServimOS y lista para flujo independiente.",
          "register"
        )
      );
  });

  app.get("/health", async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: { status: "ok" }
    });
  });

  app.get("/api/public/integraciones/pedidos/contract", async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: {
        createOrder: {
          endpoint: "/api/public/integraciones/pedidos/orders",
          method: "POST",
          headers: {
            "x-api-key": "string",
            "x-restaurante-slug": "string",
            "x-idempotency-key": "string",
            "x-api-version": "v1 (optional)",
            "x-correlation-id": "string (optional)"
          }
        },
        getOrderStatus: {
          endpoint: "/api/public/integraciones/pedidos/orders/:orderId",
          method: "GET",
          headers: {
            "x-api-key": "string",
            "x-restaurante-slug": "string"
          }
        }
      }
    });
  });

  app.post("/api/public/integraciones/pedidos/orders", { preHandler: authGuard.preHandler }, async (request, reply) => {
    const headers = externalOrderHeadersSchema.parse(request.headers);
    const body = createExternalOrderBodySchema.parse(request.body);

    const context = request.integrationContext;
    if (!context) {
      throw new Error("Missing integration context");
    }

    const result = await ingestionService.createExternalOrder({
      restauranteSlug: headers["x-restaurante-slug"],
      restauranteId: context.restauranteId,
      apiKeyId: context.apiKeyId,
      idempotencyKey: headers["x-idempotency-key"],
      payload: body,
      ttlHours: env.IDEMPOTENCY_TTL_HOURS
    });

    return reply.status(result.httpStatus).send(result.body);
  });

  app.get(
    "/api/public/integraciones/pedidos/orders/:orderId",
    { preHandler: authGuard.preHandler },
    async (request, reply) => {
      const context = request.integrationContext;
      if (!context) {
        throw new Error("Missing integration context");
      }
      const params = z.object({ orderId: z.string().min(1) }).parse(request.params);
      const result = await ingestionService.getExternalOrderStatus(context.restauranteId, params.orderId);
      return reply.status(200).send(result);
    }
  );
};
