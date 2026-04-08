import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../../../config/env.js";
import { canonicalError } from "../../../shared/errors/canonicalErrors.js";
import { IntegrationAuthGuard } from "../../auth/integrationAuth.js";
import {
  createExternalOrderBodySchema,
  externalOrderHeadersSchema
} from "../contracts/createExternalOrder.contract.js";
import type { OrdersRepository } from "../repositories/orders.repository.js";
import { OrderIngestionService } from "../services/orderIngestion.service.js";
import {
  sendWebAsset,
  sendWebIndex
} from "../../ui/webArtifact.server.js";

export const registerPublicOrdersRoutes = (app: FastifyInstance, repository: OrdersRepository): void => {
  const authGuard = new IntegrationAuthGuard(repository);
  const ingestionService = new OrderIngestionService(repository);

  app.get("/", async (_request, reply) => sendWebIndex(reply));
  app.get("/login", async (_request, reply) => sendWebIndex(reply));
  app.get("/register", async (_request, reply) => sendWebIndex(reply));
  app.get("/integration-status", async (_request, reply) => sendWebIndex(reply));
  app.get("/orders/new", async (_request, reply) => sendWebIndex(reply));
  app.get("/assets/*", async (request, reply) => {
    const path = (request.params as { "*": string })["*"];
    return sendWebAsset(reply, `assets/${path}`);
  });

  app.get("/health", async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: { status: "ok" }
    });
  });

  app.get("/api/public/integraciones/pedidos/restaurantes", async (_request, reply) => {
    let restaurantes: Awaited<ReturnType<typeof repository.listActiveRestaurantes>> = [];
    try {
      restaurantes = await repository.listActiveRestaurantes();
    } catch (error) {
      app.log.error({ error }, "No fue posible listar restaurantes para discovery publico");
    }
    return reply.status(200).send({
      success: true,
      data: restaurantes
    });
  });

  app.get("/api/public/integraciones/pedidos/menu/:slug", async (request, reply) => {
    const { slug } = z.object({ slug: z.string().min(1) }).parse(request.params);
    try {
      const catalog = await repository.getPublicCatalogByRestauranteSlug(slug);
      if (!catalog) {
        throw canonicalError("branch_not_found", "Sucursal no encontrada o inactiva");
      }
      return reply.status(200).send({
        success: true,
        data: catalog
      });
    } catch (error) {
      app.log.error({ error, slug }, "No fue posible cargar catalogo publico");
      return reply.status(200).send({
        success: true,
        data: {
          restaurante: { id: "unknown", slug, nombre: slug },
          productos: [],
          tamanos: [],
          modificadores: []
        },
        degraded: true
      });
    }
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
