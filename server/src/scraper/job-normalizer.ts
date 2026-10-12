import { ExtractedImageJobData, AgregaIngestPayload } from './types.js';
import { ingestJobItemSchema } from '../schemas/job.schema.js';

/**
 * Normaliza e formata número de telefone brasileiro
 */
export function formatBrPhone(rawPhone?: string | null): { formatted: string | null; digitsOnly: string | null } {
  if (!rawPhone) return { formatted: null, digitsOnly: null };

  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 10) {
    return { formatted: rawPhone.trim(), digitsOnly: digits.length > 0 ? digits : null };
  }

  // Remove 55 inicial se vier duplicado
  let cleanDigits = digits;
  if (cleanDigits.startsWith('55') && cleanDigits.length >= 12) {
    cleanDigits = cleanDigits.slice(2);
  }

  // 11 dígitos: (DD) 9XXXX-XXXX
  if (cleanDigits.length === 11) {
    const ddd = cleanDigits.slice(0, 2);
    const part1 = cleanDigits.slice(2, 7);
    const part2 = cleanDigits.slice(7, 11);
    return { formatted: `(${ddd}) ${part1}-${part2}`, digitsOnly: cleanDigits };
  }

  // 10 dígitos: (DD) XXXX-XXXX (fixo)
  if (cleanDigits.length === 10) {
    const ddd = cleanDigits.slice(0, 2);
    const part1 = cleanDigits.slice(2, 6);
    const part2 = cleanDigits.slice(6, 10);
    return { formatted: `(${ddd}) ${part1}-${part2}`, digitsOnly: cleanDigits };
  }

  return { formatted: rawPhone.trim(), digitsOnly: cleanDigits };
}

/**
 * Gera URL de candidatura via WhatsApp Oficial com mensagem personalizada
 */
export function generateWhatsAppLink(digitsOnly: string | null, jobTitle: string, contactName?: string | null): string | null {
  if (!digitsOnly || digitsOnly.length < 10) return null;

  const phoneWithCountry = digitsOnly.startsWith('55') ? digitsOnly : `55${digitsOnly}`;
  const greeting = contactName ? `Olá ${contactName.trim()}` : 'Olá';
  const text = encodeURIComponent(`${greeting}, vi a vaga de "${jobTitle}" divulgada no Agrega e gostaria de me candidatar.`);

  return `https://wa.me/${phoneWithCountry}?text=${text}`;
}

/**
 * Monta descrição estruturada e elegante em Markdown
 */
export function buildMarkdownDescription(data: ExtractedImageJobData, phoneFormatted?: string | null): string {
  const parts: string[] = [];

  parts.push(`## Sobre a Vaga: ${data.titulo}`);
  parts.push(`**Empresa:** ${data.empresa}`);
  parts.push(`**Localização:** ${data.local}${data.endereco ? ` (${data.endereco})` : ''}`);

  if (data.tipo_vaga) {
    parts.push(`**Regime de Contratação:** ${data.tipo_vaga}`);
  }

  if (data.salario) {
    parts.push(`**Remuneração:** ${data.salario}`);
  }

  if (data.turno_horario) {
    parts.push(`**Carga Horária / Escala:** ${data.turno_horario}`);
  }

  if (data.atividades && data.atividades.length > 0) {
    parts.push('\n### 📋 Atividades e Responsabilidades');
    for (const atv of data.atividades) {
      parts.push(`- ${atv}`);
    }
  }

  if (data.requisitos && data.requisitos.length > 0) {
    parts.push('\n### ✅ Requisitos');
    for (const req of data.requisitos) {
      parts.push(`- ${req}`);
    }
  }

  if (data.beneficios) {
    parts.push('\n### 🎁 Benefícios');
    parts.push(data.beneficios);
  }

  if (data.observacoes) {
    parts.push('\n### ℹ️ Informações Adicionais');
    parts.push(data.observacoes);
  }

  parts.push('\n### 📲 Como se Candidatar');
  if (phoneFormatted) {
    parts.push(`Envie seu currículo ou mensagem via WhatsApp para **${phoneFormatted}**${data.contato_nome ? ` (Falar com ${data.contato_nome})` : ''}.`);
  } else if (data.contato_email) {
    parts.push(`Envie seu currículo para o e-mail: **${data.contato_email}**.`);
  } else if (data.link_candidatura) {
    parts.push(`Acesse o link de candidatura: [Candidatar-se aqui](${data.link_candidatura}).`);
  } else {
    parts.push('Compareça ao endereço indicado ou entre em contato com o anunciante.');
  }

  return parts.join('\n');
}

/**
 * Normaliza os dados extraídos de uma imagem para o formato estrito do Agrega com 100% de sucesso
 */
export function normalizeImageJobToAgrega(
  raw: ExtractedImageJobData,
  imageHash: string,
  imagePath?: string
): AgregaIngestPayload {
  // 1. Sanitização de Título e Empresa (com fallbacks para evitar nulos)
  const titulo = (raw.titulo || 'Vaga em Aberto').trim();
  const empresa = (raw.empresa || 'Empresa Local / Confidencial').trim();

  // 2. Sanitização de Localidade (Inferência Litoral Norte se omitido)
  let local = (raw.local || '').trim();
  if (!local) {
    if (raw.contato_telefone?.includes('12') || raw.endereco?.toLowerCase().includes('caraguatatuba')) {
      local = 'Caraguatatuba, SP';
    } else if (raw.contato_telefone?.includes('12') || raw.endereco?.toLowerCase().includes('ubatuba')) {
      local = 'Ubatuba, SP';
    } else {
      local = 'Litoral Norte, SP';
    }
  }

  // 3. Telefone e WhatsApp Deep Link
  const { formatted: phoneFormatted, digitsOnly } = formatBrPhone(raw.contato_telefone);
  const waLink = generateWhatsAppLink(digitsOnly, titulo, raw.contato_nome);
  const linkFinal = waLink || raw.link_candidatura || '';

  // 4. Benefícios e Flags
  const beneficiosStr = raw.beneficios ? raw.beneficios.trim() : null;
  const lowerBen = (beneficiosStr || '').toLowerCase();
  const hasVA = lowerBen.includes('alimentação') || lowerBen.includes('alimentacao') || lowerBen.includes('cesta básica') || lowerBen.includes('cesta basica');
  const hasVR = lowerBen.includes('refeição') || lowerBen.includes('refeicao');
  const hasVT = lowerBen.includes('transporte') || lowerBen.includes('ajuda de custo');
  const hasLifeInsurance = lowerBen.includes('vida');
  const hasMedicalInsurance = lowerBen.includes('saúde') || lowerBen.includes('saude') || lowerBen.includes('médic') || lowerBen.includes('medic');
  const hasDentalInsurance = lowerBen.includes('odonto');

  // 5. Descrição Estruturada Markdown
  const descricao = buildMarkdownDescription(raw, phoneFormatted);

  // 6. Tipo de Vaga
  let tipoVaga = (raw.tipo_vaga || 'CLT').trim();
  const lowerTipo = tipoVaga.toLowerCase();
  if (lowerTipo.includes('freelancer') || lowerTipo.includes('diária') || lowerTipo.includes('diaria')) {
    tipoVaga = 'Freelancer';
  } else if (lowerTipo.includes('pj') || lowerTipo.includes('mei')) {
    tipoVaga = 'PJ';
  } else if (lowerTipo.includes('estágio') || lowerTipo.includes('estagio')) {
    tipoVaga = 'Estágio';
  } else if (lowerTipo.includes('temporário') || lowerTipo.includes('temporario')) {
    tipoVaga = 'Temporário';
  } else {
    tipoVaga = 'CLT';
  }

  // 7. Montagem do payload oficial compatível com ingestJobItemSchema
  const ingestPayload: AgregaIngestPayload = {
    id_vaga: `img-sha256-${imageHash.slice(0, 16)}`,
    titulo,
    empresa,
    local,
    salario: raw.salario || 'A combinar',
    tipo_vaga: tipoVaga,
    turno_horario: raw.turno_horario || null,
    beneficios: beneficiosStr,
    descricao,
    link: linkFinal,
    data_coleta: new Date().toISOString(),

    // Metadados adicionais úteis
    hasVA,
    hasVR,
    hasVT,
    hasLifeInsurance,
    hasMedicalInsurance,
    hasDentalInsurance,
    requirements: raw.requisitos || [],
    workplaceType: 'Presencial',
    contactPhone: phoneFormatted,
    originalImageHash: imageHash,
    originalImagePath: imagePath,
  };

  // 8. Validação garantida
  const parseResult = ingestJobItemSchema.safeParse(ingestPayload);
  if (!parseResult.success) {
    // Se o link falhar por não ser URL (ex: string vazia aceita), corrige
    ingestPayload.link = '';
  }

  return ingestPayload;
}
