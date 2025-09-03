import crypto from "node:crypto";
import { db, verification } from "../drizzle";
import { generateHash } from "./password";
import { getExpirationDate, getSignedToken } from "./utils";

type PrepareVerification = { target: string } & (
  | {
      type: "signup";
      data: {
        name: string;
        email: string;
        dob: Date;
      };
    }
  | {
      type: "forget-password";
      data: {
        id: string;
        username: string;
      };
    }
  | {
      type: "verify-email";
      data: {
        id: string;
        username: string;
      };
    }
);

export type VerificationType = PrepareVerification["type"];

export type VerificationPayload = PrepareVerification & { expiresAt: string };

export async function prepareVerification(input: PrepareVerification) {
  const { target, type } = input;
  const data = "data" in input ? input.data : undefined;

  const code = generateVerificationCode();

  const verificationData = {
    target,
    type,
    hash: await generateHash(code),
    expiresAt: getExpirationDate(60 * 10),
  };

  try {
    await db
      .insert(verification)
      .values(verificationData)
      .onConflictDoUpdate({
        target: [verification.target, verification.type],
        set: {
          hash: verificationData.hash,
          expiresAt: verificationData.expiresAt,
        },
      });
  } catch {
    return null;
  }

  const tokenData = {
    expiresAt: verificationData.expiresAt,
    data,
    target,
    type,
  };

  const token = getSignedToken(tokenData);

  return {
    code,
    token,
  };
}

function generateVerificationCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const bytes = crypto.randomBytes(6);

  let code = "";

  for (const byte of bytes) {
    code += alphabet[byte >> 3];
  }

  return code;
}
