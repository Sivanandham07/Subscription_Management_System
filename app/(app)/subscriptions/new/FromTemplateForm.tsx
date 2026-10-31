"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ToastBox, { ToastState } from "../../../../components/ui/ToastBox";
import CustomerPicker, { Customer } from "../CustomerPicker";
import { addYears } from "../dates";

export default function FromTemplateForm({
  today,
  templates,
}: {
  today: string;
  templates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [startDate, setStartDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState(addYears(today, 1));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function fail(text: string) {
    setToast({ type: "error", text });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!templateId) return fail("Please choose a quotation template.");
    if (!customer) return fail("Please choose a customer.");
    if (!startDate) return fail("Start date is required.");
    if (!expiryDate) return fail("Expiry date is required.");
    if (expiryDate <= startDate) return fail("Expiry date must be after the start date.");

    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_subscription_from_template", {
      p_template_id: templateId,
      p_customer_id: customer.id,
      p_start: startDate,
      p_expiry: expiryDate,
    });
    setSaving(false);

    if (error) return fail(error.message);
    if (!data) return fail("The subscription was not created. Are you logged in?");

    router.push(`/subscriptions/${data}`);
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 max-w-3xl"
      >
        <div>
          <label className={labelClass}>Quotation template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className={inputClass}
          >
            <option value="">Choose a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Customer</label>
          <CustomerPicker value={customer} onChange={setCustomer} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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