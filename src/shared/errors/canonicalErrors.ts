export type CanonicalErrorCode =
  | "invalid_payload"
  | "invalid_api_key"
  | "branch_scope_mismatch"
  | "branch_not_found"
  | "branch_inactive"
  | "branch_suspended"
  | "idempotency_payload_mismatch"
  | "duplicate_external_order"
  | "catalog_version_mismatch"
  | "invalid_item_scope"
  | "rate_limited"
  | "internal_error";

export class AppError extends Error {
  constructor(
    public readonly code: CanonicalErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const canonicalError = (
  code: CanonicalErrorCode,
  message: string,
  details?: Record<string, unknown>
): AppError => {
  const statusByCode: Record<CanonicalErrorCode, number> = {
    invalid_payload: 400,
    invalid_api_key: 401,
    branch_scope_mismatch: 403,
    branch_not_found: 404,
    branch_inactive: 409,
    branch_suspended: 409,
    idempotency_payload_mismatch: 409,
    duplicate_external_order: 409,
    catalog_version_mismatch: 409,
    invalid_item_scope: 422,
    rate_limited: 429,
    internal_error: 500
  };
  return new AppError(code, statusByCode[code], message, details);
};
