"use client";

import { useState } from "react";
import FromTemplateForm from "./FromTemplateForm";
import BlankForm from "./BlankForm";
import type { ProductOption, VariantOption, TaxOption } from "../LinesEditor";

export default function NewSubscription({
  today,
  templates,
  plans,
  products,
  variants,
  taxes,
}: {
  today: string;
  templates: { id: string; name: string }[];
  plans: { id: string; name: string }[];
  products: ProductOption[];
  variants: VariantOption[];
  taxes: TaxOption[];
}) {
  const [mode, setMode] = useState<"template" | "blank">("template");

  const tabClass = (active: boolean) =>
    active
      ? "px-4 py-2 text-sm rounded-md bg-blue-600 text-white"
      : "px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("template")}
          className={tabClass(mode === "template")}
        >
          From a quotation template
        </button>
        <button
          type="button"
          onClick={() => setMode("blank")}
          className={tabClass(mode === "blank")}
        >
          Blank form
        </button>
      </div>

      {mode === "template" ? (
        <FromTemplateForm today={today} templates={templates} />
      ) : (
        <BlankForm
          today={today}
          plans={plans}
          products={products}
          variants={variants}
          taxes={taxes}
        />
      )}
    </div>
  );
}