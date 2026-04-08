import { canonicalError } from "../../../shared/errors/canonicalErrors.js";
import { stablePayloadHash } from "../../../shared/utils/hash.js";
export class IdempotencyService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async start(context) {
        const payloadHash = stablePayloadHash(context.payload);
        const existing = await this.repository.findIdempotencyKey(context.restauranteId, context.idempotencyKey);
        if (existing) {
            if (existing.payloadHash !== payloadHash) {
                throw canonicalError("idempotency_payload_mismatch", "Misma idempotency key con payload diferente", { idempotencyKey: context.idempotencyKey });
            }
            if (existing.status === "completed" && existing.responseSnapshot) {
                return { mode: "replay", response: existing.responseSnapshot };
            }
            throw canonicalError("rate_limited", "Solicitud en procesamiento; intenta nuevamente");
        }
        const created = await this.repository.createIdempotencyKey({
            idempotencyKey: context.idempotencyKey,
            restauranteId: context.restauranteId,
            apiKeyId: context.apiKeyId,
            payloadHash,
            status: "processing",
            expiresAt: new Date(Date.now() + context.ttlHours * 60 * 60 * 1000)
        });
        return { mode: "continue", recordId: created.id };
    }
    async complete(recordId, response) {
        await this.repository.updateIdempotencyKey({
            id: recordId,
            status: "completed",
            responseSnapshot: response
        });
    }
}
