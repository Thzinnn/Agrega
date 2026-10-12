import { z } from 'zod';
import { ingestJobItemSchema } from '../schemas/job.schema.js';

export const contentTypeEnum = z.preprocess((val) => {
  if (typeof val === 'string') {
    const upper = val.toUpperCase().trim();
    if (upper === 'PROGRAMA_SOCIAL' || upper === 'PROJETO_SOCIAL') {
      return 'PROGRAMA_EMPREGABILIDADE';
    }
    if (upper === 'CURSO' || upper === 'CAPACITACAO') {
      return 'CURSO_CAPACITACAO';
    }
  }
  return val;
}, z.enum([
  'VAGA_DIRETA',
  'PROGRAMA_EMPREGABILIDADE',
  'CURSO_CAPACITACAO',
  'NAO_E_VAGA',
]));

export type ContentType = z.infer<typeof contentTypeEnum>;

export const extractedImageJobDataSchema = z.object({
  is_job_or_opportunity: z.boolean().default(true),
  content_type: contentTypeEnum.default('VAGA_DIRETA'),
  discard_reason: z.string().nullable().optional(),
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
  contentType?: ContentType;
};

export type ImageExtractionOutcome =
  | { status: 'PROCESSED'; job: AgregaIngestPayload; contentType: ContentType; traceId: string }
  | { status: 'DISCARDED'; reason: string; contentType: ContentType; file: string; traceId: string }
  | { status: 'ERROR'; error: string; file: string; traceId: string };

export interface ScraperExecutionResult {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  discardedCount: number;
  jobs: AgregaIngestPayload[];
  discarded: Array<{ file: string; reason: string; contentType?: ContentType }>;
  errors: Array<{ file: string; error: string }>;
}
