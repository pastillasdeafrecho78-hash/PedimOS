import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/pedimos"),
  IDEMPOTENCY_TTL_HOURS: z.coerce.number().positive().default(48),
  SERVIMOS_PUBLIC_BASE_URL: z.string().url().optional(),
  PUBLIC_SESSION_SECRET: z.string().min(16).default("pedimos-public-session-dev-secret"),
  PUBLIC_SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(180),
  ACCOUNT_SESSION_SECRET: z.string().min(16).default("pedimos-account-session-dev-secret"),
  ACCOUNT_SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(10080),
  BENEFITS_GRANT_SECRET: z.string().min(16).optional(),
  META_CLIENT_ID: z.string().optional(),
  META_CLIENT_SECRET: z.string().optional(),
  META_REDIRECT_URI: z.string().url().optional()
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(process.env);
