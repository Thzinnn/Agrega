/**
 * Serviço de Controle de Tráfego e Proteção de Conexões (Ingestion Traffic Load Balancer)
 * Responsável por gerenciar concorrência em voo (Inflight Guard), evitar saturação do pool
 * de conexões do Neon PostgreSQL e aplicar backpressure / descarte de duplicatas em rajada.
 */
export class TrafficLimiterService {
  private inflight: number = 0;
  private readonly maxConcurrent: number;
  private readonly queueWaitTimeoutMs: number;
  private recentHashes: Set<string> = new Set();
  private hashHistory: string[] = [];
  private readonly maxHashCacheSize: number = 1000;

  // Métricas agregadas de tráfego
  private totalRequests: number = 0;
  private rejectedRequests: number = 0;
  private deduplicatedCount: number = 0;
  private latencies: number[] = [];

  constructor(maxConcurrent: number = 8, queueWaitTimeoutMs: number = 3000) {
    this.maxConcurrent = maxConcurrent;
    this.queueWaitTimeoutMs = queueWaitTimeoutMs;
  }

  /**
   * Adquire um slot de execução concorrente para proteger o banco de dados.
   * Aguarda se houver vagas em voo até o limite de timeout, ou lança erro de saturação.
   */
  async acquireSlot(): Promise<() => void> {
    this.totalRequests++;

    if (this.inflight < this.maxConcurrent) {
      this.inflight++;
      const startTime = Date.now();
      return () => this.releaseSlot(startTime);
    }

    // Aguarda liberação com polling assíncrono rápido (10ms)
    const startWait = Date.now();
    while (this.inflight >= this.maxConcurrent) {
      if (Date.now() - startWait > this.queueWaitTimeoutMs) {
        this.rejectedRequests++;
        throw new TrafficOverloadedError(
          `Gateway sobrecarregado (${this.inflight}/${this.maxConcurrent} requisições em voo). Aguarde alguns instantes.`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    this.inflight++;
    const startTime = Date.now();
    return () => this.releaseSlot(startTime);
  }

  private releaseSlot(startTime: number): void {
    this.inflight = Math.max(0, this.inflight - 1);
    const duration = Date.now() - startTime;
    this.latencies.push(duration);
    if (this.latencies.length > 100) {
      this.latencies.shift();
    }
  }

  /**
   * Checa se um hash de payload já foi processado recentemente (Idempotência / Deduplicação antecipada)
   */
  checkAndRecordHash(hash: string): boolean {
    if (this.recentHashes.has(hash)) {
      this.deduplicatedCount++;
      return true; // É duplicata
    }

    this.recentHashes.add(hash);
    this.hashHistory.push(hash);

    if (this.hashHistory.length > this.maxHashCacheSize) {
      const oldest = this.hashHistory.shift();
      if (oldest) {
        this.recentHashes.delete(oldest);
      }
    }

    return false;
  }

  /**
   * Retorna métricas de saúde e saturação do tráfego do gateway
   */
  getMetrics() {
    const avgLatencyMs =
      this.latencies.length > 0
        ? Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length)
        : 0;

    return {
      inflight: this.inflight,
      maxConcurrent: this.maxConcurrent,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests,
      deduplicatedCount: this.deduplicatedCount,
      avgLatencyMs,
      cachedHashesCount: this.recentHashes.size,
    };
  }

  /**
   * Limpeza de estado para testes
   */
  clear(): void {
    this.inflight = 0;
    this.totalRequests = 0;
    this.rejectedRequests = 0;
    this.deduplicatedCount = 0;
    this.latencies = [];
    this.recentHashes.clear();
    this.hashHistory = [];
  }
}

export class TrafficOverloadedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrafficOverloadedError';
  }
}

export const trafficLimiter = new TrafficLimiterService();
