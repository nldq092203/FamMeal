import pino, { type Logger, type LoggerOptions, type StreamEntry, type DestinationStream } from 'pino';
import pinoPretty from 'pino-pretty';
import { env } from '@/config/env.js';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogContext = Record<string, unknown>;

function defaultLevel(): LogLevel {
  if (env.NODE_ENV === 'production') return 'info';
  if (env.NODE_ENV === 'test') return 'silent';
  return 'debug';
}

function createPrettyStream() {
  return pinoPretty({
    colorize: true,
    translateTime: 'HH:MM:ss Z',
    ignore: 'pid,hostname',
  }) as unknown as DestinationStream;
}

function createPinoLogger(): Logger {
  const level = (env.LOG_LEVEL ?? defaultLevel()) as LogLevel;

  const baseOptions: LoggerOptions = {
    level,
    redact: {
      paths: [
        '*.password',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
        'req.headers.authorization',
      ],
      remove: true,
    },
  };

  const streams: StreamEntry[] = [];

  if (env.NODE_ENV === 'development') {
    streams.push({ stream: createPrettyStream() });
  } else {
    streams.push({ stream: pino.destination(1) as unknown as DestinationStream });
  }

  if (env.LOG_FILE) {
    streams.push({
      stream: pino.destination({ dest: env.LOG_FILE, mkdir: true, sync: false }) as unknown as DestinationStream,
    });
  }

  return pino(baseOptions, pino.multistream(streams));
}

export const logger = createPinoLogger();

export function withContext(context: LogContext): Logger {
  return logger.child(context);
}

export function logException(error: unknown, message = 'Unhandled exception', context: LogContext = {}): void {
  if (error instanceof Error) {
    logger.error({ err: error, ...context }, message);
    return;
  }
  logger.error({ error, ...context }, message);
}
