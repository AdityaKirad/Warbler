import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, verification } from "../drizzle";
import { getSignedToken } from "../utils";
import { getExpirationDate } from "./utils";

type CreateVerification = { target: string } & (
  | { type: "signup"; data: { name: string; email: string; dob: Date } }
  | { type: "password-reset"; data: { userId: string } }
  | { type: "verify-email"; data: { userId: string } }
);

export type VerificationType = CreateVerification["type"];

export async function createVerification(args: CreateVerification) {
  const code = generateVerificationCode();

  const identifier = `${args.type}-otp-${args.target}`;

  const verificationData = {
    identifier,
    value: `${getHash(code).toString("base64url")}:0`,
    expiresAt: getExpirationDate(60 * 10),
  };

  try {
    await db
      .insert(verification)
      .values(verificationData)
      .onConflictDoUpdate({
        target: [verification.identifier],
        set: {
          value: verificationData.value,
          expiresAt: verificationData.expiresAt,
        },
      });
  } catch (error) {
    console.error(error);
    return null;
  }

  const token = getSignedToken({
    identifier,
    type: args.type,
    data: args.data,
    expiresAt: verificationData.expiresAt,
  });

  return {
    code,
    token,
  };
}

export async function validateVerificationCode({
  identifier,
  code,
}: {
  identifier: string;
  code: string;
}): Promise<
  | {
      success: false;
      error: string;
    }
  | { success: true }
> {
  const verificationData = await db.query.verification.findFirst({
    columns: { value: true },
    where: (verication, { and, eq, gt }) =>
      and(
        eq(verication.identifier, identifier),
        gt(verication.expiresAt, new Date()),
      ),
  });

  if (!verificationData) {
    return {
      success: false,
      error: "Invalid Code",
    };
  }

  const [codeValue, attempts] = verificationData.value.split(":");

  if (!codeValue || !attempts) {
    return {
      success: false,
      error: "Invalid Code",
    };
  }

  if (Number(attempts) > 5) {
    return {
      success: false,
      error: "Invalid Code",
    };
  }

  const codeValueBuffer = Buffer.from(codeValue, "base64url");
  const codeHash = getHash(code);

  if (codeValueBuffer.length !== codeHash.length) {
    return {
      success: false,
      error: "Invalid Code",
    };
  }

  const isCodeValid = crypto.timingSafeEqual(codeValueBuffer, codeHash);

  if (!isCodeValid) {
    await db
      .update(verification)
      .set({
        value: `${codeValue}:${attempts + 1}`,
      })
      .where(eq(verification.identifier, identifier));
    return {
      success: false,
      error: "Invalid Code",
    };
  }

  void db
    .delete(verification)
    .where(eq(verification.identifier, identifier))
    .catch(() => {});

  return {
    success: true,
  };
}

const getHash = (code: string) =>
  crypto.createHash("SHA-256").update(code).digest();

function generateVerificationCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const bytes = crypto.randomBytes(6);

  let code = "";

  for (const byte of bytes) {
    code += alphabet[byte >> 3];
  }

  return code;
}
