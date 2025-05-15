import baseConfig from '@extension/tailwindcss-config';
import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  ...baseConfig,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  plugins: [typography],
} as Config;
