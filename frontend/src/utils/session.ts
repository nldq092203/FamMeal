import type { User } from '@/types';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getStoredFamilyId(): string | null {
  return localStorage.getItem('familyId');
}

export function setStoredFamilyId(familyId: string) {
  localStorage.setItem('familyId', familyId);
}
