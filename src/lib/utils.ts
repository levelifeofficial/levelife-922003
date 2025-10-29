import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGold(amount: number): string {
  return amount.toLocaleString();
}

export function capGold(amount: number): number {
  return Math.min(amount, 1000000);
}
