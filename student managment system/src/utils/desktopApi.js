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
  files: { list: missing, add: missing, remove: missing, pick: missing, open: missing, reveal: missing, asDataUrl: missing },
  analytics: { dashboard: missing },
  reports: { exportGpaPdf: missing },
  notify: missing,
  window: { minimize: missing, maximize: missing, close: missing }
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

  return {
    ...fallback,
    ...raw,
    semesters
  };
}

export const desktopAPI = buildDesktopAPI();
