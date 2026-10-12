import fs from 'fs';
import path from 'path';
import { ExtractedImageJobData, extractedImageJobDataSchema } from './types.js';

interface GeminiCandidatePart {
  text?: string;
}

interface GeminiCandidateContent {
  parts?: GeminiCandidatePart[];
}

interface GeminiCandidate {
  content?: GeminiCandidateContent;
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
}

/**
 * Prompt de extração multimodal estruturada para anúncios e panfletos de emprego
 */
const SYSTEM_INSTRUCTION = `
Você é um especialista em OCR e análise estruturada de anúncios e panfletos de emprego brasileiros (WhatsApp, redes sociais, impressos).
Sua missão é extrair com 100% de precisão todas as informações da imagem e retornar EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown, sem explicações), no seguinte formato:

{
  "titulo": "Nome do cargo/função com precisão (ex: Promotor de Vendas, Cozinheira, Doméstica, Garçonete, Bargirl, Caseiro)",
  "empresa": "Nome da empresa/instituição anunciante (ex: Z&Z Distribuidora, Lar Vicentino de Ubatuba, Condessa Caiçara, Pousada, ou 'Particular' se residência)",
  "local": "Cidade e estado (ex: Caraguatatuba, SP; Ubatuba, SP). Se a imagem mencionar apenas o bairro (ex: Perequê-Açu), deduza a cidade correspondente",
  "salario": "Remuneração mencionada (ex: 'R$ 2.500,00', 'Piso da categoria', 'Compatível com o mercado', ou 'A combinar')",
  "tipo_vaga": "Regime de trabalho: CLT, PJ, Freelancer, Temporário ou Estágio",
  "turno_horario": "Horário de trabalho e escala (ex: 'Seg a Sex 07:00 às 16:00 / Sáb 07:00 às 11:00', 'Escala 5x2 (08h às 15h50)')",
  "beneficios": "Lista de benefícios mencionados (ex: 'Vale Alimentação, Ajuda de Custo', 'Auxílio cesta básica', 'Moradia no local')",
  "requisitos": ["Lista de requisitos, como CNH, ter moto, experiência comprovada, referências, simpatia"],
  "atividades": ["Lista de atribuições e tarefas do dia a dia"],
  "contato_telefone": "Telefone ou WhatsApp para candidatura com DDD (ex: '12 99658-2121')",
  "contato_email": "E-mail de contato se houver",
  "contato_nome": "Nome da pessoa de contato (ex: Bianca) se mencionado",
  "link_candidatura": "URL de inscrição externa se houver",
  "endereco": "Endereço físico se houver no anúncio",
  "observacoes": "Informações adicionais relevantes (ex: '1 pessoa ou casal sem filhos, casa com 1 quarto')"
}
`;

/**
 * Detecta MIME type a partir da extensão do arquivo
 */
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
 * Executa extração visual utilizando a Google Gemini Vision API via fetch nativo
 */
export async function extractJobWithGeminiVision(
  imagePath: string,
  apiKey?: string
): Promise<ExtractedImageJobData> {
  const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error('Chave de API do Gemini não configurada (GEMINI_API_KEY ou GOOGLE_API_KEY).');
  }

  const imageBuffer = await fs.promises.readFile(imagePath);
  const base64Data = imageBuffer.toString('base64');
  const mimeType = getMimeType(imagePath);

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: SYSTEM_INSTRUCTION
          },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na Gemini Vision API (${response.status}): ${errorText}`);
  }

  const jsonResponse = (await response.json()) as GeminiGenerateContentResponse;
  const rawText = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('A Gemini Vision API não retornou texto na resposta.');
  }

  // Sanitiza delimitadores markdown de código se houver (ex: ```json ... ```)
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsedUnknown = JSON.parse(cleanJson);
  return extractedImageJobDataSchema.parse(parsedUnknown);
}
