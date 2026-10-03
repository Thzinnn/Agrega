import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3333/api/v1' : '');

export const api = axios.create({
  baseURL,
  /**
   * SEGURANÇA (Session Hijacking): 
   * `withCredentials: true` é obrigatório porque não trafegamos mais o JWT livremente. 
   * Essa flag força o Axios a embutir o cookie de sessão (HttpOnly) em todas as requisições 
   * cross-origin para a API.
   */
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    /**
     * ESTRATÉGIA DE CACHE NO EDGE:
     * Rotas públicas precisam ser cacheadas (Hit) nos CDNs do Cloudflare para aguentar tráfego.
     * Mas rotas administrativas não podem ter "Stale Data". Este interceptador injeta
     * um Timestamp falso na URL só para rotas de `/admin/`, furando (Bypass) o Cache do Cloudflare.
     */
    if (config.method?.toLowerCase() === 'get' && config.url?.includes('/admin/')) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
  }
  return config;
});
