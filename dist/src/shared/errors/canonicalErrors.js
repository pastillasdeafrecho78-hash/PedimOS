export class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, statusCode, message, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
export const canonicalError = (code, message, details) => {
    const statusByCode = {
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
