"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ConfirmModal';

interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  options: FilterOption[];
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export default function AdminFiltersPage() {
  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategoryId, setModalCategoryId] = useState<string | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<{categoryId: string, value: string}[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchFilters = async () => {
    try {
      const response = await api.get('/admin/filters');
      setCategories(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  const handleAddOptionClick = (categoryId: string) => {
    setModalCategoryId(categoryId);
    setNewOptionLabel('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (!newOptionLabel.trim() || !modalCategoryId) return;
    
    setIsSubmitting(true);
    const value = newOptionLabel.trim();
    
    try {
      const response = await api.post('/admin/filters/options', { label: value, value, filterCategoryId: modalCategoryId });
      const updatedCol = response.data.data;
      
      // Atualiza o estado local imediatamente sem precisar refetch
      setCategories(prev => prev.map(cat => {
        if (cat.id === modalCategoryId) {
          // Mantém as opções existentes e adiciona a nova
          const exists = cat.options.find(o => o.value === value);
          if (!exists) {
            return {
              ...cat,
              options: [...cat.options, { id: value, label: value, value }]
            };
          }
        }
        return cat;
      }));

      toast.success('Opção adicionada com sucesso!');
      setIsModalOpen(false);
      setNewOptionLabel('');
    } catch (_) {
      toast.error('Erro ao adicionar opção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedToDelete.length === 0) return;
    setIsSubmitting(true);
    
    // Group by categoryId
    const groups: Record<string, string[]> = {};
    for (const item of selectedToDelete) {
      if (!groups[item.categoryId]) groups[item.categoryId] = [];
      groups[item.categoryId].push(item.value);
    }

    try {
      await Promise.all(
        Object.entries(groups).map(([categoryId, values]) => 
          api.post('/admin/filters/options/delete', { categoryId, values })
        )
      );
      
      // Atualiza o estado local imediatamente
      setCategories(prev => prev.map(cat => {
        if (groups[cat.id]) {
          return {
            ...cat,
            options: cat.options.filter(opt => !groups[cat.id].includes(opt.value))
          };
        }
        return cat;
      }));

      toast.success('Opções excluídas com sucesso!');
      setIsDeleteMode(false);
      setSelectedToDelete([]);
      setIsDeleteModalOpen(false);
    } catch (_) {
      toast.error('Erro ao excluir opções');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Gerenciamento de Filtros</h1>
          <p className="text-brand-muted mt-1">Configure categorias e opções do site público.</p>
        </div>
        <div className="flex items-center gap-3">
          {isDeleteMode ? (
            <>
              <button 
                onClick={() => {
                  setIsDeleteMode(false);
                  setSelectedToDelete([]);
                }} 
                className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-60 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={selectedToDelete.length === 0 || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmar
              </button>
            </>
          ) : (
             <button 
                onClick={() => setIsDeleteMode(true)} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Opções
              </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-brand-30 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-muted" /></div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => (
              <div key={cat.id} className="border-b border-brand-30 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-bold text-brand-text">{cat.name} <span className="text-xs text-brand-muted font-normal uppercase ml-2">Slug: {cat.slug}</span></h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {cat.options.map(opt => {
                    const isSelected = selectedToDelete.some(item => item.categoryId === cat.id && item.value === opt.value);
                    return (
                      <span 
                        key={opt.id} 
                        onClick={() => {
                          if (isDeleteMode) {
                            if (isSelected) {
                               setSelectedToDelete(prev => prev.filter(item => !(item.categoryId === cat.id && item.value === opt.value)));
                            } else {
                               setSelectedToDelete(prev => [...prev, { categoryId: cat.id, value: opt.value }]);
                            }
                          }
                        }}
                        className={`relative px-3 py-1 bg-brand-60 border border-brand-30 text-brand-text rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${isDeleteMode ? 'cursor-pointer hover:bg-brand-50 hover:border-red-300' : ''} ${isSelected ? 'bg-red-50 border-red-200' : ''}`}
                      >
                        {isDeleteMode && (
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            readOnly
                            className="w-3.5 h-3.5 text-red-600 rounded focus:ring-red-500 cursor-pointer pointer-events-none"
                          />
                        )}
                        {opt.label}
                      </span>
                    );
                  })}
                  {!isDeleteMode && (
                    <button onClick={() => handleAddOptionClick(cat.id)} className="relative z-10 cursor-pointer px-3 py-1 border border-dashed border-brand-10 text-brand-10 rounded-full text-sm font-medium hover:bg-brand-50 transition-colors">
                      + Adicionar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-brand-text mb-4">Adicionar Nova Opção</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">
                  Nome da nova opção
                </label>
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  placeholder="ex: Híbrido Flex"
                  className="w-full px-4 py-2 border border-brand-30 rounded-lg focus:ring-2 focus:ring-brand-10 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-60 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleModalSubmit}
                  disabled={isSubmitting || !newOptionLabel.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-10 hover:bg-brand-10/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                  ) : (
                    'Adicionar Opção'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Excluir Opções de Filtro"
        description={`Tem certeza que deseja excluir as ${selectedToDelete.length} opções selecionadas?`}
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isSubmitting}
      />
    </div>
  );
}
