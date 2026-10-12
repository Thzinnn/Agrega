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
   * Obtém o valor real e não-mascarado de chaves específicas de IA para o motor
   */
  async getAiKeys(prisma: PrismaClient): Promise<{
    groqApiKey?: string;
    geminiApiKey?: string;
  }> {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['GROQ_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY'],
        },
      },
    });

    const groqSetting = settings.find((s) => s.key === 'GROQ_API_KEY')?.value;
    const geminiSetting = settings.find((s) => s.key === 'GEMINI_API_KEY' || s.key === 'GOOGLE_API_KEY')?.value;

    return {
      groqApiKey: groqSetting || undefined,
      geminiApiKey: geminiSetting || undefined,
    };
  }
}

export const settingsService = new SettingsService();
