"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { useToast } from "./useToast";

export default function GenerateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { show, node } = useToast();

  async function run() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("generate_due_invoices");
    setLoading(false);
    if (error) return show(error.message, true);
    show(`${data} invoices created`);
    router.refresh();
  }

  return (
    <div className="print:hidden">
      {node}
      <button onClick={run} disabled={loading} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
        {loading ? "Generating... please wait" : "Generate due invoices"}
      </button>
      <p className="mt-1 text-xs text-gray-500">Demo: click twice. The second click creates 0 invoices, so nothing is billed twice.</p>
    </div>
  );
}