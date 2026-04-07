import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { apiParserRouter } from './routes/api-parser.js';
import { aiGenerateRouter } from './routes/ai-generate.js';
import { proxyRouter } from './routes/proxy.js';
import { testsRouter } from './routes/tests.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/parse', apiParserRouter);
app.use('/api/ai', aiGenerateRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/tests', testsRouter);

// WebSocket for live updates
wss.on('connection', (ws: WebSocket) => {
  console.log('🔌 Client connected');
  ws.send(JSON.stringify({ type: 'connected' }));
  ws.on('close', () => console.log('🔌 Client disconnected'));
});

// Export for use in services
export { wss };

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 API Genius Backend running on http://localhost:${PORT}`);
});
