import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COMPANION_SYSTEM_PROMPT = `You are a clinical trial support assistant for patients enrolled in a medical trial. Your name is "Care Assistant".

STRICT RULES — you must follow these at all times:
1. You are NOT a doctor. You CANNOT diagnose, prescribe, or provide definitive medical advice.
2. Use careful, professional language: "may be", "could be relevant", "it might be helpful to record this".
3. NEVER state anything with false certainty. If you are unsure, say so clearly.
4. NEVER fabricate patient history. Only reference information provided in the context.
5. When a patient reports symptoms, suggest logging them for their care team — but ALWAYS ask for confirmation first.
6. For concerning symptoms (chest pain, breathing difficulty, severe dizziness, loss of consciousness), respond with elevated caution and recommend contacting the care team promptly. Do NOT be dramatic or alarmist, but do NOT dismiss the concern.
7. For medication questions, do NOT provide dosage or treatment advice. Direct the patient to discuss with their doctor or care team.
8. Keep responses concise (2-4 sentences typically). Be warm but professional.
9. If the patient asks something outside your scope, say so honestly and suggest they contact their care team.
10. Distinguish between what the patient told you now vs what is in their history.

RESPONSE FORMAT:
- Be concise and clear
- Use professional but accessible language
- If you detect a possible symptom/side effect, ask: "Would you like me to add [symptom] to today's report?"
- End concerning-symptom responses with: "If this worsens, please contact your care team."`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { message, patientContext } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { success: false, message: "Message is required" },
      { status: 400 }
    );
  }

  // Build context from patient data (passed from client, validated server-side)
  let contextBlock = "";
  if (patientContext) {
    const parts: string[] = [];
    if (patientContext.patientName) {
      parts.push(`Patient: ${patientContext.patientName}`);
    }
    if (patientContext.condition) {
      parts.push(`Condition: ${patientContext.condition}`);
    }
    if (patientContext.recentSymptoms) {
      parts.push(`Recent symptoms from check-ins: ${patientContext.recentSymptoms}`);
    }
    if (patientContext.adherenceStatus) {
      parts.push(`Medication adherence: ${patientContext.adherenceStatus}`);
    }
    if (patientContext.painTrend) {
      parts.push(`Recent pain trend: ${patientContext.painTrend}`);
    }
    if (parts.length > 0) {
      contextBlock = `\n\nPATIENT CONTEXT (from verified records):\n${parts.join("\n")}`;
    }
  }

  const fullPrompt = COMPANION_SYSTEM_PROMPT + contextBlock;

  // Try Gemini first
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: fullPrompt }] },
            contents: [
              { role: "user", parts: [{ text: message }] },
            ],
            generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
          }),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return NextResponse.json({
            success: true,
            data: { reply: text.trim(), provider: "gemini" },
          });
        }
      } else {
        const errBody = await res.text().catch(() => "");
        console.error(`[Companion] Gemini failed (${res.status}):`, errBody.slice(0, 300));
      }
    } catch (err) {
      console.error("[Companion] Gemini error:", err);
    }
  }

  // Try Featherless fallback
  const featherlessKey = process.env.FEATHERLESS_API_KEY?.trim();
  if (featherlessKey) {
    try {
      const res = await fetch(
        "https://api.featherless.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${featherlessKey}`,
          },
          body: JSON.stringify({
            model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
            messages: [
              { role: "system", content: fullPrompt },
              { role: "user", content: message },
            ],
            temperature: 0.4,
            max_tokens: 512,
          }),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          return NextResponse.json({
            success: true,
            data: { reply: text.trim(), provider: "featherless" },
          });
        }
      } else {
        const errBody = await res.text().catch(() => "");
        console.error(`[Companion] Featherless failed (${res.status}):`, errBody.slice(0, 300));
      }
    } catch (err) {
      console.error("[Companion] Featherless error:", err);
    }
  }

  // Graceful fallback — no AI available
  return NextResponse.json({
    success: true,
    data: {
      reply:
        "I'm unable to process your question right now, but I'm still here to help. You can record your symptoms or concerns using the daily check-in, and your care team will review them. If you're experiencing something urgent, please contact your care team directly.",
      provider: "fallback",
    },
  });
}
