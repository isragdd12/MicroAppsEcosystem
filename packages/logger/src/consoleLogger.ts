import type { LogContext, Logger } from './types';

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  return String(error);
}

export function createConsoleLogger(): Logger {
  let currentUserId: string | null = null;

  function withUser(context?: LogContext): LogContext | undefined {
    if (currentUserId === null) return context;
    return { ...context, userId: currentUserId };
  }

  return {
    debug(message, context) {
      // eslint-disable-next-line no-console
      console.debug(`[debug] ${message}`, withUser(context) ?? '');
    },
    info(message, context) {
      // eslint-disable-next-line no-console
      console.info(`[info] ${message}`, withUser(context) ?? '');
    },
    warn(message, context) {
      // eslint-disable-next-line no-console
      console.warn(`[warn] ${message}`, withUser(context) ?? '');
    },
    error(error, context) {
      // eslint-disable-next-line no-console
      console.error(`[error] ${formatError(error)}`, withUser(context) ?? '');
    },
    setUser(user) {
      currentUserId = user?.id ?? null;
    },
  };
}
