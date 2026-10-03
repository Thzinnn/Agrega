import { Job } from '@/types/job';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Building2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const formattedDate = new Date(job.createdAt).toLocaleDateString('pt-BR');

  const renderSalary = () => {
    if (job.salary) {
      return `R$ ${job.salary.toLocaleString('pt-BR')}`;
    }
    if (job.salaryMin && job.salaryMax) {
      return `R$ ${job.salaryMin.toLocaleString('pt-BR')} - R$ ${job.salaryMax.toLocaleString('pt-BR')}`;
    }
    if (job.salaryMin) {
      return `A partir de R$ ${job.salaryMin.toLocaleString('pt-BR')}`;
    }
    if (job.salaryMax) {
      return `Até R$ ${job.salaryMax.toLocaleString('pt-BR')}`;
    }
    return null;
  };

  const salaryText = renderSalary();

  return (
    /**
     * UI Dinâmica (Framer Motion)
     * Por que foi feito: Melhora drasticamente a percepção de performance.
     * Como funciona: O atributo 'layoutId' informa ao Framer Motion que este componente 
     * e o Modal compartilham a mesma identidade visual. Quando clicado, o card fisicamente 
     * flutua e se expande na tela até virar o Modal, sem recarregar a página.
     */
    <motion.div
      layoutId={`job-card-${job.id}`}
      onClick={onClick}
      className="group flex flex-col justify-between gap-3 rounded-2xl border border-brand-30/50 bg-brand-30 p-4 sm:p-6 text-brand-text shadow-sm transition-all hover:shadow-lg cursor-pointer hover:border-brand-10/50 min-h-[160px] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-brand-10 transition-colors"></div>

      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-lg sm:text-xl leading-tight tracking-tight group-hover:text-brand-10 transition-colors break-words line-clamp-2">
          {job.title}
        </h3>
        
        <div className="flex flex-wrap items-center text-xs sm:text-sm text-brand-muted gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 font-medium max-w-full">
            <Building2 className="w-4 h-4 text-brand-muted/70 shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
          <div className="flex items-center gap-1.5 max-w-full">
            <MapPin className="w-4 h-4 text-brand-muted/70 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-wrap gap-2">
          {salaryText && (
            <Badge variant="success" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
              {salaryText}
            </Badge>
          )}
          {job.hasVA && (
            <Badge variant="success" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
              VA
            </Badge>
          )}
          {job.hasVR && (
            <Badge variant="success" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
              VR
            </Badge>
          )}
          {job.hasVT && (
            <Badge variant="success" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
              VT
            </Badge>
          )}
          {job.hasLifeInsurance && (
            <Badge variant="success" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
              Seguro de Vida
            </Badge>
          )}
          {job.hasMedicalInsurance && (
            <Badge variant="success" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
              Assist. Médica
            </Badge>
          )}
          {job.hasDentalInsurance && (
            <Badge variant="success" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
              Assist. Odonto
            </Badge>
          )}
          {job.benefits && !job.hasVA && !job.hasVR && !job.hasVT && !job.hasLifeInsurance && !job.hasMedicalInsurance && !job.hasDentalInsurance && (
            <Badge variant="success" className="bg-brand-accent/10 text-brand-accent border-brand-accent/20">
              Benefícios
            </Badge>
          )}
        </div>
        
        <div className="flex items-center text-xs text-brand-muted gap-1.5 font-medium bg-brand-60 px-2 py-1 rounded-md">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
