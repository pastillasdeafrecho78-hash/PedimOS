import { canonicalError } from "../../../shared/errors/canonicalErrors.js";
import { stablePayloadHash } from "../../../shared/utils/hash.js";
import type { CreateExternalOrderBody, CreateExternalOrderSuccess } from "../contracts/createExternalOrder.contract.js";
import type { OrdersRepository } from "../repositories/orders.repository.js";

type IdempotencyContext = {
  restauranteId: string;
  apiKeyId: string;
  idempotencyKey: string;
  payload: CreateExternalOrderBody;
  ttlHours: number;
};

type IdempotencyOutcome =
  | { mode: "continue"; recordId: string }
  | { mode: "replay"; response: CreateExternalOrderSuccess };

export class IdempotencyService {
  constructor(private readonly repository: OrdersRepository) {}

  async start(context: IdempotencyContext): Promise<IdempotencyOutcome> {
    const payloadHash = stablePayloadHash(context.payload);
    const existing = await this.repository.findIdempotencyKey(context.restauranteId, context.idempotencyKey);

    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        throw canonicalError(
          "idempotency_payload_mismatch",
          "Misma idempotency key con payload diferente",
          { idempotencyKey: context.idempotencyKey }
        );
      }

      if (existing.status === "completed" && existing.responseSnapshot) {
        return { mode: "replay", response: existing.responseSnapshot as CreateExternalOrderSuccess };
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

  async complete(recordId: string, response: CreateExternalOrderSuccess): Promise<void> {
    await this.repository.updateIdempotencyKey({
      id: recordId,
      status: "completed",
      responseSnapshot: response
    });
  }
}
