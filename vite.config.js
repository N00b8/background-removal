import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts', // adjust if your entry file is different
      name: 'background-remover',
      fileName: 'main'

    },

  },
   plugins: [
    dts({
      insertTypesEntry: true,
      exclude: ['']
    })
  ]
});
