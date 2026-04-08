import { Router, Request, Response } from "express";
import { OpenAPIParserService } from "../services/OpenAPIParser";

export const apiParserRouter = Router();
const parser = new OpenAPIParserService();

apiParserRouter.post("/url", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      res.status(400).json({ success: false, error: "url is required" });
      return;
    }

    console.log(`\n📥 Parse request: ${url}`);
    const parsed = await parser.parseFromUrl(url.trim());

    const stats = {
      totalEndpoints: parsed.endpoints.length,
      methods: {
        GET: parsed.endpoints.filter((e) => e.method === "GET").length,
        POST: parsed.endpoints.filter((e) => e.method === "POST").length,
        PUT: parsed.endpoints.filter((e) => e.method === "PUT").length,
        DELETE: parsed.endpoints.filter((e) => e.method === "DELETE").length,
        PATCH: parsed.endpoints.filter((e) => e.method === "PATCH").length,
      },
      tags: [...new Set(parsed.endpoints.flatMap((e) => e.tags))],
      hasAuth: Object.keys(parsed.securitySchemes).length > 0,
    };

    console.log(`✅ Parsed: ${stats.totalEndpoints} endpoints`);
    res.json({ success: true, data: parsed, stats });
  } catch (error: any) {
    console.error(`❌ Parse failed:`, error.message);
    res.status(422).json({ success: false, error: error.message });
  }
});

apiParserRouter.post("/text", async (req: Request, res: Response) => {
  try {
    const { spec } = req.body;
    if (!spec) {
      res.status(400).json({ success: false, error: "spec is required" });
      return;
    }
    const parsed = await parser.parseFromText(spec);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(422).json({ success: false, error: error.message });
  }
});
