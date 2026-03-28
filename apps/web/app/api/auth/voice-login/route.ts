import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ElevenLabsSttProvider } from "@/lib/ai/providers/elevenlabs-stt.provider";
import { phraseMatches } from "@/lib/voice-verification";

/**
 * POST /api/auth/voice-login
 *
 * 1. Receive email + audio
 * 2. Look up user_profiles by email → get stored voice_phrase
 * 3. Transcribe audio via ElevenLabs STT
 * 4. Compare transcript with stored phrase
 * 5. If match → sign in with Supabase Auth and return session
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { success: false, message: "Server configuration error", data: null },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { success: false, message: "Email is required", data: null },
      { status: 400 }
    );
  }

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json(
      { success: false, message: "Voice recording is required", data: null },
      { status: 400 }
    );
  }

  // Service role client to bypass RLS
  const supabase = createClient(url, serviceKey);

  // Look up voice phrase by email
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("voice_phrase, id")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { success: false, message: "Database error", data: null },
      { status: 500 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      {
        success: false,
        message: "No account found with this email. Please sign up first.",
        data: null,
      },
      { status: 404 }
    );
  }

  if (!profile.voice_phrase) {
    return NextResponse.json(
      {
        success: false,
        message:
          "No voice phrase set for this account. Please sign in with email and set your phrase.",
        data: null,
      },
      { status: 400 }
    );
  }

  // Transcribe audio
  if (!elevenLabsKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Voice service unavailable. Please use email login.",
        data: null,
      },
      { status: 503 }
    );
  }

  let transcript: string;
  try {
    const stt = new ElevenLabsSttProvider(elevenLabsKey);
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    transcript = await stt.transcribe(audioBuffer, audioFile.name || "audio.webm");
  } catch (err) {
    console.error("[VoiceLogin] STT error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Could not process voice recording. Please try again or use email login.",
        data: null,
      },
      { status: 500 }
    );
  }

  // Compare phrases
  const { matches } = phraseMatches(transcript, profile.voice_phrase);

  if (!matches) {
    return NextResponse.json(
      {
        success: false,
        message: "Voice phrase did not match. Please try again.",
        data: { transcript },
      },
      { status: 401 }
    );
  }

  // Phrase matched — look up the user's auth credentials and generate a sign-in link
  // Use admin API to generate a magic link or sign the user in directly
  try {
    // Generate a one-time sign-in link for this user
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });

    if (linkError || !linkData) {
      // Fallback: report verified but can't auto-sign-in without service role
      return NextResponse.json({
        success: true,
        message: "Voice verified! Use the token to complete sign in.",
        data: {
          verified: true,
          transcript,
          token: null,
        },
      });
    }

    // Extract the token from the generated link
    const token = linkData.properties?.hashed_token;
    const redirectUrl = linkData.properties?.action_link;

    return NextResponse.json({
      success: true,
      message: "Voice verified",
      data: {
        verified: true,
        transcript,
        token,
        redirectUrl,
      },
    });
  } catch {
    // If admin API not available, still report success
    return NextResponse.json({
      success: true,
      message: "Voice verified",
      data: {
        verified: true,
        transcript,
        token: null,
      },
    });
  }
}
