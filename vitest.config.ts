import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^\.\.\/src\//,
        replacement: path.resolve(__dirname, 'src') + '/',
      },
    ],
  },
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 10000,
  },
});
