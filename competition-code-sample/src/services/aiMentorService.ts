/**
 * AI Mentor Service — clean async request layer with streaming, timeout, and fallback.
 */

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`;
const TIMEOUT_MS = 30_000;
const FALLBACK_MSG = "AI is temporarily unavailable. Please try again later.";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface StreamCallbacks {
  onToken: (fullText: string) => void;
  onDone: (finalText: string) => void;
  onError: (message: string) => void;
}

export function createAbortable() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  return {
    signal: controller.signal,
    cancel: () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    },
    clearTimeout: () => window.clearTimeout(timeoutId),
  };
}

export async function streamMentorChat(
  messages: ChatMessage[],
  accessToken: string | undefined,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  preferredLanguage?: string
): Promise<void> {
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  let accumulated = "";

  if (!anonKey || !CHAT_URL || CHAT_URL.includes("undefined")) {
    callbacks.onError("Configuration error. Please refresh the page and try again.");
    return;
  }

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken ?? anonKey}`,
      },
      body: JSON.stringify({ messages, preferredLanguage }),
      signal,
    });

    if (!resp.ok) {
      let errorMsg = FALLBACK_MSG;
      try {
        const err = await resp.json();
        if (typeof err?.error === "string") errorMsg = err.error;
      } catch {
        // ignore parse errors
      }
      callbacks.onError(errorMsg);
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) {
      callbacks.onError(FALLBACK_MSG);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    const processLines = (flush = false) => {
      const lines = buffer.split("\n");
      buffer = flush ? "" : (lines.pop() ?? "");

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(":") || !line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const content =
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.choices?.[0]?.message?.content ??
            "";
          if (typeof content === "string" && content.length > 0) {
            accumulated += content;
            callbacks.onToken(accumulated);
          }
        } catch {
          // skip malformed chunks
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      processLines();
    }

    buffer += decoder.decode();
    processLines(true);

    if (!accumulated.trim()) {
      callbacks.onError(FALLBACK_MSG);
    } else {
      callbacks.onDone(accumulated);
    }
  } catch (error: any) {
    if (error?.name === "AbortError") {
      callbacks.onError("Request timed out. Please try again.");
    } else {
      console.error("AI Mentor stream error:", error);
      callbacks.onError(FALLBACK_MSG);
    }
  }
}
