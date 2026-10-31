import Link from "next/link";
import { getDb } from "./_components/db";
import { formatINR, formatDate } from "./_components/fmt";
import StatusBadge from "./_components/StatusBadge";
import GenerateButton from "./_components/GenerateButton";
import ReminderButton from "./_components/ReminderButton";
import ClickRow from "./_components/ClickRow";

const PAGE_SIZE = 25;
const STATUSES = ["draft", "confirmed", "partially_paid", "overdue", "paid", "cancelled"];

type SP = { page?: string; q?: string; status?: string; subscription?: string; from?: string; to?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = await getDb();

  let query = supabase
    .from("invoice_overview")
    .select("*", { count: "exact" })
    .order("issue_date", { ascending: false })
    .order("number", { ascending: false })
    .range(from, to);

  if (sp.status) query = query.eq("display_status", sp.status);
  if (sp.subscription) query = query.eq("subscription_id", sp.subscription);
  if (sp.from) query = query.gte("issue_date", sp.from);
  if (sp.to) query = query.lte("issue_date", sp.to);
  if (sp.q) {
    const q = sp.q.replace(/[,()%]/g, "");
    query = query.or(`number.ilike.%${q}%,customer_name.ilike.%${q}%`);
  }

  const countQueries = STATUSES.map((s) =>
    supabase.from("invoice_overview").select("id", { count: "exact", head: true }).eq("display_status", s)
  );
  const [{ data, count, error }, ...counts] = await Promise.all([query, ...countQueries]);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const showOverdue = sp.status === "overdue";

  function pageLink(p: number) {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => { if (v && k !== "page") params.set(k, v); });
    params.set("page", String(p));
    return `/invoices?${params.toString()}`;
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <GenerateButton />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {STATUSES.map((s, i) => (
          <Link key={s} href={`/invoices?status=${s}`} className="rounded border bg-white p-3 hover:bg-gray-50">
            <StatusBadge status={s} />
            <div className="mt-1 text-xl font-semibold">{counts[i].count ?? 0}</div>
          </Link>
        ))}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2 rounded border bg-white p-3">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Invoice no. or customer" className="rounded border px-2 py-1" />
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border px-2 py-1">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <label className="text-xs">From <input type="date" name="from" defaultValue={sp.from ?? ""} className="rounded border px-2 py-1" /></label>
        <label className="text-xs">To <input type="date" name="to" defaultValue={sp.to ?? ""} className="rounded border px-2 py-1" /></label>
        {sp.subscription && <input type="hidden" name="subscription" value={sp.subscription} />}
        <button className="rounded bg-gray-800 px-3 py-1 text-white">Filter</button>
        <Link href="/invoices" className="px-2 py-1 text-sm text-gray-600 underline">Reset</Link>
      </form>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3">Subscription</th>
              <th className="p-3">Issue</th><th className="p-3">Due</th><th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Paid</th><th className="p-3 text-right">Outstanding</th>
              <th className="p-3">Status</th>
              {showOverdue && <th className="p-3">Days overdue</th>}
              {showOverdue && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <ClickRow key={r.id} href={`/invoices/${r.id}`}>
                <td className="p-3 font-medium">{r.number}</td>
                <td className="p-3">{r.customer_name}</td>
                <td className="p-3">{r.subscription_number}</td>
                <td className="p-3">{formatDate(r.issue_date)}</td>
                <td className="p-3">{formatDate(r.due_date)}</td>
                <td className="p-3 text-right">{formatINR(r.total)}</td>
                <td className="p-3 text-right">{formatINR(r.amount_paid)}</td>
                <td className="p-3 text-right">{formatINR(r.outstanding)}</td>
                <td className="p-3"><StatusBadge status={r.display_status} /></td>
                {showOverdue && <td className="p-3 text-red-600">{r.days_overdue}</td>}
                {showOverdue && <td className="p-3"><ReminderButton id={r.id} /></td>}
              </ClickRow>
            ))}
            {rows.length === 0 && <tr><td colSpan={11} className="p-6 text-center text-gray-500">No invoices found</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>{count ?? 0} invoices - page {page} of {totalPages}</span>
        <div className="space-x-2">
          {page > 1 && <Link href={pageLink(page - 1)} className="rounded border px-3 py-1">Previous</Link>}
          {page < totalPages && <Link href={pageLink(page + 1)} className="rounded border px-3 py-1">Next</Link>}
        </div>
      </div>
    </div>
  );
}