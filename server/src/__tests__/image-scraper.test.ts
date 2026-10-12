import { describe, it, expect } from 'vitest';
import { processImageDirectory, extractSingleImageJob } from '../scraper/image-extractor.js';
import { ingestJobItemSchema } from '../schemas/job.schema.js';
import path from 'path';

describe('Image Job Scraper - Testes de Extração e Validação Agrega', () => {
  const imagesDir = 'C:\\Users\\Gus\\Downloads\\Imagens emprego';

  it('deve processar o diretório de imagens com 100% de taxa de sucesso', async () => {
    const result = await processImageDirectory(imagesDir);

    expect(result.totalFiles).toBe(9);
    expect(result.successCount).toBe(9);
    expect(result.failureCount).toBe(0);
    expect(result.errors.length).toBe(0);
    expect(result.jobs.length).toBe(9);
  }, 60000);

  it('todas as vagas extraídas devem estar em total conformidade com o schema ingestJobItemSchema', async () => {
    const result = await processImageDirectory(imagesDir);

    for (const job of result.jobs) {
      const validation = ingestJobItemSchema.safeParse(job);
      expect(validation.success, `Falha na validação do job ${job.titulo}: ${JSON.stringify(validation)}`).toBe(true);
      
      // Verifica campos essenciais do formato Agrega
      expect(job.titulo.length).toBeGreaterThan(2);
      expect(job.empresa.length).toBeGreaterThan(1);
      expect(job.local.length).toBeGreaterThan(2);
      expect(job.descricao.length).toBeGreaterThan(10);
      expect(job.id_vaga.startsWith('img-sha256-')).toBe(true);
      expect(job.link).toMatch(/^https:\/\/(wa\.me\/\d+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    }
  }, 60000);

  it('deve extrair e estruturar corretamente os requisitos e benefícios da vaga de Promotor de Vendas', async () => {
    const imagePath = path.join(imagesDir, 'WhatsApp Image 2026-10-07 at 13.39.58.jpeg');
    const job = await extractSingleImageJob(imagePath);

    expect(job.titulo).toBe('Promotor de Vendas');
    expect(job.empresa).toBe('Z&Z Distribuidora');
    expect(job.local).toBe('Caraguatatuba, SP');
    expect(job.hasVA).toBe(true);
    expect(job.hasVT).toBe(true);
    expect(job.requirements).toContain('Ter moto');
    expect(job.contactPhone).toBe('(12) 99658-2121');
    expect(job.link).toContain('5512996582121');
  });

  it('deve extrair com sucesso as vagas da subpasta Nova pasta (Supervisor e Pizzaiolo)', async () => {
    const subfolder = path.join(imagesDir, 'Nova pasta');
    const result = await processImageDirectory(subfolder);

    expect(result.totalFiles).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);

    const supervisor = result.jobs.find(j => j.titulo.includes('Supervisor'));
    expect(supervisor).toBeDefined();
    expect(supervisor?.empresa).toBe('Imediato Nexway');
    expect(supervisor?.local).toBe('Jacareí, SP');
    expect(supervisor?.hasMedicalInsurance).toBe(true);
    expect(supervisor?.hasDentalInsurance).toBe(true);

    const pizzaiolo = result.jobs.find(j => j.titulo.includes('Pizzaiolo'));
    expect(pizzaiolo).toBeDefined();
    expect(pizzaiolo?.empresa).toBe('SamPa Esfiharia e Pizzaria');
    expect(pizzaiolo?.local).toBe('Maresias, São Sebastião, SP');
    expect(pizzaiolo?.contactPhone).toBe('(12) 98868-7905');
  }, 30000);
});
