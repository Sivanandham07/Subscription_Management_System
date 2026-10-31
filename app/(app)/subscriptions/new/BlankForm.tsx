"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ToastBox, { ToastState } from "../../../../components/ui/ToastBox";
import CustomerPicker, { Customer } from "../CustomerPicker";
import LinesEditor, {
  LineState,
  ProductOption,
  VariantOption,
  TaxOption,
  newLine,
  validateLines,
  toRows,
} from "../LinesEditor";
import { addYears } from "../dates";

export default function BlankForm({
  today,
  plans,
  products,
  variants,
  taxes,
}: {
  today: string;
  plans: { id: string; name: string }[];
  products: ProductOption[];
  variants: VariantOption[];
  taxes: TaxOption[];
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState(addYears(today, 1));
  const [paymentTerms, setPaymentTerms] = useState("Net 15");
  const [lines, setLines] = useState<LineState[]>([newLine()]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function fail(text: string) {
    setToast({ type: "error", text });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!customer) return fail("Please choose a customer.");
    if (!planId) return fail("Please choose a plan.");
    if (!startDate) return fail("Start date is required.");
    if (!expiryDate) return fail("Expiry date is required.");
    if (expiryDate <= startDate) return fail("Expiry date must be after the start date.");

    const lineError = validateLines(lines);
    if (lineError) return fail(lineError);

    setSaving(true);
    const supabase = createClient();

    // 1. create the subscription (starts as draft)
    const { data: created, error: createError } = await supabase
      .from("subscriptions")
      .insert({
        customer_id: customer.id,
        plan_id: planId,
        start_date: startDate,
        expiry_date: expiryDate,
        payment_terms: paymentTerms,
        status: "draft",
      })
      .select("id")
      .single();

    if (createError || !created) {
      setSaving(false);
      return fail(createError?.message ?? "Nothing was saved. Are you logged in?");
    }

    // 2. create its lines
    const { error: linesError } = await supabase
      .from("subscription_lines")
      .insert(toRows(lines).map((r) => ({ ...r, subscription_id: created.id })));

    if (linesError) {
      // remove the empty subscription so we do not leave junk behind
      await supabase.from("subscriptions").delete().eq("id", created.id);
      setSaving(false);
      return fail(linesError.message);
    }

    setSaving(false);
    router.push(`/subscriptions/${created.id}`);
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <label className={labelClass}>Customer</label>
            <CustomerPicker value={customer} onChange={setCustomer} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
              <label className={labelClass}>Expiry date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Payment terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className={inputClass}
              >
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lines</h2>
          <LinesEditor
            lines={lines}
            onChange={setLines}
            products={products}
            variants={variants}
            taxes={taxes}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create subscription"}
          </button>
        </div>
      </form>
    </>
  );
}