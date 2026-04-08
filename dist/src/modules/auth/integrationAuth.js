import { canonicalError } from "../../shared/errors/canonicalErrors.js";
import { sha256 } from "../../shared/utils/hash.js";
export class IntegrationAuthGuard {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    validateHeaders(headers) {
        const apiKey = headers["x-api-key"];
        const restauranteSlug = headers["x-restaurante-slug"];
        const idempotencyKey = headers["x-idempotency-key"];
        if (typeof apiKey !== "string" || !apiKey.trim()) {
            throw canonicalError("invalid_api_key", "x-api-key ausente o invalida");
        }
        if (typeof restauranteSlug !== "string" || !restauranteSlug.trim()) {
            throw canonicalError("invalid_payload", "x-restaurante-slug es obligatorio");
        }
        if (typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
            throw canonicalError("invalid_payload", "x-idempotency-key es obligatorio");
        }
        return { apiKey, restauranteSlug, idempotencyKey };
    }
    preHandler = async (request, _reply) => {
        const { apiKey, restauranteSlug } = this.validateHeaders(request.headers);
        const restaurante = await this.repository.findRestauranteBySlug(restauranteSlug);
        if (!restaurante) {
            throw canonicalError("branch_not_found", "Sucursal no encontrada");
        }
        if (!restaurante.isActive) {
            throw canonicalError("branch_inactive", "Sucursal inactiva");
        }
        if (restaurante.isSuspended) {
            throw canonicalError("branch_suspended", "Sucursal suspendida");
        }
        const apiKeyRecord = await this.repository.findApiKeyByHash(sha256(apiKey));
        if (!apiKeyRecord || !apiKeyRecord.isActive) {
            throw canonicalError("invalid_api_key", "x-api-key ausente o invalida");
        }
        if (apiKeyRecord.restauranteId !== restaurante.id) {
            throw canonicalError("branch_scope_mismatch", "API key no pertenece a la sucursal objetivo");
        }
        if (!apiKeyRecord.scopes.includes("orders:create") && !apiKeyRecord.scopes.includes("orders:read")) {
            throw canonicalError("invalid_api_key", "API key sin scopes requeridos");
        }
        request.integrationContext = {
            restauranteId: restaurante.id,
            restauranteSlug: restaurante.slug,
            apiKeyId: apiKeyRecord.id
        };
    };
}
