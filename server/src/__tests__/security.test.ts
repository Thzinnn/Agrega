import { describe, it, expect } from 'vitest';
import { app } from '../app.js';

describe('Security Audit Tests', () => {
  const validJobPayload = {
    title: 'Desenvolvedor Frontend',
    company: 'Tech Corp',
    location: 'São Paulo',
    description: 'Vaga para desenvolvedor frontend com experiência em React.',
    workplaceType: 'REMOTE',
    education: 'SUPERIOR_COMPLETE',
    contactEmail: 'vagas@techcorp.com',
    turnstileToken: 'test-valid-token'
  };

  it('TEST-01: Mass Assignment - Should reject requests with unauthorized internal fields or strip them', async () => {
    const maliciousPayload = {
      ...validJobPayload,
      source: 'ADMIN_OVERRIDE',
      isActive: false,
      customData: { is_verified: true },
      unauthorizedField: 'hack'
    };

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify(maliciousPayload),
    });

    // The current implementation uses strict() and omit() on the public schema.
    // This means any payload with these properties will fail validation with HTTP 400.
    expect(res.status).toBe(400);
    const data = await res.json() as { success: boolean; errors?: string[] };
    expect(data.success).toBe(false);
    
    // We expect the strict validation to block unallowed properties
    const errorString = JSON.stringify(data.errors);
    expect(errorString).toContain('Propriedades não permitidas');
  });

  it('TEST-02: Rate Limiting and Turnstile Verification - Should reject missing token', async () => {
    const { turnstileToken, ...payloadWithoutToken } = validJobPayload;

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify(payloadWithoutToken),
    });

    // Should fail validation because turnstileToken is required
    expect(res.status).toBe(400);
    const data = await res.json() as { errors?: string[] };
    expect(JSON.stringify(data.errors)).toContain('Token de verificação');
  });

  it('TEST-03: Stack Trace Exposure - Malformed JSON should return 400 without stack', async () => {
    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      // Intentionally broken JSON
      body: '{ "title": "Vaga", "company": "Empresa", }',
    });

    expect(res.status).toBe(400);
    const data = await res.json() as { success: boolean, error?: string, stack?: string };
    expect(data.success).toBe(false);
    expect(data.error).toContain('JSON');
    expect(data.stack).toBeUndefined();
  });

  it('TEST-04: Protocol Injection - Should reject applicationUrl with javascript: protocol', async () => {
    const { contactEmail, ...payloadWithoutEmail } = validJobPayload;
    const payloadWithBadUrl = {
      ...payloadWithoutEmail,
      applicationUrl: 'javascript:alert(1)'
    };

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify(payloadWithBadUrl),
    });

    expect(res.status).toBe(400);
    const data = await res.json() as { success: boolean, errors?: string[] };
    expect(data.success).toBe(false);
    expect(JSON.stringify(data.errors)).toContain('http');
  });
});
