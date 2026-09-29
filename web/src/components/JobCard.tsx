import { Job } from '@/types/job';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Building2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const formattedDate = new Date(job.postedAt).toLocaleDateString('pt-BR');

  return (
    <motion.div
      layoutId={`job-card-${job.id}`}
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-lg border bg-card p-5 text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-primary/50 bg-white"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-semibold text-lg leading-none tracking-tight group-hover:text-primary transition-colors">
          {job.title}
        </h3>
        
        <div className="flex items-center text-sm text-muted-foreground gap-3 text-gray-500">
          <div className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span>{job.company}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-wrap gap-2">
          {job.salary && (
            <Badge variant="success">
              R$ {job.salary.toLocaleString('pt-BR')}
            </Badge>
          )}
          {job.benefits && (
            <Badge variant="success">
              Benefícios
            </Badge>
          )}
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground text-gray-400 gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
