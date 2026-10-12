import { z } from 'zod';

export const upsertSettingSchema = z.object({
  key: z.string({ required_error: 'A chave de configuração é obrigatória' }).min(2).max(100),
  value: z.string({ required_error: 'O valor da configuração é obrigatório' }),
  label: z.string().max(150).optional(),
});

export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;

export interface MaskedSettingItem {
  id: string;
  key: string;
  label: string | null;
  value: string;
  isConfigured: boolean;
}
