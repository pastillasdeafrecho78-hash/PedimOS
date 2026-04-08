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

export const registerPublicOrdersRoutes = (app: FastifyInstance, repository: OrdersRepository): void => {
  const authGuard = new IntegrationAuthGuard(repository);
  const ingestionService = new OrderIngestionService(repository);

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
