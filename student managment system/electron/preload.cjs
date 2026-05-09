const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  /** Generic IPC when a named method is missing after a hot reload (restart still recommended). */
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
  auth: {
    signup: (payload) => ipcRenderer.invoke("auth:signup", payload),
    login: (payload) => ipcRenderer.invoke("auth:login", payload),
    getProfile: (userId) => ipcRenderer.invoke("auth:profile", userId),
    updateProfile: (payload) => ipcRenderer.invoke("auth:updateProfile", payload),
    changePassword: (payload) => ipcRenderer.invoke("auth:changePassword", payload)
  },
  semesters: {
    list: (userId) => ipcRenderer.invoke("semester:list", userId),
    create: (payload) => ipcRenderer.invoke("semester:create", payload),
    setActive: (payload) => ipcRenderer.invoke("semester:setActive", payload),
    update: (payload) => ipcRenderer.invoke("semester:update", payload),
    remove: (payload) => ipcRenderer.invoke("semester:remove", payload),
    exportZip: (payload) => ipcRenderer.invoke("semester:export", payload)
  },
  subjects: {
    list: (semesterId) => ipcRenderer.invoke("subject:list", semesterId),
    save: (payload) => ipcRenderer.invoke("subject:save", payload),
    remove: (subjectId) => ipcRenderer.invoke("subject:remove", subjectId)
  },
  assignments: {
    listBySemester: (semesterId) => ipcRenderer.invoke("assignment:listBySemester", semesterId),
    save: (payload) => ipcRenderer.invoke("assignment:save", payload),
    remove: (assignmentId) => ipcRenderer.invoke("assignment:remove", assignmentId)
  },
  files: {
    list: (semesterId) => ipcRenderer.invoke("file:list", semesterId),
    listByAssignment: (assignmentId) => ipcRenderer.invoke("file:listByAssignment", assignmentId),
    add: (payload) => ipcRenderer.invoke("file:add", payload),
    remove: (fileId) => ipcRenderer.invoke("file:remove", fileId),
    pick: () => ipcRenderer.invoke("file:pick"),
    open: (filePath) => ipcRenderer.invoke("file:open", filePath),
    reveal: (filePath) => ipcRenderer.invoke("file:reveal", filePath),
    asDataUrl: (filePath) => ipcRenderer.invoke("file:asDataUrl", filePath)
  },
  analytics: {
    dashboard: (payload) => ipcRenderer.invoke("analytics:dashboard", payload)
  },
  timetable: {
    listBySemester: (payload) => ipcRenderer.invoke("timetable:listBySemester", payload),
    save: (payload) => ipcRenderer.invoke("timetable:save", payload),
    remove: (payload) => ipcRenderer.invoke("timetable:remove", payload)
  },
  ai: {
    generate: (payload) => ipcRenderer.invoke("ai:generate", payload)
  },
  reports: {
    exportGpaPdf: (payload) => ipcRenderer.invoke("report:gpaPdf", payload)
  },
  notify: (payload) => ipcRenderer.invoke("notify:desktop", payload),
  /**
   * Registers listener for mirrored OS notifications → in-app Notifications inbox (dedupe in React).
   * @param {(detail: { title: string; body: string; dedupeKey?: string|null; kind?: string }) => void} handler
   * @returns {() => void} cleanup
   */
  onInboxMirrorFromMain: (handler) => {
    if (typeof handler !== "function") return () => {};
    const channel = "notifications:inboxMirror";
    const wrapped = (_event, detail) => {
      try {
        handler(detail);
      } catch {
        /* ignore */
      }
    };
    ipcRenderer.on(channel, wrapped);
    return () => {
      ipcRenderer.removeListener(channel, wrapped);
    };
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close")
  }
});
