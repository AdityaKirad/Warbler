import { differenceInYears } from "date-fns";
import { z } from "zod";

export const NameSchema = z
  .string()
  .trim()
  .min(1, { message: "What's your name" })
  .max(50, "Your name is too long");

export const UsernameSchema = z
  .string()
  .min(4, { message: "username too short" })
  .max(15, { message: "username too long" })
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_]*$/, {
    message:
      "Must start with letter or number, only letters, numbers & underscores allowed",
  })
  .refine((val) => !/^\d+$/.test(val), {
    message: "Username cannot be purely numbers",
  })
  .refine(
    (val) => {
      const lower = val.toLowerCase();
      return !lower.includes("warbler") && !lower.includes("admin");
    },
    {
      message: "Username cannot contain 'warbler' or 'admin'",
    },
  );

export const EmailSchema = z
  .string()
  .email({ message: "Invalid Email" })
  .min(3, { message: "Email too short" })
  .max(100, { message: "Email too long" })
  .toLowerCase();

export const IdentifierSchema = z.object({
  identifier: z.union([EmailSchema, UsernameSchema]),
});

export const DOBSchema = z
  .date()
  .refine((val) => differenceInYears(new Date(), val) >= 13, {
    message: "You must be atleast 13 years old",
  });

export const PasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password too short" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

export const PasswordAndConfirmPasswordSchema = PasswordSchema.extend({
  confirmPassword: z.string(),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      path: ["confirmPassword"],
      code: "custom",
      message: "Password's don't match",
    });
  }
});

export type IdentifierSchemaType = z.infer<typeof IdentifierSchema>;
export type PasswordAndConfirmPasswordSchemaType = z.infer<
  typeof PasswordAndConfirmPasswordSchema
>;
