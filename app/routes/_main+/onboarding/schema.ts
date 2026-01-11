import { DOBSchema, UsernameSchema } from "~/lib/user-validation";
import { z } from "zod";

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export const avatarSchema = z.object({
  avatar: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Image is required")
    .refine((file) => file.size <= MAX_IMAGE_SIZE),
});

export const dobSchema = z.object({
  dob: DOBSchema,
});

export const usernameSchema = z.object({
  username: UsernameSchema,
});
