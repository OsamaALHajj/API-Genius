import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { apiParserRouter } from "./routes/api-parser";
import { aiGenerateRouter } from "./routes/ai-generate";
import { proxyRouter } from "./routes/proxy";
import { testsRouter } from "./routes/tests";

dotenv.config();

const app = express();
const server = createServer(app);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  const provider = process.env.GEMINI_API_KEY
    ? "Gemini (FREE)"
    : process.env.GROQ_API_KEY
      ? "Groq (FREE)"
      : process.env.OPENAI_API_KEY
        ? "OpenAI"
        : "Local (No AI key)";

  res.json({
    status: "ok",
    aiProvider: provider,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/parse", apiParserRouter);
app.use("/api/ai", aiGenerateRouter);
app.use("/api/proxy", proxyRouter);
app.use("/api/tests", testsRouter);

// Error handler
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("❌ Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
);

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, "0.0.0.0", () => {
  const provider = process.env.GEMINI_API_KEY
    ? "🟢 Gemini (FREE)"
    : process.env.GROQ_API_KEY
      ? "🟢 Groq (FREE)"
      : process.env.OPENAI_API_KEY
        ? "🟡 OpenAI"
        : "⚪ Local (No AI - still works!)";

  console.log("");
  console.log("=".repeat(55));
  console.log(`  ⚡ API Genius Backend running!`);
  console.log(`  📡 http://localhost:${PORT}`);
  console.log(`  🏥 http://localhost:${PORT}/health`);
  console.log(`  🤖 AI: ${provider}`);
  console.log("=".repeat(55));
  console.log("");
});
