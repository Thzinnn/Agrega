import { Job } from '@/types/job';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Building2, Calendar, DollarSign, Gift } from 'lucide-react';

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobDetailsModal({ job, isOpen, onClose }: JobDetailsModalProps) {
  if (!job) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              layoutId={`job-card-${job.id}`}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl pointer-events-auto"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-6 py-4 backdrop-blur">
                <h2 className="text-xl font-bold tracking-tight">{job.title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(job.postedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {job.salary && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-800">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">
                        R$ {job.salary.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {job.benefits && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-800">
                      <Gift className="w-4 h-4" />
                      <span className="font-semibold">Benefícios Inclusos</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Descrição da Vaga</h3>
                  <div className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                    {job.description}
                  </div>
                </div>
                
                {job.benefits && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Benefícios Detalhados</h3>
                    <div className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                      {job.benefits}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
