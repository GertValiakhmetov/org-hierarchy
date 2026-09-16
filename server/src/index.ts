import cors from 'cors';
import express from 'express';
import { DEBUG_MODES, type DebugMode } from '../../shared/types.ts';
import { generateOrgTree } from './data/generate.ts';
import { attachLiveChannel } from './live.ts';
import { createSearchHandler } from './search.ts';

const PORT = Number(process.env.PORT ?? 4000);

/** Without a delay the loading state is never visible long enough to inspect. */
const LATENCY_MS = Number(process.env.API_LATENCY_MS ?? 250);
const SLOW_LATENCY_MS = 5_000;

const app = express();
app.use(cors());
app.use(express.json());

const nodes = generateOrgTree();

/**
 * Kept on the server rather than in request parameters on purpose: the client
 * keeps issuing the same GET /api/org-tree under one cache key, so a failure
 * reproduces on the query the app actually lives on — including a failed
 * background revalidation while data is already on screen.
 */
let debugMode: DebugMode = 'normal';

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

app.get('/api/org-tree', async (_req, res) => {
  await delay(debugMode === 'slow' ? SLOW_LATENCY_MS : LATENCY_MS);

  switch (debugMode) {
    case 'error':
      res.status(500).json({ message: 'Debug mode: the server returned an error' });
      return;

    case 'empty':
      res.json([]);
      return;

    case 'invalid':
      // Contract broken on purpose to exercise the client's schema validation.
      res.json([{ id: 'broken', name: 'Без обязательных полей' }]);
      return;

    default:
      res.json(nodes);
  }
});

app.post('/api/search', createSearchHandler(nodes));

app.get('/api/debug/mode', (_req, res) => {
  res.json({ mode: debugMode });
});

app.post('/api/debug/mode', (req, res) => {
  const mode = (req.body as { mode?: unknown } | undefined)?.mode;

  if (!DEBUG_MODES.includes(mode as DebugMode)) {
    res.status(400).json({ message: `Unknown debug mode: ${String(mode)}` });
    return;
  }

  debugMode = mode as DebugMode;
  console.log(`[server] debug mode: ${debugMode}`);
  res.json({ mode: debugMode });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    nodes: nodes.length,
    mode: debugMode,
    connections: live.connectionCount(),
    version: live.version(),
  });
});

app.post('/api/debug/disconnect', (_req, res) => {
  const dropped = live.connectionCount();
  live.disconnectAll();
  console.log(`[server] dropped ${dropped} live connection(s)`);
  res.json({ dropped });
});

const server = app.listen(PORT, () => {
  console.log(
    `[server] http://localhost:${PORT} — ${nodes.length} nodes, ${LATENCY_MS}ms latency`,
  );
});

const live = attachLiveChannel(server, nodes);
