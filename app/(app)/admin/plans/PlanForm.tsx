"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ToastBox, { ToastState } from "../../../../components/ui/ToastBox";

type Plan = {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  min_quantity: number;
  start_date: string | null;
  end_date: string | null;
  auto_close: boolean;
  allow_close: boolean;
  allow_pause: boolean;
  allow_renew: boolean;
};

export default function PlanForm({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const isEdit = !!plan;

  const [name, setName] = useState(plan?.name ?? "");
  const [price, setPrice] = useState(plan ? String(plan.price) : "");
  const [billingPeriod, setBillingPeriod] = useState(plan?.billing_period ?? "monthly");
  const [minQuantity, setMinQuantity] = useState(plan ? String(plan.min_quantity) : "1");
  const [startDate, setStartDate] = useState(plan?.start_date?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(plan?.end_date?.slice(0, 10) ?? "");
  const [autoClose, setAutoClose] = useState(plan?.auto_close ?? false);
  const [allowClose, setAllowClose] = useState(plan?.allow_close ?? true);
  const [allowPause, setAllowPause] = useState(plan?.allow_pause ?? true);
  const [allowRenew, setAllowRenew] = useState(plan?.allow_renew ?? true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function fail(text: string) {
    setToast({ type: "error", text });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const priceNum = Number(price);
    const minQtyNum = Number(minQuantity);

    if (!name.trim()) return fail("Name is required.");
    if (price === "" || Number.isNaN(priceNum) || priceNum < 0) return fail("Price must be 0 or more.");
    if (!Number.isInteger(minQtyNum) || minQtyNum < 1) {
      return fail("Minimum quantity must be a whole number, 1 or more.");
    }
    if (startDate && endDate && endDate <= startDate) return fail("End date must be after the start date.");
    if (autoClose && !endDate) return fail("Set an end date to use auto-close.");

    const payload = {
      name: name.trim(),
      price: priceNum,
      billing_period: billingPeriod,
      min_quantity: minQtyNum,
      start_date: startDate || null,
      end_date: endDate || null,
      auto_close: autoClose,
      allow_close: allowClose,
      allow_pause: allowPause,
      allow_renew: allowRenew,
    };

    setSaving(true);
    const supabase = createClient();

    if (isEdit) {
      const { data, error } = await supabase
        .from("plans")
        .update(payload)
        .eq("id", plan!.id)
        .select();
      setSaving(false);

      if (error) return fail(error.message);
      if (!data || data.length === 0) return fail("Nothing was saved. Are you logged in as an admin?");
      setToast({ type: "success", text: "Plan saved." });
      router.refresh();
    } else {
      const { data, error } = await supabase
        .from("plans")
        .insert({ ...payload, status: "active" })
        .select();
      setSaving(false);

      if (error) return fail(error.message);
      if (!data || data.length === 0) return fail("Nothing was saved. Are you logged in as an admin?");
      router.push("/admin/plans");
      router.refresh();
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Price (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Billing period</label>
            <select
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              className={inputClass}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Minimum quantity</label>
            <input
              type="number"
              step="1"
              min="1"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={autoClose} onChange={(e) => setAutoClose(e.target.checked)} />
            Auto-close at end date
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={allowClose} onChange={(e) => setAllowClose(e.target.checked)} />
            Allow early close
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={allowPause} onChange={(e) => setAllowPause(e.target.checked)} />
            Allow pause
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={allowRenew} onChange={(e) => setAllowRenew(e.target.checked)} />
            Allow renew
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create plan"}
          </button>
        </div>
      </form>
    </>
  );
}