import { Search, MapPin } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';

interface HeroSearchProps {
  onSearch: (term: string, location: string) => void;
  defaultTerm?: string;
  defaultLocation?: string;
}

export function HeroSearch({ onSearch, defaultTerm = '', defaultLocation = '' }: HeroSearchProps) {
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [searchLocation, setSearchLocation] = useState(defaultLocation);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /**
     * Autocomplete de Localização Dinâmico (Integração IBGE)
     * Por que foi feito: Reduz o erro de digitação de candidatos buscando cidades,
     * garantindo que a filtragem bata 1:1 com o que está cadastrado no Banco.
     * Como funciona: Faz cacheamento na montagem chamando a API gratuita do IBGE
     * e mescla com as flags padrões de "Remoto" e "Híbrido".
     */
    const fetchLocations = async () => {
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios');
        const municipalities = await response.json();
        
        const formatted = [
          'Remoto',
          'Híbrido',
          ...municipalities.map((m: { nome: string }) => `${m.nome}, SP`)
        ];
        // Deduplicate
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
      // Only start filtering if something is typed, to avoid showing thousands
      const filtered = allLocations
        .filter(loc => loc.toLowerCase().includes(term))
        .slice(0, 8); // Top 8 suggestions
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSearch(formData.get('term') as string, searchLocation);
    setShowSuggestions(false);
  };

  const handleSelectLocation = (loc: string) => {
    setSearchLocation(loc);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full bg-brand-10 rounded-3xl p-6 sm:p-10 text-white flex flex-col gap-4 sm:gap-6 items-center justify-center text-center shadow-lg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-10-hover/50 rounded-full blur-3xl"></div>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight z-10 px-2">
        Encontre a sua próxima oportunidade
      </h1>
      <p className="text-white/90 max-w-lg text-sm sm:text-base md:text-lg z-10 font-medium px-4">
        Busque por cargo, tecnologia ou empresa em milhares de vagas disponíveis no momento.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full max-w-4xl bg-brand-30 p-3 sm:p-2 rounded-2xl shadow-xl mt-4 sm:mt-6 focus-within:ring-4 focus-within:ring-brand-10/30 transition-all z-10">
        <div className="flex-1 flex items-center gap-3 px-4 bg-brand-60/30 sm:bg-transparent rounded-xl sm:rounded-none">
          <Search className="w-5 h-5 text-brand-muted shrink-0" />
          <input
            name="term"
            defaultValue={defaultTerm}
            placeholder="Cargo, empresa ou tecnologia"
            className="w-full py-3 sm:py-4 min-h-[44px] text-brand-text focus:outline-none bg-transparent placeholder:text-brand-muted font-medium text-sm sm:text-base"
            autoComplete="off"
          />
        </div>
        
        <div className="hidden sm:block w-px bg-brand-60 my-3"></div>
        
        <div className="flex-1 flex items-center gap-3 px-4 bg-brand-60/30 sm:bg-transparent rounded-xl sm:rounded-none relative" ref={wrapperRef}>
          <MapPin className="w-5 h-5 text-brand-muted shrink-0" />
          <input
            name="location"
            value={searchLocation}
            onChange={(e) => {
              setSearchLocation(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Estado, cidade ou remoto"
            className="w-full py-3 sm:py-4 min-h-[44px] text-brand-text focus:outline-none bg-transparent placeholder:text-brand-muted font-medium text-sm sm:text-base"
            autoComplete="off"
          />
          
          {/* Custom Autocomplete Dropdown */}
          {showSuggestions && filteredLocations.length > 0 && (
            <ul className="absolute top-full left-0 mt-2 w-full bg-brand-30 border border-brand-60 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto py-2">
              {filteredLocations.map(loc => (
                <li 
                  key={loc}
                  onClick={() => handleSelectLocation(loc)}
                  className="px-4 py-3 min-h-[44px] flex items-center hover:bg-brand-60 text-brand-text cursor-pointer text-left text-sm font-medium transition-colors"
                >
                  {loc}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-brand-10 hover:bg-brand-10-hover text-white px-6 sm:px-10 py-3 sm:py-4 min-h-[48px] rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-base"
        >
          Buscar Vagas
        </button>
      </form>
    </div>
  );
}
