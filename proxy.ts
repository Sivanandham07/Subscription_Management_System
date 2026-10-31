import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages anyone can open without logging in
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

// Which roles may open which paths
const ADMIN_ONLY = ["/admin"];
const STAFF_AREA = ["/subscriptions", "/invoices", "/payments", "/dashboard"];
const CUSTOMER_AREA = ["/portal"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function homeFor(role: string) {
  return role === "admin" || role === "staff" ? "/dashboard" : "/portal";
}

// Redirect while keeping any refreshed session cookies
function redirectTo(
  request: NextRequest,
  path: string,
  sessionResponse: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const response = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  return response;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This line also refreshes the session on every request
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public pages: let everyone through
  if (matches(pathname, PUBLIC_PATHS)) {
    return response;
  }

  // Everything else needs a login
  if (!user) {
    return redirectTo(request, "/login", response);
  }

  // The home page "/" decides by itself where to send the user (see app/page.tsx)
  if (pathname === "/") {
    return response;
  }

  // Light query: only the role column, only for this user
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "customer";

  // /admin/* -> admin only
  if (matches(pathname, ADMIN_ONLY) && role !== "admin") {
    return redirectTo(request, homeFor(role), response);
  }

  // /subscriptions, /invoices, /payments, /dashboard -> admin and staff
  if (matches(pathname, STAFF_AREA) && role !== "admin" && role !== "staff") {
    return redirectTo(request, homeFor(role), response);
  }

  // /portal -> customers (admin also allowed for testing)
  if (matches(pathname, CUSTOMER_AREA) && role !== "customer" && role !== "admin") {
    return redirectTo(request, homeFor(role), response);
  }

  return response;
}

// Skip static files and images
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};