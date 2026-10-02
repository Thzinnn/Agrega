import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { api } from '@/lib/api';

export interface FilterState {
  hasSalary: boolean;
  minSalary: string;
  maxSalary: string;
  [key: string]: string[] | boolean | string;
}

interface SidebarFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

interface DbFilter {
  id: string;
  slug: string;
  name: string;
  options?: { label: string; value: string }[];
}

export function SidebarFilters({ filters, onChange }: SidebarFiltersProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [dbFilters, setDbFilters] = useState<DbFilter[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await api.get('/filters');
        setDbFilters(response.data.data || []);
      } catch (error) {
        console.error('Failed to load filters', error);
      }
    };
    fetchFilters();
  }, []);

  const handleToggle = (key: keyof FilterState) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const handleArrayToggle = (key: string, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
  };

  const isRemote = (filters.workplaceType as string[] || []).includes('REMOTE');

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

        {dbFilters.map(cat => {
          const filterKey = cat.slug;
          return (
            <React.Fragment key={cat.id}>
              <div className="w-full h-px bg-brand-60"></div>
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-base sm:text-sm text-brand-text">{cat.name}</h3>
                <div className="flex flex-col gap-1 sm:gap-2.5 max-h-64 sm:max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-60 scrollbar-track-transparent">
                  {(cat.options || []).map((opt) => {
                    const isChecked = Array.isArray(filters[filterKey]) ? (filters[filterKey] as string[]).includes(opt.value) : false;
                    return (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer group py-2 sm:py-1 px-1 -ml-1 rounded transition-colors hover:bg-brand-60/50 min-h-[40px] sm:min-h-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleArrayToggle(filterKey, opt.value)}
                          className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 text-brand-10 rounded border-brand-muted/30 focus:ring-brand-10"
                        />
                        <span className="text-sm text-brand-muted font-medium group-hover:text-brand-text transition-colors leading-tight">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          );
        })}

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
