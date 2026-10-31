import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";

const PAGE_SIZE = 25;

function relName(rel: unknown): string {
  const item = Array.isArray(rel) ? rel[0] : rel;
  if (item && typeof item === "object" && "name" in item) {
    return String((item as { name: unknown }).name);
  }
  return "-";
}

function lineCount(rel: unknown): number {
  const item = Array.isArray(rel) ? rel[0] : rel;
  if (item && typeof item === "object" && "count" in item) {
    return Number((item as { count: unknown }).count) || 0;
  }
  return 0;
}

export default async function TemplatesPage({
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
    .from("quotation_templates")
    .select("id, name, validity_days, plans(name), template_lines(count)", {
      count: "exact",
    })
    .order("name")
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quotation templates</h1>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <Link
          href="/admin/templates/new"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add template
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Validity</th>
              <th className="px-4 py-3 font-medium">Lines</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No templates yet.
                </td>
              </tr>
            )}
            {(data ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-700">{relName(t.plans)}</td>
                <td className="px-4 py-3 text-gray-700">{t.validity_days} days</td>
                <td className="px-4 py-3 text-gray-700">{lineCount(t.template_lines)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/templates/${t.id}`}
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
              href={`/admin/templates?page=${current - 1}`}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {current < totalPages && (
            <Link
              href={`/admin/templates?page=${current + 1}`}
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