import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `NPR ${amount.toFixed(2)}`
}

export function validateNepaliPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "")
  const nepaliPhoneRegex = /^(\+977)?[9][6-8]\d{8}$/
  return nepaliPhoneRegex.test(cleaned)
}

export function getPhoneValidationError(phone: string): string | null {
  if (!phone.trim()) return "Phone number is required"
  if (!validateNepaliPhone(phone)) {
    return "Enter a valid Nepali phone number (e.g., +977-98XXXXXXXX or 98XXXXXXXX)"
  }
  return null
}
