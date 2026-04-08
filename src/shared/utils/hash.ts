import crypto from "node:crypto";

export const sha256 = (input: string): string =>
  crypto.createHash("sha256").update(input).digest("hex");

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
};

export const stablePayloadHash = (payload: unknown): string => {
  const normalized = normalize(payload);
  return sha256(JSON.stringify(normalized));
};
