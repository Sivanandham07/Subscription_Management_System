import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import { formatINR, formatDate } from "../../../../lib/format";

const PAGE_SIZE = 25;

function productName(rel: unknown): string {
  const item = Array.isArray(rel) ? rel[0] : rel;
  if (item && typeof item === "object" && "name" in item) {
    return String((item as { name: unknown }).name);
  }
  return "-";
}

type DiscountRow = {
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  times_used: number;
};

function getStatus(d: DiscountRow, today: string): string {
  if (!d.active) return "Inactive";
  if (d.start_date && d.start_date.slice(0, 10) > today) return "Not started";
  if (d.end_date && d.end_date.slice(0, 10) < today) return "Expired";
  if (d.usage_limit !== null && d.times_used >= d.usage_limit) return "Exhausted";
  return "Active";
}

function StatusPill({ label }: { label: string }) {
  const styles: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    Expired: "bg-gray-200 text-gray-700",
    Exhausted: "bg-red-100 text-red-700",
    "Not started": "bg-blue-100 text-blue-700",
    Inactive: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${styles[label] ?? "bg-gray-100 text-gray-700"}`}>
      {label}
    </span>
  );
}

export default async function DiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("discounts")
    .select(
      "id, name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, times_used, applies_to, active, products(name)",
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
          <h1 className="text-2xl font-semibold text-gray-900">Discounts</h1>
          <p className="text-sm text-gray-500">
            {total} total. Discounts are applied automatically when invoices are generated.
          </p>
        </div>
        <Link
          href="/admin/discounts/new"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add discount
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Applies to</th>
              <th className="px-4 py-3 font-medium">Valid</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No discounts yet.
                </td>
              </tr>
            )}
            {(data ?? []).map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 text-gray-900">{d.name}</td>
                <td className="px-4 py-3 text-gray-700">
                  {d.type === "percent" ? `${Number(d.value)}%` : formatINR(Number(d.value))}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {d.applies_to === "product"
                    ? `Product: ${productName(d.products)}`
                    : "Whole subscription"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatDate(d.start_date)} to {formatDate(d.end_date)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {d.usage_limit !== null
                    ? `used ${d.times_used} of ${d.usage_limit}`
                    : `used ${d.times_used} (no limit)`}
                </td>
                <td className="px-4 py-3">
                  <StatusPill
                    label={getStatus(
                      {
                        active: d.active,
                        start_date: d.start_date,
                        end_date: d.end_date,
                        usage_limit: d.usage_limit,
                        times_used: d.times_used ?? 0,
                      },
                      today
                    )}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/discounts/${d.id}`}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Edit
                  </Link>
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
              href={`/admin/discounts?page=${current - 1}`}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {current < totalPages && (
            <Link
              href={`/admin/discounts?page=${current + 1}`}
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