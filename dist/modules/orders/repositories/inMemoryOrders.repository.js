import { randomUUID } from "node:crypto";
export class InMemoryOrdersRepository {
    restaurantes;
    apiKeys;
    productos;
    tamanos;
    modificadores;
    orders = [];
    idempotencyKeys = [];
    constructor(seed) {
        this.restaurantes = seed?.restaurantes ?? [];
        this.apiKeys = seed?.apiKeys ?? [];
        this.productos = seed?.productos ?? [];
        this.tamanos = seed?.tamanos ?? [];
        this.modificadores = seed?.modificadores ?? [];
    }
    async findRestauranteBySlug(slug) {
        return this.restaurantes.find((r) => r.slug === slug) ?? null;
    }
    async findApiKeyByHash(hash) {
        return this.apiKeys.find((k) => k.keyHash === hash) ?? null;
    }
    async findProductsByIds(productIds) {
        return this.productos.filter((p) => productIds.includes(p.id));
    }
    async findTamanosByIds(tamanoIds) {
        return this.tamanos.filter((t) => tamanoIds.includes(t.id));
    }
    async findModificadoresByIds(modificadorIds) {
        return this.modificadores.filter((m) => modificadorIds.includes(m.id));
    }
    async findOrderByExternalId(restauranteId, externalOrderId) {
        const found = this.orders.find((order) => order.restauranteId === restauranteId && order.externalOrderId === externalOrderId);
        return found ?? null;
    }
    async getNextNumeroComanda(restauranteId) {
        const max = this.orders
            .filter((order) => order.restauranteId === restauranteId)
            .reduce((acc, current) => Math.max(acc, current.numeroComanda), 0);
        return max + 1;
    }
    async createOrder(params) {
        const duplicate = await this.findOrderByExternalId(params.restaurante.id, params.payload.externalOrderId);
        if (duplicate) {
            throw new Error("duplicate_external_order");
        }
        const order = {
            id: randomUUID(),
            restauranteId: params.restaurante.id,
            restauranteSlug: params.restaurante.slug,
            numeroComanda: await this.getNextNumeroComanda(params.restaurante.id),
            estado: "PENDIENTE",
            createdAt: new Date(),
            externalOrderId: params.payload.externalOrderId,
            payload: params.payload
        };
        this.orders.push(order);
        return order;
    }
    async findIdempotencyKey(restauranteId, key) {
        return (this.idempotencyKeys.find((record) => record.restauranteId === restauranteId && record.idempotencyKey === key) ??
            null);
    }
    async createIdempotencyKey(input) {
        const existing = await this.findIdempotencyKey(input.restauranteId, input.idempotencyKey);
        if (existing) {
            throw new Error("duplicate_idempotency_key");
        }
        const record = {
            id: randomUUID(),
            idempotencyKey: input.idempotencyKey,
            restauranteId: input.restauranteId,
            apiKeyId: input.apiKeyId,
            payloadHash: input.payloadHash,
            status: input.status,
            responseSnapshot: null,
            createdAt: new Date(),
            expiresAt: input.expiresAt
        };
        this.idempotencyKeys.push(record);
        return record;
    }
    async updateIdempotencyKey(input) {
        const found = this.idempotencyKeys.find((record) => record.id === input.id);
        if (!found)
            return;
        found.status = input.status;
        found.responseSnapshot = input.responseSnapshot;
    }
    async findOrderById(orderId) {
        return this.orders.find((order) => order.id === orderId) ?? null;
    }
}
