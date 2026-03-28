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
