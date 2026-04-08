const mapRestaurante = (row) => row;
const mapApiKey = (row) => ({
    ...row,
    scopes: row.scopes.map((scope) => (scope === "orders_create" ? "orders:create" : "orders:read"))
});
const mapScopeEntity = (row) => row;
const mapOrder = (row) => ({
    id: row.id,
    restauranteId: row.restauranteId,
    restauranteSlug: row.restaurante.slug,
    numeroComanda: row.numeroComanda,
    estado: row.estado,
    createdAt: row.createdAt
});
const mapIdempotency = (row) => ({
    ...row,
    status: row.status === "completed" ? "completed" : "processing",
    responseSnapshot: row.responseSnapshot ?? null
});
export class PrismaOrdersRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findRestauranteBySlug(slug) {
        const row = await this.prisma.restaurante.findUnique({
            where: { slug },
            select: { id: true, slug: true, nombre: true, isActive: true, isSuspended: true }
        });
        return row ? mapRestaurante(row) : null;
    }
    async findApiKeyByHash(hash) {
        const row = await this.prisma.integracionApiKey.findUnique({
            where: { keyHash: hash },
            select: { id: true, restauranteId: true, keyHash: true, isActive: true, scopes: true }
        });
        return row ? mapApiKey(row) : null;
    }
    async findProductsByIds(productIds) {
        if (!productIds.length)
            return [];
        const rows = await this.prisma.producto.findMany({
            where: { id: { in: productIds } },
            select: { id: true, restauranteId: true, isActive: true }
        });
        return rows.map(mapScopeEntity);
    }
    async findTamanosByIds(tamanoIds) {
        if (!tamanoIds.length)
            return [];
        const rows = await this.prisma.tamano.findMany({
            where: { id: { in: tamanoIds } },
            select: { id: true, restauranteId: true, isActive: true }
        });
        return rows.map(mapScopeEntity);
    }
    async findModificadoresByIds(modificadorIds) {
        if (!modificadorIds.length)
            return [];
        const rows = await this.prisma.modificador.findMany({
            where: { id: { in: modificadorIds } },
            select: { id: true, restauranteId: true, isActive: true }
        });
        return rows.map(mapScopeEntity);
    }
    async findOrderByExternalId(restauranteId, externalOrderId) {
        const row = await this.prisma.order.findUnique({
            where: { restauranteId_externalOrderId: { restauranteId, externalOrderId } },
            include: { restaurante: { select: { slug: true } } }
        });
        return row ? mapOrder(row) : null;
    }
    async getNextNumeroComanda(restauranteId) {
        const current = await this.prisma.order.aggregate({
            _max: { numeroComanda: true },
            where: { restauranteId }
        });
        return (current._max.numeroComanda ?? 0) + 1;
    }
    async createOrder(params) {
        const nextNumero = await this.getNextNumeroComanda(params.restaurante.id);
        const row = await this.prisma.order.create({
            data: {
                restauranteId: params.restaurante.id,
                externalOrderId: params.payload.externalOrderId,
                tipoPedido: params.payload.tipoPedido,
                canal: params.payload.canal,
                origen: "EXTERNAL_API",
                numeroComanda: nextNumero,
                notas: params.payload.notas ?? null,
                deliveryMode: params.payload.deliveryMetadata?.mode ?? null,
                driverRef: params.payload.deliveryMetadata?.driverRef ?? null,
                vehicleNote: params.payload.deliveryMetadata?.vehicleNote ?? null,
                items: {
                    createMany: {
                        data: params.payload.items.map((item) => ({
                            productoId: item.productoId,
                            tamanoId: item.tamanoId ?? null,
                            cantidad: item.cantidad,
                            notas: item.notas ?? null
                        }))
                    }
                }
            },
            select: {
                id: true,
                restauranteId: true,
                numeroComanda: true,
                estado: true,
                createdAt: true
            }
        });
        return {
            id: row.id,
            restauranteId: row.restauranteId,
            restauranteSlug: params.restaurante.slug,
            numeroComanda: row.numeroComanda,
            estado: row.estado,
            createdAt: row.createdAt
        };
    }
    async findIdempotencyKey(restauranteId, key) {
        const row = await this.prisma.externalIdempotencyKey.findUnique({
            where: { idempotencyKey_restauranteId: { idempotencyKey: key, restauranteId } }
        });
        return row ? mapIdempotency(row) : null;
    }
    async createIdempotencyKey(input) {
        const row = await this.prisma.externalIdempotencyKey.create({
            data: {
                idempotencyKey: input.idempotencyKey,
                restauranteId: input.restauranteId,
                apiKeyId: input.apiKeyId,
                payloadHash: input.payloadHash,
                status: input.status,
                expiresAt: input.expiresAt
            }
        });
        return mapIdempotency(row);
    }
    async updateIdempotencyKey(input) {
        await this.prisma.externalIdempotencyKey.update({
            where: { id: input.id },
            data: {
                status: input.status,
                responseSnapshot: input.responseSnapshot
            }
        });
    }
    async findOrderById(orderId) {
        const row = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { restaurante: { select: { slug: true } } }
        });
        return row ? mapOrder(row) : null;
    }
}
