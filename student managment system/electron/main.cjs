const { app, BrowserWindow, ipcMain, Notification, dialog } = require("electron");
const path = require("path");
const { registerIpcHandlers } = require("../src/backend/controllers/ipcHandlers");
const db = require(path.join(__dirname, "../src/backend/db"));
const { writeSemesterExportZip } = require(path.join(__dirname, "../src/backend/services/semesterExportService"));

const isDev = !app.isPackaged;

function registerSemesterExportIpc(ipcMain) {
  ipcMain.handle("semester:export", async (_event, payload) => {
    const userId = Number(payload?.userId);
    const semesterId = Number(payload?.semesterId);
    if (!Number.isFinite(userId) || !Number.isFinite(semesterId)) {
      return { ok: false, error: "Invalid session or semester." };
    }
    const row = db.prepare("SELECT name FROM Semesters WHERE id = ? AND userId = ?").get(semesterId, userId);
    if (!row) {
      return { ok: false, error: "Semester not found." };
    }
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return { ok: false, error: "No active window found." };
    }
    const base = (row.name || "semester").replace(/[/\\?*:|"<>]/g, "_").trim() || "semester";
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "Export semester (ZIP)",
      defaultPath: `${base}-export.zip`,
      filters: [{ name: "Zip archive", extensions: ["zip"] }]
    });
    if (canceled || !filePath) {
      return { ok: true, data: { canceled: true } };
    }
    try {
      const summary = await writeSemesterExportZip(semesterId, userId, filePath);
      return { ok: true, data: { filePath, ...summary } };
    } catch (e) {
      return { ok: false, error: e.message || "Export failed." };
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 740,
    backgroundColor: "#030712",
    title: "Student Management System",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers(ipcMain, Notification);
  registerSemesterExportIpc(ipcMain);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
