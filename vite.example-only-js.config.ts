import { defineConfig } from 'vite';
import { virtualMultiEntryPlugin } from './src/virtual-multi-entry.plugin';

export default defineConfig({
	plugins: [virtualMultiEntryPlugin({
		files: ['./src/__tests__/mock/components.js', './src/__tests__/mock/helpers.js'],
		name: 'components',
		type: 'lib',
	})],
});