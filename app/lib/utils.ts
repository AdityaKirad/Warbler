import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {customAlphabet} from "nanoid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate expiration date
 * @param time expiration time in seconds
 * @default 10 minutes
 */
export const getExpirationDate = (time = 600) => new Date(Date.now() + time * 1000)

/**
 * Generate unique id
 * @param length length of id
 * @default 10
 */
export const generateUniqueId = (length = 10) => customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", length)()