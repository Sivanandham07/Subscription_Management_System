// A small colored pill. Works in both server and client components.

const STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  quotation: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-slate-200 text-slate-700',
  paid: 'bg-green-100 text-green-700',
  partially_paid: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
  paused: 'bg-amber-100 text-amber-800',
};

const FALLBACK_STYLE = 'bg-gray-100 text-gray-700';

// "partially_paid" -> "Partially paid"
function toLabel(status: string): string {
  const text = status.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status ?? '').trim().toLowerCase();
  if (!key) return <span className="text-gray-400">—</span>;

  const style = STYLES[key] ?? FALLBACK_STYLE;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {toLabel(key)}
    </span>
  );
}