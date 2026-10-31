export function formatINR(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n ?? 0));
}
export function formatDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}