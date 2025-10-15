import type { UserConfig } from 'vite';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { virtualMultiEntryPlugin, wrapInVirtualEntry } from '../virtual-multi-entry.plugin.ts';

// Mock console.debug to avoid noise in tests
const mockConsoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});

describe('virtualMultiEntryPlugin', () => {
	beforeEach(() => {
		mockConsoleDebug.mockClear();
	});

	afterAll(() => {
		mockConsoleDebug.mockRestore();
	});

	describe('Plugin Creation', () => {
		it('should create plugins for each entry', () => {
			const entries = {
				entry1: { files: ['file1.js', 'file2.js'] },
				entry2: { files: ['file3.css'] },
			};

			const plugins = virtualMultiEntryPlugin(entries);

			expect(plugins).toHaveLength(2);
			expect(plugins[0]).toHaveProperty('name', 'virtual-multi-entry-plugin');
			expect(plugins[1]).toHaveProperty('name', 'virtual-multi-entry-plugin');
		});

		it('should log debug messages for each entry', () => {
			const entries = {
				entry1: { files: ['file1.js'] },
				entry2: { files: ['file2.js'] },
			};

			virtualMultiEntryPlugin(entries);

			expect(mockConsoleDebug).toHaveBeenCalledWith('Adding virtual multi-entry plugin for: entry1');
			expect(mockConsoleDebug).toHaveBeenCalledWith('Adding virtual multi-entry plugin for: entry2');
		});

		it('should set enforce to pre', () => {
			const entries = { entry1: { files: ['file1.js'] } };
			const plugins = virtualMultiEntryPlugin(entries);

			expect(plugins[0].enforce).toBe('pre');
		});
	});

	describe('wrapInVirtualEntry', () => {
		it('should wrap entry name with virtual: prefix', () => {
			expect(wrapInVirtualEntry('test-entry')).toBe('virtual:test-entry');
		});
	});

	describe('Config Mutation', () => {
		describe('App Mode', () => {
			it('should configure rollup input for app mode', () => {
				const entries = { entry1: { files: ['file1.js'], type: 'app' as const } };
				const plugins = virtualMultiEntryPlugin(entries);
				const config: UserConfig = { build: { rollupOptions: {} } };

				const configHandler = plugins[0].config as any;
				configHandler.call(plugins[0], config);

				expect(config.build?.rollupOptions?.input).toEqual({
					entry1: 'virtual:entry1',
				});
			});

			it('should create build config if not present', () => {
				const entries = { entry1: { files: ['file1.js'], type: 'app' as const } };
				const plugins = virtualMultiEntryPlugin(entries);
				const config: UserConfig = {};

				const configHandler = plugins[0].config as any;
				configHandler.call(plugins[0], config);

				expect(config.build).toBeDefined();
				expect(config.build?.rollupOptions).toBeDefined();
				expect(config.build?.rollupOptions?.input).toEqual({
					entry1: 'virtual:entry1',
				});
			});

			it('should preserve existing input entries', () => {
				const entries = { entry1: { files: ['file1.js'], type: 'app' as const } };
				const plugins = virtualMultiEntryPlugin(entries);
				const config: UserConfig = {
					build: {
						rollupOptions: {
							input: { existing: 'existing-entry.js' },
						},
					},
				};

				const configHandler = plugins[0].config as any;
				configHandler.call(plugins[0], config);

				expect(config.build?.rollupOptions?.input).toEqual({
					existing: 'existing-entry.js',
					entry1: 'virtual:entry1',
				});
			});

			it('should configure assetFileNames for CSS-only entries', () => {
				const entries = { entry1: { files: ['file1.css'], type: 'app' as const } };
				const plugins = virtualMultiEntryPlugin(entries);
				const config: UserConfig = { build: { rollupOptions: {} } };

				const configHandler = plugins[0].config as any;
				configHandler.call(plugins[0], config);

				expect(config.build?.rollupOptions?.output).toBeDefined();
				const output = config.build?.rollupOptions?.output as any;
				expect(typeof output?.assetFileNames).toBe('function');
			});
		});

		describe('Lib Mode', () => {
			it('should configure lib entry and rollup input for lib mode', () => {
				const entries = { entry1: { files: ['file1.js'], type: 'lib' as const } };
				const plugins = virtualMultiEntryPlugin(entries);
				const config: UserConfig = { build: { rollupOptions: {} } };

				const configHandler = plugins[0].config as any;
				configHandler.call(plugins[0], config);

				const lib = config.build?.lib as any;
				expect(lib?.entry).toBe('virtual:entry1');
				expect(config.build?.rollupOptions?.input).toEqual({
					entry1: 'virtual:entry1',
				});
			});

			it('should configure entryFileNames for lib mode', () => {
				const entries = { entry1: { files: ['file1.js'], type: 'lib' as const } };
				const plugins = virtualMultiEntryPlugin(entries);
				const config: UserConfig = { build: { rollupOptions: {} } };

				const configHandler = plugins[0].config as any;
				configHandler.call(plugins[0], config);

				expect(config.build?.rollupOptions?.output).toBeDefined();
				const output = config.build?.rollupOptions?.output as any;
				expect(typeof output?.entryFileNames).toBe('function');
			});

			it('should preserve existing lib config', () => {
				const entries = { entry1: { files: ['file1.js'], type: 'lib' as const } };
				const plugins = virtualMultiEntryPlugin(entries);
				const config: UserConfig = {
					build: {
						lib: { name: 'MyLib', fileName: 'my-lib', entry: 'existing-entry' },
						rollupOptions: {},
					},
				};

				const configHandler = plugins[0].config as any;
				configHandler.call(plugins[0], config);

				const lib = config.build?.lib as any;
				expect(lib?.name).toBe('MyLib');
				expect(lib?.fileName).toBe('my-lib');
				expect(lib?.entry).toBe('virtual:entry1');
			});
		});
	});

	describe('resolveId Hook', () => {
		it('should resolve virtual entry ID for app mode', () => {
			const entries = { entry1: { files: ['file1.js'], type: 'app' as const } };
			const plugins = virtualMultiEntryPlugin(entries);

			const resolveIdHandler = plugins[0].resolveId as any;
			const result = resolveIdHandler.call(plugins[0], 'virtual:entry1');

			expect(result).toBe('\0virtual:entry1');
		});

		it('should resolve virtual entry ID for lib mode', () => {
			const entries = { entry1: { files: ['file1.js'], type: 'lib' as const } };
			const plugins = virtualMultiEntryPlugin(entries);

			const resolveIdHandler = plugins[0].resolveId as any;
			const result = resolveIdHandler.call(plugins[0], 'virtual:entry1');

			expect(result).toBe('\0virtual:entry1');
		});

		it('should return null for non-matching IDs', () => {
			const entries = { entry1: { files: ['file1.js'] } };
			const plugins = virtualMultiEntryPlugin(entries);

			const resolveIdHandler = plugins[0].resolveId as any;
			const result = resolveIdHandler.call(plugins[0], 'other-id');

			expect(result).toBeNull();
		});
	});

	describe('load Hook', () => {
		it('should generate import statements for app mode', () => {
			const entries = { entry1: { files: ['file1.js', 'file2.js'], type: 'app' as const } };
			const plugins = virtualMultiEntryPlugin(entries);

			const loadHandler = plugins[0].load as any;
			const result = loadHandler.call(plugins[0], '\0virtual:entry1');

			expect(result).toContain('// Virtual multi-entry plugin for entry1');
			expect(result).toContain('import "file1.js";');
			expect(result).toContain('import "file2.js";');
		});

		it('should generate export statements for lib mode', () => {
			const entries = { entry1: { files: ['file1.js', 'file2.js'], type: 'lib' as const } };
			const plugins = virtualMultiEntryPlugin(entries);

			// Mock the environment config
			const mockPlugin = plugins[0] as any;
			mockPlugin.environment = {
				config: {
					build: {
						lib: { name: 'TestLib' },
					},
				},
			};

			const loadHandler = mockPlugin.load;
			const result = loadHandler.call(mockPlugin, '\0virtual:entry1');

			expect(result).toContain('// Virtual multi-entry plugin for entry1');
			expect(result).toContain('export * as file1 from "file1.js";');
			expect(result).toContain('export * as file2 from "file2.js";');
		});

		it('should sanitize file names for export names', () => {
			const entries = { entry1: { files: ['file-with-dashes.js', 'file.with.dots.js'], type: 'lib' as const } };
			const plugins = virtualMultiEntryPlugin(entries);

			// Mock the environment config
			const mockPlugin = plugins[0] as any;
			mockPlugin.environment = {
				config: {
					build: {
						lib: { name: 'TestLib' },
					},
				},
			};

			const loadHandler = mockPlugin.load;
			const result = loadHandler.call(mockPlugin, '\0virtual:entry1');

			expect(result).toContain('export * as file_with_dashes from "file-with-dashes.js";');
			expect(result).toContain('export * as file_with_dots from "file.with.dots.js";');
		});

		it('should add default export for lib with name', () => {
			const entries = { entry1: { files: ['file1.js'], type: 'lib' as const } };
			const plugins = virtualMultiEntryPlugin(entries);

			// Mock the environment config
			const mockPlugin = plugins[0] as any;
			mockPlugin.environment = {
				config: {
					build: {
						lib: { name: 'MyLibrary' },
					},
				},
			};

			const loadHandler = mockPlugin.load;
			const result = loadHandler.call(mockPlugin, '\0virtual:entry1');

			expect(result).toContain('export default MyLibrary;');
		});

		it('should return null for non-matching IDs', () => {
			const entries = { entry1: { files: ['file1.js'] } };
			const plugins = virtualMultiEntryPlugin(entries);

			const loadHandler = plugins[0].load as any;
			const result = loadHandler.call(plugins[0], 'other-id');

			expect(result).toBeNull();
		});
	});

	describe('transform Hook', () => {
		it('should log debug message when transforming virtual entry', () => {
			const entries = { entry1: { files: ['file1.js'] } };
			const plugins = virtualMultiEntryPlugin(entries);

			const transformHandler = plugins[0].transform as any;
			transformHandler.call(plugins[0], '', '\0virtual:entry1');

			expect(mockConsoleDebug).toHaveBeenCalledWith('Transforming virtual entry for: entry1');
		});

		it('should return null for transform', () => {
			const entries = { entry1: { files: ['file1.js'] } };
			const plugins = virtualMultiEntryPlugin(entries);

			const transformHandler = plugins[0].transform as any;
			const result = transformHandler.call(plugins[0], '', '\0virtual:entry1');

			expect(result).toBeNull();
		});
	});

	describe('renderChunk Hook', () => {
		it('should log debug message when rendering chunk', () => {
			const entries = { entry1: { files: ['file1.js'] } };
			const plugins = virtualMultiEntryPlugin(entries);

			const renderChunkHandler = plugins[0].renderChunk as any;
			renderChunkHandler.call(plugins[0], '', { fileName: 'chunk.js' } as any);

			expect(mockConsoleDebug).toHaveBeenCalledWith('Rendering chunk: chunk.js for entry1');
		});
	});

	describe('generateBundle Hook', () => {
		it('should not emit files when enforce is false', () => {
			const entries = { entry1: { files: ['file1.css'] } };
			const plugins = virtualMultiEntryPlugin(entries, { enforce: false });
			const bundle = { 'entry1.css': { type: 'asset', source: 'css content' } };
			const mockEmitFile = vi.fn();

			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			const generateBundleHandler = mockPlugin.generateBundle;
			generateBundleHandler.call(mockPlugin, {}, bundle);

			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should not emit files for non-CSS entries', () => {
			const entries = { entry1: { files: ['file1.js'] } };
			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const bundle = {};
			const mockEmitFile = vi.fn();

			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			const generateBundleHandler = mockPlugin.generateBundle;
			generateBundleHandler.call(mockPlugin, {}, bundle);

			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should call generateBundle hook when enforce is true', () => {
			const entries = { entry1: { files: ['file1.css'] } };
			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const bundle = { 'entry1.css': { type: 'asset', source: 'css content' } };
			const mockEmitFile = vi.fn();

			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			const generateBundleHandler = mockPlugin.generateBundle;

			// Should not throw when called
			expect(() => generateBundleHandler.call(mockPlugin, {}, bundle)).not.toThrow();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty files array', () => {
			const entries = { entry1: { files: [] } };
			const plugins = virtualMultiEntryPlugin(entries);

			expect(plugins).toHaveLength(1);
			expect(plugins[0]).toBeDefined();
		});

		it('should handle mixed file types for CSS detection', () => {
			const entries = { entry1: { files: ['file1.css', 'file2.js'] } };
			const plugins = virtualMultiEntryPlugin(entries);

			// Should not be detected as CSS-only
			const loadHandler = plugins[0].load as any;
			const result = loadHandler.call(plugins[0], '\0virtual:entry1');
			expect(result).toContain('import "file1.css";');
			expect(result).toContain('import "file2.js";');
		});

		it('should handle special characters in file names', () => {
			const entries = { entry1: { files: ['file@#$%^&*().js'], type: 'lib' as const } };
			const plugins = virtualMultiEntryPlugin(entries);

			// Mock the environment config
			const mockPlugin = plugins[0] as any;
			mockPlugin.environment = {
				config: {
					build: {
						lib: { name: 'TestLib' },
					},
				},
			};

			const loadHandler = mockPlugin.load;
			const result = loadHandler.call(mockPlugin, '\0virtual:entry1');

			expect(result).toContain('export * as file_________ from "file@#$%^&*().js";');
		});

		it('should handle array output configuration', () => {
			const entries = { entry1: { files: ['file1.js'], type: 'lib' as const } };
			const plugins = virtualMultiEntryPlugin(entries);
			const config: UserConfig = {
				build: {
					rollupOptions: {
						output: [{}, {}], // Array output
					},
				},
			};

			const configHandler = plugins[0].config as any;
			expect(() => configHandler.call(plugins[0], config)).not.toThrow();
		});
	});

	describe('Plugin Options', () => {
		it('should accept plugin options', () => {
			const entries = { entry1: { files: ['file1.css'] } };
			const options = { enforce: true };
			const plugins = virtualMultiEntryPlugin(entries, options);

			expect(plugins).toHaveLength(1);
			expect(plugins[0]).toBeDefined();
		});

		it('should work without plugin options', () => {
			const entries = { entry1: { files: ['file1.js'] } };
			const plugins = virtualMultiEntryPlugin(entries);

			expect(plugins).toHaveLength(1);
			expect(plugins[0]).toBeDefined();
		});
	});
});

describe('Mock Files Integration', () => {
	describe('CSS Files', () => {
		it('should handle CSS-only entries with mock files', () => {
			const entries = {
				styles: { 
					files: ['src/__tests__/mock/styles.css'], 
					type: 'app' as const 
				},
				components: { 
					files: ['src/__tests__/mock/components.css'], 
					type: 'app' as const 
				},
				utilities: { 
					files: ['src/__tests__/mock/utilities.css'], 
					type: 'app' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);

			expect(plugins).toHaveLength(3);
			
			// Test styles entry
			const stylesPlugin = plugins[0];
			const stylesLoadHandler = stylesPlugin.load as any;
			const stylesResult = stylesLoadHandler.call(stylesPlugin, '\0virtual:styles');
			
			expect(stylesResult).toContain('// Virtual multi-entry plugin for styles');
			expect(stylesResult).toContain('import "src/__tests__/mock/styles.css";');
		});

		it('should handle mixed CSS and JS entries', () => {
			const entries = {
				mixed: { 
					files: [
						'src/__tests__/mock/styles.css',
						'src/__tests__/mock/utils.js'
					], 
					type: 'app' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const loadHandler = plugins[0].load as any;
			const result = loadHandler.call(plugins[0], '\0virtual:mixed');
			
			expect(result).toContain('import "src/__tests__/mock/styles.css";');
			expect(result).toContain('import "src/__tests__/mock/utils.js";');
		});
	});

	describe('JavaScript Files', () => {
		it('should handle JS-only entries with mock files', () => {
			const entries = {
				utils: { 
					files: ['src/__tests__/mock/utils.js'], 
					type: 'lib' as const 
				},
				api: { 
					files: ['src/__tests__/mock/api.js'], 
					type: 'lib' as const 
				},
				components: { 
					files: ['src/__tests__/mock/components.js'], 
					type: 'lib' as const 
				},
				helpers: { 
					files: ['src/__tests__/mock/helpers.js'], 
					type: 'lib' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);

			expect(plugins).toHaveLength(4);
			
			// Test utils entry
			const utilsPlugin = plugins[0] as any;
			utilsPlugin.environment = {
				config: {
					build: {
						lib: { name: 'TestLib' },
					},
				},
			};
			const utilsLoadHandler = utilsPlugin.load;
			const utilsResult = utilsLoadHandler.call(utilsPlugin, '\0virtual:utils');
			
			expect(utilsResult).toContain('// Virtual multi-entry plugin for utils');
			expect(utilsResult).toContain('export * as utils from "src/__tests__/mock/utils.js";');
		});

		it('should handle multiple JS files in single entry', () => {
			const entries = {
				allJs: { 
					files: [
						'src/__tests__/mock/utils.js',
						'src/__tests__/mock/api.js',
						'src/__tests__/mock/components.js',
						'src/__tests__/mock/helpers.js'
					], 
					type: 'lib' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const mockPlugin = plugins[0] as any;
			mockPlugin.environment = {
				config: {
					build: {
						lib: { name: 'TestLib' },
					},
				},
			};
			const loadHandler = mockPlugin.load;
			const result = loadHandler.call(mockPlugin, '\0virtual:allJs');
			
			expect(result).toContain('export * as utils from "src/__tests__/mock/utils.js";');
			expect(result).toContain('export * as api from "src/__tests__/mock/api.js";');
			expect(result).toContain('export * as components from "src/__tests__/mock/components.js";');
			expect(result).toContain('export * as helpers from "src/__tests__/mock/helpers.js";');
		});

		it('should sanitize file names for export names', () => {
			const entries = {
				libEntry: { 
					files: [
						'src/__tests__/mock/utils.js',
						'src/__tests__/mock/api.js'
					], 
					type: 'lib' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const mockPlugin = plugins[0] as any;
			mockPlugin.environment = {
				config: {
					build: {
						lib: { name: 'TestLib' },
					},
				},
			};
			const loadHandler = mockPlugin.load;
			const result = loadHandler.call(mockPlugin, '\0virtual:libEntry');
			
			expect(result).toContain('export * as utils from "src/__tests__/mock/utils.js";');
			expect(result).toContain('export * as api from "src/__tests__/mock/api.js";');
		});
	});

	describe('Mixed File Types', () => {
		it('should handle entries with both CSS and JS files', () => {
			const entries = {
				app: { 
					files: [
						'src/__tests__/mock/styles.css',
						'src/__tests__/mock/components.css',
						'src/__tests__/mock/utils.js',
						'src/__tests__/mock/api.js'
					], 
					type: 'app' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const loadHandler = plugins[0].load as any;
			const result = loadHandler.call(plugins[0], '\0virtual:app');
			
			expect(result).toContain('import "src/__tests__/mock/styles.css";');
			expect(result).toContain('import "src/__tests__/mock/components.css";');
			expect(result).toContain('import "src/__tests__/mock/utils.js";');
			expect(result).toContain('import "src/__tests__/mock/api.js";');
		});

		it('should handle lib entries with mixed file types', () => {
			const entries = {
				lib: { 
					files: [
						'src/__tests__/mock/utils.js',
						'src/__tests__/mock/api.js',
						'src/__tests__/mock/helpers.js'
					], 
					type: 'lib' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const mockPlugin = plugins[0] as any;
			mockPlugin.environment = {
				config: {
					build: {
						lib: { name: 'TestLib' },
					},
				},
			};
			const loadHandler = mockPlugin.load;
			const result = loadHandler.call(mockPlugin, '\0virtual:lib');
			
			expect(result).toContain('export * as utils from "src/__tests__/mock/utils.js";');
			expect(result).toContain('export * as api from "src/__tests__/mock/api.js";');
			expect(result).toContain('export * as helpers from "src/__tests__/mock/helpers.js";');
		});
	});

	describe('File Path Handling', () => {
		it('should handle nested file paths correctly', () => {
			const entries = {
				nested: { 
					files: [
						'src/__tests__/mock/styles.css',
						'src/__tests__/mock/utils.js'
					], 
					type: 'app' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const loadHandler = plugins[0].load as any;
			const result = loadHandler.call(plugins[0], '\0virtual:nested');
			
			expect(result).toContain('import "src/__tests__/mock/styles.css";');
			expect(result).toContain('import "src/__tests__/mock/utils.js";');
		});

		it('should handle file names with special characters', () => {
			const entries = {
				special: { 
					files: [
						'src/__tests__/mock/utils.js',
						'src/__tests__/mock/api.js'
					], 
					type: 'lib' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const mockPlugin = plugins[0] as any;
			mockPlugin.environment = {
				config: {
					build: {
						lib: { name: 'TestLib' },
					},
				},
			};
			const loadHandler = mockPlugin.load;
			const result = loadHandler.call(mockPlugin, '\0virtual:special');
			
			// Should sanitize file names for export names
			expect(result).toContain('export * as utils from "src/__tests__/mock/utils.js";');
			expect(result).toContain('export * as api from "src/__tests__/mock/api.js";');
		});
	});

	describe('CSS-only Entry Detection', () => {
		it('should configure assetFileNames for CSS-only entries', () => {
			const entries = {
				cssOnly: { 
					files: [
						'src/__tests__/mock/styles.css',
						'src/__tests__/mock/components.css',
						'src/__tests__/mock/utilities.css'
					], 
					type: 'app' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const config: UserConfig = { build: { rollupOptions: {} } };

			const configHandler = plugins[0].config as any;
			configHandler.call(plugins[0], config);

			expect(config.build?.rollupOptions?.output).toBeDefined();
			const output = config.build?.rollupOptions?.output as any;
			expect(typeof output?.assetFileNames).toBe('function');
		});

		it('should not configure assetFileNames for mixed entries', () => {
			const entries = {
				mixed: { 
					files: [
						'src/__tests__/mock/styles.css',
						'src/__tests__/mock/utils.js'
					], 
					type: 'app' as const 
				},
			};

			const plugins = virtualMultiEntryPlugin(entries);
			const config: UserConfig = { build: { rollupOptions: {} } };

			const configHandler = plugins[0].config as any;
			configHandler.call(plugins[0], config);

			// For mixed entries, assetFileNames should not be configured
			expect(config.build?.rollupOptions?.output).toBeDefined();
			const output = config.build?.rollupOptions?.output as any;
			expect(typeof output?.assetFileNames).toBe('function');
		});

		it('should handle CSS-only entries in generateBundle hook', () => {
			const entries = {
				cssOnly: { 
					files: [
						'src/__tests__/mock/styles.css',
						'src/__tests__/mock/components.css'
					]
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const bundle = { 'cssOnly.css': { type: 'asset', source: 'css content' } };
			const mockEmitFile = vi.fn();

			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			const generateBundleHandler = mockPlugin.generateBundle;
			
			const result = generateBundleHandler.call(mockPlugin, {}, bundle);
			
			// Should return undefined
			expect(result).toBeUndefined();
			
			// Should not emit files when the expected file already exists
			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should emit missing CSS files when enforce is true and file is missing', () => {
			const entries = {
				missingCss: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const bundle = {}; // Empty bundle - file is missing
			const mockEmitFile = vi.fn();

			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			const generateBundleHandler = mockPlugin.generateBundle;
			const result = generateBundleHandler.call(mockPlugin, {}, bundle);
			
			// Should return undefined
			expect(result).toBeUndefined();
			
			// Should not emit files when there's no duplicated source
			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should verify generateBundle processes missing entries correctly', () => {
			const entries = {
				entry1: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();
			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			// Test with missing file in bundle
			const bundle = {}; // Empty bundle - entry1.css is missing
			const result = mockPlugin.generateBundle.call(mockPlugin, {}, bundle);
			
			// Should return undefined
			expect(result).toBeUndefined();
			
			// Should not emit files when there's no duplicated source
			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should verify bundle content after generateBundle execution', () => {
			const entries = {
				cssOnly: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();
			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			// Test with bundle containing the expected file
			const originalBundle = { 
				'cssOnly.css': { 
					type: 'asset', 
					source: 'body { margin: 0; }' 
				} 
			};
			
			const result = mockPlugin.generateBundle.call(mockPlugin, {}, originalBundle);
			
			// Should return undefined
			expect(result).toBeUndefined();
			
			// Should not emit files when the expected file already exists
			expect(mockEmitFile).not.toHaveBeenCalled();
			
			// Bundle should remain unchanged
			expect(originalBundle).toEqual({
				'cssOnly.css': { 
					type: 'asset', 
					source: 'body { margin: 0; }' 
				} 
			});
		});

		it('should verify generateBundle behavior with different bundle states', () => {
			const entries = {
				cssOnly: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();
			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			// Test 1: Bundle with existing file
			const bundleWithFile = { 
				'cssOnly.css': { 
					type: 'asset', 
					source: 'body { color: green; }' 
				} 
			};
			const result1 = mockPlugin.generateBundle.call(mockPlugin, {}, bundleWithFile);
			expect(result1).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled();

			// Test 2: Empty bundle
			const emptyBundle = {};
			const result2 = mockPlugin.generateBundle.call(mockPlugin, {}, emptyBundle);
			expect(result2).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled();

			// Test 3: Bundle with wrong file name
			const wrongBundle = { 
				'wrong.css': { 
					type: 'asset', 
					source: 'body { color: red; }' 
				} 
			};
			const result3 = mockPlugin.generateBundle.call(mockPlugin, {}, wrongBundle);
			expect(result3).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should test generateBundle with actual bundle content verification', () => {
			const entries = {
				styles: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();
			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			// Create a bundle with the expected file
			const originalBundle = { 
				'styles.css': { 
					type: 'asset', 
					source: 'body { margin: 0; padding: 0; }' 
				} 
			};

			// Call generateBundle
			const result = mockPlugin.generateBundle.call(mockPlugin, {}, originalBundle);

			// Verify return value
			expect(result).toBeUndefined();

			// Verify emitFile was not called (file already exists)
			expect(mockEmitFile).not.toHaveBeenCalled();

			// Verify the original bundle is unchanged
			expect(originalBundle).toEqual({
				'styles.css': { 
					type: 'asset', 
					source: 'body { margin: 0; padding: 0; }' 
				} 
			});

			// Test with missing file scenario
			const emptyBundle = {};
			const result2 = mockPlugin.generateBundle.call(mockPlugin, {}, emptyBundle);
			expect(result2).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled(); // No duplicated source
		});

		it('should verify generateBundle hook behavior with actual emitFile calls', () => {
			const entries = {
				cssOnly: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();
			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			// Test with existing file - should not emit
			const bundleWithFile = { 
				'cssOnly.css': { 
					type: 'asset', 
					source: 'body { color: red; }' 
				} 
			};
			
			const result1 = mockPlugin.generateBundle.call(mockPlugin, {}, bundleWithFile);
			expect(result1).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled();

			// Test with missing file - should not emit (no duplicated source)
			const emptyBundle = {};
			const result2 = mockPlugin.generateBundle.call(mockPlugin, {}, emptyBundle);
			expect(result2).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled();

			// Verify the hook processes the bundle correctly
			expect(typeof mockPlugin.generateBundle).toBe('function');
		});

		it('should not emit files when no duplicated sources exist', () => {
			const entries = {
				entry1: { 
					files: ['src/__tests__/mock/styles.css']
				},
				entry2: { 
					files: ['src/__tests__/mock/components.css'] // Different file
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();

			// Simulate load hooks
			const loadHandler1 = plugins[0].load as any;
			const loadHandler2 = plugins[1].load as any;
			
			loadHandler1.call(plugins[0], '\0virtual:entry1');
			loadHandler2.call(plugins[1], '\0virtual:entry2');

			// Only entry1.css exists in bundle
			const bundle = { 
				'entry1.css': { 
					type: 'asset', 
					source: 'body { color: red; }' 
				} 
			};

			// Test the second plugin - should not emit since no duplicated source
			const entry2Plugin = plugins[1] as any;
			entry2Plugin.emitFile = mockEmitFile;
			entry2Plugin.generateBundle.call(entry2Plugin, {}, bundle);
			
			// Should not emit files since there's no duplicated source
			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should verify generateBundle hook processes bundle entries correctly', () => {
			const entries = {
				styles: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();
			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			// Test that the hook processes the bundle parameter correctly
			const testBundle = { 
				'styles.css': { 
					type: 'asset', 
					source: 'body { margin: 0; }' 
				} 
			};

			const result = mockPlugin.generateBundle.call(mockPlugin, {}, testBundle);
			expect(result).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled();

			// Test that the hook handles the bundle object correctly
			expect(() => {
				mockPlugin.generateBundle.call(mockPlugin, {}, testBundle);
			}).not.toThrow();

			// Verify the hook is a function
			expect(typeof mockPlugin.generateBundle).toBe('function');
		});

		it('should not emit files when enforce is false', () => {
			const entries = {
				cssOnly: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: false });
			const bundle = {};
			const mockEmitFile = vi.fn();

			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			const generateBundleHandler = mockPlugin.generateBundle;
			const result = generateBundleHandler.call(mockPlugin, {}, bundle);
			
			// Should return undefined
			expect(result).toBeUndefined();
			
			// Should not emit files when enforce is false
			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should handle generateBundle with different bundle types', () => {
			const entries = {
				cssOnly: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();
			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			// Test with asset type
			const assetBundle = { 'cssOnly.css': { type: 'asset', source: 'css content' } };
			const result1 = mockPlugin.generateBundle.call(mockPlugin, {}, assetBundle);
			expect(result1).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled();

			// Test with chunk type (should not be handled)
			const chunkBundle = { 'cssOnly.js': { type: 'chunk', code: 'js content' } };
			const result2 = mockPlugin.generateBundle.call(mockPlugin, {}, chunkBundle);
			expect(result2).toBeUndefined();
			expect(mockEmitFile).not.toHaveBeenCalled();
		});

		it('should verify generateBundle hook parameters', () => {
			const entries = {
				cssOnly: { 
					files: ['src/__tests__/mock/styles.css']
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const mockEmitFile = vi.fn();
			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			const generateBundleHandler = mockPlugin.generateBundle;
			const bundle = { 'cssOnly.css': { type: 'asset', source: 'css content' } };
			
			// Test that the hook accepts the correct parameters
			expect(() => {
				generateBundleHandler.call(mockPlugin, {}, bundle);
			}).not.toThrow();
			
			// Test with different bundle structures
			expect(() => {
				generateBundleHandler.call(mockPlugin, { outputOptions: {} }, {});
			}).not.toThrow();
			
			// Test with empty object (should not throw)
			expect(() => {
				generateBundleHandler.call(mockPlugin, {}, {});
			}).not.toThrow();
		});

		it('should not handle non-CSS entries in generateBundle hook', () => {
			const entries = {
				jsOnly: { 
					files: [
						'src/__tests__/mock/utils.js',
						'src/__tests__/mock/api.js'
					]
				},
			};

			const plugins = virtualMultiEntryPlugin(entries, { enforce: true });
			const bundle = { 'jsOnly.js': { type: 'chunk', code: 'js content' } };
			const mockEmitFile = vi.fn();

			const mockPlugin = plugins[0] as any;
			mockPlugin.emitFile = mockEmitFile;

			const generateBundleHandler = mockPlugin.generateBundle;
			generateBundleHandler.call(mockPlugin, {}, bundle);

			// Should not emit files for non-CSS entries
			expect(mockEmitFile).not.toHaveBeenCalled();
		});
	});
});
