import { successResponse } from "@/lib/api-utils";
import { aiService } from "@/lib/ai/ai-service";

export async function GET() {
  return successResponse({
    ai: aiService.isUsingMockAi() ? "mock" : "gemini",
    tts: aiService.isUsingMockTts() ? "mock" : "elevenlabs",
  });
}
