import { z } from "zod";

const zodEnv = z.object({
  AUTH_SECRET: z.string().length(44),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  DATABASE_URL: z.string().url(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  HONEYPOT_SEED: z.string().length(44),
  NODE_ENV: z.enum(["development", "production", "test"]),
  PLUNK_API_KEY: z.string(),
  URL: z.string().url(),
});

try {
  zodEnv.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const { fieldErrors } = error.flatten();
    const errorMessage = Object.entries(fieldErrors).map(([field, error]) =>
      error ? `${field}: ${error.join(", ")}` : field,
    );
    console.error(`Invalid environment variables:\n ${errorMessage}`);
    process.exit(1);
  }
}

type ZodEnv = z.infer<typeof zodEnv>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv extends ZodEnv {}
  }
}
