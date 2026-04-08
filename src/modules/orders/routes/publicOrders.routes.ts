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
import {
  renderCreateOrderPage,
  renderHomePage,
  renderIntegrationStatusPage,
  renderLoginPage,
  renderRegisterPage
} from "../../ui/recivimosUi.js";

export const registerPublicOrdersRoutes = (app: FastifyInstance, repository: OrdersRepository): void => {
  const authGuard = new IntegrationAuthGuard(repository);
  const ingestionService = new OrderIngestionService(repository);

  app.get("/", async (_request, reply) => {
    return reply.type("text/html; charset=utf-8").status(200).send(renderHomePage());
  });

  app.get("/login", async (_request, reply) => {
    return reply.type("text/html; charset=utf-8").status(200).send(renderLoginPage());
  });

  app.get("/register", async (_request, reply) => {
    return reply.type("text/html; charset=utf-8").status(200).send(renderRegisterPage());
  });

  app.get("/integration-status", async (_request, reply) => {
    return reply.type("text/html; charset=utf-8").status(200).send(renderIntegrationStatusPage());
  });

  app.get("/orders/new", async (_request, reply) => {
    return reply.type("text/html; charset=utf-8").status(200).send(renderCreateOrderPage());
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
