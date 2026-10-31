import Link from 'next/link';
import { formatINR, formatDate } from '../../../lib/format';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ToastProvider } from '../../../components/ui/Toast';
import { RevenueChart } from './RevenueChart';
import { ReminderButton } from './ReminderButton';
import { createClient } from '../../../lib/supabase/server';


type Summary = {
  active_subscriptions: number | string | null;
  mrr: number | string | null;
  revenue_collected: number | string | null;
  outstanding: number | string | null;
  overdue_count: number | string | null;
  overdue_amount: number | string | null;
  paid_invoices: number | string | null;
};

type OverdueRow = {
  id: string | number;
  number: string;
  customer_name: string | null;
  outstanding: number | string;
  days_overdue: number | string;
};

const STATUSES = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------- small date helpers (all dates are "YYYY-MM-DD" text) ----------
function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// "2026-05-01" -> "May 26"
function monthLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${MONTHS[Number(match[2]) - 1]} ${match[1].slice(2)}`;
}

function count(value: number | string | null | undefined): string {
  return Number(value ?? 0).toLocaleString('en-IN');
}

// ---------- one summary card ----------
function StatCard({
  title,
  value,
  sub,
  href,
}: {
  title: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </>
  );
  const base = 'block rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

  if (href) {
    return (
      <Link href={href} className={`${base} transition hover:border-indigo-400 hover:shadow`}>
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;

  // Date range: default is the current month
  const today = todayIST();
  const year = today.slice(0, 4);
  const month = today.slice(5, 7);
  const lastDay = String(lastDayOfMonth(Number(year), Number(month))).padStart(2, '0');

  let from = isDate(sp.from) ? sp.from : `${year}-${month}-01`;
  let to = isDate(sp.to) ? sp.to : `${year}-${month}-${lastDay}`;
  if (from > to) [from, to] = [to, from];

  const supabase = await createClient();

  // Subscriptions by status: head:true means "only count, send no rows"
  const countsPromise = Promise.all(
    STATUSES.map((s) =>
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', s)
    )
  );

  // All queries run at the same time
  const [summaryRes, monthlyRes, overdueRes, countResults] = await Promise.all([
    supabase.rpc('dashboard_summary', { p_from: from, p_to: to }),
    supabase.rpc('monthly_revenue', { p_months: 6 }),
    supabase
      .from('overdue_invoices')
      .select('id, number, customer_name, outstanding, days_overdue')
      .order('days_overdue', { ascending: false })
      .limit(10),
    countsPromise,
  ]);

  const firstError = [
    summaryRes.error,
    monthlyRes.error,
    overdueRes.error,
    ...countResults.map((r) => r.error),
  ].find(Boolean);
  if (firstError) throw new Error(firstError.message);

  const rawSummary = Array.isArray(summaryRes.data) ? summaryRes.data[0] : summaryRes.data;
  const summary = (rawSummary ?? {}) as Summary;

  const revenueData = ((monthlyRes.data ?? []) as { month: string; revenue: number | string }[])
    .slice()
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((r) => ({ label: monthLabel(String(r.month)), revenue: Number(r.revenue) }));

  const overdue = (overdueRes.data ?? []) as OverdueRow[];
  const statusCounts = STATUSES.map((s, i) => ({ status: s, count: countResults[i].count ?? 0 }));

  const quickLink =
    'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50';

  return (
    // TODO: remove this ToastProvider once Member B adds one in app/(app)/layout.tsx (having both is harmless)
    <ToastProvider>
      <div className="space-y-6 bg-gray-50 p-6 text-gray-900">
        <div>
          <h1 className="text-2xl font-bold">Finance dashboard</h1>
          <p className="text-sm text-gray-500">
            {formatDate(from)} – {formatDate(to)}
          </p>
        </div>

        {/* Date filter */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row md:items-end md:justify-between">
          <form action="/dashboard" method="get" className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">From</span>
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">To</span>
              <input
                type="date"
                name="to"
                defaultValue={to}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Apply
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className={quickLink}>
              This month
            </Link>
            <Link href={`/dashboard?from=${addDays(today, -29)}&to=${today}`} className={quickLink}>
              Last 30 days
            </Link>
            <Link href={`/dashboard?from=${year}-01-01&to=${year}-12-31`} className={quickLink}>
              This year
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active subscriptions"
            value={count(summary.active_subscriptions)}
            href="/subscriptions?status=active"
          />
          <StatCard
            title="MRR"
            value={formatINR(summary.mrr)}
            sub="Monthly recurring revenue"
          />
          <StatCard
            title="Revenue collected"
            value={formatINR(summary.revenue_collected)}
            sub={`${formatDate(from)} – ${formatDate(to)}`}
          />
          <StatCard
            title="Outstanding"
            value={formatINR(summary.outstanding)}
            href="/invoices?status=confirmed"
          />
          <StatCard
            title="Overdue invoices"
            value={count(summary.overdue_count)}
            sub={`${formatINR(summary.overdue_amount)} overdue`}
            href="/invoices?status=overdue"
          />
          <StatCard
            title="Paid invoices"
            value={count(summary.paid_invoices)}
            href="/invoices?status=paid"
          />
        </div>

        {/* Revenue chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Revenue, last 6 months</h2>
          <RevenueChart data={revenueData} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Overdue table */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Most overdue invoices</h2>
              <Link href="/invoices?status=overdue" className="text-sm text-indigo-600 hover:underline">
                View all
              </Link>
            </div>

            {overdue.length === 0 ? (
              <p className="text-sm text-gray-500">No overdue invoices.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-2 pr-3 font-medium">Customer</th>
                      <th className="py-2 pr-3 font-medium">Invoice</th>
                      <th className="py-2 pr-3 text-right font-medium">Outstanding</th>
                      <th className="py-2 pr-3 text-right font-medium">Days overdue</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {overdue.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-3">{row.customer_name ?? '—'}</td>
                        <td className="py-2 pr-3">
                          <Link href={`/invoices/${row.id}`} className="text-indigo-600 hover:underline">
                            {row.number}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 text-right">{formatINR(row.outstanding)}</td>
                        <td className="py-2 pr-3 text-right text-red-600">
                          {Number(row.days_overdue)} days
                        </td>
                        <td className="py-2 text-right">
                          <ReminderButton
                            customerName={row.customer_name ?? 'customer'}
                            invoiceNumber={row.number}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Subscriptions by status */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Subscriptions by status</h2>
            <ul className="space-y-2">
              {statusCounts.map((item) => (
                <li key={item.status}>
                  <Link
                    href={`/subscriptions?status=${item.status}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50"
                  >
                    <StatusBadge status={item.status} />
                    <span className="text-sm font-medium">{item.count.toLocaleString('en-IN')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}