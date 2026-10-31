import Link from "next/link";
import { getDb } from "../invoices/_components/db";
import { formatINR, formatDate } from "../invoices/_components/fmt";

const PAGE_SIZE = 25;
type SP = { page?: string; q?: string; method?: string; from?: string; to?: string };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = await getDb();

  // search by invoice number: find matching invoice ids first
  let ids: string[] | null = null;
  if (sp.q) {
    const q = sp.q.replace(/[,()%]/g, "");
    const { data } = await supabase.from("invoices").select("id").ilike("number", `%${q}%`).limit(1000);
    ids = (data ?? []).map((x: any) => x.id);
  }

  function applyFilters(query: any) {
    if (sp.method) query = query.eq("method", sp.method);
    if (sp.from) query = query.gte("payment_date", sp.from);
    if (sp.to) query = query.lte("payment_date", sp.to);
    if (ids) query = query.in("invoice_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    return query;
  }

  const listQuery = applyFilters(
    supabase
      .from("payments")
      .select("id, method, amount, payment_date, note, invoice_id, invoices(number, profiles!customer_id(full_name))", { count: "exact" })
      .order("payment_date", { ascending: false })
      .range(from, to)
  );
  const sumQuery = applyFilters(supabase.from("payments").select("amount.sum()"));

  const [list, sum] = await Promise.all([listQuery, sumQuery]);
  if (list.error) throw new Error(list.error.message);

  const rows: any[] = list.data ?? [];
  const count = list.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const total = sum.error ? null : (sum.data as any)?.[0]?.sum ?? 0;

  function pageLink(p: number) {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => { if (v && k !== "page") params.set(k, v); });
    params.set("page", String(p));
    return `/payments?${params.toString()}`;
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <div className="rounded border bg-white p-4">
        <div className="text-xs uppercase text-gray-500">Total of filtered payments</div>
        <div className="text-2xl font-semibold">{total === null ? "-" : formatINR(total)}</div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2 rounded border bg-white p-3">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Invoice number" className="rounded border px-2 py-1" />
        <select name="method" defaultValue={sp.method ?? ""} className="rounded border px-2 py-1">
          <option value="">All methods</option>
          {["cash", "card", "upi", "bank_transfer", "cheque"].map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
        </select>
        <label className="text-xs">From <input type="date" name="from" defaultValue={sp.from ?? ""} className="rounded border px-2 py-1" /></label>
        <label className="text-xs">To <input type="date" name="to" defaultValue={sp.to ?? ""} className="rounded border px-2 py-1" /></label>
        <button className="rounded bg-gray-800 px-3 py-1 text-white">Filter</button>
        <Link href="/payments" className="px-2 py-1 text-sm text-gray-600 underline">Reset</Link>
      </form>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr><th className="p-3">Date</th><th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3">Method</th><th className="p-3 text-right">Amount</th><th className="p-3">Note</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{formatDate(p.payment_date)}</td>
                <td className="p-3"><Link href={`/invoices/${p.invoice_id}`} className="text-indigo-600 underline">{p.invoices?.number}</Link></td>
                <td className="p-3">{p.invoices?.profiles?.full_name ?? "-"}</td>
                <td className="p-3">{String(p.method).replace("_", " ")}</td>
                <td className="p-3 text-right">{formatINR(p.amount)}</td>
                <td className="p-3">{p.note ?? "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No payments found</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>{count} payments - page {page} of {totalPages}</span>
        <div className="space-x-2">
          {page > 1 && <Link href={pageLink(page - 1)} className="rounded border px-3 py-1">Previous</Link>}
          {page < totalPages && <Link href={pageLink(page + 1)} className="rounded border px-3 py-1">Next</Link>}
        </div>
      </div>
    </div>
  );
}