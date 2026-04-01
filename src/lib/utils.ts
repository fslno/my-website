import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deeply serializes data to ensure it can be passed across Next.js Server/Client boundaries.
 * Specifically handles Firestore Timestamps and other non-plain objects.
 */
export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}
