import { Request, Response } from "express";
import { aiService } from "./ai.service";
import { sendSuccess, sendError } from "../../shared/utils";

export async function analyzeTranscript(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { transcript } = req.body;
    if (!transcript || typeof transcript !== "string") {
      sendError(res, "transcript is required and must be a string", 400);
      return;
    }

    const analysis = await aiService.analyzeTranscript(transcript);
    sendSuccess(res, analysis, "Transcript analyzed successfully");
  } catch (err) {
    console.error("[AI] Analysis error:", err);
    sendError(
      res,
      err instanceof Error ? err.message : "Analysis failed",
      500
    );
  }
}

export async function generateSpeech(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      sendError(res, "text is required and must be a string", 400);
      return;
    }

    const audioBuffer = await aiService.generateSpokenSummary(text);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error("[AI] TTS error:", err);
    sendError(
      res,
      err instanceof Error ? err.message : "Speech generation failed",
      500
    );
  }
}

export async function getProviderStatus(
  _req: Request,
  res: Response
): Promise<void> {
  sendSuccess(res, {
    ai: aiService.isUsingMockAi() ? "mock" : "gemini",
    tts: aiService.isUsingMockTts() ? "mock" : "elevenlabs",
  });
}
