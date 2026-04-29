import React from "react";
import { desktopAPI } from "../utils/desktopApi";

export default function WindowControls({ isDark }) {
  return (
    <div className="flex items-center gap-1">
      <button
        title="Minimize"
        onClick={() => desktopAPI.window.minimize()}
        className={`rounded px-2 py-1 text-xs transition-colors ${isDark ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
      >
        -
      </button>
      <button
        title="Maximize"
        onClick={() => desktopAPI.window.maximize()}
        className={`rounded px-2 py-1 text-xs transition-colors ${isDark ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
      >
        []
      </button>
      <button title="Close" onClick={() => desktopAPI.window.close()} className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-500">
        x
      </button>
    </div>
  );
}
