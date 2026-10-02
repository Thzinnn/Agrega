"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Trash2, Plus, Loader2, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface CustomColumn {
  id: string;
  name: string;
  slug: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'LIST';
  section: 'BASIC' | 'CONTACT' | 'CLASSIFICATION' | 'REMUNERATION' | 'REQUIREMENTS' | 'DESCRIPTION' | 'ADDITIONAL';
  isRequired: boolean;
  isActive: boolean;
  isNative: boolean;
  isFilterable: boolean;
  options?: string[];
  createdAt: string;
  isStaticNative?: boolean;
}

export default function AdminColumnsPage() {
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState<CustomColumn | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchColumns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/columns');
      
      const staticColumns: CustomColumn[] = [
        { id: 'static-title', name: 'Título da Vaga', slug: 'title', type: 'STRING', section: 'BASIC', isRequired: true, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
        { id: 'static-company', name: 'Nome da Empresa', slug: 'company', type: 'STRING', section: 'BASIC', isRequired: true, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
        { id: 'static-location', name: 'Local de Trabalho', slug: 'location', type: 'STRING', section: 'BASIC', isRequired: true, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
        { id: 'static-description', name: 'Descrição', slug: 'description', type: 'STRING', section: 'DESCRIPTION', isRequired: true, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
        { id: 'static-salary', name: 'Salário / Remuneração', slug: 'salary', type: 'NUMBER', section: 'REMUNERATION', isRequired: false, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
        { id: 'static-benefits', name: 'Benefícios', slug: 'benefits', type: 'STRING', section: 'REMUNERATION', isRequired: false, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
        { id: 'static-appUrl', name: 'Link de Inscrição', slug: 'applicationUrl', type: 'STRING', section: 'CONTACT', isRequired: false, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
        { id: 'static-email', name: 'E-mail para Currículos', slug: 'contactEmail', type: 'STRING', section: 'CONTACT', isRequired: false, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
        { id: 'static-phone', name: 'Telefone/WhatsApp', slug: 'contactPhone', type: 'STRING', section: 'CONTACT', isRequired: false, isActive: true, isNative: true, isFilterable: false, createdAt: new Date().toISOString(), isStaticNative: true },
      ];

      setColumns([...staticColumns, ...response.data.data]);
    } catch (error) {
      console.error('Failed to load columns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColumns();
  }, []);

  const openModal = (col: CustomColumn | null = null) => {
    setColumnToEdit(col);
    if (col) {
      setValue('name', col.name);
      setValue('slug', col.slug);
      setValue('type', col.type);
      setValue('section', col.section);
      setValue('isRequired', col.isRequired);
      setValue('isFilterable', col.isFilterable);
      setValue('optionsString', (col.options || []).join(', '));
    } else {
      reset({ type: 'STRING', section: 'ADDITIONAL', isRequired: false, isFilterable: false, optionsString: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      setIsSubmitting(true);
      const payload = { ...data };
      if (payload.type === 'LIST' && typeof payload.optionsString === 'string') {
        payload.options = payload.optionsString.split(',').map((s: string) => s.trim()).filter(Boolean);
      } else {
        payload.options = [];
      }
      delete payload.optionsString;

      if (columnToEdit) {
        await api.put(`/admin/columns/${columnToEdit.id}`, payload);
      } else {
        await api.post('/admin/columns', payload);
      }
      setIsModalOpen(false);
      alert('Coluna salva com sucesso!');
      fetchColumns();
    } catch (error: unknown) {
      const axiosError = error as import('axios').AxiosError<{message: string}>;
      alert(axiosError.response?.data?.message || 'Erro ao salvar coluna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta coluna? Os dados existentes nas vagas para esta coluna não serão apagados do JSON, mas deixarão de aparecer nos formulários.')) {
      return;
    }
    try {
      await api.delete(`/admin/columns/${id}`);
      alert('Coluna excluída com sucesso!');
      fetchColumns();
    } catch (_) {
      alert('Erro ao excluir coluna.');
    }
  };

  const nameValue = watch('name');
  
  // Auto-generate slug from name if creating
  useEffect(() => {
    if (!columnToEdit && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_");
      setValue('slug', generatedSlug);
    }
  }, [nameValue, columnToEdit, setValue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Campos do Sistema & Personalizados</h1>
          <p className="text-brand-muted mt-1">Gerencie todos os campos que aparecem no formulário de vagas.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-brand-10 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-10/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Coluna Extra
        </button>
      </div>

      <div className="bg-white border border-brand-30 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-text">
            <thead className="bg-brand-60/50 text-brand-muted uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Nome da Coluna</th>
                <th className="px-6 py-4">Identificador (Slug)</th>
                <th className="px-6 py-4">Seção</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Obrigatório</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-brand-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    Carregando colunas...
                  </td>
                </tr>
              ) : columns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-brand-muted">
                    Nenhuma coluna personalizada criada ainda.
                  </td>
                </tr>
              ) : (
                columns.map((col) => (
                  <tr key={col.id} className={col.isStaticNative ? "bg-gray-50/80 opacity-60 grayscale pointer-events-none" : "hover:bg-brand-60/30 transition-colors"}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{col.name}</span>
                        {col.isNative && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-10 text-white uppercase tracking-wider">Nativa</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1 text-gray-600">{col.slug}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {col.section === 'BASIC' && 'Informações Básicas'}
                      {col.section === 'CONTACT' && 'Meios de Contato'}
                      {col.section === 'CLASSIFICATION' && 'Classificações'}
                      {col.section === 'REMUNERATION' && 'Remuneração e Benefícios'}
                      {col.section === 'REQUIREMENTS' && 'Requisitos'}
                      {col.section === 'DESCRIPTION' && 'Descrição Completa'}
                      {col.section === 'ADDITIONAL' && 'Informações Adicionais'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {col.type === 'STRING' && 'Texto'}
                      {col.type === 'NUMBER' && 'Número'}
                      {col.type === 'BOOLEAN' && 'Caixa de Seleção (Sim/Não)'}
                      {col.type === 'DATE' && 'Data'}
                      {col.type === 'LIST' && 'Lista de Opções'}
                    </td>
                    <td className="px-6 py-4">
                      {col.isRequired ? (
                        <span className="text-red-600 font-bold">Sim</span>
                      ) : (
                        <span className="text-gray-500 font-medium">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {col.isStaticNative ? (
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fixo e Rígido</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openModal(col)}
                            className="p-2 text-brand-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors pointer-events-auto"
                            title="Editar Coluna"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!col.isNative && (
                            <button 
                              onClick={() => handleDelete(col.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors pointer-events-auto"
                              title="Excluir Coluna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-brand-30 bg-brand-60/50">
              <h2 className="text-xl font-bold text-brand-text">
                {columnToEdit ? 'Editar Coluna' : 'Nova Coluna'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Nome de Exibição (Rótulo)</label>
                <input 
                  required 
                  disabled={!!columnToEdit?.isNative}
                  {...register('name')} 
                  placeholder="Ex: Carga Horária"
                  className={`w-full px-4 py-3 rounded-xl border border-brand-30 focus:outline-none focus:ring-2 focus:ring-brand-10 ${columnToEdit?.isNative ? 'bg-gray-100 opacity-70' : 'bg-brand-60'}`} 
                />
                {columnToEdit?.isNative && (
                  <p className="text-xs text-brand-muted mt-1">O nome desta coluna padrão não pode ser alterado.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Identificador Interno (Slug)</label>
                <input 
                  required 
                  disabled={!!columnToEdit}
                  {...register('slug')} 
                  placeholder="ex: carga_horaria"
                  className="w-full px-4 py-3 rounded-xl border border-brand-30 focus:outline-none focus:ring-2 focus:ring-brand-10 bg-gray-100 disabled:opacity-70 font-mono text-sm" 
                />
                {!columnToEdit && <p className="text-xs text-gray-500 mt-1">Gere automaticamente ou digite sem espaços (ex: anos_experiencia).</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Tipo de Dado</label>
                <select 
                  required 
                  disabled={!!columnToEdit?.isNative}
                  {...register('type')} 
                  className={`w-full px-4 py-3 rounded-xl border border-brand-30 focus:outline-none focus:ring-2 focus:ring-brand-10 ${columnToEdit?.isNative ? 'bg-gray-100 opacity-70' : 'bg-brand-60'}`}
                >
                  <option value="STRING">Texto Curto</option>
                  <option value="NUMBER">Número</option>
                  <option value="DATE">Data</option>
                  <option value="BOOLEAN">Caixa de Seleção (Sim/Não)</option>
                  <option value="LIST">Lista de Opções (Dropdown)</option>
                </select>
                {columnToEdit?.isNative && <p className="text-xs text-gray-500 mt-1">Colunas nativas não podem ter o tipo de dado alterado.</p>}
              </div>

              {watch('type') === 'LIST' && (
                <div>
                  <label className="block text-sm font-bold text-brand-text mb-2">Opções da Lista</label>
                  <input 
                    required={watch('type') === 'LIST'}
                    {...register('optionsString')} 
                    placeholder="Ex: CLT, PJ, Estágio (separe por vírgula)"
                    className="w-full px-4 py-3 rounded-xl border border-brand-30 focus:outline-none focus:ring-2 focus:ring-brand-10 bg-brand-60" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Digite as opções separadas por vírgula.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Seção no Formulário</label>
                <select 
                  required 
                  {...register('section')} 
                  className="w-full px-4 py-3 rounded-xl border border-brand-30 focus:outline-none focus:ring-2 focus:ring-brand-10 bg-brand-60"
                >
                  <option value="BASIC">Informações Básicas</option>
                  <option value="CONTACT">Meios de Contato</option>
                  <option value="CLASSIFICATION">Classificações</option>
                  <option value="REMUNERATION">Remuneração e Benefícios</option>
                  <option value="REQUIREMENTS">Requisitos Adicionais</option>
                  <option value="ADDITIONAL">Informações Adicionais</option>
                  <option value="DESCRIPTION">Descrição Completa</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  disabled={!!columnToEdit?.isNative && ['title', 'company', 'location', 'workplaceType', 'contractType', 'description'].includes(columnToEdit?.slug || '')} 
                  {...register('isRequired')} 
                  id="isRequired" 
                  className="w-5 h-5 accent-brand-10 disabled:opacity-50" 
                />
                <label htmlFor="isRequired" className="text-sm font-bold text-brand-text">Preenchimento Obrigatório</label>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-brand-muted hover:bg-brand-60 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button disabled={isSubmitting} type="submit" className="bg-brand-10 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-10/90 transition-colors flex items-center gap-2 disabled:opacity-70">
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Salvar Coluna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
