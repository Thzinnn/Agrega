import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

export interface FilterState {
  workplaceType: string[];
  hasSalary: boolean;
  education: string[];
  contractTypes: string[];
  minSalary: string;
  maxSalary: string;
}

interface SidebarFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function SidebarFilters({ filters, onChange }: SidebarFiltersProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleToggle = (key: keyof FilterState) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const handleArrayToggle = (key: 'education' | 'contractTypes' | 'workplaceType', value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
  };

  const isRemote = filters.workplaceType.includes('REMOTE');

  return (
    <div className="flex flex-col gap-0 md:gap-6 p-4 sm:p-6 border border-brand-30/50 rounded-2xl bg-brand-30 shadow-sm w-full">
      
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="flex md:hidden items-center justify-between w-full font-bold text-brand-text bg-brand-60/50 px-4 py-3 rounded-xl mb-2"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-brand-10" />
          Filtros de Vagas
        </div>
        {isOpenMobile ? <ChevronUp className="w-5 h-5 text-brand-muted" /> : <ChevronDown className="w-5 h-5 text-brand-muted" />}
      </button>

      {/* Filter Content */}
      <div className={`flex-col gap-6 ${isOpenMobile ? 'flex' : 'hidden'} md:flex`}>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer group py-2 sm:py-0">
            <input
              type="checkbox"
              checked={isRemote}
              onChange={() => handleArrayToggle('workplaceType', 'REMOTE')}
              className="w-5 h-5 sm:w-4 sm:h-4 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
            />
            <span className="text-base sm:text-sm font-medium text-brand-text group-hover:text-brand-10 transition-colors">Apenas Remoto</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer group py-2 sm:py-0">
            <input
              type="checkbox"
              checked={filters.hasSalary}
              onChange={() => handleToggle('hasSalary')}
              className="w-5 h-5 sm:w-4 sm:h-4 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
            />
            <span className="text-base sm:text-sm font-medium text-brand-text group-hover:text-brand-10 transition-colors">Com salário informado</span>
          </label>
        </div>

        <div className="w-full h-px bg-brand-60"></div>

        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-base sm:text-sm text-brand-text">Escolaridade</h3>
          <div className="flex flex-col gap-1 sm:gap-2.5 max-h-64 sm:max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-60 scrollbar-track-transparent">
            {[
              { label: 'Ens. Fundamental - Incompleto', value: 'FUNDAMENTAL_INCOMPLETE' },
              { label: 'Ens. Fundamental - Completo', value: 'FUNDAMENTAL_COMPLETE' },
              { label: 'Ensino Médio - Incompleto', value: 'MEDIO_INCOMPLETE' },
              { label: 'Ensino Médio - Completo', value: 'MEDIO_COMPLETE' },
              { label: 'Graduação - Incompleta', value: 'SUPERIOR_INCOMPLETE' },
              { label: 'Graduação - Completa', value: 'SUPERIOR_COMPLETE' },
              { label: 'Pós-graduação', value: 'POS_GRADUACAO' },
              { label: 'Mestrado', value: 'MESTRADO' },
              { label: 'Doutorado', value: 'DOUTORADO' }
            ].map((edu) => (
              <label key={edu.value} className="flex items-center gap-3 cursor-pointer group py-2 sm:py-1 px-1 -ml-1 rounded transition-colors hover:bg-brand-60/50 min-h-[40px] sm:min-h-0">
                <input
                  type="checkbox"
                  checked={filters.education.includes(edu.value)}
                  onChange={() => handleArrayToggle('education', edu.value)}
                  className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
                />
                <span className="text-sm text-brand-muted font-medium group-hover:text-brand-text transition-colors leading-tight">{edu.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-brand-60"></div>

        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-base sm:text-sm text-brand-text">Tipo de Contrato</h3>
          <div className="flex flex-col gap-1 sm:gap-2.5">
            {['CLT', 'PJ'].map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group py-2 sm:py-1 px-1 -ml-1 rounded transition-colors hover:bg-brand-60/50 min-h-[40px] sm:min-h-0">
                <input
                  type="checkbox"
                  checked={filters.contractTypes.includes(type)}
                  onChange={() => handleArrayToggle('contractTypes', type)}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
                />
                <span className="text-sm text-brand-muted font-medium group-hover:text-brand-text transition-colors">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-brand-60"></div>

        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-base sm:text-sm text-brand-text">Faixa Salarial</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-center">
            <input
              type="number"
              placeholder="Mínimo"
              value={filters.minSalary}
              onChange={(e) => onChange({ ...filters, minSalary: e.target.value })}
              className="w-full px-4 sm:px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-sm border border-brand-60 bg-brand-60/50 text-brand-text font-medium rounded-xl sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-10/20 focus:border-brand-10"
            />
            <span className="hidden sm:block text-brand-muted font-medium">-</span>
            <input
              type="number"
              placeholder="Máximo"
              value={filters.maxSalary}
              onChange={(e) => onChange({ ...filters, maxSalary: e.target.value })}
              className="w-full px-4 sm:px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-sm border border-brand-60 bg-brand-60/50 text-brand-text font-medium rounded-xl sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-10/20 focus:border-brand-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
