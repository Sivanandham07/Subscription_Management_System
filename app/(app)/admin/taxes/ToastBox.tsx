"use client";
import { useEffect } from "react";

export type ToastState = { type: "error" | "success"; text: string } | null;

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
    toast.type === "error"
      ? "bg-red-600 text-white"
      : "bg-green-600 text-white";

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-sm ${color}`}>
      {toast.text}
    </div>
  );
}
