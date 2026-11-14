import type { Session } from './types';
export async function kitchenApi<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api/kitchen/${path}`, {
    method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(45000),
    headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = typeof data.message === 'string' ? data.message : 'اطلاعات واردشده معتبر نیست. دوباره بررسی کن.';
    throw new Error(message);
  }
  return data as T;
}
let openingSession: Promise<Session> | undefined;
export function ensureSession() {
  openingSession ??= kitchenApi<Session>('session', 'POST', {}).finally(() => { openingSession = undefined; });
  return openingSession;
}
export const draftKey = (id: string) => `atmat-kitchen-draft:${id}`;
export const errorText = (error: unknown) => error instanceof Error ? error.name === 'TimeoutError' ? 'پاسخ کمی طول کشید؛ دوباره تلاش کن.' : error.message : 'مشکلی پیش آمد؛ دوباره امتحان کن.';
