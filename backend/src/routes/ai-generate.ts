import { Router } from 'express';
import { AIService } from '../services/AIService.js';

export const aiGenerateRouter = Router();

// Lazy initialization - only create when API key is present
let ai: AIService | null = null;
function getAI(): AIService {
  if (!ai) {
    ai = new AIService();
  }
  return ai;
}

// Generate test data
aiGenerateRouter.post('/test-data', async (req, res) => {
  try {
    const { endpoint, api } = req.body;
    if (!endpoint || !api) {
      res.status(400).json({ success: false, error: 'endpoint and api are required' });
      return;
    }
    const testData = await getAI().generateTestData(endpoint, api);
    res.json({ success: true, data: testData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate code examples
aiGenerateRouter.post('/code-examples', async (req, res) => {
  try {
    const { endpoint, api } = req.body;
    if (!endpoint || !api) {
      res.status(400).json({ success: false, error: 'endpoint and api are required' });
      return;
    }
    const examples = await getAI().generateCodeExamples(endpoint, api);
    res.json({ success: true, data: examples });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate tests
aiGenerateRouter.post('/tests', async (req, res) => {
  try {
    const { endpoint, api } = req.body;
    if (!endpoint || !api) {
      res.status(400).json({ success: false, error: 'endpoint and api are required' });
      return;
    }
    const tests = await getAI().generateTests(endpoint, api);
    res.json({ success: true, data: tests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate documentation
aiGenerateRouter.post('/documentation', async (req, res) => {
  try {
    const { api } = req.body;
    if (!api) {
      res.status(400).json({ success: false, error: 'api is required' });
      return;
    }
    const docs = await getAI().generateDocumentation(api);
    res.json({ success: true, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze response
aiGenerateRouter.post('/analyze-response', async (req, res) => {
  try {
    const { endpoint, response } = req.body;
    if (!endpoint || !response) {
      res.status(400).json({ success: false, error: 'endpoint and response are required' });
      return;
    }
    const analysis = await getAI().analyzeResponse(endpoint, response);
    res.json({ success: true, data: analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
