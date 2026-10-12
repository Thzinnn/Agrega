import { describe, it, expect, beforeEach } from 'vitest';
import { AiKeyLoadBalancer } from '../services/ai-load-balancer.service.js';

describe('AiKeyLoadBalancer - Testes Unitários de Balanceamento e Resiliência', () => {
  let balancer: AiKeyLoadBalancer;

  beforeEach(() => {
    balancer = new AiKeyLoadBalancer();
  });

  it('deve registrar chaves mascaradas e listar o pool inicial com status HEALTHY', () => {
    balancer.registerKey('groq', 'gsk_testkeyone123456789', 'Groq Principal');
    balancer.registerKey('groq', 'gsk_testkeytwo987654321', 'Groq Reserva');
    balancer.registerKey('gemini', 'AIzaSyTestKeyGemini12345', 'Gemini Backup');

    const status = balancer.getPoolStatus();
    expect(status.totalKeys).toBe(3);
    expect(status.healthyKeys).toBe(3);
    expect(status.cooldownKeys).toBe(0);
    expect(status.exhaustedKeys).toBe(0);
    expect(status.recommendedConcurrency).toBe(6);

    const key1 = status.keys.find((k) => k.name === 'Groq Principal');
    expect(key1?.maskedKey).toBe('gsk_...6789');
    expect(key1?.status).toBe('HEALTHY');
  });

  it('deve distribuir requisições sequenciais usando Round-Robin', () => {
    balancer.registerKey('groq', 'key-alpha-1111111111', 'Key Alpha');
    balancer.registerKey('groq', 'key-beta-2222222222', 'Key Beta');

    const acq1 = balancer.acquireKey('groq');
    balancer.releaseKey(acq1!.id, { success: true });

    const acq2 = balancer.acquireKey('groq');
    balancer.releaseKey(acq2!.id, { success: true });

    const acq3 = balancer.acquireKey('groq');
    balancer.releaseKey(acq3!.id, { success: true });

    expect(acq1?.secretKey).toBe('key-alpha-1111111111');
    expect(acq2?.secretKey).toBe('key-beta-2222222222');
    expect(acq3?.secretKey).toBe('key-alpha-1111111111');
  });

  it('deve priorizar chaves com menor carga em voo (Least-Inflight)', () => {
    balancer.registerKey('groq', 'key-1-1111111111', 'Key 1');
    balancer.registerKey('groq', 'key-2-2222222222', 'Key 2');

    // Adquire Key 1 e mantém em voo (sem chamar releaseKey)
    const acq1 = balancer.acquireKey('groq');
    expect(acq1?.secretKey).toBe('key-1-1111111111');

    // A próxima chamada deve priorizar a Key 2 que tem 0 requisições em voo
    const acq2 = balancer.acquireKey('groq');
    expect(acq2?.secretKey).toBe('key-2-2222222222');

    // Libera a Key 1
    balancer.releaseKey(acq1!.id, { success: true });
    const status = balancer.getPoolStatus();
    const key1Status = status.keys.find((k) => k.id === acq1!.id);
    expect(key1Status?.activeInflight).toBe(0);
  });

  it('deve acionar Circuit Breaker e isolar chave em COOLDOWN ao receber HTTP 429', () => {
    balancer.registerKey('groq', 'key-rate-limited-111', 'Key Quota');
    balancer.registerKey('groq', 'key-healthy-2222222', 'Key Saudável');

    const acq1 = balancer.acquireKey('groq');
    expect(acq1?.secretKey).toBe('key-rate-limited-111');

    // Simula erro 429 Too Many Requests com Retry-After de 45s
    balancer.releaseKey(acq1!.id, {
      success: false,
      statusCode: 429,
      retryAfterSeconds: 45,
    });

    const statusAfter429 = balancer.getPoolStatus();
    const keyQuota = statusAfter429.keys.find((k) => k.id === acq1!.id);
    expect(keyQuota?.status).toBe('COOLDOWN');
    expect(keyQuota?.totalRateLimits).toBe(1);
    expect(keyQuota?.cooldownUntil).toBeGreaterThan(Date.now() + 40000);

    // As próximas aquisições devem pular a chave em cooldown e usar apenas a saudável
    const acq2 = balancer.acquireKey('groq');
    expect(acq2?.secretKey).toBe('key-healthy-2222222');

    const acq3 = balancer.acquireKey('groq');
    expect(acq3?.secretKey).toBe('key-healthy-2222222');
  });

  it('deve marcar chave como EXHAUSTED em caso de HTTP 401 ou 403 (chave revogada)', () => {
    balancer.registerKey('groq', 'invalid-key-revoked-000', 'Key Revogada');

    const acq = balancer.acquireKey('groq');
    balancer.releaseKey(acq!.id, {
      success: false,
      statusCode: 401,
      error: 'Unauthorized / Invalid Key',
    });

    const status = balancer.getPoolStatus();
    expect(status.exhaustedKeys).toBe(1);
    expect(status.healthyKeys).toBe(0);

    // Tentativa de adquirir deve retornar null (nenhuma chave saudável)
    const nextAcq = balancer.acquireKey('groq');
    expect(nextAcq).toBeNull();
  });

  it('deve recuperar chave em COOLDOWN automaticamente após o término do TTL', () => {
    balancer.registerKey('gemini', 'gemini-key-recovering', 'Gemini Recovering');

    const acq = balancer.acquireKey('gemini');
    // Cooldown com 0 segundos (expira no mesmo instante)
    balancer.releaseKey(acq!.id, {
      success: false,
      statusCode: 429,
      retryAfterSeconds: -1,
    });

    // Próxima aquisição faz refresh e recupera a chave
    const acqRecovered = balancer.acquireKey('gemini');
    expect(acqRecovered).not.toBeNull();
    expect(acqRecovered?.secretKey).toBe('gemini-key-recovering');
  });

  it('deve permitir Tier Failover transparente quando todas as chaves de um provedor falharem', () => {
    balancer.registerKey('groq', 'groq-exhausted-1', 'Groq 1');
    balancer.registerKey('gemini', 'gemini-fallback-active', 'Gemini 1');

    // Esgota a chave Groq
    const groqKey = balancer.acquireKey('groq');
    balancer.releaseKey(groqKey!.id, { success: false, statusCode: 429 });

    // Groq não tem mais chaves saudáveis
    expect(balancer.acquireKey('groq')).toBeNull();

    // Fallback para Tier 2 (Gemini) obtém chave saudável imediatamente
    const geminiKey = balancer.acquireKey('gemini');
    expect(geminiKey).not.toBeNull();
    expect(geminiKey?.secretKey).toBe('gemini-fallback-active');
  });
});
