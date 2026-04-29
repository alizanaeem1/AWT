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
  reports: {
    exportGpaPdf: (payload) => ipcRenderer.invoke("report:gpaPdf", payload)
  },
  notify: (payload) => ipcRenderer.invoke("notify:desktop", payload),
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close")
  }
});
