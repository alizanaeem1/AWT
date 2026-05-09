import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function aiGenerateMiddleware(env) {
  return {
    name: "sms-ai-generate-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0];
        if (req.method !== "POST" || pathname !== "/api/ai/generate") {
          return next();
        }

        /** @type {Buffer[]} */
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const rawBody = Buffer.concat(chunks).toString("utf8");
        let json;
        try {
          json = JSON.parse(rawBody || "{}");
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid JSON body." }));
          return;
        }

        let generateDailyProgressContent;
        try {
          ({ generateDailyProgressContent } = require("./src/backend/services/aiGenerateService.js"));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e?.message || "Could not load AI service." }));
          return;
        }

        try {
          const data = await generateDailyProgressContent(json.text, {
            geminiApiKey: env.GEMINI_API_KEY,
            anthropicApiKey: env.ANTHROPIC_API_KEY,
            attachment: json.attachment,
            geminiModel: env.GEMINI_MODEL
          });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (e) {
          const status =
            typeof e?.message === "string" && e.message.includes("Please enter") ? 400 : 500;
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e.message || "Generation failed." }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "./",
    plugins: [react(), aiGenerateMiddleware(env)],
    server: {
      port: 5173,
      strictPort: true
    }
  };
});
