import { successResponse } from "@/lib/api-utils";

export async function GET() {
  return successResponse({
    ai: "active",
    tts: "active",
  });
}
