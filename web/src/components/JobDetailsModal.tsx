import { Job } from '@/types/job';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Building2, Calendar, DollarSign, Gift, Phone, Mail, ExternalLink } from 'lucide-react';

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
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-brand-30 shadow-2xl pointer-events-auto border border-brand-30/50"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-60 bg-brand-30/95 px-6 py-4 backdrop-blur">
                <h2 className="text-xl font-bold tracking-tight text-brand-text">{job.title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 transition-colors hover:bg-brand-60 text-brand-muted hover:text-brand-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-wrap gap-4 text-sm text-brand-muted font-medium">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-brand-muted/70" />
                    <span className="font-semibold text-brand-text">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-muted/70" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-muted/70" />
                    <span>{new Date(job.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {(job.salary || job.salaryMin || job.salaryMax) && (
                    <div className="flex items-center gap-2 rounded-xl border border-brand-accent/20 bg-brand-accent/10 px-4 py-2 text-brand-accent">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-bold">
                        {job.salary 
                          ? `R$ ${job.salary.toLocaleString('pt-BR')}`
                          : job.salaryMin && job.salaryMax
                          ? `R$ ${job.salaryMin.toLocaleString('pt-BR')} - R$ ${job.salaryMax.toLocaleString('pt-BR')}`
                          : job.salaryMin
                          ? `A partir de R$ ${job.salaryMin.toLocaleString('pt-BR')}`
                          : `Até R$ ${job.salaryMax!.toLocaleString('pt-BR')}`}
                      </span>
                    </div>
                  )}
                  {(job.benefits || job.hasVA || job.hasVR || job.hasVT || job.hasLifeInsurance || job.hasMedicalInsurance || job.hasDentalInsurance) && (
                    <div className="flex items-center gap-2 rounded-xl border border-brand-accent/20 bg-brand-accent/10 px-4 py-2 text-brand-accent">
                      <Gift className="w-4 h-4" />
                      <span className="font-bold">Benefícios Inclusos</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 bg-brand-60/50 p-5 rounded-2xl">
                  <h3 className="font-bold text-lg text-brand-text">Descrição da Vaga</h3>
                  <div className="text-brand-muted whitespace-pre-wrap leading-relaxed text-sm font-medium">
                    {job.description}
                  </div>
                </div>
                
                {(job.benefits || job.hasVA || job.hasVR || job.hasVT || job.hasLifeInsurance || job.hasMedicalInsurance || job.hasDentalInsurance) && (
                  <div className="space-y-4 bg-brand-60/50 p-5 rounded-2xl">
                    <h3 className="font-bold text-lg text-brand-text">Benefícios Detalhados</h3>
                    <ul className="list-disc pl-5 text-brand-muted text-sm font-medium mb-3">
                      {job.hasVA && <li>Vale Alimentação (VA)</li>}
                      {job.hasVR && <li>Vale Refeição (VR)</li>}
                      {job.hasVT && <li>Vale Transporte (VT)</li>}
                      {job.hasLifeInsurance && <li>Seguro de Vida</li>}
                      {job.hasMedicalInsurance && <li>Assistência Médica</li>}
                      {job.hasDentalInsurance && <li>Assistência Odontológica</li>}
                    </ul>
                    {job.benefits && (
                      <div className="text-brand-muted whitespace-pre-wrap leading-relaxed text-sm font-medium">
                        {job.benefits}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4 bg-brand-10/10 p-5 rounded-2xl border border-brand-10/20">
                  <h3 className="font-bold text-lg text-brand-text">Entre em Contato</h3>
                  <div className="flex flex-col gap-3">
                    {job.applicationUrl && (
                      <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-10 hover:underline font-medium break-all">
                        <ExternalLink className="w-5 h-5 shrink-0" />
                        Acessar Link da Vaga
                      </a>
                    )}
                    {job.contactEmail && (
                      <a href={`mailto:${job.contactEmail}`} className="flex items-center gap-2 text-brand-10 hover:underline font-medium break-all">
                        <Mail className="w-5 h-5 shrink-0" />
                        {job.contactEmail}
                      </a>
                    )}
                    {job.contactPhone && (
                      <a href={`https://wa.me/${job.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-10 hover:underline font-medium">
                        <Phone className="w-5 h-5 shrink-0" />
                        {job.contactPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
