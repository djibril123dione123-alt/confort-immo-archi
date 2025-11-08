import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // ==================== PLUGINS ====================
  plugins: [
    react({
      // Fast Refresh pour un meilleur DX
      fastRefresh: true,
      // Optimisation du JSX runtime
      jsxRuntime: 'automatic',
      // Support des émotions/styled-components si nécessaire
      babel: {
        plugins: [],
      },
    }),
  ],

  // ==================== PATH ALIASES ====================
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  // ==================== OPTIMISATION DES DÉPENDANCES ====================
  optimizeDeps: {
    // Exclure lucide-react de la pré-optimisation (déjà optimisé)
    exclude: ['lucide-react'],
    // Inclure les dépendances CJS qui doivent être pré-bundlées
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ],
  },

  // ==================== BUILD ====================
  build: {
    // Target moderne pour des bundles plus petits
    target: 'es2020',
    // Taille maximale des chunks (500 KB)
    chunkSizeWarningLimit: 500,
    // Minification optimale
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Retire les console.log en production
        drop_debugger: true,
      },
    },
    // Code splitting intelligent
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor principal (React)
          'vendor-react': ['react', 'react-dom'],
          // Vendor UI (Lucide Icons)
          'vendor-ui': ['lucide-react'],
          // Vendor utils si vous utilisez lodash, date-fns, etc.
          // 'vendor-utils': ['lodash', 'date-fns'],
        },
        // Nommage cohérent des chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Source maps en production (optionnel, à désactiver si problème de taille)
    sourcemap: false,
    // Optimisation CSS
    cssCodeSplit: true,
    // Report de la taille du bundle
    reportCompressedSize: true,
  },

  // ==================== SERVER (DÉVELOPPEMENT) ====================
  server: {
    port: 3000,
    host: true, // Écoute sur toutes les interfaces (0.0.0.0)
    open: true, // Ouvre automatiquement le navigateur
    cors: true,
    // Proxy API si backend local
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    // HMR (Hot Module Replacement)
    hmr: {
      overlay: true, // Affiche les erreurs en overlay
    },
  },

  // ==================== PREVIEW (PRODUCTION LOCALE) ====================
  preview: {
    port: 4173,
    host: true,
    open: true,
  },

  // ==================== PERFORMANCE ====================
  esbuild: {
    // Optimisation du loader esbuild
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Drop debugger statements
    drop: ['debugger'],
    // Minification des identificateurs
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },

  // ==================== CSS ====================
  css: {
    // Configuration PostCSS
    postcss: {},
    // Modules CSS
    modules: {
      localsConvention: 'camelCase',
    },
    // Préprocesseur
    preprocessorOptions: {
      scss: {
        // Variables globales SCSS si nécessaire
        // additionalData: `@import "@/styles/variables.scss";`
      },
    },
    devSourcemap: true, // Source maps CSS en dev
  },

  // ==================== DÉFINITIONS GLOBALES ====================
  define: {
    // Variables d'environnement
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});