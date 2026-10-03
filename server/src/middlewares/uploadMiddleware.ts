import { Context, Next } from 'hono';
import { AppError } from '../errors/AppError.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const MAGIC_BYTES = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  WEBP: [0x52, 0x49, 0x46, 0x46], // "RIFF", followed by size, then "WEBP"
};

const checkMagicBytes = async (file: File): Promise<boolean> => {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check JPEG
  if (bytes[0] === MAGIC_BYTES.JPEG[0] && bytes[1] === MAGIC_BYTES.JPEG[1] && bytes[2] === MAGIC_BYTES.JPEG[2]) {
    return true;
  }

  // Check PNG
  let isPng = true;
  for (let i = 0; i < MAGIC_BYTES.PNG.length; i++) {
    if (bytes[i] !== MAGIC_BYTES.PNG[i]) {
      isPng = false;
      break;
    }
  }
  if (isPng) return true;

  // Check WEBP (RIFF...WEBP)
  if (
    bytes[0] === MAGIC_BYTES.WEBP[0] &&
    bytes[1] === MAGIC_BYTES.WEBP[1] &&
    bytes[2] === MAGIC_BYTES.WEBP[2] &&
    bytes[3] === MAGIC_BYTES.WEBP[3] &&
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50    // P
  ) {
    return true;
  }

  return false;
};

export const uploadValidationMiddleware = async (c: Context, next: Next) => {
  const contentType = c.req.header('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    // We clone the request because parsing body consumes the stream, but Hono's `parseBody` caches it for subsequent calls.
    const body = await c.req.parseBody();

    for (const key in body) {
      const field = body[key];
      if (field instanceof File) {
        if (field.size > MAX_SIZE) {
          throw new AppError('O arquivo excede o limite máximo de 5MB.', 413);
        }

        const isValidMagic = await checkMagicBytes(field);
        if (!isValidMagic) {
          throw new AppError('Formato de arquivo inválido. Apenas imagens JPEG, PNG e WebP são permitidas.', 400);
        }
      }
    }
  }

  await next();
};
