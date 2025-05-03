import type { Config } from 'tailwindcss';

import typographyPlugin from '@tailwindcss/typography';

export default {
  plugins: [typographyPlugin],
} as Omit<Config, 'content'>;
