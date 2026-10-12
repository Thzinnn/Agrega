import { z } from 'zod';
import { ingestJobItemSchema } from '../schemas/job.schema.js';

export const extractedImageJobDataSchema = z.object({
  titulo: z.string(),
  empresa: z.string(),
  local: z.string(),
  salario: z.string().nullable().optional(),
  tipo_vaga: z.string().nullable().optional(), // CLT, PJ, Freelancer, Temporário, Estágio
  turno_horario: z.string().nullable().optional(),
  beneficios: z.string().nullable().optional(),
  requisitos: z.array(z.string()).optional(),
  atividades: z.array(z.string()).optional(),
  contato_telefone: z.string().nullable().optional(),
  contato_email: z.string().nullable().optional(),
  contato_nome: z.string().nullable().optional(),
  link_candidatura: z.string().nullable().optional(),
  endereco: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
});

export type ExtractedImageJobData = z.infer<typeof extractedImageJobDataSchema>;

/**
 * Estrutura final padronizada para o Agrega
 */
export type AgregaIngestPayload = z.infer<typeof ingestJobItemSchema> & {
  // Campos complementares ricos para auditoria e inserção direta
  hasVA?: boolean;
  hasVR?: boolean;
  hasVT?: boolean;
  hasLifeInsurance?: boolean;
  hasMedicalInsurance?: boolean;
  hasDentalInsurance?: boolean;
  requirements?: string[];
  workplaceType?: string;
  contactPhone?: string | null;
  originalImageHash?: string;
  originalImagePath?: string;
};

export interface ScraperExecutionResult {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  jobs: AgregaIngestPayload[];
  errors: Array<{ file: string; error: string }>;
}
