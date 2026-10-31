import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { formatINR, formatDate } from '../../../../../lib/format';
import { StatusBadge } from '../../../../../components/ui/StatusBadge';
import { ToastProvider } from '../../../../../components/ui/Toast';
import { PayNow } from './PayNow';
import { PrintButton } from './PrintButton';

type Invoice = {
  id: string | number;
  number: string;
  status: string;
  display_status: string;
  days_overdue: number | string | null;
  subscription_number: string | null;
  period_start: string | null;
  period_end: string | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total: number | string;
  amount_paid: number | string;
  outstanding: number | string;
};

type Line = {
  id: string | number;
  description: string | null;
  quantity: number | string;
  unit_price: number | string;
  tax_percent: number | string;
  amount: number | string;
};

type Payment = {
  id: string | number;
  method: string;
  amount: number | string;
  payment_date: string | null;
  note: string | null;
};

function methodLabel(method: string): string {
  const text = method.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function PortalInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // RLS plus .eq('customer_id') means another customer's invoice simply is not found
  const { data, error } = await supabase
    .from('invoice_overview')
    .select('*')
    .eq('id', id)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error) {
    if (error.code === '22P02') notFound(); // not a valid id format
    throw new Error(error.message);
  }
  if (!data) notFound();

  const invoice = data as Invoice;

  const [linesRes, paymentsRes] = await Promise.all([
    supabase
      .from('invoice_lines')
      .select('id, description, quantity, unit_price, tax_percent, amount')
      .eq('invoice_id', invoice.id)
      .order('id'),
    supabase
      .from('payments')
      .select('id, method, amount, payment_date, note')
      .eq('invoice_id', invoice.id)
      .order('payment_date', { ascending: false }),
  ]);

  const firstError = [linesRes.error, paymentsRes.error].find(Boolean);
  if (firstError) throw new Error(firstError.message);

  const lines = (linesRes.data ?? []) as unknown as Line[];
  const payments = (paymentsRes.data ?? []) as unknown as Payment[];

  const outstanding = Number(invoice.outstanding ?? 0);
  const discount = Number(invoice.discount_amount ?? 0);
  const canPay = invoice.status === 'confirmed' && outstanding > 0;

  return (
    <ToastProvider>
      {/* Printing: hide the sidebar and other page chrome */}
      <style>{`
        @media print {
          aside, nav, header { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="min-h-full space-y-6 bg-gray-50 p-6 text-gray-900 print:bg-white print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/portal" className="text-sm text-indigo-600 hover:underline print:hidden">
              ← Back to my account
            </Link>
            <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold">
              Invoice {invoice.number}
              <StatusBadge status={invoice.display_status} />
            </h1>
            {invoice.display_status === 'overdue' && (
              <p className="mt-1 text-sm text-red-600">
                Overdue by {Number(invoice.days_overdue ?? 0)} days
              </p>
            )}
          </div>
          <div className="flex gap-2 print:hidden">
            <PrintButton />
          </div>
        </div>

        {/* Pay now (confirmed invoices that still have a balance) */}
        {canPay && <PayNow invoiceId={String(invoice.id)} amount={outstanding} />}

        {/* Details */}
        <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Subscription</p>
            <p className="font-medium">{invoice.subscription_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Billing period</p>
            <p className="font-medium">
              {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Issue date</p>
            <p className="font-medium">{formatDate(invoice.issue_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due date</p>
            <p className="font-medium">{formatDate(invoice.due_date)}</p>
          </div>
        </div>

        {/* Lines and totals */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Invoice lines</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-gray-500">No lines to show.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 text-right font-medium">Qty</th>
                    <th className="py-2 pr-3 text-right font-medium">Unit price</th>
                    <th className="py-2 pr-3 text-right font-medium">Tax</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-3">{line.description ?? '—'}</td>
                      <td className="py-2 pr-3 text-right">{Number(line.quantity)}</td>
                      <td className="py-2 pr-3 text-right">{formatINR(line.unit_price)}</td>
                      <td className="py-2 pr-3 text-right">{Number(line.tax_percent)}%</td>
                      <td className="py-2 text-right">{formatINR(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="ml-auto mt-6 w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd>{formatINR(invoice.subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Discount</dt>
                <dd>-{formatINR(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Tax</dt>
              <dd>{formatINR(invoice.tax_amount)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatINR(invoice.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Paid</dt>
              <dd>{formatINR(invoice.amount_paid)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Outstanding</dt>
              <dd className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>
                {formatINR(outstanding)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Payment history */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Payment history</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Method</th>
                    <th className="py-2 pr-3 font-medium">Note</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-3">{formatDate(p.payment_date)}</td>
                      <td className="py-2 pr-3">{methodLabel(p.method)}</td>
                      <td className="py-2 pr-3">{p.note || '—'}</td>
                      <td className="py-2 text-right">{formatINR(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}