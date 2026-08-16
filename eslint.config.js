import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * FASE 5 Beta 0.9 — regole comportamentali rischiose restano in warning:
 * - set-state-in-effect: richiede rewrite di sheet/pagine (docs/TODO-LINT-SPRINT.md)
 * - only-export-components: richiede split file (DX HMR, non correttezza runtime)
 */
export default defineConfig([
  globalIgnores(['dist', 'ios', 'android', 'icons', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
])
