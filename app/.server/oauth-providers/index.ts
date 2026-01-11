import { DiscordProvider } from "./discord";
import { GoogleProvider } from "./google";

export type Provider = {
  name: string;
  generateAuth: (request: Request) => Promise<never>;
  handleCallback: (request: Request) => Promise<{
    providerId: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
  } | null>;
};

export const providers: Record<string, Provider> = {
  google: GoogleProvider,
  discord: DiscordProvider,
};
