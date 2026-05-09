const { app, BrowserWindow, ipcMain, Notification, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

/** Load `.env` from project root so API keys work without exporting them in the shell. */
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, { encoding: "utf8" }).split(/\r?\n/);
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch (_) {
    /* ignore */
  }
}

loadEnvFile();
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
