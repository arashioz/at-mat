export const PHONE_REGEX = /^(09\d{9}|\+989\d{9})$/;

export function normalizePhone(phone: string): string {
  const cleaned = phone.trim();
  return cleaned.startsWith('+98') ? `0${cleaned.slice(3)}` : cleaned;
}

export function isEmailIdentifier(value: string): boolean {
  return value.includes('@');
}
