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

// ビルド時にGitLab設定を読み込み
function loadGitLabConfig() {
  const configPath = resolve(rootDir, '..', '..', 'config', 'gitlab-servers.json');
  const configContent = readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

// ビルド時にFooter設定を読み込み
function loadFooterConfig() {
  const configPath = resolve(rootDir, '..', '..', 'config', 'footer-config.json');
  const configContent = readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

// ビルド時にLLMサービス設定を読み込み
function loadLLMConfig() {
  const configPath = resolve(rootDir, '..', '..', 'config', 'llm-services.json');
  const configContent = readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

const githubConfig = loadGitHubConfig();
const gitlabConfig = loadGitLabConfig();
const footerConfig = loadFooterConfig();
const llmConfig = loadLLMConfig();

export default withPageConfig({
  define: {
    __GITHUB_CONFIG__: JSON.stringify(githubConfig),
    __GITLAB_CONFIG__: JSON.stringify(gitlabConfig),
    __FOOTER_CONFIG__: JSON.stringify(footerConfig),
    __LLM_CONFIG__: JSON.stringify(llmConfig),
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
