import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { mapPatient } from "@/lib/db-mappers";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return errorResponse(error.message, 500);

  return successResponse((data || []).map(mapPatient));
}
