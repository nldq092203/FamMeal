import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // This rule flags almost all common React effects (loading flags, fetch lifecycles, etc.).
      // We rely on React's patterns (cancellation flags / abort controllers) instead.
      'react-hooks/set-state-in-effect': 'off',

      // Allow non-component exports in modules (hooks, contexts, constants).
      'react-refresh/only-export-components': 'off',
    },
  },
])
