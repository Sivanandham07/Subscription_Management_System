"use client";
import { useState } from "react";

export function useToast() {
  const [t, setT] = useState<{ m: string; err: boolean } | null>(null);
  const show = (m: string, err = false) => {
    setT({ m, err });
    setTimeout(() => setT(null), 3500);
  };
  const node = t ? (
    <div className={`fixed right-4 top-4 z-50 rounded px-4 py-3 text-sm text-white shadow-lg print:hidden ${t.err ? "bg-red-600" : "bg-green-600"}`}>
      {t.m}
    </div>
  ) : null;
  return { show, node };
}