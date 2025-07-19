import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { withPageConfig } from '@extension/vite-config';

const rootDir = resolve(import.meta.dirname);
const srcDir = resolve(rootDir, 'src');

// ビルド時にGitHub設定を読み込み
function loadGitHubConfig() {
  try {
    const configPath = resolve(rootDir, '..', '..', 'config', 'github-servers.json');
    const configContent = readFileSync(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.warn('Failed to load GitHub config, using defaults:', error);
    return {
      github: {
        servers: [
          {
            id: 'github-com',
            name: 'GitHub.com',
            apiUrl: 'https://api.github.com',
            webUrl: 'https://github.com',
          },
        ],
      },
    };
  }
}

const githubConfig = loadGitHubConfig();

export default withPageConfig({
  define: {
    __GITHUB_CONFIG__: JSON.stringify(githubConfig),
  },
  resolve: {
    alias: {
      '@src': srcDir,
    },
  },
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, '..', '..', 'dist', 'side-panel'),
  },
});
