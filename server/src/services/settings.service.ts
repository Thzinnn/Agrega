import { PrismaClient } from '@prisma/client';
import { UpsertSettingInput, MaskedSettingItem } from '../schemas/settings.schema.js';

export class SettingsService {
  /**
   * Lista todas as configurações e chaves de IA cadastradas, mascarando dados sensíveis
   */
  async listSettings(prisma: PrismaClient): Promise<MaskedSettingItem[]> {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return settings.map((s) => {
      const isSecret = s.key.includes('KEY') || s.key.includes('SECRET') || s.key.includes('TOKEN');
      const isConfigured = Boolean(s.value && s.value.trim().length > 0);
      const maskedValue = isSecret && s.value.length > 8 
        ? `${s.value.slice(0, 4)}...${s.value.slice(-4)}` 
        : s.value;

      return {
        id: s.id,
        key: s.key,
        label: s.label,
        value: maskedValue,
        isConfigured,
      };
    });
  }

  /**
   * Cria ou atualiza uma chave de configuração (upsert)
   */
  async upsertSetting(prisma: PrismaClient, data: UpsertSettingInput) {
    return prisma.systemSetting.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        ...(data.label !== undefined ? { label: data.label } : {}),
      },
      create: {
        key: data.key,
        value: data.value,
        label: data.label ?? data.key,
      },
    });
  }

  /**
   * Obtém todas as chaves cadastradas para cada provedor de IA (suporta múltiplas chaves)
   */
  async getAllAiKeys(prisma: PrismaClient): Promise<{
    groqKeys: string[];
    geminiKeys: string[];
  }> {
    const settings = await prisma.systemSetting.findMany({
      where: {
        OR: [
          { key: { contains: 'GROQ' } },
          { key: { contains: 'GEMINI' } },
          { key: { contains: 'GOOGLE' } },
        ],
      },
    });

    const groqKeys: string[] = [];
    const geminiKeys: string[] = [];

    for (const s of settings) {
      if (!s.value || s.value.trim().length === 0) continue;
      // Permite múltiplas chaves separadas por vírgula, ponto e vírgula ou quebra de linha
      const rawTokens = s.value.split(/[\n,;]+/).map((t) => t.trim()).filter(Boolean);

      if (s.key.toUpperCase().includes('GROQ')) {
        groqKeys.push(...rawTokens);
      } else if (s.key.toUpperCase().includes('GEMINI') || s.key.toUpperCase().includes('GOOGLE')) {
        geminiKeys.push(...rawTokens);
      }
    }

    return {
      groqKeys: Array.from(new Set(groqKeys)),
      geminiKeys: Array.from(new Set(geminiKeys)),
    };
  }

  /**
   * Obtém a chave primária de IA (para compatibilidade retroativa)
   */
  async getAiKeys(prisma: PrismaClient): Promise<{
    groqApiKey?: string;
    geminiApiKey?: string;
  }> {
    const { groqKeys, geminiKeys } = await this.getAllAiKeys(prisma);

    return {
      groqApiKey: groqKeys[0],
      geminiApiKey: geminiKeys[0],
    };
  }
}

export const settingsService = new SettingsService();

