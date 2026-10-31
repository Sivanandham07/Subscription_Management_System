import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

// Until login is merged, keep USE_ADMIN = true. After merge, set it to false.
const USE_ADMIN = true; // TODO-AUTH: switch to server createClient()

export async function getDb() {
  if (USE_ADMIN) return createAdminClient(); // TODO-AUTH: switch to server createClient()
  return await createClient();
}