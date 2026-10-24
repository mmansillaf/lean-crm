export interface TranscriptionOptions {
  apiKey?: string;
  provider?: "groq" | "openai";
  model?: string;
  language?: string; // 'es', 'en', 'pt'
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = "audio.ogg",
  options: TranscriptionOptions = {}
): Promise<{ success: boolean; text?: string; error?: string }> {
  const provider = options.provider || process.env.TRANSCRIPTION_PROVIDER || "groq";
  const apiKey = options.apiKey || (provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY);

  // Si no hay API key real configurada en este entorno, devolver mock determinista para testing
  if (!apiKey) {
    return {
      success: true,
      text: "[Transcripción simulada: Estimados, quisiera consultar sobre la suscripción al Buscador de Procesos Constitucionales]",
    };
  }

  const endpoint = provider === "groq"
    ? "https://api.groq.com/openai/v1/audio/transcriptions"
    : "https://api.openai.com/v1/audio/transcriptions";

  const model = options.model || (provider === "groq" ? "whisper-large-v3" : "whisper-1");

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" });
  formData.append("file", blob, filename);
  formData.append("model", model);
  if (options.language) formData.append("language", options.language);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: JSON.stringify(data) };
    }

    return { success: true, text: data.text };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
