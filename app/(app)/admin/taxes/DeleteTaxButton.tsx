"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ToastBox, { ToastState } from "./ToastBox";

export default function DeleteTaxButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function handleDelete() {
    if (!confirm(`Delete tax "${name}"?`)) return;

    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("taxes")
      .delete()
      .eq("id", id)
      .select();
    setBusy(false);

    if (error) {
      // e.g. the tax is already used by a template or subscription line
      setToast({ type: "error", text: error.message });
      return;
    }
    if (!data || data.length === 0) {
      setToast({
        type: "error",
        text: "Nothing was deleted. Are you logged in as an admin?",
      });
      return;
    }

    router.refresh();
  }

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />
      <button
        onClick={handleDelete}
        disabled={busy}
        className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "..." : "Delete"}
      </button>
    </>
  );
}
