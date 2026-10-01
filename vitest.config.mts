import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
    env: { NEXT_PUBLIC_PAYPAL_CLIENT_ID: 'test-client-id' },
  },
});
