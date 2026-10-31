"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ToastBox, { ToastState } from "../../../../components/ui/ToastBox";

export default function PlanActions({
  id,
  status,
  allowPause,
  allowClose,
}: {
  id: string;
  status: string;
  allowPause: boolean;
  allowClose: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function changeStatus(newStatus: "active" | "paused" | "closed") {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("plans")
      .update({ status: newStatus })
      .eq("id", id)
      .select();
    setBusy(false);

    if (error) {
      setToast({ type: "error", text: error.message });
      return;
    }
    if (!data || data.length === 0) {
      setToast({ type: "error", text: "Nothing was changed. Are you logged in as an admin?" });
      return;
    }
    router.refresh();
  }

  const showPause = status === "active" && allowPause;
  const showClose = status !== "closed" && allowClose;
  const showReactivate = status === "paused" || status === "closed";

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />

      {showPause && (
        <button
          type="button"
          onClick={() => changeStatus("paused")}
          disabled={busy}
          className="px-3 py-1.5 text-sm border border-amber-300 text-amber-700 rounded-md hover:bg-amber-50 disabled:opacity-50"
        >
          Pause
        </button>
      )}
      {showClose && (
        <button
          type="button"
          onClick={() => {
            if (confirm("Close this plan?")) changeStatus("closed");
          }}
          disabled={busy}
          className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
        >
          Close
        </button>
      )}
      {showReactivate && (
        <button
          type="button"
          onClick={() => changeStatus("active")}
          disabled={busy}
          className="px-3 py-1.5 text-sm border border-green-300 text-green-700 rounded-md hover:bg-green-50 disabled:opacity-50"
        >
          Reactivate
        </button>
      )}
    </>
  );
}