"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Job } from '@/types/job';
import { HeroSearch } from '@/components/HeroSearch';
import { SidebarFilters, FilterState } from '@/components/SidebarFilters';
import { JobCard } from '@/components/JobCard';
import { JobCardSkeleton } from '@/components/JobCardSkeleton';
import { JobDetailsModal } from '@/components/JobDetailsModal';

function JobsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const initialFilters: FilterState = {
    hasSalary: searchParams.get('hasSalary') === 'true',
    minSalary: searchParams.get('minSalary') || '',
    maxSalary: searchParams.get('maxSalary') || '',
  };

  searchParams.forEach((value, key) => {
    if (!['hasSalary', 'minSalary', 'maxSalary', 'q', 'location', 'page'].includes(key)) {
      initialFilters[key] = searchParams.getAll(key);
    }
  });

  const initialTerm = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || '';

  /**
   * Arquitetura URL-Driven
   * Por que foi feito: Em vez de armazenar o estado do filtro em variáveis locais (`useState`), 
   * sincronizamos tudo com a Query String da URL (`?q=dev&page=2`).
   * Vantagens:
   * 1. Permite que o usuário copie e cole o link para um amigo e os filtros continuem aplicados.
   * 2. SEO Friendly (Motores de busca conseguem mapear /?location=São+Paulo).
   * 3. O botão de "Voltar" do navegador funciona como um "Desfazer Filtro".
   */
  const updateUrl = useCallback((newParams: Record<string, string | string[] | boolean | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      params.delete(key);
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v) params.append(key, v);
        });
      } else if (value === true) {
        params.set(key, 'true');
      } else if (typeof value === 'string' && value.trim() !== '') {
        params.set(key, value.trim());
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const handleFilterChange = (filters: FilterState) => {
    const updatedFilters: Record<string, string | boolean | string[] | undefined> = { ...filters };
    if (!updatedFilters.hasSalary) {
      updatedFilters.hasSalary = undefined;
    }
    updatedFilters.page = '1'; // Reset to first page when filtering
    updateUrl(updatedFilters);
  };

  const handleSearch = (term: string, location: string) => {
    updateUrl({
      q: term,
      location: location,
      page: '1', // Reset to first page when searching
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({
      page: newPage.toString(),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const queryString = searchParams.toString();
        const response = await api.get(`/jobs?${queryString}`);
        if (response.data && response.data.data) {
          setJobs(response.data.data);
          setTotalPages(response.data.meta.totalPages);
          setTotalJobs(response.data.meta.total);
        } else {
          setJobs([]);
          setTotalPages(1);
          setTotalJobs(0);
        }
      } catch (error) {
        console.error('Failed to fetch jobs', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-brand-60 flex flex-col font-sans text-brand-text pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 flex-1">
        
        <HeroSearch 
          onSearch={handleSearch} 
          defaultTerm={initialTerm} 
          defaultLocation={initialLocation} 
        />

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <aside className="w-full md:w-64 lg:w-72 shrink-0 md:sticky md:top-24 z-10">
            <SidebarFilters filters={initialFilters} onChange={handleFilterChange} />
          </aside>

          <main className="flex-1 flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-text">
                {loading ? 'Buscando vagas...' : `${totalJobs} vaga${totalJobs !== 1 ? 's' : ''} encontrada${totalJobs !== 1 ? 's' : ''}`}
              </h2>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
              {loading ? (
                <>
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                </>
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onClick={() => setSelectedJob(job)} 
                  />
                ))
              ) : (
                <div className="p-8 sm:p-12 text-center bg-brand-30 rounded-2xl border border-brand-30/50 text-brand-muted shadow-sm flex flex-col items-center justify-center gap-3 mt-4">
                  <div className="text-5xl mb-2 opacity-80">🕵️</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-brand-text">Nenhuma vaga encontrada</h3>
                  <p className="max-w-sm font-medium text-sm sm:text-base">Tente ajustar seus filtros ou termos de busca para ver mais resultados.</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-brand-60 text-brand-text hover:bg-brand-60 hover:text-brand-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-xl font-bold transition-colors ${
                        currentPage === page
                          ? 'bg-brand-10 text-white shadow-md'
                          : 'border border-brand-60 text-brand-text hover:bg-brand-60 hover:text-brand-10'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-brand-60 text-brand-text hover:bg-brand-60 hover:text-brand-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <JobDetailsModal 
        job={selectedJob} 
        isOpen={!!selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-60 flex items-center justify-center">
        <div className="text-brand-10 font-bold text-xl animate-pulse">Carregando o painel de vagas...</div>
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}
