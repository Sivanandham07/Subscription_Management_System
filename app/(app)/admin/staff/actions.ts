"use server";

import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { allRulesPass } from "../../../(auth)/password-rules";

export type StaffResult = { error?: string; success?: string };

export async function createStaff(
  fullName: string,
  email: string,
  password: string
): Promise<StaffResult> {
  // 1. Who is calling? Must be a logged-in admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") {
    return { error: "Only admins can create staff accounts." };
  }

  // 2. Check the inputs again on the server (never trust the browser)
  const cleanName = fullName.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || !cleanEmail) {
    return { error: "Full name and email are required." };
  }
  if (!allRulesPass(password)) {
    return { error: "Password does not meet the rules." };
  }

  // 3. Create the auth user with the admin (service role) client
  const admin = createAdminClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName },
    });

  if (createError || !created.user) {
    const msg = (createError?.message ?? "").toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      return { error: "This email already has an account." };
    }
    return { error: createError?.message ?? "Could not create the user." };
  }

  // 4. The signup trigger made a customer profile. Change it to staff.
  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "staff" })
    .eq("id", created.user.id);

  if (roleError) {
    return {
      error:
        "User was created but the role could not be set to staff: " +
        roleError.message,
    };
  }

  return { success: `Staff account created for ${cleanEmail}.` };
}