import { defineConfig } from 'vite';
import { virtualMultiEntryPlugin } from './src/virtual-multi-entry.plugin';

export default defineConfig({
	build: {
		lib: {
			entry: 'placeholder:name',
			formats: ['es'],
		},
	},
	plugins: [virtualMultiEntryPlugin({
		entries: {
			files: ['./src/__tests__/mock/api.js', './src/__tests__/mock/styles.css'],
			type: 'lib',
		},
	})],
});