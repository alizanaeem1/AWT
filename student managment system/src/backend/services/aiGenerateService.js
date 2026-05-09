/**
 * Turns daily work notes (+ optional screenshot or text file) into an image prompt and LinkedIn-style blurb.
 * Uses Gemini when GEMINI_API_KEY is set, otherwise Claude when ANTHROPIC_API_KEY is set.
 */

const MAX_EXTRACTED_TEXT = 48000;
const MAX_IMAGE_BASE64_LENGTH = 2_800_000; // ~2.1MB decoded — keeps IPC reasonably sized

const ALLOWED_IMAGE_MIME = /** @type {const} */ ({
  "image/jpeg": true,
  "image/png": true,
  "image/webp": true,
  "image/gif": true
});

/**
 * @param {unknown} raw
 * @returns {{ kind: 'text'; fileName: string; extractedText: string } | { kind: 'image'; fileName: string; mimeType: string; base64: string } | null}
 */
function normalizeAttachment(raw) {
  if (!raw || typeof raw !== "object") return null;

  /** @type {any} */
  const o = raw;
  if (o.kind === "text") {
    const extracted =
      typeof o.extractedText === "string"
        ? o.extractedText.replace(/\u0000/g, "").trim()
        : "";
    if (!extracted) return null;
    const fileName =
      typeof o.fileName === "string" ? o.fileName.slice(0, 256).replace(/[<>]|\.{2}/g, "_") : "notes.txt";
    return { kind: "text", fileName, extractedText: extracted.slice(0, MAX_EXTRACTED_TEXT) };
  }

  if (o.kind === "image") {
    const mimeType = typeof o.mimeType === "string" ? o.mimeType.toLowerCase().trim() : "";
    const base64 = typeof o.base64 === "string" ? o.base64.replace(/\s/g, "") : "";
    if (!ALLOWED_IMAGE_MIME[mimeType] || !base64.length) return null;
    if (base64.length > MAX_IMAGE_BASE64_LENGTH) {
      throw new Error("Image is too large. Use a smaller file (under ~2 MB).");
    }
    const fileName =
      typeof o.fileName === "string" ? o.fileName.slice(0, 256).replace(/[<>]|\.{2}/g, "_") : "photo";
    return { kind: "image", fileName, mimeType, base64 };
  }

  return null;
}

function buildPrompt(userText, normalizedAttachment) {
  const trimmed = typeof userText === "string" ? userText.trim() : "";
  const written = trimmed.length ? trimmed : "(No separate written summary — infer from attachments only if needed.)";

  let extras = "";
  if (normalizedAttachment?.kind === "text") {
    extras = `\n\nAttached text file (${normalizedAttachment.fileName}):\n___\n${normalizedAttachment.extractedText}\n___\n`;
  } else if (normalizedAttachment?.kind === "image") {
    extras = `\n\nThe student attached an image (${normalizedAttachment.fileName}). Use what you see in the image together with any written notes to shape the outputs.\n`;
  }

  return `You are an assistant that converts student daily work into professional content.

User Input:
${JSON.stringify(written)}${extras}
Generate ONLY:

1. A high-quality AI image generation prompt (modern, dark UI, tech style, professional, detailed, suitable for DALL·E or Midjourney)

2. A short clean description (2-3 lines, simple, professional, suitable for LinkedIn or portfolio)

Return ONLY JSON in this format:

{
  "imagePrompt": "...",
  "description": "..."
}`;
}

function extractJsonFromText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("AI returned an empty response.");
  }
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  return JSON.parse(candidate);
}

function normalizeResult(parsed) {
  const imagePrompt = typeof parsed.imagePrompt === "string" ? parsed.imagePrompt.trim() : "";
  const description = typeof parsed.description === "string" ? parsed.description.trim() : "";
  if (!imagePrompt || !description) {
    throw new Error("AI response was missing imagePrompt or description.");
  }
  return { imagePrompt, description };
}

/**
 * Avoid gemini-2.0-flash on many free tiers (Google reports limit: 0 until billing).
 * GEMINI_MODEL in .env is tried first, then these (deduped).
 */
const GEMINI_FALLBACK_CHAIN = [
  "gemini-1.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash-8b",
  "gemini-2.5-flash"
];

function stringifyGeminiDetail(body) {
  try {
    return JSON.stringify(body || {}).toLowerCase();
  } catch {
    return "";
  }
}

/** True if another model might work (quota / wrong model); false for fatal errors like invalid API key. */
function geminiShouldTryNextModel(httpStatus, body) {
  const apiCode = Number(body?.error?.code ?? 0);
  if (apiCode === 429 || apiCode === 503) return true;

  const errStatus = String(body?.error?.status || "").toUpperCase();
  if (errStatus === "RESOURCE_EXHAUSTED" || errStatus === "UNAVAILABLE") return true;

  const msg = String(body?.error?.message || "").toLowerCase();
  const hay = `${msg} ${stringifyGeminiDetail(body)}`;
  if (
    hay.includes("quota") ||
    hay.includes("rate limit") ||
    hay.includes("resource_exhausted") ||
    hay.includes("tokens_per_day") ||
    hay.includes("requests_per_day") ||
    hay.includes("_per_minute") ||
    hay.includes("limit: 0") ||
    hay.includes("free_tier") ||
    hay.includes("plan and billing") ||
    hay.includes("billing details")
  ) {
    return true;
  }

  const retryHttp = httpStatus === 429 || httpStatus === 503 || httpStatus === 408;
  if (retryHttp) return true;

  // Google sometimes returns quota walls as 403 with billing/quota wording — but 403 alone can be invalid key.
  if (httpStatus === 403 || apiCode === 403) {
    if (errStatus === "RESOURCE_EXHAUSTED") return true;
    if (msg.includes("quota") || msg.includes("billing") || msg.includes("limit")) return true;
    return false;
  }

  const nf = hay.includes("not found") || hay.includes("does not exist");
  if ((httpStatus === 404 || apiCode === 404) && (nf || hay.includes("model"))) return true;

  return false;
}

function geminiRetryPlainInsteadOfJsonMode(res, body) {
  if (!(res.status === 400 || Number(body?.error?.code) === 400)) return false;
  const st = String(body?.error?.status || "").toUpperCase();
  const msg = String(body?.error?.message || "").toLowerCase();
  if (st === "INVALID_ARGUMENT") return true;
  if (
    msg.includes("json") ||
    msg.includes("mime") ||
    msg.includes("responsemimetype") ||
    msg.includes("response schema") ||
    msg.includes("unknown name")
  ) {
    return true;
  }
  return false;
}

function throwGeminiHttpError(modelId, res, body) {
  const hint = body?.error?.message || JSON.stringify(body) || res.statusText;
  const err = new Error(`Gemini request failed (${modelId}): ${hint}`);
  /** @type {any} */
  const tagged = err;
  tagged.httpStatus = res.status;
  tagged.detailBody = body;
  throw tagged;
}

async function callGeminiOnce(apiKey, modelId, parts) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelId
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  for (const useJsonMime of [true, false]) {
    const generationConfig = { temperature: 0.7 };
    if (useJsonMime) generationConfig.responseMimeType = "application/json";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig
      })
    });

    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      const raw = body?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
      try {
        return extractJsonFromText(raw);
      } catch (_) {
        if (useJsonMime && raw.trim().length > 0) continue;
        throw new Error(`Gemini (${modelId}) returned a reply that could not be parsed as JSON. Try again.`);
      }
    }

    if (useJsonMime && geminiRetryPlainInsteadOfJsonMode(res, body)) {
      continue;
    }

    throwGeminiHttpError(modelId, res, body);
  }

  throw new Error(`Gemini request failed (${modelId}): exhausted JSON and plain retries.`);
}

/**
 * @param {string} geminiModelFromOptions - optional single model from env (Vite loads into options)
 */
function buildGeminiModelChain(preferredRaw) {
  const preferred = String(preferredRaw || "").trim();
  if (!preferred) return [...GEMINI_FALLBACK_CHAIN];
  const dedup = GEMINI_FALLBACK_CHAIN.filter((m) => m !== preferred);
  return [preferred, ...dedup];
}

async function callGemini(apiKey, promptText, inlineImage, geminiModelFromOptions = "") {
  const parts = [];
  if (inlineImage) {
    parts.push({ inlineData: { mimeType: inlineImage.mimeType, data: inlineImage.base64 } });
  }
  parts.push({ text: promptText });

  const chain = buildGeminiModelChain(geminiModelFromOptions || process.env.GEMINI_MODEL || "");

  let lastUserMessage = "Unknown error.";
  for (let i = 0; i < chain.length; i++) {
    const modelId = chain[i];
    try {
      return await callGeminiOnce(apiKey, modelId, parts);
    } catch (e) {
      /** @type {any} */
      const ex = e;
      lastUserMessage = ex.message || String(e);
      const status = typeof ex.httpStatus === "number" ? ex.httpStatus : 0;
      const detail = ex.detailBody ?? {};
      const tryNext = i < chain.length - 1 && geminiShouldTryNextModel(status, detail);
      if (!tryNext) {
        throw new Error(
          `${lastUserMessage}\n---\nFree tier limits (limit: 0) often apply until billing is enabled: https://ai.google.dev/pricing · https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas · You can also set ANTHROPIC_API_KEY in .env instead. Restart the Electron app after changing .env.`
        );
      }
    }
  }
  throw new Error(lastUserMessage);
}

async function callAnthropic(apiKey, promptText, inlineImage) {
  /** @type {{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }[]} */
  const content = [];

  if (inlineImage) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: inlineImage.mimeType,
        data: inlineImage.base64
      }
    });
  }

  content.push({ type: "text", text: promptText });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [{ role: "user", content }]
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message || JSON.stringify(body) || res.statusText;
    throw new Error(`Claude request failed: ${msg}`);
  }
  const blocks = body?.content || [];
  const text = blocks.map((b) => (b.type === "text" ? b.text : "")).join("");
  return extractJsonFromText(text);
}

/**
 * @param {string} text
 * @param {{ geminiApiKey?: string, anthropicApiKey?: string, attachment?: unknown, geminiModel?: string }} [options]
 */
async function generateDailyProgressContent(text, options = {}) {
  const trimmed = (text ?? "").trim();
  const normalizedAttachment = normalizeAttachment(options?.attachment);

  const hasWritten = trimmed.length > 0;
  const hasTextFile = normalizedAttachment?.kind === "text";
  const hasImage = normalizedAttachment?.kind === "image";

  if (!hasWritten && !hasTextFile && !hasImage) {
    throw new Error("Please describe what you learned today, or attach a photo or text file.");
  }

  const geminiApiKey = options.geminiApiKey ?? process.env.GEMINI_API_KEY;
  const anthropicApiKey = options.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY;

  const prompt = buildPrompt(trimmed, normalizedAttachment);

  /** Image is sent multimodally — not inlined in text (except text-kind attachment, already in prompt). */
  const inlineImage = hasImage ? normalizedAttachment : null;

  let parsed;
  if (geminiApiKey) {
    parsed = await callGemini(geminiApiKey, prompt, inlineImage, options.geminiModel ?? "");
  } else if (anthropicApiKey) {
    parsed = await callAnthropic(anthropicApiKey, prompt, inlineImage);
  } else {
    throw new Error(
      "Set GEMINI_API_KEY or ANTHROPIC_API_KEY (e.g. in a .env file at the project root) to use AI generation."
    );
  }

  return normalizeResult(parsed);
}

module.exports = { generateDailyProgressContent, buildPrompt, normalizeAttachment };
