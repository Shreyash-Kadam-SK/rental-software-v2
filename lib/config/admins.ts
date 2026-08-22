export const ADMIN_EMAILS: string[] = [
  "kadam.shreyash.d@gmail.com",
];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}