import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import type { FastifyRequest } from "fastify";
import { env } from "../../config/env.js";

export type AccountSessionPayload = {
  userId: string;
  restauranteId: string;
  restauranteSlug: string;
  email: string;
  exp: number;
};

const cookieName = "pedimos_account_session";

const sign = (value: string): string =>
  createHmac("sha256", env.ACCOUNT_SESSION_SECRET).update(value).digest("base64url");

const encode = (payload: AccountSessionPayload): string => {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
};

const decode = (token: string): AccountSessionPayload | null => {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AccountSessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

const parseCookie = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) return null;
  for (const chunk of cookieHeader.split(";")) {
    const [rawKey, ...rest] = chunk.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rest.join("="));
  }
  return null;
};

export const createAccountSessionCookie = (payload: Omit<AccountSessionPayload, "exp">): string => {
  const maxAge = env.ACCOUNT_SESSION_TTL_MINUTES * 60;
  const token = encode({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAge
  });
  return `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
};

export const clearAccountSessionCookie = (): string =>
  `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export const readAccountSession = (request: FastifyRequest): AccountSessionPayload | null => {
  const token = parseCookie(request.headers.cookie, cookieName);
  if (!token) return null;
  return decode(token);
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("base64url");
  const derived = scryptSync(password, salt, 32).toString("base64url");
  return `s2:${salt}:${derived}`;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (hash.startsWith("s2:")) {
    const [, salt, expected] = hash.split(":");
    if (!salt || !expected) return false;
    const derived = scryptSync(password, salt, 32).toString("base64url");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(derived, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  }
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    return bcrypt.compare(password, hash);
  }
  return false;
};

export const guestSessionFingerprint = (request: FastifyRequest): string | null => {
  const token = parseCookie(request.headers.cookie, "pedimos_public_session");
  if (!token) return null;
  return createHmac("sha256", env.PUBLIC_SESSION_SECRET).update(token).digest("hex");
};
