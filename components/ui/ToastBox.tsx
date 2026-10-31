"use client";

import { useEffect } from "react";

export type ToastState = { type: "success" | "error"; text: string } | null;

export default function ToastBox({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const color =
    toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white";

  return (
    <div className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 text-sm shadow-lg ${color}`}>
      {toast.text}
    </div>
  );
}