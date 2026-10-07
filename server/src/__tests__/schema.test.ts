import { describe, it, expect } from 'vitest';
import { app } from '../app.js';

describe('Schema Route Tests', () => {
  it('Should return the Prisma schema for Job model', async () => {
    const res = await app.request('/api/v1/jobs/schema', {
      method: 'GET',
    });

    expect(res.status).toBe(200);
    const data = await res.json() as { success: boolean; data: { name: string; fields: any[]; customColumns: any[] } };
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Job');
    expect(Array.isArray(data.data.fields)).toBe(true);
    expect(Array.isArray(data.data.customColumns)).toBe(true);
  });
});
