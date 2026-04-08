import { Router, Request, Response } from "express";
import { AIService } from "../services/AIService";

export const aiGenerateRouter = Router();

let _ai: AIService | null = null;
function getAI(): AIService {
  if (!_ai) _ai = new AIService();
  return _ai;
}

aiGenerateRouter.post("/test-data", async (req: Request, res: Response) => {
  try {
    const { endpoint, api } = req.body;
    if (!endpoint || !api) {
      res.status(400).json({ success: false, error: "endpoint and api required" });
      return;
    }
    const data = await getAI().generateTestData(endpoint, api);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("AI test-data error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

aiGenerateRouter.post("/code-examples", async (req: Request, res: Response) => {
  try {
    const { endpoint, api } = req.body;
    if (!endpoint || !api) {
      res.status(400).json({ success: false, error: "endpoint and api required" });
      return;
    }
    const data = await getAI().generateCodeExamples(endpoint, api);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("AI code-examples error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

aiGenerateRouter.post("/tests", async (req: Request, res: Response) => {
  try {
    const { endpoint, api } = req.body;
    if (!endpoint || !api) {
      res.status(400).json({ success: false, error: "endpoint and api required" });
      return;
    }
    const data = await getAI().generateTests(endpoint, api);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("AI tests error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

aiGenerateRouter.post("/documentation", async (req: Request, res: Response) => {
  try {
    const { api } = req.body;
    if (!api) {
      res.status(400).json({ success: false, error: "api required" });
      return;
    }
    const data = await getAI().generateDocumentation(api);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("AI documentation error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

aiGenerateRouter.post("/analyze-response", async (req: Request, res: Response) => {
  try {
    const { endpoint, response } = req.body;
    if (!endpoint || !response) {
      res.status(400).json({ success: false, error: "endpoint and response required" });
      return;
    }
    const data = await getAI().analyzeResponse(endpoint, response);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("AI analyze error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
