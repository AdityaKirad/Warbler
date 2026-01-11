import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const base64url = {
  encode(payload: string) {
    const bytes = new TextEncoder().encode(payload);

    let base64 = "";

    for (let i = 0; i < bytes.length; i++) {
      base64 += String.fromCharCode(bytes[i] as number);
    }

    base64 = btoa(base64).replace(/[+/=]/g, (c) =>
      c === "+" ? "-" : c === "/" ? "_" : "",
    );

    return base64;
  },
  decode(base64url: string | null | undefined) {
    if (!base64url) {
      return null;
    }

    if (!/^[A-Za-z0-9\-_]*$/.test(base64url)) {
      return null;
    }

    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

    const pad = base64.length % 4;
    if (pad === 2) base64 += "==";
    else if (pad === 3) base64 += "=";
    else if (pad === 1) return null;

    let bytes: Uint8Array;

    try {
      const bin = atob(base64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
    } catch {
      {
        return null;
      }
    }

    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      {
        return null;
      }
    }
  },
};
