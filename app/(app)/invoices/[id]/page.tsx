import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "../_components/db";
import { formatINR, formatDate } from "../_components/fmt";
import StatusBadge from "../_components/StatusBadge";
import InvoiceActions from "../_components/InvoiceActions";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getDb();

  const [inv, lines, pays] = await Promise.all([
    supabase.from("invoice_overview").select("*").eq("id", id).maybeSingle(),
    supabase.from("invoice_lines").select("*").eq("invoice_id", id),
    supabase.from("payments").select("*").eq("invoice_id", id).order("payment_date", { ascending: false }),
  ]);

  if (inv.error) throw new Error(inv.error.message);
  if (!inv.data) notFound();
  const i: any = inv.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <style>{`@media print { aside, nav, header { display: none !important; } body { background: white; } }`}</style>

      <Link href="/invoices" className="text-sm text-indigo-600 print:hidden">&larr; Back to invoices</Link>

      <div className="hidden print:block">
        <h1 className="text-3xl font-bold">Brightloop Software</h1>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice {i.number}</h2>
          <p className="text-sm text-gray-600">Customer: {i.customer_name}</p>
          <p className="text-sm text-gray-600">Subscription: {i.subscription_number}</p>
          <p className="text-sm text-gray-600">Issued {formatDate(i.issue_date)} - Due {formatDate(i.due_date)}</p>
        </div>
        <StatusBadge status={i.display_status} />
      </div>

      <InvoiceActions id={i.id} status={i.status} amountPaid={Number(i.amount_paid)} outstanding={Number(i.outstanding)} sentAt={i.sent_at} />

      <table className="w-full rounded border bg-white text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr><th className="p-3">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit price</th><th className="p-3 text-right">Tax %</th><th className="p-3 text-right">Amount</th></tr>
        </thead>
        <tbody>
          {(lines.data ?? []).map((l: any) => (
            <tr key={l.id} className="border-t">
              <td className="p-3">{l.description}</td>
              <td className="p-3 text-right">{l.quantity}</td>
              <td className="p-3 text-right">{formatINR(l.unit_price)}</td>
              <td className="p-3 text-right">{l.tax_percent}%</td>
              <td className="p-3 text-right">{formatINR(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-72 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(i.subtotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>- {formatINR(i.discount_amount)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatINR(i.tax_amount)}</span></div>
        <div className="flex justify-between border-t pt-1 font-bold"><span>Total</span><span>{formatINR(i.total)}</span></div>
        <div className="flex justify-between"><span>Amount paid</span><span>{formatINR(i.amount_paid)}</span></div>
        <div className="flex justify-between font-semibold"><span>Outstanding</span><span>{formatINR(i.outstanding)}</span></div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Payment history</h3>
        <table className="w-full rounded border bg-white text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr><th className="p-3">Date</th><th className="p-3">Method</th><th className="p-3 text-right">Amount</th><th className="p-3">Note</th></tr>
          </thead>
          <tbody>
            {(pays.data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{formatDate(p.payment_date)}</td>
                <td className="p-3">{String(p.method).replace("_", " ")}</td>
                <td className="p-3 text-right">{formatINR(p.amount)}</td>
                <td className="p-3">{p.note ?? "-"}</td>
              </tr>
            ))}
            {(pays.data ?? []).length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No payments yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}