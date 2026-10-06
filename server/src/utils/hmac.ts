/**
 * Utilitário HMAC-SHA256 usando Web Crypto API.
 * Escolhido porque o Node.js 20+ e o Cloudflare Workers suportam nativamente.
 */

export async function generateHmacSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const data = encoder.encode(payload);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  
  // Convert ArrayBuffer to Hex string
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const hexSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `sha256=${hexSignature}`;
}

export async function verifyHmacSignature(secret: string, payload: string, providedSignature: string): Promise<boolean> {
  if (!providedSignature || !providedSignature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = await generateHmacSignature(secret, payload);
  
  // Timing-safe string comparison
  if (expectedSignature.length !== providedSignature.length) {
    return false;
  }

  let isMatch = true;
  for (let i = 0; i < expectedSignature.length; i++) {
    if (expectedSignature[i] !== providedSignature[i]) {
      isMatch = false;
    }
  }

  return isMatch;
}
