// TEMPORARY: replace with formatINR from lib/format.ts once Member A's code is merged.
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}
