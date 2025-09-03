import { OAuth2Strategy } from "remix-auth-oauth2";
import { z } from "zod";

const schema = z.object({
  id: z.string(),
  avatar: z.string().url().nullable(),
  email: z.string().email().toLowerCase(),
  global_name: z.string(),
  verified: z.boolean(),
  username: z.string(),
});

export const discordStrategy = new OAuth2Strategy(
  {
    cookie: {
      name: "oauth2",
      httpOnly: true,
      maxAge: 600,
      sameSite: "Lax",
      secure: true,
    },
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    authorizationEndpoint: "https://discord.com/oauth2/authorize",
    tokenEndpoint: "https://discord.com/api/oauth2/token",
    redirectURI: `${process.env.URL}/flow/discord/callback`,
    scopes: ["identify", "email"],
  },
  async ({ tokens }) => {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });

    if (!res.ok)
      throw new Error(`Failed to fetch user profile: ${res.statusText}`);

    const data = schema.parse(await res.json());

    return {
      providerId: data.id,
      name: data.global_name ?? data.username,
      email: data.email,
      emailVerified: data.verified,
      image: data.avatar,
    };
  },
);
