"use client";

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, X, MapPin, Building2, Briefcase, Link as LinkIcon, DollarSign, AlignLeft, Info, CheckCircle2, Phone, Mail, Contact, LayoutList } from 'lucide-react';
import { api } from '@/lib/api';

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

export interface JobFormData {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  salary?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  benefits?: string | null;
  applicationUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  workplaceType?: string;
  education?: string | null;
  contractType?: string;
  hasVA?: boolean;
  hasVR?: boolean;
  hasVT?: boolean;
  hasLifeInsurance?: boolean;
  hasMedicalInsurance?: boolean;
  hasDentalInsurance?: boolean;
  requirements?: string[];
  customData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CustomColumn {
  id: string;
  name: string;
  slug: string;
  type: string;
  section: string;
  isRequired: boolean;
  isActive: boolean;
  isNative: boolean;
  options?: string[];
}

export function JobFormModal({
  isOpen,
  onClose,
  onSuccess,
  jobToEdit = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobToEdit?: Record<string, unknown> | null;
}) {
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [loading, setLoading] = useState(false);
  
  /**
   * Formulário Estrito via React Hook Form
   * Por que foi feito: Permite que o Next.js gerencie centenas de inputs dinâmicos 
   * (criados pelos admins) sem causar re-renders da tela a cada tecla digitada.
   * O Zod (no Backend) e as regras HTML5 nativas garantem que as validações brutas 
   * (como teto vs piso salarial) não explodam na cara do usuário.
   */
  const { register, handleSubmit, reset, setValue, watch } = useForm<JobFormData>();

  // Location
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Requirements
  const [requirementsList, setRequirementsList] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  const [showRequirementInput, setShowRequirementInput] = useState(false);

  const watchSalary = watch('salary');
  const watchSalaryMin = watch('salaryMin');
  const watchSalaryMax = watch('salaryMax');

  useEffect(() => {
    if (isOpen) {
      fetchColumns();
      if (jobToEdit) {
        Object.keys(jobToEdit).forEach((key) => {
          if (key !== 'customData' && key !== 'requirements') {
            setValue(key, jobToEdit[key]);
          }
        });
        if (jobToEdit.requirements && Array.isArray(jobToEdit.requirements)) {
           setRequirementsList(jobToEdit.requirements);
           setValue('requirements', jobToEdit.requirements);
        } else {
           setRequirementsList([]);
        }
        if (jobToEdit.location) {
           setSearchLocation(jobToEdit.location as string);
        } else {
           setSearchLocation('');
        }
        if (jobToEdit.customData && typeof jobToEdit.customData === 'object') {
          const cData = jobToEdit.customData as Record<string, unknown>;
          Object.keys(cData).forEach((key) => {
            setValue(`customData.${key}`, cData[key]);
          });
        }
      } else {
        reset({
          hasVA: false,
          hasVR: false,
          hasVT: false,
          hasLifeInsurance: false,
          hasMedicalInsurance: false,
          hasDentalInsurance: false,
          requirements: [],
        });
        setRequirementsList([]);
        setSearchLocation('');
      }
    }
  }, [isOpen, jobToEdit, reset, setValue]);

  const fetchColumns = async () => {
    try {
      const res = await api.get('/admin/columns');
      setColumns(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios');
        const municipalities = await response.json();
        
        const formatted = [
          'Remoto',
          'Híbrido',
          ...municipalities.map((m: { nome: string }) => `${m.nome}, SP`)
        ];
        setAllLocations(Array.from(new Set(formatted)));
      } catch {
        setAllLocations(['Remoto', 'Híbrido', 'São Paulo, SP', 'Campinas, SP', 'Ribeirão Preto, SP']);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (searchLocation.trim().length >= 1) {
      const term = searchLocation.toLowerCase();
      const filtered = allLocations
        .filter(loc => loc.toLowerCase().includes(term))
        .slice(0, 8);
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  }, [searchLocation, allLocations]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (loc: string) => {
    setSearchLocation(loc);
    setValue('location', loc, { shouldValidate: true });
    setShowSuggestions(false);
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim().length > 0) {
      const updatedList = [...requirementsList, newRequirement.trim()];
      setRequirementsList(updatedList);
      setValue('requirements', updatedList);
      setNewRequirement('');
      setShowRequirementInput(false);
    }
  };

  const handleRemoveRequirement = (indexToRemove: number) => {
    const updatedList = requirementsList.filter((_, idx) => idx !== indexToRemove);
    setRequirementsList(updatedList);
    setValue('requirements', updatedList);
  };

  const getCol = (slug: string) => columns.find(c => c.slug === slug);
  const isReq = (slug: string) => getCol(slug)?.isRequired || false;
  const isActive = (slug: string) => getCol(slug)?.isActive !== false;

  const renderCustomCols = (section: string) => {
    const cols = columns.filter(c => !c.isNative && c.isActive && c.section === section);
    if (!cols.length) return null;
    
    return (
      <>
        {cols.map(col => (
          <div key={col.id} className="space-y-2">
            {col.type === 'BOOLEAN' ? (
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" required={col.isRequired} {...register(`customData.${col.slug}`)} className="w-5 h-5 accent-brand-10" />
                <label className="text-sm font-medium text-brand-text">{col.name} {col.isRequired && '*'}</label>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-brand-text">{col.name} {col.isRequired && '*'}</label>
                {col.options && col.options.length > 0 ? (
                  <select required={col.isRequired} {...register(`customData.${col.slug}`)} className="w-full bg-brand-60/50 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-10/50 appearance-none">
                    <option value="">Selecione...</option>
                    {col.options.map((opt: string) => (
                      <option key={opt} value={opt}>{OPTION_LABELS[opt] || opt}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type={col.type === 'NUMBER' ? 'number' : col.type === 'DATE' ? 'date' : 'text'}
                    required={col.isRequired}
                    {...register(`customData.${col.slug}`)} 
                    className="w-full bg-brand-60/50 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-10/50" 
                  />
                )}
              </>
            )}
          </div>
        ))}
      </>
    );
  };

  const onSubmit = async (data: JobFormData) => {
    setLoading(true);
    try {
      const hasUrl = !!data.applicationUrl;
      const hasEmail = !!data.contactEmail;
      const hasPhone = !!data.contactPhone && typeof data.contactPhone === 'string' && data.contactPhone.trim() !== '';
      if (!hasUrl && !hasEmail && !hasPhone) {
        alert("Você deve informar pelo menos um meio de contato (Link, E-mail ou Telefone)");
        setLoading(false);
        return;
      }

      if (data.salary) {
        if (data.salaryMin || data.salaryMax) {
          alert("Se informar valor fixo, limpe o piso e o teto.");
          setLoading(false);
          return;
        }
      }

      if (data.salaryMin && data.salaryMax) {
        if (Number(data.salaryMax) < Number(data.salaryMin)) {
          alert("O teto salarial não pode ser menor que o mínimo");
          setLoading(false);
          return;
        }
      }

      if (data.salary) data.salary = Number(data.salary);
      if (data.salaryMin) data.salaryMin = Number(data.salaryMin);
      if (data.salaryMax) data.salaryMax = Number(data.salaryMax);
      if (!data.salary) data.salary = null;
      if (!data.salaryMin) data.salaryMin = null;
      if (!data.salaryMax) data.salaryMax = null;

      if (jobToEdit) {
        await api.put(`/admin/jobs/${jobToEdit.id}`, data);
      } else {
        await api.post('/admin/jobs', data);
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error(error);
      const axiosError = error as import('axios').AxiosError<{message: string}>;
      alert(axiosError.response?.data?.message || 'Erro ao salvar vaga');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-brand-30 bg-brand-60/50 shrink-0">
          <h2 className="text-xl font-bold text-brand-text">
            {jobToEdit ? 'Editar Vaga' : 'Nova Vaga'}
          </h2>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-text transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-8">
          
          {/* Informações Básicas */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <Briefcase className="w-5 h-5 text-brand-10" /> Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isActive('title') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-text">Título da Vaga {isReq('title') && '*'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-brand-muted/70" />
                    </div>
                    <input
                      required={isReq('title')}
                      {...register('title')}
                      className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                      placeholder="Ex: Desenvolvedor Front-end React"
                    />
                  </div>
                </div>
              )}

              {isActive('company') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-text">Nome da Empresa {isReq('company') && '*'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-brand-muted/70" />
                    </div>
                    <input
                      required={isReq('company')}
                      {...register('company')}
                      className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                      placeholder="Ex: Tech Corp"
                    />
                  </div>
                </div>
              )}

              {isActive('location') && (
                <div className="space-y-2" ref={wrapperRef}>
                  <label className="text-sm font-medium text-brand-text">Localização {isReq('location') && '*'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-brand-muted/70" />
                    </div>
                    <input
                      type="text"
                      required={isReq('location')}
                      value={searchLocation}
                      onChange={(e) => {
                        setSearchLocation(e.target.value);
                        setValue('location', e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                      placeholder="Ex: São Paulo, SP ou Remoto"
                      autoComplete="off"
                    />
                    {showSuggestions && filteredLocations.length > 0 && (
                      <ul className="absolute top-full left-0 mt-2 w-full bg-brand-30 border border-gray-300 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto py-2">
                        {filteredLocations.map(loc => (
                          <li 
                            key={loc}
                            onClick={() => handleSelectLocation(loc)}
                            className="px-4 py-2 hover:bg-brand-60 text-brand-text cursor-pointer text-left text-sm font-medium transition-colors"
                          >
                            {loc}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input type="hidden" {...register('location')} />
                </div>
              )}
              {renderCustomCols('BASIC')}
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <Contact className="w-5 h-5 text-brand-10" /> Meios de Contato
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Link para Candidatura</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-brand-muted/70" />
                  </div>
                  <input
                    {...register('applicationUrl')}
                    className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: https://sua-empresa.gupy.io/vaga"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">E-mail de Contato</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-brand-muted/70" />
                  </div>
                  <input
                    type="email"
                    {...register('contactEmail')}
                    className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: vagas@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Telefone / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-brand-muted/70" />
                  </div>
                  <input
                    {...register('contactPhone')}
                    className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
              </div>
              {renderCustomCols('CONTACT')}
            </div>
          </div>

          {/* Classificações */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <Info className="w-5 h-5 text-brand-10" /> Classificações
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isActive('workplaceType') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-text">Modalidade {isReq('workplaceType') && '*'}</label>
                  <select
                    required={isReq('workplaceType')}
                    {...register('workplaceType')}
                    defaultValue=""
                    className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 appearance-none"
                  >
                    <option value="" disabled>Não informado</option>
                    {getCol('workplaceType')?.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{OPTION_LABELS[opt] || opt}</option>
                    ))}
                    {!getCol('workplaceType')?.options?.length && (
                      <>
                        <option value="REMOTE">Remoto</option>
                        <option value="HYBRID">Híbrido</option>
                        <option value="ON_SITE">Presencial</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {isActive('education') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-text">Escolaridade {isReq('education') && '*'}</label>
                  <select
                    required={isReq('education')}
                    {...register('education')}
                    defaultValue=""
                    className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 appearance-none"
                  >
                    <option value="" disabled={isReq('education')}>Não informado</option>
                    {getCol('education')?.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{OPTION_LABELS[opt] || opt}</option>
                    ))}
                    {!getCol('education')?.options?.length && (
                      <>
                        <option value="FUNDAMENTAL_INCOMPLETE">Ensino Fundamental - Incompleto</option>
                        <option value="FUNDAMENTAL_COMPLETE">Ensino Fundamental - Completo</option>
                        <option value="MEDIO_INCOMPLETE">Ensino Médio - Incompleto</option>
                        <option value="MEDIO_COMPLETE">Ensino Médio - Completo</option>
                        <option value="SUPERIOR_INCOMPLETE">Graduação - Incompleta</option>
                        <option value="SUPERIOR_COMPLETE">Graduação - Completa</option>
                        <option value="POS_GRADUACAO">Pós-graduação</option>
                        <option value="MESTRADO">Mestrado</option>
                        <option value="DOUTORADO">Doutorado</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {isActive('contractType') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-text">Contrato {isReq('contractType') && '*'}</label>
                  <select
                    required={isReq('contractType')}
                    {...register('contractType')}
                    defaultValue=""
                    className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 appearance-none"
                  >
                    <option value="" disabled>Não informado</option>
                    {getCol('contractType')?.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{OPTION_LABELS[opt] || opt}</option>
                    ))}
                    {!getCol('contractType')?.options?.length && (
                      <>
                        <option value="CLT">CLT</option>
                        <option value="PJ">PJ</option>
                        <option value="OTHER">Outros</option>
                      </>
                    )}
                  </select>
                </div>
              )}
              {renderCustomCols('CLASSIFICATION')}
            </div>
          </div>

          {/* Requisitos */}
          {isActive('requirements') && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
                <CheckCircle2 className="w-5 h-5 text-brand-10" /> Requisitos Adicionais {isReq('requirements') && '*'}
              </h3>
              
              <div className="flex flex-col gap-4">
                {requirementsList.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {requirementsList.map((req, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-brand-60/50 px-4 py-2 rounded-lg border border-gray-300">
                        <span className="text-sm font-medium text-brand-text">{req}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(idx)}
                          className="text-red-500 hover:text-red-600 text-sm font-bold"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                
                {!showRequirementInput ? (
                  <button
                    type="button"
                    onClick={() => setShowRequirementInput(true)}
                    className="w-full sm:w-auto self-start px-4 py-2 border-2 border-dashed border-brand-10/50 text-brand-10 rounded-xl hover:bg-brand-10/10 transition-colors font-medium text-sm"
                  >
                    + Adicionar um requisito
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                      className="flex-1 bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50"
                      placeholder="Ex: Inglês Intermediário, Pacote Office..."
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddRequirement}
                        className="px-6 py-3 bg-brand-10 text-white rounded-xl hover:bg-brand-10/90 font-medium transition-colors"
                      >
                        Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRequirementInput(false);
                          setNewRequirement('');
                        }}
                        className="px-6 py-3 bg-brand-60 text-brand-text rounded-xl hover:bg-brand-60/80 font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {columns.some(c => !c.isNative && c.isActive && c.section === 'REQUIREMENTS') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-60/50">
                  {renderCustomCols('REQUIREMENTS')}
                </div>
              )}
            </div>
          )}

          {/* Remuneração */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <DollarSign className="w-5 h-5 text-brand-10" /> Remuneração e Benefícios
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {isActive('salary') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-text">Salário Fixo {isReq('salary') && '*'}</label>
                  <input
                    type="number"
                    required={isReq('salary')}
                    {...register('salary')}
                    disabled={!!watchSalaryMin || !!watchSalaryMax}
                    className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted disabled:opacity-50"
                    placeholder="Ex: 6500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Piso Salarial</label>
                <input
                  type="number"
                  {...register('salaryMin')}
                  disabled={!!watchSalary}
                  className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted disabled:opacity-50"
                  placeholder="Ex: 5000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Teto Salarial</label>
                <input
                  type="number"
                  {...register('salaryMax')}
                  disabled={!!watchSalary}
                  className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted disabled:opacity-50"
                  placeholder="Ex: 8000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-brand-text mb-2 block">Benefícios Padrão</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {isActive('hasVA') && (
                  <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                    <input type="checkbox" required={isReq('hasVA')} {...register('hasVA')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-gray-300" />
                    Vale Alimentação (VA)
                  </label>
                )}
                {isActive('hasVR') && (
                  <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                    <input type="checkbox" required={isReq('hasVR')} {...register('hasVR')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-gray-300" />
                    Vale Refeição (VR)
                  </label>
                )}
                {isActive('hasVT') && (
                  <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                    <input type="checkbox" required={isReq('hasVT')} {...register('hasVT')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-gray-300" />
                    Vale Transporte (VT)
                  </label>
                )}
                {isActive('hasLifeInsurance') && (
                  <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                    <input type="checkbox" required={isReq('hasLifeInsurance')} {...register('hasLifeInsurance')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-gray-300" />
                    Seguro de Vida
                  </label>
                )}
                {isActive('hasMedicalInsurance') && (
                  <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                    <input type="checkbox" required={isReq('hasMedicalInsurance')} {...register('hasMedicalInsurance')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-gray-300" />
                    Assistência Médica
                  </label>
                )}
                {isActive('hasDentalInsurance') && (
                  <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                    <input type="checkbox" required={isReq('hasDentalInsurance')} {...register('hasDentalInsurance')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-gray-300" />
                    Assistência Odonto
                  </label>
                )}
                {columns.filter(c => !c.isNative && c.isActive && c.section === 'REMUNERATION' && c.type === 'BOOLEAN').map(col => (
                  <label key={col.id} className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                    <input type="checkbox" required={col.isRequired} {...register(`customData.${col.slug}`)} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-gray-300" />
                    {col.name} {col.isRequired && '*'}
                  </label>
                ))}
              </div>
            </div>

            {isActive('benefits') && (
              <div className="space-y-2 pt-4 border-t border-brand-60/50">
                <label className="text-sm font-medium text-brand-text">Outros Benefícios {isReq('benefits') && '*'}</label>
                <input
                  required={isReq('benefits')}
                  {...register('benefits')}
                  className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted"
                  placeholder="Ex: Gympass, PLR, Auxílio Creche..."
                />
              </div>
            )}
            
            {/* Non-boolean Remuneration Custom Cols */}
            {columns.filter(c => !c.isNative && c.isActive && c.section === 'REMUNERATION' && c.type !== 'BOOLEAN').length > 0 && (
              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-brand-60/50">
                {columns.filter(c => !c.isNative && c.isActive && c.section === 'REMUNERATION' && c.type !== 'BOOLEAN').map(col => (
                  <div key={col.id} className="space-y-2">
                    <label className="block text-sm font-medium text-brand-text">{col.name} {col.isRequired && '*'}</label>
                    {col.options && col.options.length > 0 ? (
                      <select required={col.isRequired} {...register(`customData.${col.slug}`)} className="w-full bg-brand-60/50 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-10/50 appearance-none">
                        <option value="">Selecione...</option>
                        {col.options.map((opt: string) => (
                          <option key={opt} value={opt}>{OPTION_LABELS[opt] || opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type={col.type === 'NUMBER' ? 'number' : col.type === 'DATE' ? 'date' : 'text'}
                        required={col.isRequired}
                        {...register(`customData.${col.slug}`)} 
                        className="w-full bg-brand-60/50 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-10/50" 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colunas Personalizadas (Extras - ADDITIONAL) */}
          {columns.filter(c => !c.isNative && c.isActive && c.section === 'ADDITIONAL').length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
                <LayoutList className="w-5 h-5 text-brand-10" /> Informações Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderCustomCols('ADDITIONAL')}
              </div>
            </div>
          )}

          {/* Descrição */}
          {isActive('description') && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
                <AlignLeft className="w-5 h-5 text-brand-10" /> Descrição Completa
              </h3>
              
              <div className="space-y-2">
                <textarea
                  required={isReq('description')}
                  {...register('description')}
                  rows={8}
                  className="w-full bg-brand-60/50 border border-gray-300 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted resize-y"
                  placeholder="Descreva as responsabilidades, requisitos, tech stack e diferenciais da vaga..."
                />
              </div>
              {columns.some(c => !c.isNative && c.isActive && c.section === 'DESCRIPTION') && (
                <div className="grid grid-cols-1 gap-6 pt-6 border-t border-brand-60/50">
                  {renderCustomCols('DESCRIPTION')}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4 border-t border-brand-30 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-brand-muted hover:bg-brand-60 rounded-xl transition-colors">
              Cancelar
            </button>
            <button disabled={loading} type="submit" className="bg-brand-10 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-10/90 transition-colors flex items-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {jobToEdit ? 'Salvar Alterações' : 'Criar Vaga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
