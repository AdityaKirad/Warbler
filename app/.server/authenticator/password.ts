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

    return data.split("/\r?\n/").some((line) => line.includes(suffix));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Password check timed out");
    } else {
      console.warn("Unknown error occurred while checking password", error);
    }
    return false;
  }
}

export const generateHash = async (data: string) => {
  const salt = createToken(SCRYPT_PARAMS.saltLength);
  const key = await generateKey({ data, salt });
  return `${key.toString("hex")}.${salt}`;
};

export const verifyHash = async ({
  data,
  hash,
}: {
  data: string | undefined;
  hash: string;
}) => {
  if (!data) return false;

  const [key, salt] = hash.split(".");

  if (!(key && salt)) return false;

  const expectedKey = await generateKey({ data, salt });

  return crypto.timingSafeEqual(Buffer.from(key, "hex"), expectedKey);
};

const generateKey = async ({ data, salt }: { data: string; salt: string }) =>
  new Promise<Buffer<ArrayBufferLike>>((resolve, reject) => {
    crypto.scrypt(
      data.normalize("NFKC"),
      salt,
      SCRYPT_PARAMS.keyLength,
      {
        N: SCRYPT_PARAMS.N,
        p: SCRYPT_PARAMS.p,
        r: SCRYPT_PARAMS.r,
        maxmem: 128 * 2 * SCRYPT_PARAMS.N * SCRYPT_PARAMS.p * SCRYPT_PARAMS.r,
      },
      (err, key) => {
        if (err) {
          reject(err);
        }
        resolve(key);
      },
    );
  });
