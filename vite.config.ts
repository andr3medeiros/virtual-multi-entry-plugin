import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/virtual-multi-entry.plugin.ts'),
      name: 'VirtualMultiEntryPlugin',
      fileName: 'virtual-multi-entry.plugin',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['vite', 'path'],
    },
  }
});
