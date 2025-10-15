import { defineConfig } from 'vite';
import { virtualMultiEntryPlugin } from './src/virtual-multi-entry.plugin';

export default defineConfig({
	plugins: [virtualMultiEntryPlugin({
		entries: {
			files: ['./src/__tests__/mock/styles.css', './src/__tests__/mock/utilities.css'],
			type: 'app',
		},
	})],
});