import path from 'node:path';
import fs from 'node:fs';
import { unzipSync } from 'fflate';
import { checkbox } from '@inquirer/prompts';

const pagesPath = path.resolve(import.meta.dirname, '..', '..', '..', 'pages');
const archivePath = path.resolve(import.meta.dirname, '..', 'archive');

const archiveFiles = fs.existsSync(archivePath) ? fs.readdirSync(archivePath) : [];

const DEFAULT_CHOICES = [
  { name: 'Background Script', value: 'background' },
  { name: 'Content Script (Execute JS on Web Page)', value: 'content' },
  { name: 'Content Script UI (Render Custom React Component on Web Page)', value: 'content-ui' },
  { name: 'Content Script Runtime (Inject JS on Specific Actions like Popup Click)', value: 'content-runtime' },
  { name: 'New Tab Override', value: 'new-tab' },
  { name: 'Popup (On Extension Icon Click)', value: 'popup' },
  { name: 'DevTools (Include DevTools Panel)', value: 'devtools' },
  { name: 'Side Panel', value: 'side-panel' },
  { name: 'Options Page', value: 'options' },
];

export default async function recoverModules(manifestObject: chrome.runtime.ManifestV3) {
  const choices = DEFAULT_CHOICES.filter(choice => {
    if (choice.value === 'background') {
      return !manifestObject.background;
    }
    return archiveFiles.includes(`${choice.value}.zip`);
  });

  if (!choices.length) {
    console.log('No features to recover');
    process.exit(0);
  }

  const answers = await checkbox({
    message: 'Choose the features you want to recover',
    loop: false,
    choices,
  });

  if (answers.length === 0) {
    console.log('No features selected');
    process.exit(0);
  }
  if (answers.includes('background')) {
    recoverBackgroundScript(manifestObject);
  }
  if (answers.includes('side-panel')) {
    recoverSidePanel(manifestObject);
  }
  console.log(`Recovered selected features: ${answers.join(', ')}`);
}

function recoverBackgroundScript(manifestObject: chrome.runtime.ManifestV3) {
  manifestObject.background = {
    service_worker: 'background.js',
    type: 'module',
  };
}

function recoverSidePanel(manifestObject: chrome.runtime.ManifestV3) {
  manifestObject.side_panel = {
    default_path: 'side-panel/index.html',
  };
  if (!manifestObject.permissions) {
    manifestObject.permissions = [];
  }
  manifestObject.permissions.push('sidePanel');
  const zipFilePath = path.resolve(archivePath, 'side-panel.zip');
  upZipAndDelete(zipFilePath, path.resolve(pagesPath, 'side-panel'));
}

function upZipAndDelete(zipFilePath: string, destPath: string) {
  const unzipped = unzipSync(fs.readFileSync(zipFilePath));
  fs.mkdirSync(destPath, { recursive: true });
  for (const [filename, fileData] of Object.entries(unzipped)) {
    const filePath = path.join(destPath, filename);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, fileData);
  }
  fs.unlinkSync(zipFilePath);
}
