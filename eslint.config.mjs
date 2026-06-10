import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist/', 'node_modules/', '.astro/', '.npm-cache/', 'public/'],
  },
  js.configs.recommended,
  ...astro.configs.recommended,
  {
    // Client-side code: src/main.js and inline <script> blocks in components.
    files: ['src/**/*.js', '**/*.astro', '**/*.astro/*.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Build-time code runs in Node.
    files: ['astro.config.mjs', 'scripts/**/*.mjs', 'src/pages/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Keep last so formatting stays Prettier's job.
  prettier,
];
