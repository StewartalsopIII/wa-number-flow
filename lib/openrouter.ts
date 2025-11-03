import { env } from "process";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "google/gemini-2.5-flash";
const MAX_RETRIES = 3;

interface OpenRouterChoice {
  message?: {
    content?: string | Array<{ type: string; text?: string }> | null;
  } | null;
}

interface OpenRouterSuccessResponse {
  choices?: OpenRouterChoice[];
}

function tryParseJson(raw: string): unknown {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  const unwrapCodeFence = (value: string) => {
    if (!value.startsWith("```")) {
      return value;
    }

    const fenceRemoved = value.replace(/^```(?:json)?/i, "").replace(/```$/i, "");
    return fenceRemoved.trim();
  };

  const parse = (value: string) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return error;
    }
  };

  const attemptOrder = [trimmed, unwrapCodeFence(trimmed)];

  for (const candidate of attemptOrder) {
    const result = parse(candidate);
    if (!(result instanceof Error)) {
      return result;
    }
  }

  const braceMatch = trimmed.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch (error) {
      console.error("Failed to parse JSON from brace match", error, braceMatch[0]);
    }
  }

  return null;
}

function extractJsonPayload(choice: OpenRouterChoice): unknown {
  const content = choice.message?.content;

  if (!content) {
    return null;
  }

  if (typeof content === "string") {
    const parsed = tryParseJson(content);
    if (parsed === null) {
      console.error("Failed to parse string content from OpenRouter", content);
    }
    return parsed;
  }

  for (const part of content) {
    if (part.type === "text" && part.text) {
      const parsed = tryParseJson(part.text);
      if (parsed !== null) {
        return parsed;
      }
      console.error("Failed to parse structured content from OpenRouter", part.text);
    }
  }

  return null;
}

export class OpenRouterError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export async function callOpenRouter(
  base64Image: string,
  mimeType: string,
): Promise<string[]> {
  const apiKey = env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterError("Missing OPENROUTER_API_KEY environment variable");
  }

  const payload = {
    model: MODEL_ID,
    messages: [
      {
        role: "system",
        content:
          "You are an OCR extraction assistant. Read the provided screenshot image. Extract every phone number you find. Return ONLY valid JSON with a 'numbers' array containing each phone number as a string of digits only (no spaces, hyphens, or other characters). Include country codes if visible. No other text in your response.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all phone numbers from this image. Return only JSON format.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new OpenRouterError(
          `OpenRouter request failed with status ${response.status}: ${errorText}`,
          response.status,
        );
      }

      const data = (await response.json()) as OpenRouterSuccessResponse;
      const choice = data.choices?.[0];

      if (!choice) {
        throw new OpenRouterError("OpenRouter response did not contain choices");
      }

      const parsed = extractJsonPayload(choice);

      if (!parsed || typeof parsed !== "object" || !("numbers" in parsed)) {
        throw new OpenRouterError("OpenRouter did not return the expected JSON structure");
      }

      const numbersValue = (parsed as { numbers: unknown }).numbers;

      if (!Array.isArray(numbersValue)) {
        throw new OpenRouterError("OpenRouter numbers payload is not an array");
      }

      const numbers = numbersValue.map((value) => {
        if (typeof value !== "string") {
          return String(value ?? "");
        }
        return value;
      });

      return numbers;
    } catch (error) {
      const delay = Math.min(1000 * 2 ** (attempt - 1), 4000);

      if (attempt === MAX_RETRIES) {
        if (error instanceof OpenRouterError) {
          throw error;
        }
        throw new OpenRouterError(
          error instanceof Error ? error.message : "Unknown OpenRouter error",
        );
      }

      console.warn(
        `OpenRouter request failed (attempt ${attempt} of ${MAX_RETRIES}). Retrying in ${delay}ms`,
        error,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new OpenRouterError("OpenRouter request exhausted retries");
}
