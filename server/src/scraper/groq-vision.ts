import fs from 'fs';
import path from 'path';
import { ExtractedImageJobData, extractedImageJobDataSchema } from './types.js';

interface GroqChatChoice {
  message?: {
    content?: string;
  };
}

interface GroqChatResponse {
  choices?: GroqChatChoice[];
}

const SYSTEM_INSTRUCTION = `
Você é um especialista em OCR, triagem e análise estruturada de anúncios e panfletos de emprego brasileiros (WhatsApp, redes sociais, impressos).
Sua missão consiste em duas etapas:
1. TRIAGEM DE RELEVÂNCIA: Avalie se a imagem é um anúncio de vaga de emprego, programa social de empregabilidade ou curso profissionalizante. Caso seja um cardápio, recibo de pagamento, meme, flyer de festa ou anúncio comercial de venda de produtos sem relação com emprego, defina "is_job_or_opportunity": false, "content_type": "NAO_E_VAGA" e preencha "discard_reason".
2. EXTRAÇÃO: Se for uma vaga ou oportunidade ("is_job_or_opportunity": true), extraia todas as informações com 100% de precisão.

Responda EXCLUSIVAMENTE com um JSON válido (sem comentários, sem crases markdown extras), contendo exatamente esta estrutura:

{
  "is_job_or_opportunity": true,
  "content_type": "VAGA_DIRETA",
  "discard_reason": null,
  "titulo": "Nome do cargo/função (ex: Promotor de Vendas, Cozinheira, Doméstica, Garçonete, Bargirl, Caseiro, Oportunidades de Emprego CLT / Projeto Social)",
  "empresa": "Nome da empresa anunciante ou 'Particular' se residência",
  "local": "Cidade e estado (ex: Caraguatatuba, SP; Ubatuba, SP; Jacareí, SP). Se a imagem mencionar apenas o bairro (ex: Perequê-Açu), deduza a cidade correspondente",
  "salario": "Remuneração (ex: 'R$ 2.500,00', 'Piso da categoria', 'Compatível com o mercado', ou 'A combinar')",
  "tipo_vaga": "CLT, PJ, Freelancer, Temporário ou Estágio",
  "turno_horario": "Horário e escala (ex: 'Seg a Sex 07:00 às 16:00 / Sáb 07:00 às 11:00', 'Escala 5x2 (08h às 15h50)')",
  "beneficios": "Benefícios citados (ex: 'Vale Alimentação, Ajuda de Custo', 'Auxílio cesta básica', 'Moradia no local')",
  "requisitos": ["Requisitos como CNH, ter moto, experiência comprovada, pontualidade, etc."],
  "atividades": ["Tarefas e atribuições da vaga"],
  "contato_telefone": "Telefone ou WhatsApp com DDD (ex: '12 99658-2121')",
  "contato_email": "E-mail se houver ou null",
  "contato_nome": "Nome do contato (ex: Bianca) se houver ou null",
  "link_candidatura": "URL externa se houver ou null",
  "endereco": "Endereço físico se houver ou null",
  "observacoes": "Informações adicionais relevantes ou null"
}
`;

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

/**
 * Extrai dados estruturados de um panfleto/anúncio de emprego usando a API Vision da Groq (Llama 3.2 Vision)
 */
export async function extractJobWithGroqVision(
  imagePath: string,
  apiKey?: string
): Promise<ExtractedImageJobData> {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('Chave de API do Groq não configurada (GROQ_API_KEY).');
  }

  const imageBuffer = await fs.promises.readFile(imagePath);
  const base64Data = imageBuffer.toString('base64');
  const mimeType = getMimeType(imagePath);
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const models = ['qwen/qwen3.8-27b'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(4000),
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: SYSTEM_INSTRUCTION
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq Vision API (${model}) retornou status ${response.status}: ${errorText}`);
      }

      const resJson = (await response.json()) as GroqChatResponse;
      const content = resJson?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error(`Resposta vazia da Groq Vision API com modelo ${model}`);
      }

      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedUnknown = JSON.parse(cleanJson);
      return extractedImageJobDataSchema.parse(parsedUnknown);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Tenta o próximo modelo
    }
  }

  throw lastError || new Error('Falha ao processar imagem com os modelos Groq Vision.');
}
