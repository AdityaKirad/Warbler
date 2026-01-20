import type { OAuth2Tokens } from "arctic";
import { Discord, generateCodeVerifier, generateState } from "arctic";
import { redirect } from "react-router";
import { z } from "zod";
import type { Provider } from ".";
import { oauthCodeVerifierCookie, oauthStateCookie } from "../cookies/oauth";
import { getRedirectCookieHeader } from "../cookies/redirect-to";

const schema = z.object({
  id: z.string(),
  avatar: z.string().nullable(),
  email: z.string().email().toLowerCase(),
  global_name: z.string(),
  verified: z.boolean(),
  username: z.string(),
});

const discord = new Discord(
  process.env.DISCORD_CLIENT_ID,
  process.env.DISCORD_CLIENT_SECRET,
  `${process.env.URL}/flow/discord/callback`,
);

export const DiscordProvider: Provider = {
  name: "discord",
  async generateAuth(request) {
    let url = new URL(request.url);

    const redirectTo = url.searchParams.get("redirectTo");
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    url = discord.createAuthorizationURL(state, codeVerifier, [
      "identify",
      "email",
    ]);

    const headers = new Headers();

    if (redirectTo) {
      headers.append("set-cookie", await getRedirectCookieHeader(redirectTo));
    }

    headers.append("set-cookie", await oauthStateCookie.serialize(state));
    headers.append(
      "set-cookie",
      await oauthCodeVerifierCookie.serialize(codeVerifier),
    );

    throw redirect(url.toString(), { headers });
  },
  async handleCallback(request: Request) {
    const cookieHeader = request.headers.get("cookie");
    const { code, state } = Object.fromEntries(
      new URL(request.url).searchParams,
    );
    const storedState = await oauthStateCookie.parse(cookieHeader);
    const codeVerifier = await oauthCodeVerifierCookie.parse(cookieHeader);

    if (
      !code ||
      !state ||
      !storedState ||
      !codeVerifier ||
      state !== storedState
    ) {
      return null;
    }

    let tokens: OAuth2Tokens;

    try {
      tokens = await discord.validateAuthorizationCode(code, codeVerifier);
    } catch (error) {
      console.error("Failed to validate oauth code: ", error);
      return null;
    }

    const response = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user profile: ", response.statusText);
      return null;
    }

    const user = schema.safeParse(await response.json());

    if (!user.success) {
      console.error("Failed to parse user profile: ", user.error);
      return null;
    }

    const data = user.data;

    return {
      providerId: data.id,
      name: data.global_name ?? data.username,
      email: data.email,
      emailVerified: data.verified,
      photo: `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`,
    };
  },
};
