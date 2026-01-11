import crypto from "node:crypto";
import { createToken } from "./utils";

const SCRYPT_PARAMS = {
  N: 2 ** 14,
  r: 16,
  p: 1,
  keyLength: 64,
  saltLength: 16,
};

export async function checkCommonPassword(password: string) {
  const hash = crypto
    .createHash("sha1")
    .update(password, "utf8")
    .digest("hex")
    .toUpperCase();
  const [prefix, suffix] = [hash.slice(0, 5), hash.slice(5)];
  const controller = new AbortController();

  try {
    const timeout = setTimeout(() => controller.abort(), 1000);

    const res = await fetch(
      `https://api.pwnedpasswords.com/range/${encodeURIComponent(prefix)}`,
      {
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`PwnedPasswords API responded with ${res.status} status`);
      return false;
    }

    const data = await res.text();

    return data.split(/\r?\n/).some((line) => line.includes(suffix));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Password check timed out");
    } else {
      console.warn("Unknown error occurred while checking password", error);
    }
    return false;
  }
}

export async function getPasswordHash(password: string) {
  const salt = createToken(SCRYPT_PARAMS.saltLength).toString("base64url");
  const key = await generateKey({ password, salt }, SCRYPT_PARAMS);
  return [
    "scrypt",
    `N=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}`,
    key.toString("base64url"),
    salt,
  ].join("$");
}

export async function verifyPassword({
  password,
  hash,
}: {
  password: string;
  hash: string;
}) {
  const parts = hash.split("$");

  if (parts.length !== 4 || parts[0] !== "scrypt") {
    return false;
  }

  const [_, config, key, salt] = parts;

  if (!config || !key || !salt) {
    return false;
  }

  const parsed = Object.fromEntries(
    config.split(",").map((part) => part.split("=")),
  );

  const keyBuffer = Buffer.from(key, "base64url");

  const scryptConfig = {
    N: Number(parsed.N),
    p: Number(parsed.p),
    r: Number(parsed.r),
    keyLength: keyBuffer.length,
  };

  const expectedKey = await generateKey({ password, salt }, scryptConfig);

  return crypto.timingSafeEqual(keyBuffer, expectedKey);
}

const generateKey = (
  { password, salt }: { password: string; salt: string },
  scryptConfig: {
    N: number;
    p: number;
    r: number;
    keyLength: number;
  },
) =>
  new Promise<Buffer<ArrayBufferLike>>((resolve, reject) => {
    crypto.scrypt(
      password.normalize("NFKC"),
      salt,
      scryptConfig.keyLength,
      {
        N: scryptConfig.N,
        p: scryptConfig.p,
        r: scryptConfig.r,
        maxmem: 128 * 2 * scryptConfig.N * scryptConfig.p * scryptConfig.r,
      },
      (err, key) => {
        if (err) {
          reject(err);
        }
        resolve(key);
      },
    );
  });
