import Link from "next/link";
import { createAdminClient } from "../../../../lib/supabase/admin"; // TODO-AUTH: switch to server createClient()
import TaxEditor from "./TaxEditor";
import DeleteTaxButton from "./DeleteTaxButton";

const PAGE_SIZE = 25;

export default async function TaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const from = (current - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createAdminClient(); // TODO-AUTH: switch to server createClient()
  const { data, count, error } = await supabase
    .from("taxes")
    .select("id, name, percentage", { count: "exact" })
    .order("name")
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Taxes</h1>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <TaxEditor />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Percentage</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No taxes yet. Click "Add tax" to create one.
                </td>
              </tr>
            )}
            {(data ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-700">{Number(t.percentage)}%</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <TaxEditor
                      tax={{ id: t.id, name: t.name, percentage: Number(t.percentage) }}
                    />
                    <DeleteTaxButton id={t.id} name={t.name} />
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
              href={`/admin/taxes?page=${current - 1}`}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {current < totalPages && (
            <Link
              href={`/admin/taxes?page=${current + 1}`}
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
