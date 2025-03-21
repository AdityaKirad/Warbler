import { z } from "zod";

const zodEnv = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  HONEYPOT_SEED: z.string().length(44),
  SESSION_SECRET: z.string().length(44),
  PLUNK_API_KEY: z.string(),
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

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof zodEnv> {}
  }
}
