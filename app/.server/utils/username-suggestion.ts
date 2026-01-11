import type { DrizzleAdapter } from "~/.server/drizzle";
import { UsernameSchema } from "~/lib/user-validation";

function sanitizeUsername(str: string): string {
  return str.replace(/[^a-zA-Z0-9_]/g, "");
}

function ensureValidStart(username: string): string {
  if (!username) return username;
  if (/^[a-zA-Z0-9]/.test(username)) return username;
  return `u${username}`;
}

function isValidUsername(username: string): boolean {
  return UsernameSchema.safeParse(username).success;
}

function generateSuffixes(): string[] {
  return [
    Math.floor(Math.random() * 100).toString(),
    Math.floor(Math.random() * 1000).toString(),
    Math.floor(Math.random() * 10000).toString(),
    Math.floor(Math.random() * 100000).toString(),
    Math.floor(Math.random() * 1000000).toString(),
    (Date.now() % 10000).toString(),
    ((Date.now() % 100000) + Math.floor(Math.random() * 1000)).toString(),
  ];
}

async function checkBatchAvailability(
  adpater: DrizzleAdapter,
  usernames: string[],
): Promise<Set<string>> {
  if (usernames.length === 0) return new Set();

  const existing = await adpater.query.user.findMany({
    columns: { username: true },
    where: (user, { inArray }) => inArray(user.username, usernames),
  });

  return new Set(existing.map((u) => u.username));
}

export async function generateUsernameSuggestions(
  adpater: DrizzleAdapter,
  {
    name,
    email,
    dob,
    count = 3,
  }: {
    name: string;
    email: string;
    dob?: Date | string | null;
    count?: number;
  },
) {
  const sanitizedName = sanitizeUsername(
    name.toLowerCase().replace(/\s+/g, ""),
  );

  const emailPrefix = email.toLowerCase().split("@")[0];
  const sanitizedEmail = emailPrefix ? sanitizeUsername(emailPrefix) : "";

  let bases = [sanitizedName, sanitizedEmail]
    .map(ensureValidStart)
    .filter((base) => base.length >= 4);

  if (bases.length === 0) {
    bases = ["user"];
  }

  const candidates: string[] = [];

  for (const base of bases) {
    candidates.push(base);

    if (dob) {
      try {
        const date = typeof dob === "string" ? new Date(dob) : dob;
        const year = date.getFullYear();
        const currentYear = new Date().getFullYear();

        if (year > 1900 && year <= currentYear) {
          candidates.push(`${base}${year}`);
          candidates.push(`${base}${year.toString().slice(-2)}`);
        }
      } catch {
        // Ignore invalid dates
      }
    }

    for (const suffix of generateSuffixes()) {
      candidates.push(`${base}${suffix}`);
    }
  }

  const validCandidates = candidates.filter(isValidUsername);

  const taken = await checkBatchAvailability(adpater, validCandidates);
  const available = validCandidates.filter((username) => !taken.has(username));

  return available.slice(0, count);
}
