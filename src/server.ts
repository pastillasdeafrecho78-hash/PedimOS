import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { createPrismaOrdersRepository } from "./modules/orders/repositories/index.js";

const start = async (): Promise<void> => {
  const { repository, prisma } = createPrismaOrdersRepository();
  const app = buildApp(repository);

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error) {
    await prisma.$disconnect();
    app.log.error(error);
    process.exit(1);
  }

  const onClose = async (): Promise<void> => {
    await prisma.$disconnect();
  };
  app.addHook("onClose", onClose);
};

void start();
