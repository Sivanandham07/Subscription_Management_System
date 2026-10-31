import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { formatINR, formatDate } from '../../../lib/format';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Pagination } from '../../../components/ui/Pagination';

type SubscriptionRow = {
  id: string | number;
  number: string;
  status: string;
  next_billing_date: string | null;
  expiry_date: string | null;
  plans: { name: string } | { name: string }[] | null;
};

type InvoiceRow = {
  id: string | number;
  number: string;
  due_date: string | null;
  total: number | string;
  outstanding: number | string;
  display_status: string;
};

const PAGE_SIZE = 25;

function planName(plans: SubscriptionRow['plans']): string {
  if (!plans) return '—';
  return Array.isArray(plans) ? (plans[0]?.name ?? '—') : plans.name;
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // The user's own session, so RLS already limits every query to this customer
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, subsRes, invoicesRes, unpaidRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('id, number, status, next_billing_date, expiry_date, plans(name)', { count: 'exact' })
      .eq('customer_id', user.id) // second safety on top of RLS
      .order('start_date', { ascending: false })
      .limit(25),
    supabase
      .from('invoice_overview')
      .select('id, number, due_date, total, outstanding, display_status', { count: 'exact' })
      .eq('customer_id', user.id) // second safety on top of RLS
      .order('issue_date', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to),
    // Only this customer's UNPAID invoices (a small list), used for the balance
    supabase
      .from('invoice_overview')
      .select('outstanding')
      .eq('customer_id', user.id)
      .in('display_status', ['confirmed', 'partially_paid', 'overdue'])
      .limit(1000),
  ]);

  const firstError = [profileRes.error, subsRes.error, invoicesRes.error, unpaidRes.error].find(Boolean);
  if (firstError) throw new Error(firstError.message);

  const name = profileRes.data?.full_name || user.email || 'there';
  const subscriptions = (subsRes.data ?? []) as unknown as SubscriptionRow[];
  const subsTotal = subsRes.count ?? subscriptions.length;
  const invoices = (invoicesRes.data ?? []) as unknown as InvoiceRow[];
  const invoicesTotal = invoicesRes.count ?? 0;

  const unpaid = (unpaidRes.data ?? []) as { outstanding: number | string }[];
  const balance = unpaid.reduce((sum, row) => sum + Number(row.outstanding ?? 0), 0);

  return (
    <div className="min-h-full space-y-6 bg-gray-50 p-6 text-gray-900">
      {/* Welcome */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:flex md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-bold">{name}</h1>
        </div>
        <div className="mt-4 md:mt-0 md:text-right">
          <p className="text-sm text-gray-500">Outstanding balance</p>
          <p className={`text-3xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatINR(balance)}
          </p>
          <p className="text-xs text-gray-500">
            {unpaid.length} unpaid invoice{unpaid.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* My subscriptions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">My subscriptions</h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-gray-500">You have no subscriptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 pr-3 font-medium">Subscription</th>
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Next billing</th>
                  <th className="py-2 font-medium">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-3 font-medium">{s.number}</td>
                    <td className="py-2 pr-3">{planName(s.plans)}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-2 pr-3">{formatDate(s.next_billing_date)}</td>
                    <td className="py-2">{formatDate(s.expiry_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {subsTotal > subscriptions.length && (
          <p className="mt-3 text-xs text-gray-500">
            Showing the latest {subscriptions.length} of {subsTotal.toLocaleString('en-IN')} subscriptions.
          </p>
        )}
      </div>

      {/* My invoices */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">My invoices</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500">You have no invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 pr-3 font-medium">Invoice</th>
                  <th className="py-2 pr-3 font-medium">Due date</th>
                  <th className="py-2 pr-3 text-right font-medium">Total</th>
                  <th className="py-2 pr-3 text-right font-medium">Outstanding</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-3">
                      <Link href={`/portal/invoices/${inv.id}`} className="text-indigo-600 hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{formatDate(inv.due_date)}</td>
                    <td className="py-2 pr-3 text-right">{formatINR(inv.total)}</td>
                    <td className="py-2 pr-3 text-right">{formatINR(inv.outstanding)}</td>
                    <td className="py-2">
                      <StatusBadge status={inv.display_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={invoicesTotal} basePath="/portal" searchParams={sp} />
      </div>
    </div>
  );
}