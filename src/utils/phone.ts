/**
 * Every customer phone number is stored/sent as "+91XXXXXXXXXX" (see
 * backend app/core/phone.py). These helpers keep the "+91" prefix and
 * 10-digit restriction in one place rather than repeated per form.
 */
export const PHONE_DIGIT_LENGTH = 10;

/** Strips everything but digits and caps at 10 — use on every keystroke. */
export function sanitizePhoneDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, PHONE_DIGIT_LENGTH);
}

/** Bare 10 digits -> canonical "+91XXXXXXXXXX" for sending to the API. */
export function toE164(digits: string): string {
  return `+91${sanitizePhoneDigits(digits)}`;
}

/** "+91XXXXXXXXXX" (or a legacy bare 10-digit value) -> bare 10 digits,
 * for pre-filling an input from a value that came back from the API. */
export function digitsFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > PHONE_DIGIT_LENGTH ? digits.slice(-PHONE_DIGIT_LENGTH) : digits;
}

/** "+91XXXXXXXXXX" -> "+91 98765 43210", for read-only display. */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = digitsFromPhone(phone);
  if (digits.length !== PHONE_DIGIT_LENGTH) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
