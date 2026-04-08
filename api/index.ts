import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.js";
import { createPrismaOrdersRepository } from "../src/modules/orders/repositories/index.js";

let appPromise: ReturnType<typeof initApp> | null = null;
let handlersRegistered = false;

const initApp = async () => {
  const { repository, prisma } = createPrismaOrdersRepository();
  const app = buildApp(repository);
  await app.ready();
  return { app, prisma };
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!handlersRegistered) {
    handlersRegistered = true;
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection:", reason);
    });
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
    });
  }

  if (!appPromise) {
    appPromise = initApp();
  }

  const { app } = await appPromise;
  app.server.emit("request", req, res);
}
