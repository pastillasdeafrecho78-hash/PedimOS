import crypto from "node:crypto";
export const sha256 = (input) => crypto.createHash("sha256").update(input).digest("hex");
const normalize = (value) => {
    if (Array.isArray(value)) {
        return value.map(normalize);
    }
    if (value && typeof value === "object") {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
            acc[key] = normalize(value[key]);
            return acc;
        }, {});
    }
    return value;
};
export const stablePayloadHash = (payload) => {
    const normalized = normalize(payload);
    return sha256(JSON.stringify(normalized));
};
