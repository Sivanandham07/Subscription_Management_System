"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

export type Customer = { id: string; full_name: string | null; email: string | null };

export default function CustomerPicker({
  value,
  onChange,
}: {
  value: Customer | null;
  onChange: (c: Customer | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      requestId.current += 1;
      const myRequest = requestId.current;

      setLoading(true);
      setErrorText("");

      const supabase = createClient();
      let query = supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "customer")
        .order("full_name")
        .limit(50);

      const clean = term.trim().replace(/[,()%]/g, " ");
      if (clean) {
        query = query.or(`full_name.ilike.%${clean}%,email.ilike.%${clean}%`);
      }

      const { data, error } = await query;

      // ignore answers that arrive late for an older search
      if (myRequest !== requestId.current) return;

      setLoading(false);
      if (error) {
        setErrorText(error.message);
        setResults([]);
        return;
      }
      setResults((data ?? []) as Customer[]);
    }, 300);

    return () => clearTimeout(timer);
  }, [term, open]);

  if (value) {
    return (
      <div className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
        <div>
          <div className="text-gray-900">{value.full_name ?? "(no name)"}</div>
          <div className="text-xs text-gray-500">{value.email}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setTerm("");
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Search customers by name or email..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
      />

      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          )}
          {errorText && (
            <div className="px-3 py-2 text-sm text-red-600">
              Could not load customers: {errorText}
            </div>
          )}
          {!loading && !errorText && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No customers found.</div>
          )}
          {results.map((c) => (
            <button
              type="button"
              key={c.id}
              // onMouseDown runs before the input loses focus, so the click is not lost
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(c);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              <div className="text-gray-900">{c.full_name ?? "(no name)"}</div>
              <div className="text-xs text-gray-500">{c.email}</div>
            </button>
          ))}
          {results.length === 50 && (
            <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
              Showing the first 50. Type more to narrow down.
            </div>
          )}
        </div>
      )}
    </div>
  );
}