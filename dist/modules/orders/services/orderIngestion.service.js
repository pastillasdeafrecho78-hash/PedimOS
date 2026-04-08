import { canonicalError } from "../../../shared/errors/canonicalErrors.js";
import { IdempotencyService } from "./idempotency.service.js";
import { OrderScopeValidator } from "./orderScopeValidator.js";
export class OrderIngestionService {
    repository;
    scopeValidator;
    idempotencyService;
    constructor(repository) {
        this.repository = repository;
        this.scopeValidator = new OrderScopeValidator(repository);
        this.idempotencyService = new IdempotencyService(repository);
    }
    async createExternalOrder(input) {
        const restaurante = await this.repository.findRestauranteBySlug(input.restauranteSlug);
        if (!restaurante || restaurante.id !== input.restauranteId) {
            throw canonicalError("branch_scope_mismatch", "Contexto de tenant invalido");
        }
        const idempotencyState = await this.idempotencyService.start({
            restauranteId: input.restauranteId,
            apiKeyId: input.apiKeyId,
            idempotencyKey: input.idempotencyKey,
            payload: input.payload,
            ttlHours: input.ttlHours
        });
        if (idempotencyState.mode === "replay") {
            const replay = idempotencyState.response;
            replay.data.idempotent = true;
            return { httpStatus: 200, body: replay };
        }
        await this.scopeValidator.validate(restaurante, input.payload);
        const duplicated = await this.repository.findOrderByExternalId(restaurante.id, input.payload.externalOrderId);
        if (duplicated) {
            throw canonicalError("duplicate_external_order", "externalOrderId ya existe para la sucursal");
        }
        let created;
        try {
            created = await this.repository.createOrder({ restaurante, payload: input.payload });
        }
        catch {
            throw canonicalError("duplicate_external_order", "externalOrderId ya existe para la sucursal");
        }
        const response = {
            success: true,
            data: {
                orderId: created.id,
                numeroComanda: created.numeroComanda,
                restauranteId: created.restauranteId,
                restauranteSlug: created.restauranteSlug,
                estado: created.estado,
                origen: "EXTERNAL_API",
                idempotent: false,
                createdAt: created.createdAt.toISOString()
            }
        };
        await this.idempotencyService.complete(idempotencyState.recordId, response);
        return { httpStatus: 201, body: response };
    }
    async getExternalOrderStatus(restauranteId, orderId) {
        const order = await this.repository.findOrderById(orderId);
        if (!order || order.restauranteId !== restauranteId) {
            throw canonicalError("branch_scope_mismatch", "La orden no pertenece a la sucursal autenticada");
        }
        return {
            success: true,
            data: {
                orderId: order.id,
                restauranteId: order.restauranteId,
                estado: order.estado
            }
        };
    }
}
