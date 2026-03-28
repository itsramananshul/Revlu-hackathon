import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ElevenLabsSttProvider } from "@/lib/ai/providers/elevenlabs-stt.provider";
import { phraseMatches } from "@/lib/voice-verification";

/**
 * POST /api/auth/voice-login
 *
 * Voice-based login:
 * 1. Receive audio + patientId
 * 2. Fetch patient's voice_phrase from DB
 * 3. Transcribe audio via ElevenLabs STT
 * 4. Compare transcript with expected phrase
 * 5. If match → sign in as a demo user and return session
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { success: false, message: "Server config error", data: null },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;
  const patientId = formData.get("patientId") as string | null;

  if (!patientId || !audioFile || audioFile.size === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Patient selection and voice recording are required",
        data: { verified: false, reason: "no_audio" },
      },
      { status: 400 }
    );
  }

  // Use service role to bypass RLS (no session yet)
  const supabase = createClient(url, serviceKey);

  // Fetch patient's voice phrase
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("voice_phrase, name")
    .eq("id", patientId)
    .single();

  if (patientError || !patient) {
    return NextResponse.json(
      {
        success: false,
        message: "Patient not found",
        data: { verified: false, reason: "missing_phrase" },
      },
      { status: 404 }
    );
  }

  if (!patient.voice_phrase) {
    return NextResponse.json(
      {
        success: false,
        message: "No voice phrase configured for this patient",
        data: { verified: false, reason: "missing_phrase" },
      },
      { status: 400 }
    );
  }

  // Transcribe audio
  if (!elevenLabsKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Voice service unavailable",
        data: { verified: false, reason: "transcription_failed" },
      },
      { status: 503 }
    );
  }

  let transcript: string;
  try {
    const stt = new ElevenLabsSttProvider(elevenLabsKey);
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    transcript = await stt.transcribe(audioBuffer, audioFile.name);
  } catch (err) {
    console.error("[VoiceLogin] STT failed:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Could not process voice recording. Please try again.",
        data: { verified: false, reason: "transcription_failed" },
      },
      { status: 500 }
    );
  }

  // Compare phrases
  const { matches } = phraseMatches(transcript, patient.voice_phrase);

  if (!matches) {
    return NextResponse.json(
      {
        success: false,
        message: "Voice phrase did not match. Please try again.",
        data: {
          verified: false,
          reason: "phrase_mismatch",
          transcript,
        },
      },
      { status: 401 }
    );
  }

  // Voice matched — create a magic link sign-in for the demo user
  // Use a deterministic demo email based on patient name
  const demoEmail = `${patient.name.toLowerCase().replace(/\s+/g, ".")}@voxvitals.demo`;
  const demoPassword = `voice-${patientId.slice(0, 8)}`;

  // Try to sign in first (user may already exist)
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

  if (signInData?.session) {
    return NextResponse.json({
      success: true,
      message: `Welcome back, ${patient.name}`,
      data: {
        verified: true,
        reason: "matched",
        transcript,
        session: signInData.session,
        patientName: patient.name,
      },
    });
  }

  // User doesn't exist yet — create them
  const { data: signUpData, error: signUpError } = await supabase.auth.admin
    ? await supabase.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
      })
    : await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
      });

  if (signUpError) {
    // Fallback: if signup fails, still report voice was verified
    return NextResponse.json({
      success: true,
      message: `Voice verified for ${patient.name}. Please sign in with your credentials.`,
      data: {
        verified: true,
        reason: "matched",
        transcript,
        session: null,
        patientName: patient.name,
      },
    });
  }

  // Sign in the newly created user
  const { data: newSignIn } = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  return NextResponse.json({
    success: true,
    message: `Welcome, ${patient.name}`,
    data: {
      verified: true,
      reason: "matched",
      transcript,
      session: newSignIn?.session || null,
      patientName: patient.name,
    },
  });
}
