import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'android', 'mobile']),
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
      // `_` prefiksli argument/o'zgaruvchilar ataylab ishlatilmaydi
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      // Bu loyihada effekt ichida state'ni sinxronlash (localStorage'dan
      // tiklash, route parametrlari o'zgarganda reset, taymerlar) ataylab
      // ishlatiladi. React Compiler qoidasi buni error deb belgilaydi, lekin
      // bu yerda xatti-harakat to'g'ri — shuning uchun warning darajasida.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
