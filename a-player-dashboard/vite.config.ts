/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@auth': path.resolve(__dirname, './src/features/auth'),
      '@survey': path.resolve(__dirname, './src/features/survey'),
      '@assignments': path.resolve(__dirname, './src/features/assignments'),
      '@analytics': path.resolve(__dirname, './src/features/analytics'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@constants': path.resolve(__dirname, './src/constants'),
    },
    // 🔑 Prevent duplicate React copies across chunks/packages
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  build: {
    target: 'es2019',
    sourcemap: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Keep React libs together; let Vite handle the rest
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router', 'react-router-dom'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (asset) =>
          asset.name?.endsWith('.css')
            ? 'assets/styles-[hash].css'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
  // dev-only; prod will use Express below
  server: { host: true, port: 3000 },
  preview: { host: '0.0.0.0', strictPort: false },
  // Vitest configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**', 
      'tests/e2e/**', // Exclude E2E tests (use Playwright)
      '**/*.e2e.{test,spec}.{ts,tsx}'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        'dist/',
        'coverage/',
        'tests/e2e/**'
      ]
    }
  }
});