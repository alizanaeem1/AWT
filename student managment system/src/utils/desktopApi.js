const missingApiMessage =
  "Desktop API bridge is unavailable. Please run the app through Electron (`npm run dev`) instead of browser-only mode.";

function missing() {
  throw new Error(missingApiMessage);
}

const fallback = {
  auth: { signup: missing, login: missing, getProfile: missing, updateProfile: missing, changePassword: missing },
  semesters: { list: missing, create: missing, setActive: missing, update: missing, remove: missing, exportZip: missing },
  subjects: { list: missing, save: missing, remove: missing },
  assignments: { listBySemester: missing, save: missing, remove: missing },
  files: {
    list: missing,
    listByAssignment: missing,
    add: missing,
    remove: missing,
    pick: missing,
    open: missing,
    reveal: missing,
    asDataUrl: missing
  },
  analytics: { dashboard: missing },
  timetable: { listBySemester: missing, save: missing, remove: missing },
  reports: { exportGpaPdf: missing },
  notify: missing,
  onInboxMirrorFromMain: () => () => {},
  window: { minimize: missing, maximize: missing, close: missing },
  ai: {
    generate: async (payload) => {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: payload?.text ?? "",
          ...(payload?.attachment ? { attachment: payload.attachment } : {})
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: typeof body?.error === "string" ? body.error : `Request failed (${res.status})` };
      }
      if (body?.imagePrompt && body?.description) {
        return { ok: true, data: { imagePrompt: body.imagePrompt, description: body.description } };
      }
      return { ok: false, error: "Unexpected response from server." };
    }
  }
};

/**
 * Merge preload API with fallbacks. If an old Electron session has `desktopAPI` without `semesters.remove`,
 * use `invoke("semester:remove", payload)` when `invoke` exists (added in preload).
 */
function buildDesktopAPI() {
  const raw = typeof window !== "undefined" ? window.desktopAPI : null;
  if (!raw) return fallback;

  const inv = typeof raw.invoke === "function" ? raw.invoke.bind(raw) : null;
  const s = raw.semesters || {};

  const semesters = {
    list: s.list ?? (inv ? (userId) => inv("semester:list", userId) : fallback.semesters.list),
    create: s.create ?? (inv ? (payload) => inv("semester:create", payload) : fallback.semesters.create),
    setActive: s.setActive ?? (inv ? (payload) => inv("semester:setActive", payload) : fallback.semesters.setActive),
    update: s.update ?? (inv ? (payload) => inv("semester:update", payload) : fallback.semesters.update),
    remove: s.remove ?? (inv ? (payload) => inv("semester:remove", payload) : fallback.semesters.remove),
    exportZip: s.exportZip ?? (inv ? (payload) => inv("semester:export", payload) : fallback.semesters.exportZip)
  };

  const ff = raw.files || {};
  const files = {
    ...fallback.files,
    ...ff,
    listByAssignment:
      ff.listByAssignment ??
      (inv ? (assignmentId) => inv("file:listByAssignment", assignmentId) : fallback.files.listByAssignment)
  };

  const ai = {
    generate:
      raw.ai?.generate ??
      (inv ? (payload) => inv("ai:generate", payload) : fallback.ai.generate)
  };

  const tt = raw.timetable || {};
  const timetable = {
    listBySemester:
      tt.listBySemester ??
      (inv ? (payload) => inv("timetable:listBySemester", payload) : fallback.timetable.listBySemester),
    save: tt.save ?? (inv ? (payload) => inv("timetable:save", payload) : fallback.timetable.save),
    remove: tt.remove ?? (inv ? (payload) => inv("timetable:remove", payload) : fallback.timetable.remove)
  };

  const notify = typeof raw.notify === "function" ? raw.notify : fallback.notify;
  const onInboxMirrorFromMain =
    typeof raw.onInboxMirrorFromMain === "function" ? raw.onInboxMirrorFromMain : fallback.onInboxMirrorFromMain;

  return {
    ...fallback,
    ...raw,
    notify,
    onInboxMirrorFromMain,
    semesters,
    files,
    ai,
    timetable
  };
}

export const desktopAPI = buildDesktopAPI();
