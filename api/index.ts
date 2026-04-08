import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.js";
import { createPrismaOrdersRepository } from "../src/modules/orders/repositories/index.js";

let appPromise: ReturnType<typeof initApp> | null = null;

const initApp = async () => {
  const { repository, prisma } = createPrismaOrdersRepository();
  const app = buildApp(repository);
  await app.ready();
  return { app, prisma };
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!appPromise) {
    appPromise = initApp();
  }

  const { app } = await appPromise;
  app.server.emit("request", req, res);
}
