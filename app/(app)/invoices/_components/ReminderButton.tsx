"use client";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { useToast } from "./useToast";

export default function ReminderButton({ id }: { id: string }) {
  const router = useRouter();
  const { show, node } = useToast();

  async function send(e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = createClient();
    const { error } = await supabase.rpc("mark_invoice_sent", { p_id: id });
    if (error) return show(error.message, true);
    show("Reminder sent");
    router.refresh();
  }

  return (
    <>
      {node}
      <button onClick={send} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
        Send reminder
      </button>
    </>
  );
}