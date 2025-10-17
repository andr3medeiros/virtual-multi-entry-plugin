import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { virtualMultiEntryPlugin, wrapInVirtualEntry } from '../virtual-multi-entry.plugin.js';
import type { ConfigEnv, UserConfig } from 'vite';

// Mock console.debug to avoid noise in tests
const mockConsoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});

describe('virtualMultiEntryPlugin', () => {
  beforeEach(() => {
    mockConsoleDebug.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Plugin Creation and Basic Structure', () => {
    it('should create a plugin for library entry', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js', './src/__tests__/mock/helpers.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toHaveProperty('name', 'virtual-multi-entry-plugin');
      expect(plugins[0]).toHaveProperty('enforce', 'pre');
    });

    it('should create plugins for app entries', () => {
      const appEntries = {
        styles: {
          files: ['./src/__tests__/mock/styles.css'],
          type: 'app' as const,
        },
        components: {
          files: ['./src/__tests__/mock/components.css'],
          type: 'app' as const,
        },
      };

      const plugins = virtualMultiEntryPlugin(appEntries);

      expect(plugins).toHaveLength(2);
      plugins.forEach((plugin: any) => {
        expect(plugin).toHaveProperty('name', 'virtual-multi-entry-plugin');
        expect(plugin).toHaveProperty('enforce', 'pre');
      });
    });
  });

  describe('Load Hook - Actual Output Testing', () => {
    it('should generate correct lib entry content with named exports', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js', './src/__tests__/mock/helpers.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('components')}`;
      const mockContext: any = {
        environment: {
          config: {
            build: {
              lib: { name: 'Components' },
            },
          },
        },
      };

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call(mockContext, virtualResolvedEntryId);
      } else {
        result = loadHook?.handler?.call(mockContext, virtualResolvedEntryId);
      }

      // Test the actual generated content
      expect(result).toContain('// Virtual multi-entry plugin for components');
      expect(result).toContain('export * as components from "./src/__tests__/mock/components.js"');
      expect(result).toContain('export * as helpers from "./src/__tests__/mock/helpers.js"');
      expect(result).toContain('export default Components');
      
      // Verify the structure is correct
      const lines = (result as string).split('\n');
      expect(lines[0]).toBe('// Virtual multi-entry plugin for components');
      expect(lines[1]).toBe('export * as components from "./src/__tests__/mock/components.js";');
      expect(lines[2]).toBe('export * as helpers from "./src/__tests__/mock/helpers.js";');
      expect(lines[3]).toBe('export default Components;');
    });

    it('should generate correct app entry content with imports', () => {
      const appEntries = {
        styles: {
          files: ['./src/__tests__/mock/styles.css', './src/__tests__/mock/utilities.css'],
          type: 'app' as const,
        },
      };

      const plugins = virtualMultiEntryPlugin(appEntries);
      const plugin = plugins[0];

      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('styles')}`;
      const mockContext: any = {
        environment: {
          config: {
            build: {},
          },
        },
      };

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call(mockContext, virtualResolvedEntryId);
      } else {
        result = loadHook?.handler?.call(mockContext, virtualResolvedEntryId);
      }

      // Test the actual generated content
      expect(result).toContain('// Virtual multi-entry plugin for styles');
      expect(result).toContain('import "./src/__tests__/mock/styles.css"');
      expect(result).toContain('import "./src/__tests__/mock/utilities.css"');
      expect(result).not.toContain('export default');
      
      // Verify the structure is correct
      const lines = (result as string).split('\n');
      expect(lines[0]).toBe('// Virtual multi-entry plugin for styles');
      expect(lines[1]).toBe('import "./src/__tests__/mock/styles.css";');
      expect(lines[2]).toBe('import "./src/__tests__/mock/utilities.css";');
    });

    it('should handle empty files array correctly', () => {
      const emptyEntry = {
        files: [],
        name: 'empty',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(emptyEntry);
      const plugin = plugins[0];

      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('empty')}`;
      const mockContext: any = {
        environment: {
          config: {
            build: {
              lib: { name: 'Empty' },
            },
          },
        },
      };

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call(mockContext, virtualResolvedEntryId);
      } else {
        result = loadHook?.handler?.call(mockContext, virtualResolvedEntryId);
      }

      // Should only contain header and default export
      expect(result).toContain('// Virtual multi-entry plugin for empty');
      expect(result).toContain('export default Empty');
      expect(result).not.toContain('export * as');
      expect(result).not.toContain('import');
    });

    it('should sanitize file names for exports', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js', './src/__tests__/mock/helpers.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('components')}`;
      const mockContext: any = {
        environment: {
          config: {
            build: {
              lib: { name: 'Components' },
            },
          },
        },
      };

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call(mockContext, virtualResolvedEntryId);
      } else {
        result = loadHook?.handler?.call(mockContext, virtualResolvedEntryId);
      }

      // Should sanitize file names (remove special characters)
      expect(result).toContain('export * as components from');
      expect(result).toContain('export * as helpers from');
      expect(result).not.toContain('export * as __tests__');
    });

    it('should handle lib without name in config', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('components')}`;
      const mockContext: any = {
        environment: {
          config: {
            build: {
              lib: {},
            },
          },
        },
      };

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call(mockContext, virtualResolvedEntryId);
      } else {
        result = loadHook?.handler?.call(mockContext, virtualResolvedEntryId);
      }

      expect(result).toContain('// Virtual multi-entry plugin for components');
      expect(result).toContain('export * as components from');
      expect(result).not.toContain('export default');
    });

    it('should handle string lib name', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('components')}`;
      const mockContext: any = {
        environment: {
          config: {
            build: {
              lib: 'MyLib',
            },
          },
        },
      };

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call(mockContext, virtualResolvedEntryId);
      } else {
        result = loadHook?.handler?.call(mockContext, virtualResolvedEntryId);
      }

      expect(result).toContain('export default MyLib');
    });

    it('should return null for non-matching IDs', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call({} as any, 'some-other-id');
      } else {
        result = loadHook?.handler?.call({} as any, 'some-other-id');
      }

      expect(result).toBeNull();
    });
  });

  describe('ResolveId Hook - Actual Behavior Testing', () => {
    it('should resolve virtual entry ID for lib entries', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const virtualEntryId = wrapInVirtualEntry('components');
      const resolveIdHook = plugin.resolveId;
      
      let resolvedId;
      if (typeof resolveIdHook === 'function') {
        resolvedId = resolveIdHook.call({} as any, virtualEntryId, undefined, { attributes: {}, isEntry: true });
      } else {
        resolvedId = resolveIdHook?.handler?.call({} as any, virtualEntryId, undefined, { attributes: {}, isEntry: true });
      }
      
      expect(resolvedId).toBe(`\0${virtualEntryId}`);
    });

    it('should resolve virtual entry ID for app entries', () => {
      const appEntries = {
        styles: {
          files: ['./src/__tests__/mock/styles.css'],
          type: 'app' as const,
        },
      };

      const plugins = virtualMultiEntryPlugin(appEntries);
      const plugin = plugins[0];

      const virtualEntryId = wrapInVirtualEntry('styles');
      const resolveIdHook = plugin.resolveId;
      
      let resolvedId;
      if (typeof resolveIdHook === 'function') {
        resolvedId = resolveIdHook.call({} as any, virtualEntryId, undefined, { attributes: {}, isEntry: true });
      } else {
        resolvedId = resolveIdHook?.handler?.call({} as any, virtualEntryId, undefined, { attributes: {}, isEntry: true });
      }
      
      expect(resolvedId).toBe(`\0${virtualEntryId}`);
    });

    it('should return null for non-matching IDs', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const resolveIdHook = plugin.resolveId;
      
      let resolvedId;
      if (typeof resolveIdHook === 'function') {
        resolvedId = resolveIdHook.call({} as any, 'some-other-id', undefined, { attributes: {}, isEntry: true });
      } else {
        resolvedId = resolveIdHook?.handler?.call({} as any, 'some-other-id', undefined, { attributes: {}, isEntry: true });
      }
      
      expect(resolvedId).toBeNull();
    });
  });

  describe('Config Hook - Actual Vite Config Modifications', () => {
    it('should configure lib mode correctly', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const config = {
        build: {
          rollupOptions: {
            input: {},
            output: {},
          },
        },
      };

      let result: any;

      if(typeof plugin.config === 'function') {
        result = plugin.config?.call({} as any, config, {} as ConfigEnv);
      } else {
        result = {};
      }

      // Test actual config modifications
      expect(result?.build?.lib).toEqual({
        entry: wrapInVirtualEntry('components'),
        name: 'components',
      });
      expect(result?.build?.rollupOptions?.input).toEqual({
        components: wrapInVirtualEntry('components'),
      });
      
      // Test that entryFileNames function is properly set
      expect(result?.build?.rollupOptions?.output?.entryFileNames).toBeDefined();
      expect(typeof result?.build?.rollupOptions?.output?.entryFileNames).toBe('function');
    });

    it('should configure app mode correctly', () => {
      const appEntries = {
        styles: {
          files: ['./src/__tests__/mock/styles.css'],
          type: 'app' as const,
        },
      };

      const plugins = virtualMultiEntryPlugin(appEntries);
      const plugin = plugins[0];

      const config = {
        build: {
          rollupOptions: {
            input: {},
            output: {},
          },
        },
      };

      let result: any;

      if(typeof plugin.config === 'function') {
        result = plugin.config?.call({} as any, config, {} as ConfigEnv);
      } else {
        result = {};
      }

      // Test actual config modifications
      expect(result?.build?.rollupOptions?.input).toEqual({
        styles: wrapInVirtualEntry('styles'),
      });
      
      // Should not configure lib mode for app entries
      expect(result?.build?.lib).toBeUndefined();
      
      // Test that assetFileNames function is properly set
      expect(result?.build?.rollupOptions?.output?.assetFileNames).toBeDefined();
      expect(typeof result?.build?.rollupOptions?.output?.assetFileNames).toBe('function');
    });

    it('should create config structure if not exists', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const config = {};

      let result: any;

      if(typeof plugin.config === 'function') {
        result = plugin.config?.call({} as any, config, {} as ConfigEnv);
      } else {
        result = {};
      }

      // Test that all required config structure is created
      expect(result?.build).toBeDefined();
      expect(result?.build?.rollupOptions).toBeDefined();
      expect(result?.build?.rollupOptions?.input).toBeDefined();
      expect(result?.build?.rollupOptions?.output).toBeDefined();
      expect(result?.build?.lib).toBeDefined();
    });

    it('should preserve existing config', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const config = {
        build: {
          rollupOptions: {
            input: { existing: 'entry.js' },
            output: { format: 'es' },
          },
        },
      };

      let result: any;

      if(typeof plugin.config === 'function') {
        result = plugin.config?.call({} as any, config as UserConfig, {} as ConfigEnv);
      } else {
        result = {};
      }

      // Test that existing config is preserved
      expect(result?.build?.rollupOptions?.input).toEqual({
        existing: 'entry.js',
        components: wrapInVirtualEntry('components'),
      });
      expect(result?.build?.rollupOptions?.output?.format).toBe('es');
    });
  });

  describe('Transform Hook - Actual Behavior Testing', () => {
    it('should log transform calls and return null', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('components')}`;
      const transformHook = plugin.transform;

      let result;
      if (typeof transformHook === 'function') {
        result = transformHook.call({} as any, '', virtualResolvedEntryId);
      } else {
        result = {};
      }

      // Should return null
      expect(result).toBeNull();
    });

    it('should return null for non-matching IDs', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const transformHook = plugin.transform;
      let result;
      
      if (typeof transformHook === 'function') {
        result = transformHook.call({} as any, '', 'some-other-id');
      } else {
        result = {};
      }

      expect(result).toBeNull();
    });
  });

  describe('GenerateBundle Hook - Actual Behavior Testing', () => {
    it('should handle CSS-only entries with enforce option', () => {
      const cssEntry = {
        styles: {
          files: ['./src/__tests__/mock/styles.css'],
          type: 'app' as const,
        },
      };

      const plugins = virtualMultiEntryPlugin(cssEntry, { enforce: true });
      const plugin = plugins[0];

      const mockBundle: any = {
        'styles.css': {
          type: 'asset',
          source: '/* CSS content */',
        },
      };

      const mockEmitFile = vi.fn();

      const mockContext: any = {
        emitFile: mockEmitFile,
      };

      const generateBundleHook = plugin.generateBundle;
      
      if (typeof generateBundleHook === 'function') {
        generateBundleHook.call(mockContext, {} as any, mockBundle, {} as any);
      } else {
        generateBundleHook?.handler?.call(mockContext, {} as any, mockBundle, {} as any);
      }

      // Should not emit additional files for non-CSS-only entries
      expect(mockEmitFile).not.toHaveBeenCalled();
    });

    it('should not emit files when enforce is false', () => {
      const cssEntry = {
        styles: {
          files: ['./src/__tests__/mock/styles.css'],
          type: 'app' as const,
        },
      };

      const plugins = virtualMultiEntryPlugin(cssEntry, { enforce: false });
      const plugin = plugins[0];

      const mockBundle = {};
      const mockEmitFile = vi.fn();

      const mockContext: any = {
        emitFile: mockEmitFile,
      };

      const generateBundleHook = plugin.generateBundle;
      
      if (typeof generateBundleHook === 'function') {
        generateBundleHook.call(mockContext, {} as any, mockBundle, {} as any);
      } else {
        generateBundleHook?.handler?.call(mockContext, {} as any, mockBundle, {} as any);
      }

      expect(mockEmitFile).not.toHaveBeenCalled();
    });
  });

  describe('CSS-Only Entry Detection - Actual Behavior', () => {
    it('should detect CSS-only entries correctly', () => {
      const cssOnlyEntry = {
        styles: {
          files: ['./src/__tests__/mock/styles.css', './src/__tests__/mock/utilities.css'],
          type: 'app' as const,
        },
      };

      const plugins = virtualMultiEntryPlugin(cssOnlyEntry);
      const plugin = plugins[0];

      // Test the internal CSS-only detection by checking the generated content
      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('styles')}`;
      const mockContext: any = {
        environment: {
          config: {
            build: {},
          },
        },
      };

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call(mockContext, virtualResolvedEntryId);
      } else {
        result = loadHook?.handler?.call(mockContext, virtualResolvedEntryId);
      }

      // Should generate import statements for CSS files
      expect(result).toContain('import "./src/__tests__/mock/styles.css"');
      expect(result).toContain('import "./src/__tests__/mock/utilities.css"');
    });

    it('should detect mixed file types as non-CSS-only', () => {
      const mixedEntry = {
        files: ['./src/__tests__/mock/components.js', './src/__tests__/mock/styles.css'],
        name: 'mixed',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(mixedEntry);
      const plugin = plugins[0];

      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('mixed')}`;
      const mockContext: any = {
        environment: {
          config: {
            build: {
              lib: { name: 'Mixed' },
            },
          },
        },
      };

      const loadHook = plugin.load;
      let result;
      
      if (typeof loadHook === 'function') {
        result = loadHook.call(mockContext, virtualResolvedEntryId);
      } else {
        result = loadHook?.handler?.call(mockContext, virtualResolvedEntryId);
      }

      // Should generate export statements for mixed files
      expect(result).toContain('export * as components from');
      expect(result).toContain('export * as styles from');
    });
  });

  describe('File Name Generation - Actual Function Behavior', () => {
    it('should generate correct entry file names for lib entries', () => {
      const libEntry = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const plugins = virtualMultiEntryPlugin(libEntry);
      const plugin = plugins[0];

      const config = {
        build: {
          rollupOptions: {
            input: {},
            output: {},
          },
        },
      };

      let result: any;

      if(typeof plugin.config === 'function') {
        result = plugin.config?.call({} as any, config, {} as ConfigEnv);
      } else {
        result = {};
      }

      const entryFileNamesFn = result?.build?.rollupOptions?.output?.entryFileNames;

      // Test the actual function behavior
      expect(typeof entryFileNamesFn).toBe('function');
      
      // Test with virtual entry
      const virtualResolvedEntryId = `\0${wrapInVirtualEntry('components')}`;
      const assetInfo = { facadeModuleId: virtualResolvedEntryId };
      const fileName = entryFileNamesFn(assetInfo);
      expect(fileName).toBe('components.js');
      
      // Test with other entries
      const otherAssetInfo = { facadeModuleId: 'other-entry' };
      const otherFileName = entryFileNamesFn(otherAssetInfo);
      expect(otherFileName).toBe('[name].[hash].chunk.js');
    });

    it('should generate correct asset file names for CSS entries', () => {
      const cssEntry = {
        styles: {
          files: ['./src/__tests__/mock/styles.css'],
          type: 'app' as const,
        },
      };

      const plugins = virtualMultiEntryPlugin(cssEntry);
      const plugin = plugins[0];

      const config = {
        build: {
          rollupOptions: {
            input: {},
            output: {},
          },
        },
      };

      let result: any;

      if(typeof plugin.config === 'function') {
        result = plugin.config?.call({} as any, config, {} as ConfigEnv);
      } else {
        result = {};
      }

      const assetFileNamesFn = result?.build?.rollupOptions?.output?.assetFileNames;

      // Test the actual function behavior
      expect(typeof assetFileNamesFn).toBe('function');
      
      // Test with CSS-only entry
      const virtualEntryId = wrapInVirtualEntry('styles');
      const assetInfo = { 
        originalFileNames: [virtualEntryId], 
        source: '/* CSS content */' 
      };
      const fileName = assetFileNamesFn(assetInfo);
      expect(fileName).toBe('styles.css');
      
      // Test with other assets
      const otherAssetInfo = { 
        originalFileNames: ['other-file.css'], 
        source: '/* CSS content */' 
      };
      const otherFileName = assetFileNamesFn(otherAssetInfo);
      expect(otherFileName).toBe('[name].[extname]');
    });
  });

  describe('Utility Functions', () => {
    it('should wrap entry names correctly', () => {
      expect(wrapInVirtualEntry('test')).toBe('virtual:test');
      expect(wrapInVirtualEntry('my-component')).toBe('virtual:my-component');
      expect(wrapInVirtualEntry('styles')).toBe('virtual:styles');
    });
  });

  describe('Multiple Entry Points - Actual Behavior', () => {
    it('should handle multiple library entries independently', () => {
      const libConfig1 = {
        files: ['./src/__tests__/mock/components.js'],
        name: 'components',
        type: 'lib' as const,
      };

      const libConfig2 = {
        files: ['./src/__tests__/mock/helpers.js'],
        name: 'helpers',
        type: 'lib' as const,
      };

      const plugins1 = virtualMultiEntryPlugin(libConfig1);
      const plugins2 = virtualMultiEntryPlugin(libConfig2);

      expect(plugins1).toHaveLength(1);
      expect(plugins2).toHaveLength(1);

      // Test that both plugins work independently
      const plugin1 = plugins1[0];
      const plugin2 = plugins2[0];

      expect(plugin1).toHaveProperty('name', 'virtual-multi-entry-plugin');
      expect(plugin2).toHaveProperty('name', 'virtual-multi-entry-plugin');
    });

    it('should handle complex app configuration', () => {
      const appEntries = {
        main: {
          files: [
            './src/__tests__/mock/components.js',
            './src/__tests__/mock/helpers.js'
          ],
          type: 'app' as const,
        },
        styles: {
          files: [
            './src/__tests__/mock/styles.css',
            './src/__tests__/mock/utilities.css'
          ],
          type: 'app' as const,
        },
        components: {
          files: ['./src/__tests__/mock/components.css'],
          type: 'app' as const,
        }
      };

      const plugins = virtualMultiEntryPlugin(appEntries);

      expect(plugins).toHaveLength(3);
      plugins.forEach((plugin: any) => {
        expect(plugin).toHaveProperty('name', 'virtual-multi-entry-plugin');
        expect(plugin).toHaveProperty('enforce', 'pre');
      });
    });
  });
});