import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan className dengan dukungan conditional + dedupe Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
