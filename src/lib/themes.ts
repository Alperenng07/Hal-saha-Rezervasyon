export const THEME_OPTIONS = [
  { id: "emerald", label: "Zümrüt", color: "#059669" },
  { id: "blue", label: "Mavi", color: "#2563eb" },
  { id: "violet", label: "Mor", color: "#7c3aed" },
  { id: "orange", label: "Turuncu", color: "#ea580c" },
  { id: "rose", label: "Gül", color: "#e11d48" },
  { id: "cyan", label: "Turkuaz", color: "#0891b2" },
] as const;

export type ThemeId = (typeof THEME_OPTIONS)[number]["id"];

const VALID_THEMES = new Set<string>(THEME_OPTIONS.map((t) => t.id));

export function isValidTheme(id: string | null | undefined): id is ThemeId {
  return !!id && VALID_THEMES.has(id);
}

export function getThemeClass(id: string | null | undefined): string {
  return isValidTheme(id) ? `theme-${id}` : "theme-emerald";
}
