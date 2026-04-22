import { DOBSchema, NameSchema } from "~/lib/user-validation";
import { z } from "zod";

export const baseSchema = z.object({
  name: NameSchema,
  bio: z
    .string()
    .trim()
    .refine(
      (val) => new TextEncoder().encode(val).length <= 160,
      "Bio must be less than 160 characters",
    )
    .optional(),
  location: z
    .string()
    .trim()
    .refine(
      (val) => new TextEncoder().encode(val).length <= 30,
      "Location must be less than 30 characters",
    )
    .optional(),
  website: z.string().url().max(100).optional(),
  dob: DOBSchema,
});
