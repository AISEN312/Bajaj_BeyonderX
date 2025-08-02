import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Optimize bundle size
        rollupOptions: {
          output: {
            manualChunks: {
              // Split vendor libraries into separate chunks
              vendor: ['react', 'react-dom'],
              gemini: ['@google/genai']
            }
          }
        },
        // Enable minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production'
          }
        },
        // Optimize chunk sizes
        chunkSizeWarningLimit: 1000,
        // Enable source maps for debugging (disable in production)
        sourcemap: mode !== 'production'
      },
      // Optimize dev server
      server: {
        hmr: {
          overlay: false
        }
      }
    };
});
