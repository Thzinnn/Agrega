import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Remove as animações do framer-motion para evitar Unhandled Rejection (AbortError) ao desmontar componentes
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      div: require('react').forwardRef((props: any, ref: any) => {
        const { layoutId, initial, animate, exit, ...rest } = props;
        return require('react').createElement('div', { ref, ...rest });
      }),
    },
  };
});
