import crypto from "crypto";
import { base64url } from "~/lib/utils";

export function getSignedToken<T>(data: T) {
  const signature = getSignature(data).toString("base64url");

  return base64url.encode(JSON.stringify({ ...data, signature }));
}

export function parseSignedToken<T>(token: string) {
  const decoded = base64url.decode(token);

  if (!decoded) {
    return null;
  }

  try {
    const { signature, ...data } = JSON.parse(decoded);

    const signatureBuffer = Buffer.from(signature, "base64url");
    const expectedSignature = getSignature(data);

    if (signatureBuffer.length !== expectedSignature.length) {
      return null;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedSignature)
      ? (data as T)
      : null;
  } catch {
    return null;
  }
}

function getSignature<T>(data: T) {
  const encoder = new TextEncoder();
  return crypto
    .createHmac("SHA-256", process.env.AUTH_SECRET)
    .update(encoder.encode(JSON.stringify(data)))
    .digest();
}
