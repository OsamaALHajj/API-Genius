import { Router } from 'express';
import { OpenAPIParserService } from '../services/OpenAPIParser.js';

export const apiParserRouter = Router();
const parser = new OpenAPIParserService();

// Parse API from URL
apiParserRouter.post('/url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'URL is required' });
      return;
    }

    const parsed = await parser.parseFromUrl(url.trim());

    res.json({
      success: true,
      data: parsed,
      stats: {
        totalEndpoints: parsed.endpoints.length,
        methods: {
          GET: parsed.endpoints.filter(e => e.method === 'GET').length,
          POST: parsed.endpoints.filter(e => e.method === 'POST').length,
          PUT: parsed.endpoints.filter(e => e.method === 'PUT').length,
          DELETE: parsed.endpoints.filter(e => e.method === 'DELETE').length,
          PATCH: parsed.endpoints.filter(e => e.method === 'PATCH').length,
        },
        tags: [...new Set(parsed.endpoints.flatMap(e => e.tags))],
        hasAuth: Object.keys(parsed.securitySchemes).length > 0,
      }
    });
  } catch (error: any) {
    res.status(422).json({
      success: false,
      error: error.message || 'Failed to parse API specification'
    });
  }
});

// Parse API from text
apiParserRouter.post('/text', async (req, res) => {
  try {
    const { spec } = req.body;
    if (!spec) {
      res.status(400).json({ success: false, error: 'Spec text is required' });
      return;
    }
    const parsed = await parser.parseFromText(spec);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(422).json({
      success: false,
      error: error.message
    });
  }
});
