import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function shortCommitSha() {
  const fromEnv =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    '';
  if (fromEnv) return fromEnv.slice(0, 7);

  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

const sha = shortCommitSha();
const appVersion = sha ? `${version}+${sha}` : version;

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
