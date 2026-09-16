import { describe, expect, it } from 'vitest';
import { createReconnectingSocket, type ConnectionStatus, type SocketLike } from './socket';

type Listener = (event?: { data: unknown }) => void;

class FakeSocket {
  readonly listeners = new Map<string, Listener[]>();
  closed = false;

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string, event?: { data: unknown }): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

function harness() {
  const created: FakeSocket[] = [];
  const statuses: ConnectionStatus[] = [];
  const messages: unknown[] = [];
  const pending: { run: () => void; delayMs: number }[] = [];

  const socket = createReconnectingSocket({
    url: 'ws://test/live',
    onMessage: (data) => messages.push(data),
    onStatusChange: (status) => statuses.push(status),
    createSocket: () => {
      const fake = new FakeSocket();
      created.push(fake);
      return fake as unknown as SocketLike;
    },
    scheduleRetry: (run, delayMs) => {
      pending.push({ run, delayMs });
      return () => undefined;
    },
  });

  return { socket, created, statuses, messages, pending, last: () => created[created.length - 1]! };
}

describe('createReconnectingSocket', () => {
  it('connects immediately and reports open', () => {
    const h = harness();
    expect(h.created).toHaveLength(1);
    expect(h.statuses).toEqual(['connecting']);

    h.last().emit('open');
    expect(h.statuses).toEqual(['connecting', 'open']);
  });

  it('forwards raw frame payloads without parsing them', () => {
    const h = harness();
    h.last().emit('open');
    h.last().emit('message', { data: '{"type":"hello"}' });

    expect(h.messages).toEqual(['{"type":"hello"}']);
  });

  it('reconnects after a close and backs off exponentially', () => {
    const h = harness();
    h.last().emit('open');

    h.last().emit('close');
    const first = h.pending[0]!.delayMs;
    h.pending[0]!.run();

    h.last().emit('close');
    const second = h.pending[1]!.delayMs;

    expect(h.statuses).toContain('reconnecting');
    expect(second).toBeGreaterThan(first);
  });

  it('resets the backoff once a connection succeeds', () => {
    const h = harness();
    h.last().emit('close');
    h.pending[0]!.run();
    h.last().emit('close');
    h.pending[1]!.run();

    // A successful open must bring the next delay back to the first step.
    h.last().emit('open');
    h.last().emit('close');

    expect(h.pending[2]!.delayMs).toBeLessThan(h.pending[1]!.delayMs);
  });

  it('stops reconnecting once closed by the caller', () => {
    const h = harness();
    h.last().emit('open');
    h.socket.close();

    h.last().emit('close');

    expect(h.statuses.at(-1)).toBe('closed');
    expect(h.pending).toHaveLength(0);
  });

  it('closes the underlying socket when disposed', () => {
    const h = harness();
    h.socket.close();

    expect(h.last().closed).toBe(true);
  });
});

describe('reconnectDelay', () => {
  it('is jittered around the exponential base and capped', async () => {
    const { reconnectDelay } = await import('./retry-policy');

    expect(reconnectDelay(0, 0.5)).toBe(500);
    expect(reconnectDelay(1, 0.5)).toBe(1_000);
    expect(reconnectDelay(20, 0.5)).toBe(15_000);
    expect(reconnectDelay(0, 0)).toBeLessThan(reconnectDelay(0, 1));
  });
});
