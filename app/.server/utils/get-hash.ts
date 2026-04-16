import crypto from "crypto";

export function getHash(data: string, base64urlEncoded: true): string;
export function getHash(
  data: string,
  base64urlEncoded?: false,
): Buffer<ArrayBuffer>;

export function getHash(data: string, base64urlEncoded = false) {
  const encoder = new TextEncoder();
  const hash = crypto.createHash("SHA-256").update(encoder.encode(data));
  return base64urlEncoded ? hash.digest("base64url") : hash.digest();
}
