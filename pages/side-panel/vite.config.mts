import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { withPageConfig } from '@extension/vite-config';

const rootDir = resolve(import.meta.dirname);
const srcDir = resolve(rootDir, 'src');

// ビルド時にGitHub設定を読み込み
function loadGitHubConfig() {
  const configPath = resolve(rootDir, '..', '..', 'config', 'github-servers.json');
  const configContent = readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

// ビルド時にFooter設定を読み込み
function loadFooterConfig() {
  const configPath = resolve(rootDir, '..', '..', 'config', 'footer-config.json');
  const configContent = readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

const githubConfig = loadGitHubConfig();
const footerConfig = loadFooterConfig();

export default withPageConfig({
  define: {
    __GITHUB_CONFIG__: JSON.stringify(githubConfig),
    __FOOTER_CONFIG__: JSON.stringify(footerConfig),
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
