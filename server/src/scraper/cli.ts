import path from 'path';
import fs from 'fs';
import { processImageDirectory } from './image-extractor.js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente do .env do servidor
dotenv.config();

interface CliArgs {
  dir: string;
  output?: string;
  ingest: boolean;
  directDb: boolean;
  apiKey?: string;
  groqKey?: string;
  apiUrl: string;
  scraperKey?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let dir = 'C:\\Users\\Gus\\Downloads\\Imagens emprego';
  let output = path.resolve(process.cwd(), 'output', 'vagas-imagens.json');
  let ingest = false;
  let directDb = false;
  let apiKey: string | undefined = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let groqKey: string | undefined = process.env.GROQ_API_KEY;
  let apiUrl = process.env.API_URL || 'http://localhost:3333/api/v1/jobs/ingest';
  let scraperKey = process.env.SCRAPER_API_KEY || 'your-secret-api-key-here';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === '--dir' && args[i + 1]) {
      dir = args[++i]!;
    } else if (arg.startsWith('--dir=')) {
      dir = arg.split('=')[1] || dir;
    } else if (arg === '--output' && args[i + 1]) {
      output = args[++i]!;
    } else if (arg.startsWith('--output=')) {
      output = arg.split('=')[1] || output;
    } else if (arg === '--ingest') {
      ingest = true;
    } else if (arg === '--direct-db') {
      directDb = true;
    } else if (arg === '--groq-key' && args[i + 1]) {
      groqKey = args[++i]!;
    } else if (arg === '--gemini-key' && args[i + 1]) {
      apiKey = args[++i]!;
    } else if (arg === '--api-url' && args[i + 1]) {
      apiUrl = args[++i] || apiUrl;
    }
  }

  return { dir, output, ingest, directDb, apiKey, groqKey, apiUrl, scraperKey };
}

async function main() {
  const options = parseArgs();

  console.log('====================================================');
  console.log('🤖 AGREGA - IMAGE JOB SCRAPER (EXTRATOR DE VAGAS)');
  console.log('====================================================');
  console.log(`📁 Diretório de Imagens: ${options.dir}`);
  console.log(`⚡ Motor Groq Vision:     ${options.groqKey ? 'Ativo (Llama 3.2 Vision via UIsper/Admin)' : 'Opcional / Não informado'}`);
  console.log(`🌐 Motor Gemini Vision:   ${options.apiKey ? 'Ativo' : 'Opcional / Não informado'}`);
  console.log(`🗄️ Integração com Banco:  Ativa (Prisma SystemSettings & Webhooks)`);
  console.log('----------------------------------------------------');

  try {
    const startTime = Date.now();
    const result = await processImageDirectory(options.dir, {
      groqApiKey: options.groqKey,
      geminiApiKey: options.apiKey,
      useDbSettings: true,
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Processamento Concluído em ${duration}s!`);
    console.log(`📊 Total de Imagens: ${result.totalFiles}`);
    console.log(`🎯 Sucesso:          ${result.successCount} (${((result.successCount / (result.totalFiles || 1)) * 100).toFixed(0)}%)`);
    console.log(`⚠️ Falhas:           ${result.failureCount}`);

    console.log('\n📋 RESUMO DAS VAGAS EXTRAÍDAS:');
    result.jobs.forEach((job, idx) => {
      console.log(`  [${idx + 1}] ${job.titulo} | ${job.empresa} | ${job.local}`);
      console.log(`      💰 Salário: ${job.salario} | Regime: ${job.tipo_vaga}`);
      console.log(`      📲 WhatsApp / Link: ${job.link}`);
      console.log(`      🎁 Benefícios: ${job.beneficios || 'Nenhum informado'}`);
      console.log('');
    });

    // Salvar JSON no diretório de saída
    if (options.output) {
      const outputDir = path.dirname(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(options.output, JSON.stringify(result.jobs, null, 2), 'utf-8');
      console.log(`💾 JSON consolidado salvo em: ${options.output}`);
    }

    // Ingestão via HTTP API do Agrega
    if (options.ingest) {
      console.log(`\n🚀 Enviando ${result.jobs.length} vagas para API Agrega (${options.apiUrl})...`);
      try {
        const response = await fetch(options.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': options.scraperKey || ''
          },
          body: JSON.stringify(result.jobs)
        });

        if (response.ok) {
          const resJson = await response.json();
          console.log('🎉 Ingestão via API concluída com sucesso:', resJson);
        } else {
          console.warn(`⚠️ API retornou status ${response.status}:`, await response.text());
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`⚠️ Não foi possível conectar na API HTTP (${msg}). Se o servidor estiver desligado, use --direct-db ou inicie o servidor.`);
      }
    }

    // Ingestão direta no banco via Prisma (se solicitado)
    if (options.directDb) {
      console.log('\n💾 Inserindo diretamente no Banco de Dados via Prisma...');
      try {
        const { PrismaClient } = await import('@prisma/client');
        const { JobService } = await import('../services/job.service.js');
        const prisma = new PrismaClient();
        const jobService = new JobService();
        const ingestRes = await jobService.ingestJobs(prisma, result.jobs);
        console.log('🎉 Inserção no banco concluída com sucesso:', ingestRes);
        await prisma.$disconnect();
      } catch (dbErr: unknown) {
        const dbMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.warn('⚠️ Falha ao conectar diretamente no banco:', dbMsg);
      }
    }

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro fatal durante a execução do scraper:', errorMsg);
    process.exit(1);
  }
}

main();
