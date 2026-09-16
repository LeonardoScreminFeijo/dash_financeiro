export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase("en-US");
}

export function getAuthorizedEmails(
  value = process.env.AUTHORIZED_EMAILS,
): ReadonlySet<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

export function isAuthorizedEmail(
  email: string | null | undefined,
  value = process.env.AUTHORIZED_EMAILS,
): boolean {
  if (!email) return false;
  return getAuthorizedEmails(value).has(normalizeEmail(email));
}
