"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ToastBox, { ToastState } from "./ToastBox";

type Tax = { id: string; name: string; percentage: number };

export default function TaxEditor({ tax }: { tax?: Tax }) {
  const router = useRouter();
  const isEdit = !!tax;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tax?.name ?? "");
  const [percentage, setPercentage] = useState(
    tax ? String(tax.percentage) : ""
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function openForm() {
    setName(tax?.name ?? "");
    setPercentage(tax ? String(tax.percentage) : "");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = name.trim();
    const pct = Number(percentage);

    if (!trimmed) {
      setToast({ type: "error", text: "Name is required." });
      return;
    }
    if (percentage === "" || Number.isNaN(pct) || pct < 0 || pct > 100) {
      setToast({ type: "error", text: "Percentage must be between 0 and 100." });
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const result = isEdit
      ? await supabase
          .from("taxes")
          .update({ name: trimmed, percentage: pct })
          .eq("id", tax!.id)
          .select()
      : await supabase
          .from("taxes")
          .insert({ name: trimmed, percentage: pct })
          .select();

    setSaving(false);

    if (result.error) {
      setToast({ type: "error", text: result.error.message });
      return;
    }
    if (!result.data || result.data.length === 0) {
      setToast({
        type: "error",
        text: "Nothing was saved. Are you logged in as an admin?",
      });
      return;
    }

    setOpen(false);
    setToast({ type: "success", text: isEdit ? "Tax updated." : "Tax added." });
    router.refresh();
  }

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />

      <button
        onClick={openForm}
        className={
          isEdit
            ? "px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            : "px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        }
      >
        {isEdit ? "Edit" : "Add tax"}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit tax" : "Add tax"}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GST 18%"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentage (0 to 100)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="18"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
