export const SUBSCRIPTION_STATUSES = [
  "draft",
  "quotation",
  "confirmed",
  "active",
  "closed",
] as const;

// Supabase returns a joined row either as an object or as a 1-item array.
// This reads one field from it safely.
export function relField(rel: unknown, field: string): string {
  const item = Array.isArray(rel) ? rel[0] : rel;
  if (item && typeof item === "object" && field in item) {
    const v = (item as Record<string, unknown>)[field];
    return v === null || v === undefined ? "-" : String(v);
  }
  return "-";
}