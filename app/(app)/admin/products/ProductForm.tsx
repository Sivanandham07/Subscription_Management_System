"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ToastBox, { ToastState } from "../taxes/ToastBox";

type Product = {
  id: string;
  name: string;
  type: string | null;
  sales_price: number;
  cost_price: number;
  notes: string | null;
  active: boolean;
};

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [type, setType] = useState(product?.type ?? "");
  const [salesPrice, setSalesPrice] = useState(
    product ? String(product.sales_price) : ""
  );
  const [costPrice, setCostPrice] = useState(
    product ? String(product.cost_price) : ""
  );
  const [notes, setNotes] = useState(product?.notes ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const sales = Number(salesPrice);
    const cost = Number(costPrice);

    if (!name.trim()) {
      setToast({ type: "error", text: "Name is required." });
      return;
    }
    if (salesPrice === "" || Number.isNaN(sales) || sales < 0) {
      setToast({ type: "error", text: "Sales price must be 0 or more." });
      return;
    }
    if (costPrice === "" || Number.isNaN(cost) || cost < 0) {
      setToast({ type: "error", text: "Cost price must be 0 or more." });
      return;
    }

    const payload = {
      name: name.trim(),
      type: type.trim() || null,
      sales_price: sales,
      cost_price: cost,
      notes: notes.trim() || null,
      active,
    };

    setSaving(true);
    const supabase = createClient();

    if (isEdit) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product!.id)
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
      setToast({ type: "success", text: "Product saved." });
      router.refresh();
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      setSaving(false);

      if (error || !data) {
        setToast({
          type: "error",
          text: error?.message ?? "Nothing was saved. Are you logged in as an admin?",
        });
        return;
      }
      router.push(`/admin/products/${data.id}`);
    }
  }

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <input
              list="product-types"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. Software"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            />
            <datalist id="product-types">
              <option value="Software" />
              <option value="Service" />
              <option value="Support" />
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sales price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={salesPrice}
              onChange={(e) => setSalesPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Active
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </>
  );
}
