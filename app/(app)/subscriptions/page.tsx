import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { formatDate } from "../../../lib/format";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import SubscriptionFilters from "./SubscriptionFilters";
import { SUBSCRIPTION_STATUSES, relField } from "./helpers";

const PAGE_SIZE = 25;

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { page, q, status } = await searchParams;
  const search = (q ?? "").trim();
  const statusFilter = (SUBSCRIPTION_STATUSES as readonly string[]).includes(
    status ?? ""
  )
    ? (status as string)
    : "";

  const current = Math.max(1, Number(page) || 1);
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("subscriptions")
    .select(
      "id, number, start_date, expiry_date, status, next_billing_date, customer:profiles!customer_id(full_name), plan:plans!plan_id(name)",
      { count: "exact" }
    )
    .order("number", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("number", `%${search}%`);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(p));
    return `/subscriptions?${params.toString()}`;
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500">
            {total.toLocaleString("en-IN")} total
          </p>
        </div>
        <Link
          href="/subscriptions/new"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New subscription
        </Link>
      </div>

      <div className="mb-4">
        <SubscriptionFilters initialQ={search} initialStatus={statusFilter} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Number</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next billing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No subscriptions found.
                </td>
              </tr>
            )}
            {(data ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/subscriptions/${s.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {s.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {relField(s.customer, "full_name")}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {relField(s.plan, "name")}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatDate(s.start_date)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatDate(s.expiry_date)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatDate(s.next_billing_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>
          Page {current} of {totalPages.toLocaleString("en-IN")}
        </span>
        <div className="flex gap-2">
          {current > 1 && (
            <Link
              href={pageHref(current - 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {current < totalPages && (
            <Link
              href={pageHref(current + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}