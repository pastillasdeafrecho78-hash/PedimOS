import { PrismaClient } from "@prisma/client";
import { PrismaOrdersRepository } from "./prismaOrders.repository.js";
export const createPrismaOrdersRepository = () => {
    const prisma = new PrismaClient();
    return {
        repository: new PrismaOrdersRepository(prisma),
        prisma
    };
};
