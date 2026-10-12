import {
  ProviderType,
  ManagedAiKey,
  KeyReleaseResult,
  AiPoolStatus,
} from '../schemas/balancer.schema.js';

interface InternalKeyEntry extends ManagedAiKey {
  secretKey: string;
}

function maskSecretKey(secretKey: string): string {
  const trimmed = secretKey.trim();
  if (trimmed.length <= 8) return '****';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export class AiKeyLoadBalancer {
  private keys: Map<string, InternalKeyEntry> = new Map();
  private roundRobinIndices: Map<ProviderType, number> = new Map([
    ['groq', 0],
    ['gemini', 0],
  ]);

  /**
   * Registra uma chave individual no pool
   */
  registerKey(provider: ProviderType, secretKey: string, name?: string): ManagedAiKey {
    const trimmed = secretKey.trim();
    if (!trimmed) {
      throw new Error('Chave de API não pode ser vazia');
    }

    // Unicidade pelo hash/conteúdo da chave
    const existing = Array.from(this.keys.values()).find(
      (k) => k.secretKey === trimmed && k.provider === provider
    );

    if (existing) {
      return this.toPublicMetadata(existing);
    }

    const index = Array.from(this.keys.values()).filter((k) => k.provider === provider).length + 1;
    const keyId = `${provider}-key-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const keyName = name || `${provider.toUpperCase()} Key #${index}`;

    const newKey: InternalKeyEntry = {
      id: keyId,
      name: keyName,
      provider,
      maskedKey: maskSecretKey(trimmed),
      secretKey: trimmed,
      status: 'HEALTHY',
      consecutiveFailures: 0,
      totalRequests: 0,
      totalSuccess: 0,
      totalRateLimits: 0,
      cooldownUntil: 0,
      activeInflight: 0,
      lastUsedAt: null,
      avgLatencyMs: 0,
    };

    this.keys.set(keyId, newKey);
    return this.toPublicMetadata(newKey);
  }

  /**
   * Registra uma lista de chaves de uma vez
   */
  registerKeys(provider: ProviderType, secretKeys: string[], baseName?: string): void {
    secretKeys.forEach((key, idx) => {
      const name = baseName ? `${baseName} #${idx + 1}` : undefined;
      this.registerKey(provider, key, name);
    });
  }

  /**
   * Atualiza status de chaves expiradas em cooldown
   */
  private refreshCooldowns(): void {
    const now = Date.now();
    for (const key of this.keys.values()) {
      if (key.status === 'COOLDOWN' && now >= key.cooldownUntil) {
        key.status = 'HEALTHY';
        key.cooldownUntil = 0;
        key.consecutiveFailures = 0;
      }
    }
  }

  /**
   * Obtém as chaves disponíveis e saudáveis para determinado provedor
   */
  getHealthyKeys(provider: ProviderType): InternalKeyEntry[] {
    this.refreshCooldowns();
    return Array.from(this.keys.values()).filter(
      (k) => k.provider === provider && k.status === 'HEALTHY'
    );
  }

  /**
   * Adquire uma chave do pool com estratégia Least-Connections + Round-Robin
   */
  acquireKey(provider: ProviderType): { id: string; secretKey: string } | null {
    const healthy = this.getHealthyKeys(provider);
    if (healthy.length === 0) {
      return null;
    }

    // 1. Encontra a menor quantidade de requisições em voo (Least-Inflight)
    const minInflight = Math.min(...healthy.map((k) => k.activeInflight));
    const candidates = healthy.filter((k) => k.activeInflight === minInflight);

    // 2. Desempate via Round-Robin entre as candidatas com menor carga
    const currentIndex = this.roundRobinIndices.get(provider) || 0;
    const selected = candidates[currentIndex % candidates.length]!;
    this.roundRobinIndices.set(provider, (currentIndex + 1) % 1000000);

    // Marca requisição em voo
    selected.activeInflight += 1;
    selected.totalRequests += 1;
    selected.lastUsedAt = Date.now();

    return {
      id: selected.id,
      secretKey: selected.secretKey,
    };
  }

  /**
   * Libera uma chave após o término da requisição, atualizando métricas e circuit breaker
   */
  releaseKey(keyId: string, result: KeyReleaseResult): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    if (key.activeInflight > 0) {
      key.activeInflight -= 1;
    }

    if (result.latencyMs !== undefined && result.latencyMs > 0) {
      key.avgLatencyMs = key.avgLatencyMs === 0 
        ? result.latencyMs 
        : Math.round((key.avgLatencyMs * 0.7) + (result.latencyMs * 0.3));
    }

    // 1. Sucesso
    if (result.success) {
      key.totalSuccess += 1;
      key.consecutiveFailures = 0;
      key.status = 'HEALTHY';
      return;
    }

    // 2. Rate Limit (HTTP 429) -> Auto-Cooldown imediato
    if (result.statusCode === 429) {
      key.totalRateLimits += 1;
      key.status = 'COOLDOWN';
      const cooldownMs = result.retryAfterSeconds 
        ? result.retryAfterSeconds * 1000 
        : 60_000; // Padrão 60 segundos
      key.cooldownUntil = Date.now() + cooldownMs;
      return;
    }

    // 3. Autenticação Inválida (HTTP 401 ou 403) -> Chave Esgotada/Revogada
    if (result.statusCode === 401 || result.statusCode === 403) {
      key.status = 'EXHAUSTED';
      return;
    }

    // 4. Falhas genéricas (5xx ou Network Error)
    key.consecutiveFailures += 1;
    if (key.consecutiveFailures >= 3) {
      key.status = 'COOLDOWN';
      key.cooldownUntil = Date.now() + 15_000; // Cooldown leve de 15s
    }
  }

  /**
   * Calcula o nível de concorrência recomendado com base nas chaves saudáveis
   */
  getRecommendedConcurrency(): number {
    this.refreshCooldowns();
    const healthyCount = Array.from(this.keys.values()).filter((k) => k.status === 'HEALTHY').length;
    if (healthyCount === 0) return 1;
    return Math.max(1, Math.min(healthyCount * 2, 8));
  }

  /**
   * Retorna o status completo e higienizado de todas as chaves no pool
   */
  getPoolStatus(): AiPoolStatus {
    this.refreshCooldowns();
    const all = Array.from(this.keys.values());
    const healthyCount = all.filter((k) => k.status === 'HEALTHY').length;
    const cooldownCount = all.filter((k) => k.status === 'COOLDOWN').length;
    const exhaustedCount = all.filter((k) => k.status === 'EXHAUSTED').length;

    return {
      totalKeys: all.length,
      healthyKeys: healthyCount,
      cooldownKeys: cooldownCount,
      exhaustedKeys: exhaustedCount,
      recommendedConcurrency: this.getRecommendedConcurrency(),
      keys: all.map((k) => this.toPublicMetadata(k)),
    };
  }

  /**
   * Reseta todo o pool de chaves em memória
   */
  clear(): void {
    this.keys.clear();
    this.roundRobinIndices.set('groq', 0);
    this.roundRobinIndices.set('gemini', 0);
  }

  private toPublicMetadata(entry: InternalKeyEntry): ManagedAiKey {
    return {
      id: entry.id,
      name: entry.name,
      provider: entry.provider,
      maskedKey: entry.maskedKey,
      status: entry.status,
      consecutiveFailures: entry.consecutiveFailures,
      totalRequests: entry.totalRequests,
      totalSuccess: entry.totalSuccess,
      totalRateLimits: entry.totalRateLimits,
      cooldownUntil: entry.cooldownUntil,
      activeInflight: entry.activeInflight,
      lastUsedAt: entry.lastUsedAt,
      avgLatencyMs: entry.avgLatencyMs,
    };
  }
}

export const aiKeyLoadBalancer = new AiKeyLoadBalancer();
