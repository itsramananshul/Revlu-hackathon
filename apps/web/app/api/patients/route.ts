import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { mapPatient } from "@/lib/db-mappers";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  // Look up role from app_users
  const { data: appUser } = await supabase
    .from("app_users")
    .select("role")
    .eq("auth_id", user.id)
    .maybeSingle();

  const role = appUser?.role || "patient";

  let query = supabase.from("patients").select("*");

  if (role === "clinician") {
    // Clinician sees only their linked patients
    query = query.eq("doctor_id", user.id);
  } else if (role === "patient") {
    // Patient sees only their own record
    query = query.eq("user_id", user.id);
  }
  // super sees all — no filter

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) return errorResponse(error.message, 500);

  return successResponse((data || []).map(mapPatient));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { name, age, condition, trialId } = body;

  if (!name || !age || !condition || !trialId) {
    return errorResponse(
      "name, age, condition, and trialId are required",
      400
    );
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      name,
      age: Number(age),
      condition,
      trial_id: trialId,
      status: "active",
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return successResponse(mapPatient(data), "Patient created", 201);
}
