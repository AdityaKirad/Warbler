import crypto from "crypto";
import { base64url } from "~/lib/utils";

export function getSignedToken(data: object) {
  const signature = getSignature(JSON.stringify(data)).toString("base64url");

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
    const expectedSignature = getSignature(JSON.stringify(data));

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

function getSignature(data: string) {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET)
    .update(data)
    .digest();
}
