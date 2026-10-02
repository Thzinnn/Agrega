"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Trash2, Plus, Loader2, Edit, Eye, X, CheckCircle2 } from 'lucide-react';
import { JobFormModal, JobFormData } from '@/components/JobFormModal';

interface Job {
  id: string;
  title: string;
  company: string;
  clicksCount: number;
  source: string;
  isActive: boolean;
  createdAt: string;
  [key: string]: unknown;
}

const OPTION_LABELS: Record<string, string> = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ON_SITE: 'Presencial',
  FUNDAMENTAL_INCOMPLETE: 'Ensino Fundamental - Incompleto',
  FUNDAMENTAL_COMPLETE: 'Ensino Fundamental - Completo',
  MEDIO_INCOMPLETE: 'Ensino Médio - Incompleto',
  MEDIO_COMPLETE: 'Ensino Médio - Completo',
  SUPERIOR_INCOMPLETE: 'Graduação - Incompleta',
  SUPERIOR_COMPLETE: 'Graduação - Completa',
  POS_GRADUACAO: 'Pós-graduação',
  MESTRADO: 'Mestrado',
  DOUTORADO: 'Doutorado',
  CLT: 'CLT',
  PJ: 'PJ',
  OTHER: 'Outros'
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobFormData | null>(null);
  const [jobToView, setJobToView] = useState<JobFormData | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/jobs');
      setJobs(response.data.data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSoftDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja inativar esta vaga? Ela não aparecerá mais nas buscas, mas seus dados e métricas serão mantidos.')) {
      return;
    }
    
    try {
      setActionLoading(id);
      await api.patch(`/admin/jobs/${id}/soft-delete`);
      await fetchJobs();
    } catch (_) {
      alert('Erro ao inativar a vaga.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja reativar esta vaga? Ela voltará a aparecer nas buscas imediatamente.')) {
      return;
    }
    
    try {
      setActionLoading(id);
      await api.patch(`/admin/jobs/${id}/activate`);
      await fetchJobs();
    } catch (_) {
      alert('Erro ao ativar a vaga.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Gerenciamento de Vagas</h1>
          <p className="text-brand-muted mt-1">Visualize e administre as vagas ativas e inativas do portal.</p>
        </div>
        <button 
          onClick={() => { setJobToEdit(null); setIsModalOpen(true); }}
          className="bg-brand-10 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-10/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Vaga Manual
        </button>
      </div>

      <div className="bg-white border border-brand-30 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-text">
            <thead className="bg-brand-60/50 text-brand-muted uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Vaga</th>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Cliques</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-brand-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    Carregando vagas...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-brand-muted">
                    Nenhuma vaga encontrada.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-brand-60/30 transition-colors">
                    <td className="px-6 py-4 font-bold">{job.title}</td>
                    <td className="px-6 py-4 font-medium">{job.company}</td>
                    <td className="px-6 py-4">
                      {job.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        job.source === 'SCRAPER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {job.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">{job.clicksCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-brand-muted font-medium">
                      {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setJobToView(job)}
                          className="p-2 text-brand-muted hover:text-brand-10 hover:bg-brand-60 rounded-lg transition-colors"
                          title="Visualizar Vaga"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setJobToEdit(job); setIsModalOpen(true); }}
                          className="p-2 text-brand-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Vaga"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {job.isActive ? (
                          <button 
                            onClick={() => handleSoftDelete(job.id)}
                            disabled={actionLoading === job.id}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Inativar Vaga"
                          >
                            {actionLoading === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleActivate(job.id)}
                            disabled={actionLoading === job.id}
                            className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Ativar Vaga"
                          >
                            {actionLoading === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <JobFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchJobs} 
        jobToEdit={jobToEdit} 
      />

      {jobToView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-brand-30 bg-brand-60/50 shrink-0">
              <h2 className="text-xl font-bold text-brand-text">
                Detalhes da Vaga
              </h2>
              <button onClick={() => setJobToView(null)} className="text-brand-muted hover:text-brand-text">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-brand-text">{jobToView.title}</h3>
                <p className="text-brand-muted font-medium">{jobToView.company} • {jobToView.location || 'Local não informado'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-60/30 p-4 rounded-xl border border-brand-30">
                  <p className="text-sm text-brand-muted font-bold mb-1">Modalidade</p>
                  <p className="text-brand-text font-medium">{OPTION_LABELS[jobToView.workplaceType || ''] || jobToView.workplaceType}</p>
                </div>
                <div className="bg-brand-60/30 p-4 rounded-xl border border-brand-30">
                  <p className="text-sm text-brand-muted font-bold mb-1">Tipo de Contrato</p>
                  <p className="text-brand-text font-medium">{OPTION_LABELS[jobToView.contractType || ''] || jobToView.contractType}</p>
                </div>
                <div className="bg-brand-60/30 p-4 rounded-xl border border-brand-30">
                  <p className="text-sm text-brand-muted font-bold mb-1">Salário</p>
                  <p className="text-brand-text font-medium">{jobToView.salary ? `R$ ${jobToView.salary}` : 'Não informado'}</p>
                </div>
                <div className="bg-brand-60/30 p-4 rounded-xl border border-brand-30">
                  <p className="text-sm text-brand-muted font-bold mb-1">Escolaridade</p>
                  <p className="text-brand-text font-medium">{OPTION_LABELS[jobToView.education || ''] || jobToView.education || 'Não exigida'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-brand-text mb-2">Descrição</h4>
                <div className="bg-brand-60/30 p-4 rounded-xl border border-brand-30 text-brand-text whitespace-pre-wrap">
                  {jobToView.description}
                </div>
              </div>

              {jobToView.requirements && jobToView.requirements.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-brand-text mb-2">Requisitos</h4>
                  <ul className="list-disc pl-5 space-y-1 text-brand-text">
                    {jobToView.requirements.map((req: string, i: number) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {jobToView.customData && Object.keys(jobToView.customData).length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-brand-text mb-2">Campos Adicionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(jobToView.customData).map(([key, value]) => (
                      <div key={key} className="bg-brand-60/30 p-4 rounded-xl border border-brand-30">
                        <p className="text-sm text-brand-muted font-bold mb-1">{key}</p>
                        <p className="text-brand-text font-medium">{value !== null && value !== undefined && value !== '' ? (OPTION_LABELS[String(value)] || String(value)) : 'Não informado'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-brand-30 bg-brand-60/50 flex justify-end shrink-0">
              <button onClick={() => setJobToView(null)} className="px-6 py-2 bg-brand-10 text-white rounded-xl font-bold hover:bg-brand-10/90 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
