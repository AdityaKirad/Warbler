import { createCookieSessionStorage } from "@remix-run/node";

export const onboardingSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__onboarding",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10,
    secrets: process.env.SESSION_SECRET.split(","),
    secure: process.env.NODE_ENV === "production",
  },
});

export const { commitSession, destroySession, getSession } = onboardingSessionStorage;

export async function createOnboardingUser(data: {
  name: string;
  email: string;
  image?: string;
  dob?: Date;
  expiresAt: Date;
}) {
  const session = await getSession();
  for (const [key, value] of Object.entries(data)) {
    session.set(key, value);
  }
  return commitSession(session, {
    expires: data.expiresAt,
  });
}

export async function getOnboardingSession(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return session;
}

export async function getOnboardingUser(
  request: Request,
): Promise<{ name: string; email: string; dob: Date; image: string | null }> {
  const session = await getOnboardingSession(request);
  const name = session.get("name");
  const email = session.get("email");
  const dob = session.get("dob");
  const image = session.get("image");
  return { name, email, dob, image };
}
