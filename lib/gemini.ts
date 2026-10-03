import { GoogleGenAI } from "@google/genai";

export async function generateJson<T = unknown>(
  system: string,
  user: string
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const ai = new GoogleGenAI({ apiKey });

  const executeCall = async (): Promise<string> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out after 30 seconds")), 30000)
    );

    const callPromise = ai.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const res = await Promise.race([callPromise, timeoutPromise]);
    if (!res.text) {
      throw new Error("No text response from Gemini");
    }
    return res.text;
  };

  // First try
  try {
    const rawText = await executeCall();
    return JSON.parse(rawText) as T;
  } catch (err: unknown) {
    // Retry once on bad JSON or network error
    try {
      const retryText = await executeCall();
      return JSON.parse(retryText) as T;
    } catch (retryErr: unknown) {
      const message = retryErr instanceof Error ? retryErr.message : String(retryErr);
      throw new Error(`Gemini JSON generation failed after retry: ${message}`);
    }
  }
}
