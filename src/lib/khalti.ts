/**
 * Minimal server-side client for the Khalti Payment Gateway (KPG-2 ePayment).
 *
 * Docs: https://docs.khalti.com/khalti-epayment/
 * Auth is `Authorization: Key <LIVE_SECRET_KEY>` and all amounts are in paisa
 * (1 NPR = 100 paisa).
 */

const khaltiSecretKey = process.env.KHALTI_SECRET_KEY?.trim();
const khaltiBaseUrl = (
  process.env.KHALTI_BASE_URL?.trim() || "https://dev.khalti.com/api/v2"
).replace(/\/+$/, "");

export class KhaltiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "KhaltiError";
    this.status = status;
  }
}

export interface KhaltiInitiatePayload {
  return_url: string;
  website_url: string;
  amount: number;
  purchase_order_id: string;
  purchase_order_name: string;
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

export interface KhaltiLookupResponse {
  pidx: string;
  total_amount: number;
  status: string;
  transaction_id: string | null;
  fee: number;
  refunded: boolean;
}

export function isKhaltiConfigured(): boolean {
  return Boolean(khaltiSecretKey);
}

/** Convert a price in NPR to the integer paisa amount Khalti expects. */
export function toPaisa(amountNpr: number): number {
  return Math.round(amountNpr * 100);
}

/** Khalti expects a 10-digit Nepali mobile number (e.g. 98XXXXXXXX). */
export function toKhaltiPhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

async function khaltiRequest<T>(path: string, body: unknown): Promise<T> {
  if (!khaltiSecretKey) {
    throw new KhaltiError(
      "Khalti is not configured. Set KHALTI_SECRET_KEY.",
      503,
    );
  }

  let response: Response;
  try {
    response = await fetch(`${khaltiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${khaltiSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    throw new KhaltiError(
      `Unable to reach Khalti: ${error instanceof Error ? error.message : "network error"}`,
    );
  }

  const data = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok) {
    const detail = data?.detail ?? data?.error_key;
    const message =
      typeof detail === "string"
        ? detail
        : `Khalti request failed with status ${response.status}`;
    throw new KhaltiError(message, response.status);
  }

  return data as T;
}

export function initiateKhaltiPayment(
  payload: KhaltiInitiatePayload,
): Promise<KhaltiInitiateResponse> {
  return khaltiRequest<KhaltiInitiateResponse>(
    "/epayment/initiate/",
    payload,
  );
}

export function lookupKhaltiPayment(
  pidx: string,
): Promise<KhaltiLookupResponse> {
  return khaltiRequest<KhaltiLookupResponse>("/epayment/lookup/", { pidx });
}
