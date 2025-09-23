import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["@tensorflow/tfjs", "@tensorflow-models/body-pix", "@huggingface/transformers"],
    },
    lib: {
      entry: "lib/main.ts", // adjust if your entry file is different
      name: "background-remover",
      fileName: "main",
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
