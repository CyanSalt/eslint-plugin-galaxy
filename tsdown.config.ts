import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/rules/*.ts',
    'src/typescript/*.ts',
    'src/vue/*.ts',
  ],
  format: 'cjs',
  fixedExtension: false,
})
