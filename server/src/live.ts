import type { Server } from 'node:http';
import { type WebSocket, WebSocketServer } from 'ws';
import type { LiveMessage, OrgNodeDto, OrgNodePatch } from '../../shared/types.ts';

const TICK_MS = Number(process.env.LIVE_TICK_MS ?? 3_000);

export interface LiveChannel {
  /** Drops every open socket so the client's backoff can be observed. */
  disconnectAll: () => void;
  connectionCount: () => number;
  version: () => number;
}

function randomPatch(nodes: OrgNodeDto[], random: () => number): OrgNodePatch | null {
  const node = nodes[Math.floor(random() * nodes.length)];
  if (!node) return null;

  const patch: OrgNodePatch = { id: node.id, updatedAt: new Date().toISOString() };
  const roll = random();

  if (roll < 0.45) {
    patch.performance = Math.max(
      0,
      Math.min(100, node.performance + Math.round((random() - 0.5) * 20)),
    );
    node.performance = patch.performance;
  } else if (roll < 0.8) {
    patch.headcount = Math.max(0, node.headcount + (random() < 0.5 ? -1 : 1));
    node.headcount = patch.headcount;
  } else {
    patch.budget = Math.max(0, node.budget + Math.round((random() - 0.5) * 400_000));
    node.budget = patch.budget;
  }

  node.updatedAt = patch.updatedAt;
  return patch;
}

export function attachLiveChannel(server: Server, nodes: OrgNodeDto[]): LiveChannel {
  const wss = new WebSocketServer({ server, path: '/api/live' });
  const sockets = new Set<WebSocket>();
  let version = 0;

  const send = (socket: WebSocket, message: LiveMessage): void => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  wss.on('connection', (socket) => {
    sockets.add(socket);
    send(socket, { type: 'hello', version });
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => sockets.delete(socket));
  });

  setInterval(() => {
    if (sockets.size === 0) return;

    const patch = randomPatch(nodes, Math.random);
    if (!patch) return;

    version += 1;
    const message: LiveMessage = { type: 'node-updated', version, patch };
    for (const socket of sockets) {
      send(socket, message);
    }
  }, TICK_MS).unref();

  return {
    disconnectAll: () => {
      for (const socket of sockets) {
        socket.terminate();
      }
      sockets.clear();
    },
    connectionCount: () => sockets.size,
    version: () => version,
  };
}
