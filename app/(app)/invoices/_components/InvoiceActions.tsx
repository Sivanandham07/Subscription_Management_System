"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { useToast } from "./useToast";

type Props = { id: string; status: string; amountPaid: number; outstanding: number; sentAt: string | null };

export default function InvoiceActions({ id, status, amountPaid, outstanding, sentAt }: Props) {
  const router = useRouter();
  const { show, node } = useToast();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState(String(Number(outstanding).toFixed(2)));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function changeStatus(p_new: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc("change_invoice_status", { p_id: id, p_new });
    if (error) return show(error.message, true);
    show(`Invoice ${p_new}`);
    router.refresh();
  }

  async function send() {
    const supabase = createClient();
    const { error } = await supabase.rpc("mark_invoice_sent", { p_id: id });
    if (error) return show(error.message, true);
    show("Invoice sent to customer");
    router.refresh();
  }

  async function pay() {
    const amt = Number(amount);
    if (!(amt > 0)) return show("Amount must be above 0", true);
    if (amt > Number(outstanding) + 0.001) return show("Amount is more than outstanding", true);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("record_payment", {
      p_invoice_id: id, p_method: method, p_amount: amt, p_date: date, p_note: note || null,
    });
    setBusy(false);
    if (error) return show(error.message, true);
    show("Payment recorded");
    setOpen(false);
    router.refresh();
  }

  const canConfirm = status === "draft";
  const canCancel = status === "draft" || (status === "confirmed" && Number(amountPaid) === 0);
  const canPay = status === "confirmed" && Number(outstanding) > 0;
  const btn = "rounded border px-3 py-2 text-sm hover:bg-gray-50";

  return (
    <div className="print:hidden">
      {node}
      <div className="flex flex-wrap items-center gap-2">
        {canConfirm && <button className={`${btn} bg-blue-600 text-white`} onClick={() => changeStatus("confirmed")}>Confirm</button>}
        {canPay && <button className={`${btn} bg-green-600 text-white`} onClick={() => { setAmount(Number(outstanding).toFixed(2)); setOpen(true); }}>Record payment</button>}
        {status !== "cancelled" && <button className={btn} onClick={send}>Send</button>}
        <button className={btn} onClick={() => window.print()}>Print</button>
        {canCancel && <button className={`${btn} text-red-600`} onClick={() => changeStatus("cancelled")}>Cancel</button>}
        {sentAt && <span className="text-xs text-gray-500">Sent on {new Date(sentAt).toLocaleDateString("en-IN")}</span>}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md space-y-3 rounded bg-white p-6">
            <h2 className="text-lg font-semibold">Record payment</h2>
            <label className="block text-sm">Method
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded border px-2 py-2">
                {["cash", "card", "upi", "bank_transfer", "cheque"].map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </select>
            </label>
            <label className="block text-sm">Amount (max {Number(outstanding).toFixed(2)})
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded border px-2 py-2" />
            </label>
            <label className="block text-sm">Payment date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded border px-2 py-2" />
            </label>
            <label className="block text-sm">Note
              <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded border px-2 py-2" />
            </label>
            <div className="flex justify-end gap-2">
              <button className={btn} onClick={() => setOpen(false)}>Close</button>
              <button className={`${btn} bg-green-600 text-white disabled:opacity-50`} disabled={busy} onClick={pay}>{busy ? "Saving..." : "Save payment"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}