import React from 'react';

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
    <div className="flex flex-col gap-6 p-6 border border-brand-30/50 rounded-2xl bg-brand-30 shadow-sm">
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isRemote}
            onChange={() => handleArrayToggle('workplaceType', 'REMOTE')}
            className="w-4 h-4 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
          />
          <span className="text-sm font-medium text-brand-text group-hover:text-brand-10 transition-colors">Apenas Remoto</span>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.hasSalary}
            onChange={() => handleToggle('hasSalary')}
            className="w-4 h-4 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
          />
          <span className="text-sm font-medium text-brand-text group-hover:text-brand-10 transition-colors">Com salário informado</span>
        </label>
      </div>

      <div className="w-full h-px bg-brand-60"></div>

      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-sm text-brand-text">Escolaridade</h3>
        <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-60 scrollbar-track-transparent">
          {[
            { label: 'Ens. Fundamental 1 - Incompleto', value: 'FUNDAMENTAL_1_INCOMPLETE' },
            { label: 'Ens. Fundamental 1 - Completo', value: 'FUNDAMENTAL_1_COMPLETE' },
            { label: 'Ens. Fundamental 2 - Incompleto', value: 'FUNDAMENTAL_2_INCOMPLETE' },
            { label: 'Ens. Fundamental 2 - Completo', value: 'FUNDAMENTAL_2_COMPLETE' },
            { label: 'Ensino Médio - Incompleto', value: 'MEDIO_INCOMPLETE' },
            { label: 'Ensino Médio - Completo', value: 'MEDIO_COMPLETE' },
            { label: 'Graduação - Incompleta', value: 'SUPERIOR_INCOMPLETE' },
            { label: 'Graduação - Completa', value: 'SUPERIOR_COMPLETE' },
            { label: 'Pós-graduação', value: 'POS_GRADUACAO' },
            { label: 'Mestrado', value: 'MESTRADO' },
            { label: 'Doutorado', value: 'DOUTORADO' }
          ].map((edu) => (
            <label key={edu.value} className="flex items-center gap-3 cursor-pointer group p-1 -ml-1 rounded transition-colors hover:bg-brand-60/50">
              <input
                type="checkbox"
                checked={filters.education.includes(edu.value)}
                onChange={() => handleArrayToggle('education', edu.value)}
                className="w-4 h-4 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
              />
              <span className="text-sm text-brand-muted font-medium group-hover:text-brand-text transition-colors leading-tight">{edu.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-brand-60"></div>

      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-sm text-brand-text">Tipo de Contrato</h3>
        <div className="flex flex-col gap-2.5">
          {['CLT', 'PJ'].map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group p-1 -ml-1 rounded transition-colors hover:bg-brand-60/50">
              <input
                type="checkbox"
                checked={filters.contractTypes.includes(type)}
                onChange={() => handleArrayToggle('contractTypes', type)}
                className="w-4 h-4 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
              />
              <span className="text-sm text-brand-muted font-medium group-hover:text-brand-text transition-colors">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-brand-60"></div>

      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-sm text-brand-text">Faixa Salarial</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Mínimo"
            value={filters.minSalary}
            onChange={(e) => onChange({ ...filters, minSalary: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-brand-60 bg-brand-60/50 text-brand-text font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-10/20 focus:border-brand-10"
          />
          <span className="text-brand-muted font-medium">-</span>
          <input
            type="number"
            placeholder="Máximo"
            value={filters.maxSalary}
            onChange={(e) => onChange({ ...filters, maxSalary: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-brand-60 bg-brand-60/50 text-brand-text font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-10/20 focus:border-brand-10"
          />
        </div>
      </div>
    </div>
  );
}
