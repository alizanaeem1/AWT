const fs = require("fs");
const path = require("path");
const { BrowserWindow, dialog, shell, app } = require("electron");
const authService = require("../services/authService");
const semesterService = require("../services/semesterService");
const subjectService = require("../services/subjectService");
const assignmentService = require("../services/assignmentService");
const fileService = require("../services/fileService");
const analyticsService = require("../services/analyticsService");
const timetableService = require("../services/timetableService");
function loadAiGenerateService() {
  const resolved = require.resolve("../services/aiGenerateService");
  if (!app.isPackaged) {
    delete require.cache[resolved];
  }
  return require("../services/aiGenerateService.js");
}

function wrap(handler) {
  return async (_event, payload) => {
    try {
      // Standardized IPC response shape for renderer-side consistency.
      return { ok: true, data: await handler(payload) };
    } catch (error) {
      return { ok: false, error: error.message || "Unexpected error" };
    }
  };
}

function registerIpcHandlers(ipcMain, Notification) {
  ipcMain.handle("auth:signup", wrap(authService.signup));
  ipcMain.handle("auth:login", wrap(authService.login));
  ipcMain.handle("auth:profile", wrap(authService.getProfile));
  ipcMain.handle("auth:updateProfile", wrap(authService.updateProfile));
  ipcMain.handle("auth:changePassword", wrap(authService.changePassword));

  ipcMain.handle("semester:list", wrap(semesterService.list));
  ipcMain.handle("semester:create", wrap(semesterService.create));
  ipcMain.handle("semester:setActive", wrap(semesterService.setActive));
  ipcMain.handle("semester:update", wrap(semesterService.updateMeta));
  ipcMain.handle("semester:remove", wrap(semesterService.remove));

  ipcMain.handle("subject:list", wrap(subjectService.list));
  ipcMain.handle("subject:save", wrap(subjectService.save));
  ipcMain.handle("subject:remove", wrap(({ subjectId, semesterId }) => subjectService.remove(subjectId, semesterId)));

  ipcMain.handle("assignment:listBySemester", wrap(assignmentService.listBySemester));
  ipcMain.handle("assignment:save", wrap(assignmentService.save));
  ipcMain.handle(
    "assignment:remove",
    wrap(({ assignmentId, semesterId }) => assignmentService.remove(assignmentId, semesterId))
  );

  ipcMain.handle("file:list", wrap(fileService.list));
  ipcMain.handle("file:listByAssignment", wrap(fileService.listByAssignment));
  ipcMain.handle("file:add", wrap(fileService.add));
  ipcMain.handle("file:remove", wrap(({ fileId, semesterId }) => fileService.remove(fileId, semesterId)));
  ipcMain.handle("file:pick", async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      title: "Select files",
      properties: ["openFile", "multiSelections"]
    });
    if (result.canceled) return { ok: true, data: [] };
    return { ok: true, data: result.filePaths };
  });
  ipcMain.handle("file:open", async (_event, filePath) => {
    const error = await shell.openPath(filePath);
    if (error) return { ok: false, error };
    return { ok: true };
  });
  ipcMain.handle("file:reveal", async (_event, filePath) => {
    shell.showItemInFolder(filePath);
    return { ok: true };
  });
  ipcMain.handle("file:asDataUrl", async (_event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) return { ok: false, error: "File not found." };
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml"
    };
    const mime = mimeMap[ext];
    if (!mime) return { ok: false, error: "Unsupported image type." };
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");
    return { ok: true, data: `data:${mime};base64,${base64}` };
  });

  ipcMain.handle("analytics:dashboard", wrap(analyticsService.getDashboard));

  ipcMain.handle("timetable:listBySemester", wrap(timetableService.listBySemester));
  ipcMain.handle("timetable:save", wrap(timetableService.save));
  ipcMain.handle("timetable:remove", wrap(timetableService.remove));

  ipcMain.handle(
    "ai:generate",
    wrap((payload) => {
      const { generateDailyProgressContent } = loadAiGenerateService();
      return generateDailyProgressContent(payload?.text ?? "", {
        attachment: payload?.attachment
      });
    })
  );
  ipcMain.handle("report:gpaPdf", async (_event, payload) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { ok: false, error: "No active window found." };

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "Export GPA Report",
      defaultPath: `${payload?.semesterName || "semester"}-gpa-report.pdf`,
      filters: [{ name: "PDF Files", extensions: ["pdf"] }]
    });
    if (canceled || !filePath) return { ok: true, data: null };

    // Uses the current renderer view, so exported PDF matches dashboard styling.
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      margins: { top: 0.5, bottom: 0.5, left: 0.4, right: 0.4 }
    });
    fs.writeFileSync(filePath, pdf);
    return { ok: true, data: { filePath } };
  });

  ipcMain.handle("notify:desktop", async (_event, payload) => {
    const title = payload?.title || "Reminder";
    const body = payload?.body || "You have an upcoming task.";
    if (Notification.isSupported()) {
      try {
        new Notification({ title, body }).show();
      } catch {
        /* ignore */
      }
    }
    /** Mirror OS notification into the in-app Notifications list (bell + Notifications page). */
    const inboxPayload = {
      title,
      body,
      dedupeKey: payload?.dedupeKey ?? null,
      kind: typeof payload?.kind === "string" ? payload.kind : "general"
    };
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.isDestroyed() || win.webContents.isDestroyed()) return;
      try {
        win.webContents.send("notifications:inboxMirror", inboxPayload);
      } catch {
        /* ignore */
      }
    });
    return { ok: true };
  });

  ipcMain.handle("window:minimize", () => {
    BrowserWindow.getFocusedWindow()?.minimize();
    return { ok: true };
  });
  ipcMain.handle("window:maximize", () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { ok: false };
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
    return { ok: true };
  });
  ipcMain.handle("window:close", () => {
    BrowserWindow.getFocusedWindow()?.close();
    return { ok: true };
  });
}

module.exports = { registerIpcHandlers };
