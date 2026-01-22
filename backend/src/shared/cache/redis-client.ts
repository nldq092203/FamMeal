import net from 'node:net';
import tls from 'node:tls';

type RespValue = string | number | null | RespValue[];

type PendingRequest = {
  resolve: (value: RespValue) => void;
  reject: (error: Error) => void;
};

function encodeCommand(args: Array<string>): Buffer {
  const parts: Buffer[] = [];
  parts.push(Buffer.from(`*${args.length}\r\n`));
  for (const arg of args) {
    const value = Buffer.from(arg);
    parts.push(Buffer.from(`$${value.length}\r\n`));
    parts.push(value);
    parts.push(Buffer.from('\r\n'));
  }
  return Buffer.concat(parts);
}

function findCrlf(buffer: Buffer, start: number): number {
  for (let i = start; i + 1 < buffer.length; i++) {
    if (buffer[i] === 13 && buffer[i + 1] === 10) return i;
  }
  return -1;
}

function parseResp(buffer: Buffer, offset = 0): { value: RespValue | Error; bytes: number } | null {
  if (buffer.length <= offset) return null;
  const prefix = String.fromCharCode(buffer[offset]!);

  const lineEnd = findCrlf(buffer, offset);
  if (lineEnd === -1) return null;
  const line = buffer.subarray(offset + 1, lineEnd).toString('utf8');
  const afterLine = lineEnd + 2;

  switch (prefix) {
    case '+':
      return { value: line, bytes: afterLine - offset };
    case '-':
      return { value: new Error(line || 'Redis error'), bytes: afterLine - offset };
    case ':':
      return { value: Number.parseInt(line, 10), bytes: afterLine - offset };
    case '$': {
      const length = Number.parseInt(line, 10);
      if (Number.isNaN(length)) return { value: new Error('Invalid bulk length'), bytes: afterLine - offset };
      if (length === -1) return { value: null, bytes: afterLine - offset };
      const end = afterLine + length;
      if (buffer.length < end + 2) return null;
      const bulk = buffer.subarray(afterLine, end).toString('utf8');
      return { value: bulk, bytes: end + 2 - offset };
    }
    case '*': {
      const count = Number.parseInt(line, 10);
      if (Number.isNaN(count)) return { value: new Error('Invalid array length'), bytes: afterLine - offset };
      if (count === -1) return { value: null, bytes: afterLine - offset };

      const values: RespValue[] = [];
      let cursor = afterLine;
      for (let i = 0; i < count; i++) {
        const parsed = parseResp(buffer, cursor);
        if (!parsed) return null;
        if (parsed.value instanceof Error) return { value: parsed.value, bytes: cursor + parsed.bytes - offset };
        values.push(parsed.value as RespValue);
        cursor += parsed.bytes;
      }
      return { value: values, bytes: cursor - offset };
    }
    default:
      return { value: new Error(`Unknown RESP prefix: ${prefix}`), bytes: afterLine - offset };
  }
}

export class RedisClient {
  private socket: net.Socket | tls.TLSSocket | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private pending: PendingRequest[] = [];
  private connecting: Promise<void> | null = null;
  private closedByUser = false;
  private reconnectAttempt = 0;

  constructor(
    private readonly url: URL,
    private readonly options?: { connectTimeoutMs?: number; maxReconnectDelayMs?: number }
  ) {}

  get isConnected(): boolean {
    return Boolean(this.socket && !this.socket.destroyed);
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    if (this.connecting) return this.connecting;

    this.closedByUser = false;
    this.connecting = this.connectInternal().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private async connectInternal(): Promise<void> {
    const host = this.url.hostname;
    const port = Number.parseInt(this.url.port || '6379', 10);
    const useTls = this.url.protocol === 'rediss:';
    const connectTimeoutMs = this.options?.connectTimeoutMs ?? 5_000;

    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => reject(err);
      const onConnect = () => resolve();

      const socket = useTls
        ? tls.connect({ host, port, servername: host })
        : net.createConnection({ host, port });

      this.socket = socket;
      socket.setTimeout(connectTimeoutMs, () => {
        socket.destroy(new Error('Redis connect timeout'));
      });
      socket.once('error', onError);
      socket.once('connect', () => {
        socket.setTimeout(0);
        socket.off('error', onError);
        onConnect();
      });

      socket.on('data', (chunk) => this.onData(chunk));
      socket.on('error', (err) => this.onSocketError(err));
      socket.on('close', () => this.onSocketClose());
    });

    this.reconnectAttempt = 0;

    const username = this.url.username || undefined;
    const password = this.url.password || undefined;
    if (password) {
      if (username) {
        await this.command(['AUTH', username, password]);
      } else {
        await this.command(['AUTH', password]);
      }
    }
    await this.command(['PING']);
  }

  private onData(chunk: Buffer): void {
    this.buffer = this.buffer.length ? Buffer.concat([this.buffer, chunk]) : chunk;

    while (true) {
      const parsed = parseResp(this.buffer, 0);
      if (!parsed) return;

      this.buffer = this.buffer.subarray(parsed.bytes);
      const request = this.pending.shift();
      if (!request) continue;

      if (parsed.value instanceof Error) request.reject(parsed.value);
      else request.resolve(parsed.value as RespValue);
    }
  }

  private onSocketError(err: Error): void {
    this.failPending(err);
  }

  private onSocketClose(): void {
    this.socket = null;
    if (this.closedByUser) return;
    void this.reconnect();
  }

  private failPending(error: Error): void {
    while (this.pending.length) {
      const req = this.pending.shift();
      req?.reject(error);
    }
  }

  private async reconnect(): Promise<void> {
    this.reconnectAttempt++;
    const maxDelay = this.options?.maxReconnectDelayMs ?? 10_000;
    const delay = Math.min(250 * 2 ** (this.reconnectAttempt - 1), maxDelay);
    await new Promise((r) => setTimeout(r, delay));
    if (this.closedByUser) return;

    try {
      await this.connect();
    } catch {
      if (!this.closedByUser) void this.reconnect();
    }
  }

  async quit(): Promise<void> {
    this.closedByUser = true;
    try {
      if (this.isConnected) await this.command(['QUIT']);
    } catch {
      // ignore
    } finally {
      this.socket?.destroy();
      this.socket = null;
      this.failPending(new Error('Redis client closed'));
    }
  }

  async command(args: Array<string>): Promise<RespValue> {
    await this.connect();
    if (!this.socket) throw new Error('Redis socket not available');

    const payload = encodeCommand(args);
    return await new Promise<RespValue>((resolve, reject) => {
      this.pending.push({ resolve, reject });
      this.socket!.write(payload);
    });
  }
}
