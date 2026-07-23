export const ADMIN_PHONES: string[] = ["+919307736350"];

export function isAdminPhone(phone: string): boolean {
  const normalized = phone.replace(/\D/g, "").slice(-10);
  return ADMIN_PHONES.some(p => p.replace(/\D/g, "").slice(-10) === normalized);
}