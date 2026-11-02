export const TOKEN_KEY = 'at_mat_access_token';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export type Role =
  | 'super_admin'
  | 'admin'
  | 'sales_manager'
  | 'marketer'
  | 'driver'
  | 'distribution_agent';

export interface AuthUser {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: Role;
  isActive: boolean;
}

export interface FeatureFlag {
  _id: string;
  key: string;
  label: string;
  group: string;
  description: string;
  enabled: boolean;
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'سوپر ادمین',
  admin: 'ادمین',
  sales_manager: 'مدیر فروش',
  marketer: 'بازاریاب',
  driver: 'راننده پخش',
  distribution_agent: 'عامل پخش',
};

export async function login(
  identifier: string,
  password: string,
): Promise<{ accessToken: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message.join('، ') : data.message;
    throw new Error(message ?? 'خطا در ورود');
  }
  return data;
}

export async function apiFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message.join('، ') : data.message;
    throw new Error(message ?? 'خطا در درخواست');
  }
  return data as T;
}

export interface Customer {
  _id: string;
  name: string;
  type: string;
  phone: string;
  city?: string;
  address?: string;
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category?: string;
  unit: string;
  price: number;
  stockQuantity: number;
  shelfLifeDays?: number;
  isActive: boolean;
}

export function fetchMe(token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', token);
}

export function fetchMyFeatures(token: string): Promise<Record<string, boolean>> {
  return apiFetch<Record<string, boolean>>('/features/me', token);
}

export function fetchAllFeatures(token: string): Promise<FeatureFlag[]> {
  return apiFetch<FeatureFlag[]>('/features', token);
}

export function setFeatureEnabled(token: string, key: string, enabled: boolean): Promise<FeatureFlag> {
  return apiFetch<FeatureFlag>(`/features/${encodeURIComponent(key)}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}
