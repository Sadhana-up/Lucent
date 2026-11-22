import { validateNepaliPhone } from "@/lib/utils";

export interface AddressInput {
  label?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface AddressData {
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  isDefault: boolean;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateAddressInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): { data: Partial<AddressData>; error: string | null } {
  const input = (body ?? {}) as AddressInput;
  const data: Partial<AddressData> = {};

  if (!partial || input.label !== undefined) {
    data.label = text(input.label, 40) || "Home";
  }

  if (!partial || input.fullName !== undefined) {
    data.fullName = text(input.fullName, 100);
    if (!data.fullName) return { data, error: "Full name is required." };
  }

  if (!partial || input.phone !== undefined) {
    data.phone = text(input.phone, 30);
    if (!data.phone) return { data, error: "Phone number is required." };
    if (!validateNepaliPhone(data.phone)) {
      return {
        data,
        error:
          "Enter a valid Nepali phone number (e.g., +977-98XXXXXXXX or 98XXXXXXXX).",
      };
    }
  }

  if (!partial || input.address !== undefined) {
    data.address = text(input.address, 500);
    if (!data.address) return { data, error: "Street address is required." };
  }

  if (!partial || input.city !== undefined) {
    data.city = text(input.city, 100);
    if (!data.city) return { data, error: "City is required." };
  }

  if (!partial || input.state !== undefined) {
    data.state = text(input.state, 100) || null;
  }

  if (!partial || input.postalCode !== undefined) {
    data.postalCode = text(input.postalCode, 20) || null;
  }

  if (!partial || input.isDefault !== undefined) {
    data.isDefault = Boolean(input.isDefault);
  }

  return { data, error: null };
}
