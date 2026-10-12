/**
 * Logger Estruturado JSON
 * Por que foi feito: O uso disperso de 'console.log' e 'console.error' dificulta a análise de métricas
 * em sistemas como Datadog/Cloudflare Analytics, e pode inadvertidamente vazar dados sensíveis.
 * Como ajuda: Todos os logs saem formatados em string JSON limpa, com níveis (INFO, WARN, ERROR), 
 * o que permite aos robôs parsearem os logs instantaneamente no ambiente de Produção.
 */
export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'test') return;
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...(context || {})
    }));
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'test') return;
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...(context || {})
    }));
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'test') return;
    const errObj = error instanceof Error ? error : null;
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: errObj ? errObj.message : String(error || ''),
      stack: errObj?.stack,
      ...(context || {})
    }));
  }
};
