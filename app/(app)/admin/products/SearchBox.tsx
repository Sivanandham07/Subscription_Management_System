"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    router.push(v ? `/admin/products?q=${encodeURIComponent(v)}` : "/admin/products");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name..."
        className="w-72 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Search
      </button>
    </form>
  );
}