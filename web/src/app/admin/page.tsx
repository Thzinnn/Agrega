"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Briefcase, Activity, CheckCircle, XCircle } from 'lucide-react';

interface DashboardMetrics {
  totalJobs: number;
  activeJobs: number;
  inactiveJobs: number;
  totalClicks: number;
  jobsBySource: { source: string; count: number }[];
  topJobs: { id: string; title: string; company: string; clicksCount: number; source: string }[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/admin/metrics');
        setMetrics(response.data.data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex gap-4 p-4">Carregando métricas...</div>;
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      
      {/* Cards de Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-brand-30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-brand-muted font-medium">Total de Vagas</p>
            <p className="text-2xl font-bold text-brand-text">{metrics.totalJobs}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-brand-30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-brand-muted font-medium">Vagas Ativas</p>
            <p className="text-2xl font-bold text-brand-text">{metrics.activeJobs}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-brand-30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-brand-muted font-medium">Vagas Inativas</p>
            <p className="text-2xl font-bold text-brand-text">{metrics.inactiveJobs}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-brand-30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-brand-muted font-medium">Total de Cliques</p>
            <p className="text-2xl font-bold text-brand-text">{metrics.totalClicks}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Analítico */}
        <div className="bg-white p-6 rounded-3xl border border-brand-30 shadow-sm">
          <h2 className="text-lg font-bold text-brand-text mb-6">Origem das Vagas (Scraper vs Manual)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.jobsBySource}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="count" name="Quantidade" fill="#2563EB" radius={[8, 8, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vagas mais engajadas */}
        <div className="bg-white p-6 rounded-3xl border border-brand-30 shadow-sm">
          <h2 className="text-lg font-bold text-brand-text mb-6">Top Vagas Mais Acessadas</h2>
          <div className="space-y-4">
            {metrics.topJobs.length === 0 ? (
              <p className="text-brand-muted text-center py-8">Nenhum clique registrado ainda.</p>
            ) : (
              metrics.topJobs.map((job, idx) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-brand-60 rounded-2xl border border-brand-30">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-brand-10/50 w-6">{idx + 1}</span>
                    <div>
                      <p className="font-bold text-brand-text line-clamp-1">{job.title}</p>
                      <p className="text-sm text-brand-muted flex items-center gap-2">
                        {job.company} 
                        <span className="w-1 h-1 bg-brand-muted rounded-full" /> 
                        <span className="text-xs uppercase font-bold tracking-wider">{job.source}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xl font-bold text-brand-text">{job.clicksCount}</p>
                    <p className="text-xs font-medium text-brand-muted">CLIQUES</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
