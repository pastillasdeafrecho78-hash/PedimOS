import { PrismaClient } from "@prisma/client";
import type { OrdersRepository } from "./orders.repository.js";
import { PrismaOrdersRepository } from "./prismaOrders.repository.js";

export const createPrismaOrdersRepository = (): { repository: OrdersRepository; prisma: PrismaClient } => {
  const prisma = new PrismaClient();
  return {
    repository: new PrismaOrdersRepository(prisma),
    prisma
  };
};
