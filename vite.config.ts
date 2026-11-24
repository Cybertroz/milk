import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    base: process.env.VITE_WP_RELATIVE_BASE === 'true' ? './' : '/',
    build: {
      outDir: 'dist',
      manifest: true,
    },
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ and generates wp-manifest.json for WordPress embedding.
      {
        name: 'copy-unbundled-src-assets-and-wp-manifest',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }

          const viteManifestCandidates = [
            path.resolve(distDir, '.vite/manifest.json'),
            path.resolve(distDir, 'manifest.json'),
          ];
          const viteManifestPath = viteManifestCandidates.find((p) =>
            fs.existsSync(p)
          );
          if (viteManifestPath) {
            try {
              const rawManifest = JSON.parse(
                fs.readFileSync(viteManifestPath, 'utf8')
              ) as Record<
                string,
                {
                  file?: string;
                  css?: string[];
                  isEntry?: boolean;
                }
              >;
              const entry = Object.values(rawManifest).find((item) => item.isEntry);
              const wpManifest = {
                entryScript: entry?.file ?? null,
                styles: Array.isArray(entry?.css) ? entry.css : [],
                generatedAt: new Date().toISOString(),
              };
              fs.writeFileSync(
                path.resolve(distDir, 'wp-manifest.json'),
                JSON.stringify(wpManifest, null, 2),
                'utf8'
              );
            } catch {
              // Ignore manifest read failures cleanly
            }
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
