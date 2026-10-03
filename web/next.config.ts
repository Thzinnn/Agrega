import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // SECURITY: Injeção de cabeçalhos HTTP protetivos na borda (Edge) do Front-end
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // Bloqueia Clickjacking (O site não pode ser encapsulado num <iframe> malicioso)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Bloqueia MIME-Sniffing (O navegador é proibido de tentar "adivinhar" o tipo de um arquivo)
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
