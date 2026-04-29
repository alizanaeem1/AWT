const path = require("path");

/**
 * Root dir for DB + uploads: project folder in dev, Electron userData when installed (.exe).
 */
function getDataRoot() {
  try {
    const { app } = require("electron");
    if (app && app.isPackaged) {
      return app.getPath("userData");
    }
  } catch {
    /* not running under Electron */
  }
  return process.cwd();
}

module.exports = { getDataRoot };
