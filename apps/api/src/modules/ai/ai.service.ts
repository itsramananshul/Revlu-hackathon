import type { AiAnalysis } from "@trialpulse/types";
import type { AiProvider, TtsProvider } from "./ai.types";
import { GeminiProvider } from "./providers/gemini.provider";
import { MockAiProvider } from "./providers/mock-ai.provider";
import { ElevenLabsProvider } from "./providers/elevenlabs.provider";
import { MockTtsProvider } from "./providers/mock-tts.provider";

export class AiService {
  private aiProvider: AiProvider;
  private ttsProvider: TtsProvider;
  private usingMockAi: boolean;
  private usingMockTts: boolean;

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    this.usingMockAi = !geminiKey;
    this.usingMockTts = !elevenLabsKey;

    this.aiProvider = geminiKey
      ? new GeminiProvider(geminiKey)
      : new MockAiProvider();

    this.ttsProvider = elevenLabsKey
      ? new ElevenLabsProvider(elevenLabsKey)
      : new MockTtsProvider();

    console.log(
      `[AI] Provider: ${this.usingMockAi ? "Mock" : "Gemini"} | TTS: ${this.usingMockTts ? "Mock" : "ElevenLabs"}`
    );
  }

  async analyzeTranscript(transcript: string): Promise<AiAnalysis> {
    return this.aiProvider.analyzeTranscript(transcript);
  }

  async generateSpokenSummary(text: string): Promise<Buffer> {
    return this.ttsProvider.generateSpeech(text);
  }

  isUsingMockAi(): boolean {
    return this.usingMockAi;
  }

  isUsingMockTts(): boolean {
    return this.usingMockTts;
  }
}

// Singleton
export const aiService = new AiService();
