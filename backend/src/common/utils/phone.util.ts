export const PHONE_REGEX = /^(09\d{9}|\+989\d{9})$/;

export function toAsciiDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}

export function normalizePhone(phone: string): string {
  const cleaned = toAsciiDigits(phone).replace(/[\s()-]/g, '');
  return cleaned.startsWith('+98') ? `0${cleaned.slice(3)}` : cleaned;
}

export function isEmailIdentifier(value: string): boolean {
  return value.includes('@');
}
