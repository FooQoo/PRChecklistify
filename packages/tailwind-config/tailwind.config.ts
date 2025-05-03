import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
} as Omit<Config, 'content'>;
