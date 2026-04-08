import { z } from "zod";

export const emailSchema = z.string().trim().email().max(190);

export const passwordSchema = z
  .string()
  .min(8, "La contrasena debe tener minimo 8 caracteres")
  .max(72, "La contrasena es demasiado larga");

export const accountRegisterSchema = z.object({
  slug: z.string().trim().min(1),
  email: emailSchema,
  password: passwordSchema,
  nombreCompleto: z.string().trim().min(3).max(120),
  telefono: z.string().trim().min(7).max(30).optional()
});

export const accountLoginSchema = z.object({
  slug: z.string().trim().min(1),
  email: emailSchema,
  password: z.string().min(1).max(200)
});

export const accountUpdateProfileSchema = z.object({
  nombreCompleto: z.string().trim().min(3).max(120).optional(),
  telefono: z.string().trim().min(7).max(30).optional()
});

export const accountClaimGuestSchema = z.object({
  telefono: z.string().trim().min(7).max(30).optional(),
  orderIds: z.array(z.string().min(1)).max(20).optional()
});
