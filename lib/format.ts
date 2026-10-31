// Shared formatting helpers. Used by every member.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 1234567.5 -> "₹12,34,567.50"
export function formatINR(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Number.isNaN(value) ? 0 : value);
}

// "2026-03-05" -> "05 Mar 2026"
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';

  // Plain dates like "2026-03-05": read the numbers directly (no timezone shifting)
  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (match) {
      const [, year, month, day] = match;
      return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
    }
  }

  // Timestamps like "2026-03-05T10:15:00Z": show them in Indian time
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';

  const parts = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')} ${MONTHS[Number(get('month')) - 1]} ${get('year')}`;
}