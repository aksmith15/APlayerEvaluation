/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
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
  },
  build: {
    // Advanced code splitting and optimization
    rollupOptions: {
      external: (id) => {
        // Don't externalize React or React-dependent libraries to prevent version conflicts
        if (id.includes('react') || id.includes('recharts')) {
          return false;
        }
        return false; // Keep everything bundled for now
      },
      output: {
        manualChunks: (id) => {
          // Split node_modules into specific vendor chunks
          if (id.includes('node_modules')) {
            // React core - include React Router to prevent createContext errors
            if (id.includes('react') && !id.includes('recharts')) {
              return 'react-core'; // Keep React Router with React core for context sharing
            }
            // React router - moved to react-core chunk above
            // NOTE: React Router needs React createContext API, so keep with React core
            // if (id.includes('react-router')) {
            //   return 'react-router';
            // }
            // Chart libraries - keep with React core to prevent forwardRef errors
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'react-core'; // Keep Recharts with React core for forwardRef compatibility
            }
            // PDF generation libraries - keep with React core to prevent context issues
            if (id.includes('@react-pdf')) {
              return 'react-core'; // Keep React-PDF with React core for context sharing
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('file-saver')) {
              return 'pdf-vendor'; // Non-React PDF libs can be separate
            }
            // Supabase ecosystem
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'supabase-vendor';
            }
            // Utility libraries
            if (id.includes('date-fns') || id.includes('lodash') || id.includes('uuid')) {
              return 'utils-vendor';
            }
            // UI libraries (smaller utilities)
            if (id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'ui-vendor';
            }
            // All other node_modules
            return 'vendor';
          }
          
          // Split application code by feature
          // Pages - lazy loaded, so they'll be separate chunks automatically
          if (id.includes('/pages/')) {
            // NOTE: Removed pdf-pages chunk to fix React context sharing issues
            // PDF components need to stay in main bundle or shared React chunk
            // Other pages will be separate chunks due to lazy loading
          }
          
          // Large components - split more aggressively
          if (id.includes('/components/ui/')) {
            // Chart components - keep in main bundle to prevent React forwardRef issues
            // NOTE: Chart components need React context and forwardRef, so don't split them
            // if (id.includes('Chart') || id.includes('Radar') || id.includes('Trend')) {
            //   return 'chart-components';
            // }
            // PDF-related components - keep in main bundle to prevent React context issues
            // NOTE: PDF components need React context sharing, so don't split them
            // if (id.includes('PDF') || id.includes('Download') || id.includes('Generate')) {
            //   return 'pdf-components';
            // }
            // Assignment management components - split further
            if (id.includes('Assignment') && (id.includes('Creation') || id.includes('Upload'))) {
              return 'assignment-creation';
            }
            if (id.includes('Assignment') || id.includes('Coverage') || id.includes('Weights')) {
              return 'assignment-components';
            }
            // Survey components
            if (id.includes('Survey') || id.includes('Question') || id.includes('Rating')) {
              return 'survey-components';
            }
            // Tab components
            if (id.includes('Tab') && id.includes('/assignment-tabs/')) {
              return 'assignment-tabs';
            }
            // Core analysis components
            if (id.includes('Core') || id.includes('Character') || id.includes('Competence') || id.includes('Curiosity')) {
              return 'core-analysis';
            }
          }
          
          // Services
          if (id.includes('/services/')) {
            // NOTE: Keep PDF services in main bundle to prevent React context issues
            // if (id.includes('pdf') || id.includes('download')) {
            //   return 'pdf-services';
            // }
            if (id.includes('ai') || id.includes('insights') || id.includes('coaching')) {
              return 'ai-services';
            }
            if (id.includes('assignment') || id.includes('coverage')) {
              return 'assignment-services';
            }
            // Core services remain in main bundle
          }
        },
        // Optimize chunk file names for caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'vendor') {
            return 'assets/vendor-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/styles-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // More aggressive chunk size limit
    chunkSizeWarningLimit: 500,
    // Enable source maps for production debugging (smaller than default)
    sourcemap: 'hidden',
    // Advanced minification
    minify: 'esbuild',
    target: 'esnext',
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline small assets
    cssCodeSplit: true, // Split CSS into separate files
    // Enable advanced optimizations
    reportCompressedSize: true,
    write: true
  },
  // Optimize dev server for better performance
  server: {
    port: 3000,
    host: true,
    // Enable faster HMR
    hmr: {
      overlay: true
    },
    // Optimize file watching
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/coverage/**']
    }
  },
  // Configure preview server for production hosting
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'a-player-evaluations.onrender.com',
      '.onrender.com' // Allow all Render subdomains
    ]
  },
  // Basic dependency optimization - let Vite handle PDF libs naturally
  optimizeDeps: {
    include: [
      // Core dependencies
      'react',
      'react-dom',
      'react-router-dom',
      'react/jsx-runtime',
      'react-dom/client',
      
      // Backend services
      '@supabase/supabase-js',
      
      // Commonly used utilities
      'date-fns',
      'clsx',
      'class-variance-authority',
      
      // Chart libraries (pre-bundle for faster dev and ensure React compatibility)
      'recharts',
      'recharts/es6'
    ],
    force: true // Force re-optimization to fix React forwardRef issues
  },
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
})
