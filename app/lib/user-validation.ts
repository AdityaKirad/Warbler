import { differenceInYears } from "date-fns";
import { z } from "zod";

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 15;

export const NameSchema = z.string().trim().min(1, { message: "What's your name" }).max(50, "Your name is too long");

export const UsernameSchema = z
  .string()
  .min(USERNAME_MIN_LENGTH, { message: "username too short" })
  .max(USERNAME_MAX_LENGTH, { message: "username too long" })
  .regex(USERNAME_REGEX, { message: "Must start with letter, only letter, number & underscores allowed" })
  .refine(
    (val) => {
      const username = val.toLowerCase();
      return !username.includes("Warbler") && !username.includes("admin") && !username.endsWith("com");
    },
    { message: "username can't contain 'Warbler' or 'admin' or end with 'com'" },
  );

export const EmailSchema = z
  .string()
  .email({ message: "Invalid Email" })
  .min(3, { message: "Email too short" })
  .max(100, { message: "Email too long" })
  .toLowerCase();

export const IdentifierSchema = z.union([EmailSchema, UsernameSchema]);

export const DOBSchema = z
  .date()
  .refine((val) => differenceInYears(new Date(), val) >= 13, { message: "You must be atleast 13 years old" });

export const PasswordSchema = z
  .string()
  .min(8, { message: "Password too short" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })
  .refine((val) => new TextEncoder().encode(val).length <= 72, { message: "Password too long" });

export const PasswordAndConfirmPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: "custom",
        message: "Password's don't match",
      });
    }
  });
