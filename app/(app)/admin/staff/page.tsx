import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import StaffForm from "./staff-form";

type StaffRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function StaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/dashboard");

  // Try with created_at first. If that column does not exist, retry without it.
  let rows: StaffRow[] = [];
  const first = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .in("role", ["admin", "staff"])
    .order("full_name", { ascending: true })
    .limit(100);

  if (first.error) {
    const second = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["admin", "staff"])
      .order("full_name", { ascending: true })
      .limit(100);
    if (second.error) throw new Error(second.error.message);
    rows = (second.data ?? []) as StaffRow[];
  } else {
    rows = (first.data ?? []) as StaffRow[];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Staff</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No staff yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.full_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.email || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          r.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {r.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <StaffForm />
        </div>
      </div>
    </div>
  );
}