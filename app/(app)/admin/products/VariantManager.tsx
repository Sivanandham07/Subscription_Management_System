"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { formatINR } from "../../../../lib/format";
import ToastBox, { ToastState } from "./ToastBox";

type Variant = {
  id: string;
  attribute: string;
  value: string;
  extra_price: number;
};

export default function VariantManager({
  productId,
  salesPrice,
  variants,
}: {
  productId: string;
  salesPrice: number;
  variants: Variant[];
}) {
  const router = useRouter();
  const [attribute, setAttribute] = useState("");
  const [value, setValue] = useState("");
  const [extraPrice, setExtraPrice] = useState("0");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    const extra = Number(extraPrice);
    if (!attribute.trim() || !value.trim()) {
      setToast({ type: "error", text: "Attribute and value are required." });
      return;
    }
    if (extraPrice === "" || Number.isNaN(extra)) {
      setToast({ type: "error", text: "Extra price must be a number." });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        attribute: attribute.trim(),
        value: value.trim(),
        extra_price: extra,
      })
      .select();
    setSaving(false);

    if (error) {
      setToast({ type: "error", text: error.message });
      return;
    }
    if (!data || data.length === 0) {
      setToast({
        type: "error",
        text: "Nothing was saved. Are you logged in as an admin?",
      });
      return;
    }

    setAttribute("");
    setValue("");
    setExtraPrice("0");
    router.refresh();
  }

  async function handleRemove(v: Variant) {
    if (!confirm(`Remove variant ${v.attribute}: ${v.value}?`)) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", v.id)
      .select();

    if (error) {
      setToast({ type: "error", text: error.message });
      return;
    }
    if (!data || data.length === 0) {
      setToast({
        type: "error",
        text: "Nothing was removed. Are you logged in as an admin?",
      });
      return;
    }
    router.refresh();
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <ToastBox toast={toast} onClose={() => setToast(null)} />

      <h2 className="text-lg font-semibold text-gray-900 mb-1">Variants</h2>
      <p className="text-sm text-gray-500 mb-4">
        Final price = sales price + extra price
      </p>

      <table className="w-full text-sm mb-6">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Attribute</th>
            <th className="px-4 py-2 font-medium">Value</th>
            <th className="px-4 py-2 font-medium">Extra price</th>
            <th className="px-4 py-2 font-medium">Final price</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {variants.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                No variants yet.
              </td>
            </tr>
          )}
          {variants.map((v) => (
            <tr key={v.id}>
              <td className="px-4 py-2 text-gray-900">{v.attribute}</td>
              <td className="px-4 py-2 text-gray-900">{v.value}</td>
              <td className="px-4 py-2 text-gray-700">
                +{formatINR(Number(v.extra_price))}
              </td>
              <td className="px-4 py-2 text-gray-900 font-medium">
                {formatINR(salesPrice + Number(v.extra_price))}
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => handleRemove(v)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attribute
          </label>
          <input
            value={attribute}
            onChange={(e) => setAttribute(e.target.value)}
            placeholder="Brand"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value
          </label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Odoo"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Extra price (₹)
          </label>
          <input
            type="number"
            step="0.01"
            value={extraPrice}
            onChange={(e) => setExtraPrice(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add variant"}
        </button>
      </form>
    </div>
  );
}