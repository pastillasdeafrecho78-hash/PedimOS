import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { registerErrorHandler } from "./shared/http/errorHandler.js";
import { registerPublicOrdersRoutes } from "./modules/orders/routes/publicOrders.routes.js";
export const buildApp = (repository) => {
    const app = Fastify({ logger: false });
    app.register(sensible);
    registerPublicOrdersRoutes(app, repository);
    registerErrorHandler(app);
    return app;
};
