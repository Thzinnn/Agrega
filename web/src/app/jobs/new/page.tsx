'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { MapPin, Building2, Briefcase, Link as LinkIcon, DollarSign, AlignLeft, Info, CheckCircle2, Phone, Mail, Contact } from 'lucide-react';
import { api } from '@/lib/api';

const jobSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres').max(120),
  company: z.string().min(2, 'O nome da empresa deve ter pelo menos 2 caracteres').max(100),
  location: z.string().min(2, 'Localização é obrigatória').max(100),
  workplaceType: z.enum(['REMOTE', 'HYBRID', 'ON_SITE'], { message: "Modalidade é obrigatória" }),
  education: z.enum([
    'FUNDAMENTAL_1_INCOMPLETE', 'FUNDAMENTAL_1_COMPLETE',
    'FUNDAMENTAL_2_INCOMPLETE', 'FUNDAMENTAL_2_COMPLETE',
    'MEDIO_INCOMPLETE', 'MEDIO_COMPLETE',
    'SUPERIOR_INCOMPLETE', 'SUPERIOR_COMPLETE',
    'POS_GRADUACAO', 'MESTRADO', 'DOUTORADO'
  ], { message: "Escolaridade é obrigatória" }),
  contractType: z.enum(['CLT', 'PJ', 'OTHER'], { message: "Contrato é obrigatório" }),
  hasVA: z.boolean().default(false),
  hasVR: z.boolean().default(false),
  hasVT: z.boolean().default(false),
  hasLifeInsurance: z.boolean().default(false),
  hasMedicalInsurance: z.boolean().default(false),
  hasDentalInsurance: z.boolean().default(false),
  benefits: z.string().optional(),
  salary: z.coerce.number().nullable().optional(),
  salaryMin: z.coerce.number().nullable().optional(),
  salaryMax: z.coerce.number().nullable().optional(),
  applicationUrl: z.string().url('Insira uma URL válida (ex: https://...)').optional().or(z.literal('')),
  contactEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  contactPhone: z.string().regex(/^[\d\s\-\+\(\)]*$/, 'Use apenas números e +, -, ()').optional().or(z.literal('')),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
}).refine(data => {
  if (data.salary !== null) {
    if (data.salaryMin !== null || data.salaryMax !== null) return false;
  }
  return true;
}, {
  message: "Se informar valor fixo, limpe o piso e o teto.",
  path: ['salary']
}).refine(data => {
  if (data.salaryMin !== null && data.salaryMin !== undefined && data.salaryMax !== null && data.salaryMax !== undefined) {
    return data.salaryMax >= data.salaryMin;
  }
  return true;
}, {
  message: "O teto salarial não pode ser menor que o mínimo",
  path: ['salaryMax']
}).refine(data => {
  const hasUrl = !!data.applicationUrl;
  const hasEmail = !!data.contactEmail;
  const hasPhone = !!data.contactPhone && data.contactPhone.trim() !== '';
  return hasUrl || hasEmail || hasPhone;
}, {
  message: "Você deve informar pelo menos um meio de contato (Link, E-mail ou Telefone)",
  path: ['applicationUrl']
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Autocomplete Location State
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      hasVA: false,
      hasVR: false,
      hasVT: false,
      hasLifeInsurance: false,
      hasMedicalInsurance: false,
      hasDentalInsurance: false,
    }
  });

  const watchSalary = watch('salary');
  const watchSalaryMin = watch('salaryMin');
  const watchSalaryMax = watch('salaryMax');

  // Load IBGE Locations
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

  // Filter Locations
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

  // Click Outside
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

  const onSubmit = async (data: JobFormValues) => {
    setIsSubmitting(true);
    try {
      const parsedData = jobSchema.parse(data);
      // Clean up coercions for 0 -> null if user left blank (HTML number inputs with coerce result in 0 for empty string sometimes, or null/undefined)
      if (parsedData.salary === 0) parsedData.salary = null;
      if (parsedData.salaryMin === 0) parsedData.salaryMin = null;
      if (parsedData.salaryMax === 0) parsedData.salaryMax = null;

      await api.post('/jobs', parsedData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2500);
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao cadastrar a vaga. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-[80vh] flex items-center justify-center">
        <div className="bg-brand-30 border border-brand-10/30 p-10 rounded-3xl flex flex-col items-center text-center max-w-lg shadow-2xl">
          <div className="w-20 h-20 bg-brand-10/20 text-brand-10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-brand-text mb-4">Vaga Publicada!</h2>
          <p className="text-brand-muted text-lg mb-8">Sua oportunidade já está disponível para milhares de talentos na plataforma.</p>
          <div className="w-8 h-8 border-4 border-brand-10 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-brand-muted mt-4">Redirecionando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl pt-24">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-brand-text tracking-tight mb-4">
          Divulgue uma <span className="text-brand-10">Oportunidade</span>
        </h1>
        <p className="text-brand-muted text-lg max-w-2xl mx-auto">
          Encontre os melhores talentos de tecnologia do Brasil. O cadastro é rápido e gratuito.
        </p>
      </div>

      <div className="bg-brand-30 border border-brand-60 rounded-3xl p-6 md:p-10 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Informações Básicas */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <Briefcase className="w-5 h-5 text-brand-10" /> Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Título da Vaga *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-brand-muted/70" />
                  </div>
                  <input
                    {...register('title')}
                    className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: Desenvolvedor Front-end React"
                  />
                </div>
                {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Nome da Empresa *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-brand-muted/70" />
                  </div>
                  <input
                    {...register('company')}
                    className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: Tech Corp"
                  />
                </div>
                {errors.company && <p className="text-red-500 text-sm">{errors.company.message}</p>}
              </div>

              {/* Autocomplete Localização */}
              <div className="space-y-2" ref={wrapperRef}>
                <label className="text-sm font-medium text-brand-text">Localização *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-brand-muted/70" />
                  </div>
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => {
                      setSearchLocation(e.target.value);
                      setValue('location', e.target.value, { shouldValidate: true });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: São Paulo, SP ou Remoto"
                    autoComplete="off"
                  />
                  {showSuggestions && filteredLocations.length > 0 && (
                    <ul className="absolute top-full left-0 mt-2 w-full bg-brand-30 border border-brand-60 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto py-2">
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
                {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
              </div>
              
              {/* Removed ApplicationUrl from here, moved to its own section */}
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <Contact className="w-5 h-5 text-brand-10" /> Meios de Contato
            </h3>
            <p className="text-sm text-brand-muted">Forneça pelo menos <strong>uma</strong> forma de os candidatos entrarem em contato (Link, E-mail ou Telefone).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Link para Candidatura</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-brand-muted/70" />
                  </div>
                  <input
                    {...register('applicationUrl')}
                    className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: https://sua-empresa.gupy.io/vaga"
                  />
                </div>
                {errors.applicationUrl && <p className="text-red-500 text-sm">{errors.applicationUrl.message}</p>}
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
                    className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: vagas@empresa.com"
                  />
                </div>
                {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Telefone / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-brand-muted/70" />
                  </div>
                  <input
                    {...register('contactPhone')}
                    className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 transition-all placeholder:text-brand-muted"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
                {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone.message}</p>}
              </div>
            </div>
          </div>

          {/* Classificações */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <Info className="w-5 h-5 text-brand-10" /> Classificações
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Modalidade *</label>
                <select
                  {...register('workplaceType')}
                  defaultValue=""
                  className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 appearance-none"
                >
                  <option value="" disabled>Não informado</option>
                  <option value="REMOTE">Remoto</option>
                  <option value="HYBRID">Híbrido</option>
                  <option value="ON_SITE">Presencial</option>
                </select>
                {errors.workplaceType && <p className="text-red-500 text-sm">{errors.workplaceType.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Escolaridade *</label>
                <select
                  {...register('education')}
                  defaultValue=""
                  className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 appearance-none"
                >
                  <option value="" disabled>Não informado</option>
                  <option value="FUNDAMENTAL_1_INCOMPLETE">Ensino Fundamental 1 - Incompleto</option>
                  <option value="FUNDAMENTAL_1_COMPLETE">Ensino Fundamental 1 - Completo</option>
                  <option value="FUNDAMENTAL_2_INCOMPLETE">Ensino Fundamental 2 - Incompleto</option>
                  <option value="FUNDAMENTAL_2_COMPLETE">Ensino Fundamental 2 - Completo</option>
                  <option value="MEDIO_INCOMPLETE">Ensino Médio - Incompleto</option>
                  <option value="MEDIO_COMPLETE">Ensino Médio - Completo</option>
                  <option value="SUPERIOR_INCOMPLETE">Graduação - Incompleta</option>
                  <option value="SUPERIOR_COMPLETE">Graduação - Completa</option>
                  <option value="POS_GRADUACAO">Pós-graduação</option>
                  <option value="MESTRADO">Mestrado</option>
                  <option value="DOUTORADO">Doutorado</option>
                </select>
                {errors.education && <p className="text-red-500 text-sm">{errors.education.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Contrato *</label>
                <select
                  {...register('contractType')}
                  defaultValue=""
                  className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 appearance-none"
                >
                  <option value="" disabled>Não informado</option>
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="OTHER">Outros</option>
                </select>
                {errors.contractType && <p className="text-red-500 text-sm">{errors.contractType.message}</p>}
              </div>
            </div>
          </div>

          {/* Remuneração */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <DollarSign className="w-5 h-5 text-brand-10" /> Remuneração e Benefícios
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Salário Fixo (Exato)</label>
                <input
                  type="number"
                  {...register('salary')}
                  disabled={!!watchSalaryMin || !!watchSalaryMax}
                  className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted disabled:opacity-50"
                  placeholder="Ex: 6500"
                />
                {errors.salary && <p className="text-red-500 text-sm">{errors.salary.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Piso Salarial</label>
                <input
                  type="number"
                  {...register('salaryMin')}
                  disabled={!!watchSalary}
                  className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted disabled:opacity-50"
                  placeholder="Ex: 5000"
                />
                {errors.salaryMin && <p className="text-red-500 text-sm">{errors.salaryMin.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">Teto Salarial</label>
                <input
                  type="number"
                  {...register('salaryMax')}
                  disabled={!!watchSalary}
                  className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted disabled:opacity-50"
                  placeholder="Ex: 8000"
                />
                {errors.salaryMax && <p className="text-red-500 text-sm">{errors.salaryMax.message}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-brand-text mb-2 block">Benefícios Padrão</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                  <input type="checkbox" {...register('hasVA')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-brand-60" />
                  Vale Alimentação (VA)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                  <input type="checkbox" {...register('hasVR')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-brand-60" />
                  Vale Refeição (VR)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                  <input type="checkbox" {...register('hasVT')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-brand-60" />
                  Vale Transporte (VT)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                  <input type="checkbox" {...register('hasLifeInsurance')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-brand-60" />
                  Seguro de Vida
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                  <input type="checkbox" {...register('hasMedicalInsurance')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-brand-60" />
                  Assistência Médica
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-brand-text text-sm">
                  <input type="checkbox" {...register('hasDentalInsurance')} className="w-4 h-4 rounded text-brand-10 focus:ring-brand-10 bg-brand-60 border-brand-60" />
                  Assistência Odonto
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-brand-60/50">
              <label className="text-sm font-medium text-brand-text">Outros Benefícios (Opcional)</label>
              <input
                {...register('benefits')}
                className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted"
                placeholder="Ex: Gympass, PLR, Auxílio Creche..."
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-brand-text flex items-center gap-2 border-b border-brand-60 pb-3">
              <AlignLeft className="w-5 h-5 text-brand-10" /> Descrição Completa
            </h3>
            
            <div className="space-y-2">
              <textarea
                {...register('description')}
                rows={8}
                className="w-full bg-brand-60/50 border border-brand-60 text-brand-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-10/50 placeholder:text-brand-muted resize-y"
                placeholder="Descreva as responsabilidades, requisitos, tech stack e diferenciais da vaga..."
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-brand-60 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl font-semibold text-brand-text bg-brand-60 hover:bg-brand-60/80 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl font-bold text-white bg-brand-10 hover:bg-brand-10-hover transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publicando...
                </>
              ) : 'Publicar Vaga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
