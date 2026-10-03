export const logger = {
  info: (message: string, context?: any) => {
    if (process.env.NODE_ENV === 'test') return;
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  },
  warn: (message: string, context?: any) => {
    if (process.env.NODE_ENV === 'test') return;
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  },
  error: (message: string, error?: any, context?: any) => {
    if (process.env.NODE_ENV === 'test') return;
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error?.message || error,
      stack: error?.stack,
      ...context
    }));
  }
};
