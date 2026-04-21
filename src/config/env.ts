import { z } from "zod";

/** Vercel y otros paneles suelen persistir "" en lugar de omitir la variable. */
const emptyToUndefined = (value: unknown): unknown =>
  value === "" || value === null ? undefined : value;

const optionalUrl = () =>
  z.preprocess(emptyToUndefined, z.string().url().optional());

const optionalSecretMin = (min: number) =>
  z.preprocess(emptyToUndefined, z.string().min(min).optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.preprocess(emptyToUndefined, z.coerce.number().default(3000)),
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/pedimos")
  ),
  IDEMPOTENCY_TTL_HOURS: z.preprocess(emptyToUndefined, z.coerce.number().positive().default(48)),
  SERVIMOS_PUBLIC_BASE_URL: optionalUrl(),
  PUBLIC_SESSION_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(16).default("pedimos-public-session-dev-secret")
  ),
  PUBLIC_SESSION_TTL_MINUTES: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(180)),
  ACCOUNT_SESSION_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(16).default("pedimos-account-session-dev-secret")
  ),
  ACCOUNT_SESSION_TTL_MINUTES: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(10080)),
  BENEFITS_GRANT_SECRET: optionalSecretMin(16),
  META_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  META_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  META_REDIRECT_URI: optionalUrl()
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(process.env);
