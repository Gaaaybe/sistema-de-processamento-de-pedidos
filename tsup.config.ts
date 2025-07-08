import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  exclude: [
    'src/**/*.spec.ts',
    'src/**/*.test.ts', 
    'src/**/tests/**/*',
    'src/**/__tests__/**/*'
  ],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['cjs'],
  target: 'es2022',
  outDir: 'dist'
})
