import Fastify, { type FastifyInstance } from "fastify";
import sensible from "@fastify/sensible";
import { registerErrorHandler } from "./shared/http/errorHandler.js";
import { registerPublicOrdersRoutes } from "./modules/orders/routes/publicOrders.routes.js";
import type { OrdersRepository } from "./modules/orders/repositories/orders.repository.js";

export const buildApp = (repository: OrdersRepository): FastifyInstance => {
  const app = Fastify({ logger: false });
  app.register(sensible);
  registerPublicOrdersRoutes(app, repository);
  registerErrorHandler(app);
  return app;
};
