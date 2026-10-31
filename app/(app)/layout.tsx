import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import AppShell from "./_components/app-shell";

type NavLink = { href: string; label: string };

const ADMIN_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payments" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/taxes", label: "Taxes" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/templates", label: "Quotation Templates" },
  { href: "/admin/staff", label: "Staff" },
];

const STAFF_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payments" },
];

const CUSTOMER_LINKS: NavLink[] = [{ href: "/portal", label: "My Portal" }];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "customer";
  const name = profile?.full_name || user.email || "User";

  const links =
    role === "admin"
      ? ADMIN_LINKS
      : role === "staff"
      ? STAFF_LINKS
      : CUSTOMER_LINKS;

  return (
    <AppShell name={name} role={role} links={links}>
      {children}
    </AppShell>
  );
}