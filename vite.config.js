import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts', // adjust if your entry file is different
      name: 'background-remover',

    },

  },
});
