export const ADMIN_EMAILS: string[] = [
  "kadam.shreyash.d@gmail.com", // ← replace with the real admin email
];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}