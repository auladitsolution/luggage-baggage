import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer poisha into Bangladeshi Taka string (e.g. 150000 -> "৳ ১,৫০০")
 */
export function formatBDT(poisha: number, useBengaliNumerals = true): string {
  const taka = poisha / 100;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(taka);

  if (!useBengaliNumerals) {
    return `৳ ${formatted}`;
  }

  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const bnFormatted = formatted.replace(/[0-9]/g, (w) => bengaliDigits[+w]);
  return `৳ ${bnFormatted}`;
}

export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
}

