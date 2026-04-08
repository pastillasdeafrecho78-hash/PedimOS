import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError, canonicalError } from "../errors/canonicalErrors.js";

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      const appError = canonicalError("invalid_payload", "Payload o headers invalidos", {
        issues: error.issues
      });
      return reply.status(appError.statusCode).send({
        success: false,
        error: appError.message,
        code: appError.code,
        details: appError.details ?? {}
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details ?? {}
      });
    }

    return reply.status(500).send({
      success: false,
      error: "Error interno no controlado",
      code: "internal_error",
      details: {}
    });
  });
};
