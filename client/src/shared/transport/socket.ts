import { reconnectDelay } from './retry-policy';

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface SocketLike {
  addEventListener(type: 'open' | 'close' | 'error', listener: () => void): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  close(): void;
}

export interface ReconnectingSocketOptions {
  url: string;
  /** Raw frame payload; parsing and validation belong to the caller. */
  onMessage: (data: unknown) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  createSocket?: (url: string) => SocketLike;
  scheduleRetry?: (run: () => void, delayMs: number) => () => void;
}

export interface ReconnectingSocket {
  close: () => void;
}

const defaultFactory = (url: string): SocketLike => new WebSocket(url) as unknown as SocketLike;

const defaultSchedule = (run: () => void, delayMs: number): (() => void) => {
  const timer = setTimeout(run, delayMs);
  return () => clearTimeout(timer);
};

export function createReconnectingSocket({
  url,
  onMessage,
  onStatusChange,
  createSocket = defaultFactory,
  scheduleRetry = defaultSchedule,
}: ReconnectingSocketOptions): ReconnectingSocket {
  let attempt = 0;
  let socket: SocketLike | undefined;
  let cancelRetry: (() => void) | undefined;
  let disposed = false;

  const connect = (): void => {
    if (disposed) return;

    onStatusChange(attempt === 0 ? 'connecting' : 'reconnecting');
    socket = createSocket(url);

    socket.addEventListener('open', () => {
      attempt = 0;
      onStatusChange('open');
    });
    socket.addEventListener('message', (event) => onMessage(event.data));
    // `error` is always followed by `close`, so only `close` schedules a retry.
    socket.addEventListener('close', () => {
      if (disposed) return;
      onStatusChange('reconnecting');
      cancelRetry = scheduleRetry(connect, reconnectDelay(attempt));
      attempt += 1;
    });
  };

  connect();

  return {
    close: () => {
      disposed = true;
      cancelRetry?.();
      socket?.close();
      onStatusChange('closed');
    },
  };
}
