import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate expiration date
 * @param time expiration time in seconds
 * @default 10 minutes
 */
export const getExpirationDate = (time = 600) => new Date(Date.now() + time * 1000);
