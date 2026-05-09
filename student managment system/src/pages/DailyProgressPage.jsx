import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { desktopAPI } from "../utils/desktopApi";

function dailyProgressStorageKey(userId) {
  return `sms-daily-progress-v1-${userId}`;
}

const MAX_ATTACHMENT_BYTES_SAVE = 900_000;

function serializeAttachmentForStorage(att) {
  if (!att) return null;
  if (att.kind === "text") {
    return { kind: "text", fileName: att.fileName, extractedText: att.extractedText };
  }
  if (att.kind === "image") {
    const decodedApprox = Math.floor(((att.base64?.length ?? 0) * 3) / 4);
    if (decodedApprox > MAX_ATTACHMENT_BYTES_SAVE) return null;
    const previewDataUrl =
      typeof att.previewDataUrl === "string"
        ? att.previewDataUrl
        : `data:${att.mimeType};base64,${att.base64}`;
    return {
      kind: "image",
      fileName: att.fileName,
      mimeType: att.mimeType,
      base64: att.base64,
      previewDataUrl
    };
  }
  return null;
}

function restoreAttachmentFromStorage(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.kind === "text" && typeof raw.extractedText === "string") {
    return {
      kind: "text",
      fileName: typeof raw.fileName === "string" ? raw.fileName : "notes.txt",
      extractedText: raw.extractedText
    };
  }
  if (raw.kind === "image" && typeof raw.base64 === "string" && typeof raw.mimeType === "string") {
    const previewDataUrl =
      typeof raw.previewDataUrl === "string"
        ? raw.previewDataUrl
        : `data:${raw.mimeType};base64,${raw.base64}`;
    return {
      kind: "image",
      fileName: typeof raw.fileName === "string" ? raw.fileName : "photo",
      mimeType: raw.mimeType,
      base64: raw.base64,
      previewDataUrl
    };
  }
  return null;
}

const MAX_IMG_BYTES = 2 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 512 * 1024;
const ACCEPTED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * @returns {Promise<{ kind: 'image'; fileName: string; mimeType: string; base64: string; previewDataUrl: string } | { kind: 'text'; fileName: string; extractedText: string }>}
 */
function readDailyAttachment(file) {
  return new Promise((resolve, reject) => {
    const looksText =
      file.type === "text/plain" ||
      file.type === "text/markdown" ||
      /\.(txt|md)$/i.test(file.name || "");

    if (file.type.startsWith("image/")) {
      if (!ACCEPTED_IMAGE.includes(file.type)) {
        reject(new Error("Use JPG, PNG, WebP, or GIF."));
        return;
      }
      if (file.size > MAX_IMG_BYTES) {
        reject(new Error("Keep images under 2 MB."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result ?? "");
        const comma = dataUrl.indexOf(",");
        const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : "";
        if (!base64) {
          reject(new Error("Could not read the image."));
          return;
        }
        resolve({
          kind: "image",
          fileName: file.name || "photo",
          mimeType: file.type,
          base64,
          previewDataUrl: dataUrl
        });
      };
      reader.onerror = () => reject(new Error("Could not read the image."));
      reader.readAsDataURL(file);
      return;
    }

    if (looksText) {
      if (file.size > MAX_TEXT_FILE_BYTES) {
        reject(new Error("Text files must be under 512 KB."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const extractedText = typeof reader.result === "string" ? reader.result : "";
        resolve({
          kind: "text",
          fileName: file.name || "notes.txt",
          extractedText
        });
      };
      reader.onerror = () => reject(new Error("Could not read the file."));
      reader.readAsText(file, "UTF-8");
      return;
    }

    reject(new Error("Unsupported file — use an image (JPG, PNG, WebP, GIF) or .txt / .md."));
  });
}

function Spinner({ className = "" }) {
  return (
    <svg
      className={`h-5 w-5 animate-spin text-white ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function GlassCard({ isDark, children, className = "" }) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-lg transition-[box-shadow,transform] duration-300 hover:shadow-xl ${
        isDark
          ? "border-white/[0.08] bg-white/[0.04] backdrop-blur-md shadow-black/30"
          : "border-slate-200/90 bg-white/90 backdrop-blur-sm shadow-slate-200/50"
      } ${className}`}
      style={
        isDark
          ? { boxShadow: "0 0 0 1px rgba(139, 92, 246, 0.12), 0 8px 32px -8px rgba(0,0,0,0.5)" }
          : undefined
      }
    >
      {children}
    </article>
  );
}

function CopyChip({ label, isDark, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
        isDark
          ? "border border-white/15 bg-white/5 text-slate-200 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
          : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
      }`}
    >
      <span aria-hidden>{label}</span>
    </button>
  );
}

export default function DailyProgressPage() {
  const { user, theme, pushToast } = useApp();
  const isDark = theme === "dark";
  const fileInputRef = useRef(null);
  const lastHydratedUserRef = useRef(null);

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useLayoutEffect(() => {
    const uid = user?.id;
    if (uid == null) {
      lastHydratedUserRef.current = null;
      return;
    }
    if (lastHydratedUserRef.current === uid) return;
    lastHydratedUserRef.current = uid;
    try {
      const raw = localStorage.getItem(dailyProgressStorageKey(uid));
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.text === "string") setText(d.text);
      if (d.result && typeof d.result.imagePrompt === "string" && typeof d.result.description === "string") {
        setResult({ imagePrompt: d.result.imagePrompt, description: d.result.description });
      }
      const att = restoreAttachmentFromStorage(d.attachment);
      if (att) setAttachment(att);
    } catch (_) {
      /* ignore corrupt storage */
    }
  }, [user?.id]);

  useEffect(() => {
    const uid = user?.id;
    if (uid == null) return;
    const tid = window.setTimeout(() => {
      const payload = {
        v: 1,
        savedAt: new Date().toISOString(),
        text,
        result,
        attachment: serializeAttachmentForStorage(attachment)
      };
      try {
        localStorage.setItem(dailyProgressStorageKey(uid), JSON.stringify(payload));
      } catch (_) {
        const light = { ...payload, attachment: attachment?.kind === "text" ? payload.attachment : null };
        try {
          localStorage.setItem(dailyProgressStorageKey(uid), JSON.stringify(light));
        } catch {
          /* quota full */
        }
      }
    }, 250);
    return () => window.clearTimeout(tid);
  }, [user?.id, text, result, attachment]);

  const canSubmit = Boolean(text.trim() || attachment);
  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  const clearSaved = useCallback(() => {
    setText("");
    setAttachment(null);
    setResult(null);
    if (user?.id != null) {
      try {
        localStorage.removeItem(dailyProgressStorageKey(user.id));
      } catch (_) {
        /* ignore */
      }
    }
    lastHydratedUserRef.current = user?.id ?? null;
    pushToast({ title: "Cleared", message: "Saved draft and output were removed.", variant: "success" });
  }, [user?.id, pushToast]);

  async function onPickFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    try {
      const parsed = await readDailyAttachment(file);
      setAttachment(parsed);
      pushToast({
        title: "Attachment ready",
        message: `"${parsed.fileName}" will be included when you generate.`,
        variant: "success"
      });
    } catch (err) {
      pushToast({
        title: "Could not attach",
        message: err?.message || "Invalid file.",
        variant: "error"
      });
    }
  }

  async function copyToClipboard(value, toastTitle) {
    try {
      await navigator.clipboard.writeText(value);
      pushToast({ title: toastTitle, message: "Copied to clipboard.", variant: "success" });
    } catch {
      pushToast({ title: "Copy failed", message: "Could not access the clipboard.", variant: "error" });
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);

    let apiAttachment;
    if (attachment) {
      if (attachment.kind === "image") {
        apiAttachment = {
          kind: "image",
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          base64: attachment.base64
        };
      } else if (attachment.kind === "text") {
        apiAttachment = {
          kind: "text",
          fileName: attachment.fileName,
          extractedText: attachment.extractedText
        };
      }
    }

    try {
      const res = await desktopAPI.ai.generate({ text, attachment: apiAttachment });
      if (!res?.ok) {
        pushToast({
          title: "Generation failed",
          message: res?.error || "Could not generate content.",
          variant: "error"
        });
        return;
      }
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h2 className={`text-2xl font-semibold tracking-tight md:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}>
          Daily Progress ✍️
        </h2>
        <p className={`mt-1 text-sm md:text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Write what you worked on today — or add a photo or notes file
        </p>
        <p className={`mt-2 max-w-2xl text-xs leading-relaxed ${isDark ? "text-slate-500" : "text-slate-500"}`}>
          <span className="font-medium text-slate-400">محفوظ</span> — یہی پیرا اور AI کا جواب اسی کمپیوٹر پر محفوظ رہے گا؛ دوبارہ اس صفحے پر آئیں تو وہی نظر آئے گا۔{" "}
          <span className="opacity-80">(Saved locally — your notes and last output return when you open this page again.)</span>
        </p>
      </header>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div>
          <label htmlFor="daily-notes" className="sr-only">
            Today&apos;s work
          </label>
          <textarea
            id="daily-notes"
            value={text}
            onChange={(ev) => setText(ev.target.value)}
            placeholder="Today I worked on..."
            rows={6}
            disabled={loading}
            className={`w-full resize-y rounded-2xl border px-4 py-3 text-[15px] leading-relaxed shadow-inner transition outline-none placeholder:text-slate-500 disabled:opacity-60 ${
              isDark
                ? "border-white/[0.1] bg-white/[0.05] text-slate-100 backdrop-blur-sm focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                : "border-slate-200 bg-white text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            }`}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={onPickFile}
        />

        <GlassCard isDark={isDark} className="!p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={openFilePicker}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                isDark
                  ? "border-white/15 bg-white/[0.04] text-slate-200 hover:border-violet-400/35 hover:bg-violet-500/10"
                  : "border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-300 hover:bg-white"
              }`}
            >
              📎 Photo or file
            </button>
            <p className={`text-xs md:text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              JPG · PNG · WebP · GIF (max 2 MB) or plain <span className="whitespace-nowrap">.txt / .md</span>
            </p>
          </div>

          {attachment ? (
            <div
              className={`mt-4 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start ${
                isDark ? "border-white/[0.08] bg-black/20" : "border-slate-200 bg-slate-50/80"
              }`}
            >
              {attachment.kind === "image" && attachment.previewDataUrl ? (
                <img
                  src={attachment.previewDataUrl}
                  alt=""
                  className="h-24 w-auto max-w-[200px] rounded-lg border border-white/10 object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                  {attachment.kind === "image" ? "🖼️ Image" : "📄 Text file"}: {attachment.fileName}
                </p>
                {attachment.kind === "text" ? (
                  <p className={`mt-1 line-clamp-3 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {attachment.extractedText}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setAttachment(null)}
                  className={`mt-2 text-xs font-medium underline-offset-2 hover:underline disabled:opacity-50 ${
                    isDark ? "text-rose-400" : "text-rose-600"
                  }`}
                >
                  Remove attachment
                </button>
              </div>
            </div>
          ) : null}
        </GlassCard>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/45 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_40px_-4px_rgba(139,92,246,0.55)] group-hover:[box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : (
                <>
                  Generate <span aria-hidden>🚀</span>
                </>
              )}
            </span>
          </button>
        </div>
      </form>

      {text.trim() || result || attachment ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Last session is kept on this device.</p>
          <button
            type="button"
            onClick={clearSaved}
            className={`text-xs font-medium underline-offset-2 hover:underline ${
              isDark ? "text-rose-400/90" : "text-rose-600"
            }`}
          >
            Clear saved
          </button>
        </div>
      ) : null}

      {result ? (
        <section className="mt-10 space-y-5" aria-live="polite">
          <h3 className={`text-sm font-medium uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-500"}`}>
            Output
          </h3>

          <GlassCard isDark={isDark} className="ring-1 ring-violet-500/10 hover:ring-violet-400/25">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  🎨
                </span>
                <h4 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Image Prompt</h4>
              </div>
              <CopyChip
                label="📋 Copy"
                isDark={isDark}
                onClick={() => copyToClipboard(result.imagePrompt, "Image prompt")}
              />
            </div>
            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {result.imagePrompt}
            </p>
          </GlassCard>

          <GlassCard isDark={isDark} className="ring-1 ring-blue-500/10 hover:ring-blue-400/20">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  📝
                </span>
                <h4 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Description</h4>
              </div>
              <CopyChip
                label="📋 Copy"
                isDark={isDark}
                onClick={() => copyToClipboard(result.description, "Description")}
              />
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>{result.description}</p>
          </GlassCard>
        </section>
      ) : null}
    </div>
  );
}
