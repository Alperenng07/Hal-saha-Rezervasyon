export const RESERVED_TENANT_SLUGS = new Set([
  "platform",
  "api",
  "auth",
  "login",
  "register",
  "admin",
  "_next",
]);

export function slugifyTenantName(name: string): string {
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };

  return name
    .trim()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidTenantSlug(slug: string): boolean {
  if (!slug || slug.length < 2 || slug.length > 48) return false;
  if (RESERVED_TENANT_SLUGS.has(slug)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function tenantPaths(slug: string) {
  const base = `/${slug}`;
  return {
    site: base,
    admin: `${base}/admin`,
    login: `${base}/login`,
    settings: `${base}/admin/settings`,
    calendar: `${base}/admin/calendar`,
    bookings: `${base}/admin/bookings`,
    subscriptions: `${base}/admin/subscriptions`,
    pitches: `${base}/admin/pitches`,
  };
}
