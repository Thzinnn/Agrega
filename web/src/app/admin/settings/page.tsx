"use client";

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Cpu, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Key, 
  RefreshCw, 
  Clock, 
  Layers,
  ArrowUpRight,
  Plus,
  Zap
} from 'lucide-react';

interface ManagedKey {
  id: string;
  provider: 'groq' | 'gemini';
  maskedKey: string;
  status: 'HEALTHY' | 'COOLDOWN' | 'EXHAUSTED' | 'DISABLED';
  totalRequests: number;
  totalSuccess: number;
  totalRateLimits: number;
  activeInflight: number;
  avgLatencyMs: number;
  cooldownRemainingSeconds: number;
}

interface AiPoolStatus {
  totalKeys: number;
  healthyKeys: number;
  cooldownKeys: number;
  exhaustedKeys: number;
  recommendedConcurrency: number;
  keys: ManagedKey[];
}

interface TrafficMetrics {
  inflight: number;
  maxConcurrent: number;
  totalRequests: number;
  rejectedRequests: number;
  deduplicatedCount: number;
  avgLatencyMs: number;
  cachedHashesCount: number;
}

interface GatewayMetricsResponse {
  traffic: TrafficMetrics;
  scraperMetrics?: {
    totalReceived: number;
    processedCount: number;
    discardedCount: number;
    failedCount: number;
    successRatePercent: number;
    avgLatencyMs: number;
  };
}

export default function SettingsPage() {
  const [aiPool, setAiPool] = useState<AiPoolStatus | null>(null);
  const [traffic, setTraffic] = useState<TrafficMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formulário de nova chave
  const [provider, setProvider] = useState<'GROQ' | 'GEMINI'>('GROQ');
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const [aiRes, trafficRes] = await Promise.all([
        api.get('/admin/settings/ai-pool').catch(() => null),
        api.get('/gateway/metrics').catch(() => null),
      ]);

      if (aiRes?.data?.data) {
        setAiPool(aiRes.data.data as AiPoolStatus);
      }
      if (trafficRes?.data?.data?.traffic) {
        setTraffic(trafficRes.data.data.traffic as TrafficMetrics);
      }
    } catch (err: unknown) {
      console.error('Falha ao carregar métricas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh a cada 10 segundos
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue.trim()) {
      toast.error('Informe o valor da chave de API');
      return;
    }

    setSavingKey(true);
    try {
      const fullKeyName = keyName.trim()
        ? `${provider}_API_KEY_${keyName.trim().toUpperCase()}`
        : `${provider}_API_KEY_${Date.now().toString().slice(-4)}`;

      await api.post('/admin/settings', {
        key: fullKeyName,
        value: keyValue.trim(),
        description: `Chave ${provider} adicionada via Painel Admin`,
      });

      toast.success(`Chave ${fullKeyName} cadastrada no pool com sucesso!`);
      setKeyValue('');
      setKeyName('');
      fetchMetrics();
    } catch {
      toast.error('Erro ao salvar chave de API');
    } finally {
      setSavingKey(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-brand-muted animate-pulse">
        Carregando métricas dos balanceadores...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Configurações & Load Balancers</h1>
          <p className="text-sm text-brand-muted mt-1">
            Supervisão em tempo real da distribuição de carga de IA e do Gateway Universal de Ingestão.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-30 hover:border-brand-text text-brand-text rounded-2xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar Métricas
        </button>
      </div>

      {/* Visão Geral Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-brand-30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-medium">Chaves de IA Ativas</p>
            <p className="text-xl font-bold text-brand-text">
              {aiPool ? `${aiPool.healthyKeys} / ${aiPool.totalKeys}` : '0 / 0'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-brand-30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-medium">Concorrência Recomendada</p>
            <p className="text-xl font-bold text-emerald-600">
              {aiPool?.recommendedConcurrency ?? 2} threads
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-brand-30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-medium">Requisições em Voo (Gateway)</p>
            <p className="text-xl font-bold text-brand-text">
              {traffic ? `${traffic.inflight} / ${traffic.maxConcurrent}` : '0 / 8'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-brand-30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-muted font-medium">Deduplicações Evitadas</p>
            <p className="text-xl font-bold text-purple-600">
              {traffic?.deduplicatedCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal: AI Load Balancer + Traffic Balancer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel do AI Key Load Balancer (2 colunas) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-brand-30 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                Load Balancer de Chaves de IA
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Estratégia Least-Inflight com Circuit Breaker e rotação Round-Robin entre chaves.
              </p>
            </div>
          </div>

          {/* Tabela de Chaves */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-brand-muted text-xs uppercase border-b border-brand-30">
                <tr>
                  <th className="py-3 px-4 font-semibold">Provedor</th>
                  <th className="py-3 px-4 font-semibold">Chave Mascarada</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Requisições</th>
                  <th className="py-3 px-4 font-semibold">Latência</th>
                  <th className="py-3 px-4 font-semibold">Cooldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aiPool && aiPool.keys.length > 0 ? (
                  aiPool.keys.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-brand-text uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {k.provider}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-700">
                        {k.maskedKey}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            k.status === 'HEALTHY'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : k.status === 'COOLDOWN'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-brand-text">{k.totalSuccess}</span> / {k.totalRequests}
                        {k.totalRateLimits > 0 && (
                          <span className="text-amber-600 ml-1 font-medium">({k.totalRateLimits} 429)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                        {k.avgLatencyMs > 0 ? `${k.avgLatencyMs}ms` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium">
                        {k.cooldownRemainingSeconds > 0 ? (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {k.cooldownRemainingSeconds}s
                          </span>
                        ) : (
                          <span className="text-gray-400">Pronta</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-brand-muted text-xs">
                      Nenhuma chave ativa no pool em memória. Cadastre chaves abaixo para iniciar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel do Gateway Único de Tráfego (1 coluna) */}
        <div className="bg-white p-6 rounded-3xl border border-brand-30 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Gateway Único de Tráfego
            </h2>
            <p className="text-xs text-brand-muted">
              Proteção contra esgotamento de conexões do PostgreSQL / Neon via backpressure HTTP 429.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                <span className="text-brand-muted">Concorrência Máxima DB</span>
                <span className="font-bold text-brand-text">{traffic?.maxConcurrent ?? 8}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                <span className="text-brand-muted">Requisições Totais</span>
                <span className="font-bold text-brand-text">{traffic?.totalRequests ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                <span className="text-brand-muted">Rejeições por Sobrecarga (429)</span>
                <span className="font-bold text-amber-600">{traffic?.rejectedRequests ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                <span className="text-brand-muted">Hashes em Cache Dedup</span>
                <span className="font-bold text-purple-600">{traffic?.cachedHashesCount ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-brand-muted">Latência Média de I/O</span>
                <span className="font-bold text-emerald-600">{traffic?.avgLatencyMs ?? 0}ms</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Backpressure Ativo
            </p>
            <p className="text-blue-700">
              Scrapers externos que excederem o limite recebem instrução automática para esperar 3 segundos.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário: Adicionar Nova Chave ao Pool */}
      <div className="bg-white p-6 rounded-3xl border border-brand-30 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-brand-text" />
          <h2 className="text-lg font-bold text-brand-text">Cadastrar Nova Chave de IA no Pool</h2>
        </div>
        <p className="text-xs text-brand-muted">
          As chaves são salvas com criptografia e adicionadas dinamicamente ao Load Balancer sem necessidade de reiniciar o servidor.
        </p>

        <form onSubmit={handleSaveKey} className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5">Provedor</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'GROQ' | 'GEMINI')}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-brand-30 rounded-2xl text-sm font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GROQ">Groq Cloud (Llama Vision)</option>
              <option value="GEMINI">Google Gemini Vision</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5">Identificador (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: BACKUP_1 ou CONTA_2"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-brand-30 rounded-2xl text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1.5">Chave Secreta de API</label>
            <input
              type="password"
              placeholder="Ex: gsk_... ou AIza..."
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-brand-30 rounded-2xl text-sm font-mono text-brand-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingKey}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {savingKey ? 'Salvando...' : 'Salvar Chave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
