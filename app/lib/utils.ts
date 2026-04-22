import { Cloudinary } from "@cloudinary/url-gen";
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import {
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInYears,
  format,
} from "date-fns";
import { twMerge } from "tailwind-merge";

export const ALLOWED_FORMATS = {
  pjp: "image/jpeg",
  jfif: "image/jpeg",
  jpe: "image/jpeg",
  pjpeg: "image/jpeg",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm",
};

export const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
    analytics: false,
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const base64url = {
  encode(payload: string | Buffer) {
    const bytes =
      typeof payload === "string" ? new TextEncoder().encode(payload) : payload;

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

export const getNameInitials = (name: string | undefined) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("");

export function formatTweetDate(date: Date) {
  const now = new Date();

  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) {
    return `${seconds}sec`;
  }

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = differenceInHours(now, date);
  if (hours < 24) {
    return `${hours}h`;
  }

  const years = differenceInYears(now, date);
  if (years < 1) {
    return format(date, "MMM d");
  }

  return format(date, "MMM d, yyyy");
}

export function formatNumber(value?: number) {
  if (!value || !Number.isFinite(value) || value < 0) {
    return "0";
  }

  if (value < 1_000) {
    return value.toString();
  }

  if (value < 1_000_000) {
    if (value >= 999_500) {
      return "999.9K";
    }

    if (value < 10_000) {
      return truncate(value / 1_000, 1) + "K";
    }

    return Math.floor(value / 1_000) + "K";
  }

  if (value < 1_000_000_000) {
    if (value < 10_000_000) {
      return truncate(value / 1_000_000, 1) + "M";
    }

    return Math.floor(value / 1_000_000) + "M";
  }

  if (value < 10_000_000_000) {
    return truncate(value / 1_000_000_000, 1) + "B";
  }

  return Math.floor(value / 1_000_000_000) + "B";
}

function truncate(value: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return (Math.floor(value * factor) / factor)
    .toFixed(decimals)
    .replace(/\.0$/, "");
}

export async function uploadToCloudinary(
  file: File,
  type: "header" | "post" | "profile",
) {
  const res = await fetch("/cloudinary/sign", {
    method: "POST",
    body: JSON.stringify({
      type,
    }),
  });

  if (!res.ok) {
    throw new Error("Something went wrong while signing the request");
  }

  const {
    allowed_formats,
    api_key,
    cloudname,
    folder,
    overwrite,
    public_id,
    signature,
    transformation,
    timestamp,
  } = await res.json();

  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("api_key", api_key);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("allowed_formats", allowed_formats);
  formData.append("transformation", transformation);
  formData.append("public_id", public_id);

  if (overwrite) {
    formData.append("overwrite", String(overwrite));
  }

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudname}/auto/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await uploadRes.json();

  if (!uploadRes.ok) {
    throw new Error(
      data.error.message || "Something went wrong while uploading the image",
    );
  }

  return { public_id: data.public_id, version: data.version };
}
