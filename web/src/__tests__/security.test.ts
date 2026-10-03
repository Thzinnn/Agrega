import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config';

describe('Frontend Security Headers Test', () => {
  it('TEST 3: Should include mandatory security headers in Next.js config', async () => {
    // nextConfig is the exported object from next.config.ts
    // Check if headers function exists
    expect(nextConfig.headers).toBeDefined();

    if (nextConfig.headers) {
      // Execute the headers function to get the configuration rules
      const headersRules = await nextConfig.headers();
      expect(headersRules.length).toBeGreaterThan(0);

      const allHeaders = headersRules[0].headers;
      
      const headerKeys = allHeaders.map((h: any) => h.key);
      const headerValues = allHeaders.map((h: any) => h.value);

      expect(headerKeys).toContain('X-Frame-Options');
      expect(headerValues).toContain('DENY');

      expect(headerKeys).toContain('X-Content-Type-Options');
      expect(headerValues).toContain('nosniff');

      expect(headerKeys).toContain('Referrer-Policy');
      expect(headerKeys).toContain('Permissions-Policy');
    }
  });
});
