import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("El correo no es válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = authSchema.extend({
  shopName: z
    .string()
    .min(3, "El nombre de la tienda debe tener al menos 3 caracteres"),
});
