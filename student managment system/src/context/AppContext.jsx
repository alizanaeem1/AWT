import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { desktopAPI } from "../utils/desktopApi";

const AppContext = createContext(null);
const sessionKey = "sms-session";

function notificationsStorageKey(userId) {
  return `sms-notifications-inbox-v1-${userId}`;
}

/** @param {unknown} data - semester:list API: array (legacy) or { semesters, overallCgpa } */
function parseSemesterListResponse(data) {
  if (Array.isArray(data)) {
    return { rows: data, overallCgpa: null };
  }
  if (data && Array.isArray(data.semesters)) {
    const raw = data.overallCgpa;
    const n = raw == null || raw === "" ? null : Number(raw);
    return {
      rows: data.semesters,
      overallCgpa: n != null && Number.isFinite(n) ? n : null
    };
  }
  return { rows: [], overallCgpa: null };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [overallCgpa, setOverallCgpa] = useState(null);
  const [activeSemester, setActiveSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dataVersion, setDataVersion] = useState(0);
  /** Bumps only on successful semester mutations; in-flight list() from before a mutation is dropped. Does not increment on list() start (avoids discarding a good list when a newer load fails). */
  const semesterListGeneration = useRef(0);
  /** Avoid persisting to localStorage before we finish hydrating from disk (prevents wiping saved inbox on login). */
  const notificationsReadyRef = useRef(false);

  const pushToast = useCallback((payload) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextToast = {
      id,
      title: payload.title || "Notice",
      message: payload.message || "",
      variant: payload.variant || "info"
    };
    setToasts((prev) => [...prev, nextToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, payload.durationMs || 3500);
  }, []);

  const loadSemesters = useCallback(
    async (userId) => {
      const myGen = semesterListGeneration.current;
      let res;
      try {
        res = await desktopAPI.semesters.list(userId);
      } catch (e) {
        if (myGen !== semesterListGeneration.current) return;
        pushToast({
          title: "Could not load semesters",
          message: e?.message || "Is the app running in Electron (npm run dev)?",
          variant: "error"
        });
        return;
      }
      if (myGen !== semesterListGeneration.current) return;
      if (!res?.ok) {
        pushToast({
          title: "Could not load semesters",
          message: res?.error || "Check that the app is running in Electron, then try again.",
          variant: "error"
        });
        return;
      }
      if (myGen !== semesterListGeneration.current) return;
      const { rows, overallCgpa: oc } = parseSemesterListResponse(res.data);
      setSemesters(rows);
      setOverallCgpa(oc);
      setActiveSemester((prev) => {
        const byId = prev != null ? rows.find((s) => Number(s.id) === Number(prev.id)) : null;
        if (byId) return byId;
        return rows.find((item) => item.isActive) || rows[0] || null;
      });
    },
    [pushToast]
  );

  const refreshSemesters = useCallback(async () => {
    if (!user?.id) return;
    await loadSemesters(user.id);
  }, [user?.id, loadSemesters]);

  useEffect(() => {
    const stored = localStorage.getItem(sessionKey);
    if (!stored) {
      setLoading(false);
      return;
    }

    const parsed = JSON.parse(stored);
    setUser(parsed.user);
    setTheme(parsed.theme || "dark");
    loadSemesters(parsed.user.id).finally(() => setLoading(false));
  }, [loadSemesters]);

  function saveSession(nextUser, nextTheme = theme) {
    localStorage.setItem(sessionKey, JSON.stringify({ user: nextUser, theme: nextTheme }));
  }

  async function login(email, password) {
    const res = await desktopAPI.auth.login({ email, password });
    if (!res.ok) throw new Error(res.error);
    setUser(res.data);
    saveSession(res.data);
    await loadSemesters(res.data.id);
  }

  async function signup(fullName, email, password) {
    const res = await desktopAPI.auth.signup({ fullName, email, password });
    if (!res.ok) throw new Error(res.error);
    setUser(res.data);
    saveSession(res.data);
    await desktopAPI.semesters.create({
      userId: res.data.id,
      name: "Fall 2026",
      makeActive: true,
      startDate: null,
      endDate: null,
      gpa: null,
      totalCreditHours: null,
      expectedSubjects: null
    });
    await loadSemesters(res.data.id);
  }

  function logout() {
    localStorage.removeItem(sessionKey);
    setUser(null);
    setSemesters([]);
    setOverallCgpa(null);
    setActiveSemester(null);
    setNotifications([]);
  }

  async function refreshProfile() {
    if (!user?.id) return null;
    const res = await desktopAPI.auth.getProfile(user.id);
    if (!res.ok) return null;
    setUser(res.data);
    saveSession(res.data);
    return res.data;
  }

  function emptyish(v) {
    if (v == null) return true;
    if (typeof v === "string" && v.trim() === "") return true;
    return false;
  }

  async function addSemester(nameOrFields) {
    if (!user) return false;
    const f = typeof nameOrFields === "string" ? { name: nameOrFields } : nameOrFields;
    const res = await desktopAPI.semesters.create({
      userId: user.id,
      name: typeof f.name === "string" ? f.name.trim() : f.name,
      makeActive: f.makeActive !== false,
      startDate: emptyish(f.startDate) ? null : String(f.startDate).trim() || null,
      endDate: emptyish(f.endDate) ? null : String(f.endDate).trim() || null,
      gpa: emptyish(f.gpa) ? null : f.gpa,
      totalCreditHours: emptyish(f.totalCreditHours) ? null : f.totalCreditHours,
      expectedSubjects: emptyish(f.expectedSubjects) ? null : f.expectedSubjects
    });
    if (!res.ok) {
      pushToast({ title: "Action failed", message: res.error || "Could not add semester.", variant: "error" });
      return false;
    }
    const { rows, overallCgpa: oc } = parseSemesterListResponse(res.data);
    semesterListGeneration.current += 1;
    setSemesters(rows);
    setOverallCgpa(oc);
    setActiveSemester(rows.find((item) => item.isActive) || null);
    pushToast({ title: "Successful", message: "Semester added successfully.", variant: "success" });
    return true;
  }

  async function updateSemester(updates) {
    if (!user) {
      pushToast({ title: "Session", message: "Please sign in again to save changes.", variant: "error" });
      return false;
    }
    const res = await desktopAPI.semesters.update({
      userId: user.id,
      ...updates,
      id: updates.id != null ? Number(updates.id) : updates.id
    });
    if (!res.ok) {
      pushToast({ title: "Action failed", message: res.error || "Could not update semester.", variant: "error" });
      return false;
    }
    const { rows, overallCgpa: oc } = parseSemesterListResponse(res.data);
    semesterListGeneration.current += 1;
    setSemesters(rows);
    setOverallCgpa(oc);
    setActiveSemester((prev) => {
      if (!prev) return rows.find((s) => s.isActive) || null;
      const next = rows.find((s) => s.id === prev.id);
      return next || rows.find((s) => s.isActive) || null;
    });
    pushToast({ title: "Successful", message: "Semester updated successfully.", variant: "success" });
    return true;
  }

  async function switchSemester(semesterId) {
    if (!user) return;
    const res = await desktopAPI.semesters.setActive({ userId: user.id, semesterId });
    if (!res.ok) {
      pushToast({ title: "Action failed", message: res.error || "Could not switch semester.", variant: "error" });
      return;
    }
    const { rows, overallCgpa: oc } = parseSemesterListResponse(res.data);
    semesterListGeneration.current += 1;
    setSemesters(rows);
    setOverallCgpa(oc);
    setActiveSemester(rows.find((item) => item.isActive) || null);
    pushToast({ title: "Successful", message: "Semester switched successfully.", variant: "success" });
  }

  const deleteSemester = useCallback(
    async (semesterId) => {
      if (!user) {
        pushToast({ title: "Session", message: "Please sign in again.", variant: "error" });
        return false;
      }
      const rid = Number(semesterId);
      if (!Number.isFinite(rid)) {
        pushToast({ title: "Action failed", message: "Invalid semester.", variant: "error" });
        return false;
      }
      const remove = desktopAPI?.semesters?.remove;
      if (typeof remove !== "function") {
        pushToast({
          title: "Action failed",
          message: "Delete bridge not loaded. Fully quit the desktop app, then run npm run dev again.",
          variant: "error"
        });
        return false;
      }
      let res;
      try {
        res = await remove({ userId: user.id, semesterId: rid });
      } catch (e) {
        const m = e?.message || "Could not delete semester.";
        pushToast({ title: "Action failed", message: m, variant: "error" });
        return false;
      }
      if (!res?.ok) {
        pushToast({ title: "Action failed", message: res.error || "Could not delete semester.", variant: "error" });
        return false;
      }
      const { rows, overallCgpa: oc } = parseSemesterListResponse(res.data);
      semesterListGeneration.current += 1;
      setSemesters(rows);
      setOverallCgpa(oc);
      setActiveSemester((prev) => {
        if (rows.length === 0) return null;
        if (prev) {
          const still = rows.find((s) => Number(s.id) === Number(prev.id));
          if (still) return still;
        }
        return rows.find((s) => s.isActive) || rows[0] || null;
      });
      setDataVersion((v) => v + 1);
      pushToast({ title: "Successful", message: "Semester removed.", variant: "success" });
      return true;
    },
    [user, pushToast]
  );

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (user) saveSession(user, next);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  const pushNotification = useCallback((payload) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextNotification = {
      id,
      title: payload.title || "Notification",
      message: payload.message || "",
      kind: payload.kind || "general",
      createdAt: payload.createdAt || new Date().toISOString(),
      read: false,
      dedupeKey: payload.dedupeKey || null
    };
    setNotifications((prev) => {
      if (nextNotification.dedupeKey && prev.some((item) => item.dedupeKey === nextNotification.dedupeKey)) {
        return prev;
      }
      return [nextNotification, ...prev];
    });
  }, []);

  useEffect(() => {
    if (!user?.id) {
      notificationsReadyRef.current = false;
      setNotifications([]);
      return;
    }
    try {
      const raw = localStorage.getItem(notificationsStorageKey(user.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
          notificationsReadyRef.current = true;
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setNotifications([]);
    notificationsReadyRef.current = true;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !notificationsReadyRef.current) return;
    try {
      localStorage.setItem(notificationsStorageKey(user.id), JSON.stringify(notifications));
    } catch {
      /* storage full or private mode */
    }
  }, [notifications, user?.id]);

  /** Electron: main process mirrors desktop notifications → same inbox as Notifications page + bell. */
  useEffect(() => {
    if (!user?.id) return;
    const register = desktopAPI?.onInboxMirrorFromMain;
    if (typeof register !== "function") return;
    const remove = register((detail) => {
      if (!detail) return;
      pushNotification({
        title: detail.title || "Notification",
        message: typeof detail.body === "string" ? detail.body : "",
        kind: detail.kind || "general",
        dedupeKey: detail.dedupeKey != null && detail.dedupeKey !== "" ? detail.dedupeKey : null
      });
    });
    return typeof remove === "function" ? remove : undefined;
  }, [user?.id, pushNotification]);

  function markNotificationsRead(kind = null) {
    setNotifications((prev) =>
      prev.map((item) => (kind && item.kind !== kind ? item : { ...item, read: true }))
    );
  }

  function clearNotifications(kind = null) {
    if (!kind) {
      setNotifications([]);
      return;
    }
    setNotifications((prev) => prev.filter((item) => item.kind !== kind));
  }

  // Shared data invalidation trigger so dashboard/analytics react to CRUD changes.
  const bumpDataVersion = useCallback(() => {
    setDataVersion((prev) => prev + 1);
    // Re-fetch semesters so per-semester subject counts & credit sums stay in sync (e.g. after adding courses).
    if (user?.id) {
      void loadSemesters(user.id);
    }
  }, [user?.id, loadSemesters]);

  const value = useMemo(
    () => ({
      user,
      loading,
      theme,
      semesters,
      overallCgpa,
      activeSemester,
      login,
      signup,
      logout,
      addSemester,
      updateSemester,
      switchSemester,
      deleteSemester,
      refreshSemesters,
      toggleTheme,
      refreshProfile,
      toasts,
      pushToast,
      dismissToast,
      notifications,
      unreadNotificationCount: notifications.filter((item) => !item.read).length,
      pushNotification,
      markNotificationsRead,
      clearNotifications,
      dataVersion,
      bumpDataVersion
    }),
    [
      user,
      loading,
      theme,
      semesters,
      overallCgpa,
      activeSemester,
      toasts,
      notifications,
      dataVersion,
      loadSemesters,
      refreshSemesters,
      pushToast,
      pushNotification,
      bumpDataVersion,
      deleteSemester
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
