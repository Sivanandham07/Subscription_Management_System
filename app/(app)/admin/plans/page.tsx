import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import { formatINR, formatDate } from "../../../../lib/format";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import PlanActions from "./PlanActions";

const PAGE_SIZE = 25;

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("plans")
    .select(
      "id, name, price, billing_period, min_quantity, start_date, end_date, allow_close, allow_pause, status",
      { count: "exact" }
    )
    .order("name")
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <Link
          href="/admin/plans/new"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add plan
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 font-medium">Min qty</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No plans yet.
                </td>
              </tr>
            )}
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-700">{formatINR(Number(p.price))}</td>
                <td className="px-4 py-3 text-gray-700 capitalize">{p.billing_period}</td>
                <td className="px-4 py-3 text-gray-700">{p.min_quantity}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(p.start_date)}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(p.end_date)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/plans/${p.id}`}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    <PlanActions
                      id={p.id}
                      status={p.status}
                      allowPause={p.allow_pause}
                      allowClose={p.allow_close}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>
          Page {current} of {totalPages}
        </span>
        <div className="flex gap-2">
          {current > 1 && (
            <Link
              href={`/admin/plans?page=${current - 1}`}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {current < totalPages && (
            <Link
              href={`/admin/plans?page=${current + 1}`}
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