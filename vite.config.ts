import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

function normalizeBasePath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed === '/' || trimmed === './') {
    return '/';
  }
  const stripped = trimmed.replace(/^\/+|\/+$/g, '');
  return stripped ? `/${stripped}/` : '/';
}

function resolveBasePath(): string {
  // 1. Explicit override via VITE_BASE_PATH (e.g. "/" or "/shoppingey/")
  if (process.env.VITE_BASE_PATH && process.env.VITE_BASE_PATH.trim() !== '') {
    return normalizeBasePath(process.env.VITE_BASE_PATH);
  }

  // 2. Custom domain via CNAME (e.g. www.shoppingey.com) always serves from root "/"
  const hasCname =
    fs.existsSync(path.resolve(ROOT_DIR, 'CNAME')) ||
    fs.existsSync(path.resolve(ROOT_DIR, 'public/CNAME'));
  if (hasCname) {
    return '/';
  }

  // 3. GitHub Actions fallback for project pages (https://<user>.github.io/<repo>/)
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    if (owner && repo) {
      if (repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
        return '/';
      }
      return normalizeBasePath(repo);
    }
  }

  // 4. Local dev & root hosting default
  return '/';
}

export default defineConfig(() => {
  const normalizedBase = resolveBasePath();
  const pathSegmentsToKeep = normalizedBase
    .split('/')
    .filter(Boolean).length;

  return {
    base: normalizedBase,
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(ROOT_DIR, 'dist');
          const srcAssets = path.resolve(ROOT_DIR, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
          if (fs.existsSync(distDir)) {
            // Copy root CNAME into dist/ so GitHub Pages retains the custom domain on deploy
            const rootCname = path.resolve(ROOT_DIR, 'CNAME');
            const distCname = path.join(distDir, 'CNAME');
            if (fs.existsSync(rootCname) && !fs.existsSync(distCname)) {
              fs.copyFileSync(rootCname, distCname);
            }
            // Ensure GitHub Pages serves static assets cleanly without Jekyll processing
            fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
            // Generate GitHub Pages SPA fallback so deep links (/review/..., /category/...) never 404
            const spa404Html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Shoppingey.com</title>
    <script>
      (function () {
        var pathSegmentsToKeep = ${pathSegmentsToKeep};
        var l = window.location;
        l.replace(
          l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
          l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
          l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
          (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
          l.hash
        );
      })();
    </script>
  </head>
  <body></body>
</html>
`;
            fs.writeFileSync(path.join(distDir, '404.html'), spa404Html);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(ROOT_DIR, '.'),
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
