import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Set to false when everything works
const DEBUG = false;

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

// Redirect and keep any refreshed session cookies
function redirectTo(
  request: NextRequest,
  path: string,
  sessionResponse: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
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

  // Refreshes the session on every request. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (DEBUG) {
    console.log("PROXY:", pathname, "->", user?.email ?? "NO USER");
  }

  // 1. Public pages: everyone is allowed
  if (matches(pathname, PUBLIC_PATHS)) {
    return response;
  }

  // 2. Everything else needs a login
  if (!user) {
    return redirectTo(request, "/login", response);
  }

  // 3. "/" decides by itself where to send the user (app/page.tsx)
  if (pathname === "/") {
    return response;
  }

  // 4. Find the role (only one column, only this user)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError && DEBUG) {
    console.log("PROXY profile error:", profileError.message);
  }

  const role = profile?.role ?? "customer";

  if (DEBUG) {
    console.log("PROXY role:", role);
  }

  // 5. Role rules
  if (matches(pathname, ADMIN_ONLY) && role !== "admin") {
    return redirectTo(request, homeFor(role), response);
  }

  if (matches(pathname, STAFF_AREA) && role !== "admin" && role !== "staff") {
    return redirectTo(request, homeFor(role), response);
  }

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