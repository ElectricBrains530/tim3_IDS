import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    name: 'next/core-web-vitals',
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,

      // Next.js overrides
      '@next/next/no-html-link-for-pages': 'off',
      'no-undef': 'off',

      // Re-apply React 17+ JSX overrides (handled by next/core-web-vitals usually, but doing it manually here)
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
    },
  },
];
