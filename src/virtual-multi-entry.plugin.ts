import console from 'console';
import path from 'path';
import type { Plugin } from 'vite';

interface Options {
	/**
	 * The bundler will ignore entries for exclusively css files that uses the same imports as other entries.
	 * This will enforce the bundler to include all entries, even if they share imports.
	 */
	enforce?: boolean;
}

export interface MultiEntryOption {
	files: string[];
	type?: 'app' | 'lib';
}
export type AppEntryOption = Record<string, MultiEntryOption & {
	type: 'app';
}>;

export type LibEntryOption = MultiEntryOption & {
	name: string;
	type: 'lib';
}

const buildFileName = (name: string, isCssOnly: boolean): string => {
	return `${name}.${isCssOnly ? 'css' : 'js'}`;
};

export const wrapInVirtualEntry = (entry: string) => `virtual:${entry}` as const;

const isLibEntry = (entries: LibEntryOption | AppEntryOption): entries is LibEntryOption => {
	return entries.type === 'lib';
};

/**
 * Vite plugin to handle multiple virtual entry points.
 *
 * This plugin allows you to define multiple entry points, each possibly consisting of one or many files.
 * It creates virtual modules that act as aggregate entry-points for Vite/Rollup's build pipeline.
 *
 * - Supports both JS and CSS-only entries.
 * - Ensures unique output filenames per entry.
 * - If `enforce` option is supplied, will force inclusion of CSS entries even if imports are shared with others.
 *
 * @param entries - A record mapping entry names to MultiEntryOption configuration.
 * @param pluginOptions - Additional plugin options.
 *
 * @returns {Plugin[]} Returns an array of Vite plugins (one per entry).
 */
export function virtualMultiEntryPlugin<Entries extends LibEntryOption | AppEntryOption>(entries: Entries, pluginOptions?: Options): Plugin[] {
	const importMap = new Map<string, string>(); // key: import block, value: entry name
	const duplicatedSources = new Map<string, string>(); // key: entry name, value: original entry name

	let processedEntries: Record<string, MultiEntryOption> = {};

	if (isLibEntry(entries)) {
		processedEntries = {
			[entries.name]: entries,
		};
	} else {
		processedEntries = entries;
	}

	return Object.entries(processedEntries).map<Plugin>(([name, options]) => {
		console.debug(`Adding virtual multi-entry plugin for: ${name}`);

		const isCssOnly = options.files.every(file => file.endsWith('.css'));
		const virtualEntryId = wrapInVirtualEntry(name);
		const virtualResolvedEntryId = `\0${virtualEntryId}`;

		return {
			name: 'virtual-multi-entry-plugin',
			enforce: 'pre',

			/**
			 * Mutate Vite's config to inject the virtual entry into rollup input/output.
			 * - Handles both 'lib' mode (rollupOptions.lib.entry) and 'app' mode (rollupOptions.input).
			 * - Ensures each entry gets a unique filename.
			 */
			config(config) {
				if (!config?.build?.rollupOptions?.input) {
					config.build = {
						...config.build,
						rollupOptions: {
							...config.build?.rollupOptions,
							input: {},
							output: {},
						},
					};
				}

				const rollupOptions = config?.build?.rollupOptions || {};
				const output = rollupOptions.output ?? {};

				if (options.type === 'lib') {
					const build = config.build || {};
					build.lib = {
						...build.lib,
						entry: virtualEntryId,
						name: name,
					};

					rollupOptions.input = {
						...(rollupOptions.input as Record<string, string>),
						[name]: virtualEntryId,
					};

					if (!Array.isArray(output)) {
						// Ensure output filename for the main entry chunk is exactly "{name}.js"
						const oldEntryFileNames = output.entryFileNames;
						output.entryFileNames = assetInfo => {
							if (assetInfo.facadeModuleId === virtualResolvedEntryId) {
								return `${name}.js`;
							}
							return typeof oldEntryFileNames === 'function'
								? oldEntryFileNames(assetInfo)
								: oldEntryFileNames || '[name].[hash].chunk.js';
						};
					}

					console.debug('build:', build);
				} else {
					const input = (rollupOptions.input = rollupOptions.input ?? {}) as Record<string, string>;
					input[name] = virtualEntryId;

					console.debug('Input:', input);

					if (!Array.isArray(output)) {
						// For CSS-only entries, ensure output name matches input
						const oldAssetsFilename = output.assetFileNames;
						output.assetFileNames = assetInfo => {
							if (isCssOnly) {
								if (assetInfo.originalFileNames[0] === virtualEntryId && assetInfo.source) {
									return `${name}.css`;
								}
							}
							return typeof oldAssetsFilename === 'function'
								? oldAssetsFilename(assetInfo)
								: oldAssetsFilename || '[name].[extname]';
						};
					}
				}

				return config;
			},

			/**
			 * Vite/Rollup hook for resolving virtual module ids. Binds the virtual entryId to our internal module.
			 */
			resolveId(id) {
				if (options.type === 'lib' && id.endsWith(virtualEntryId)) {
					console.debug(`Resolving virtual entry ID for lib: ${name}`);

					return virtualResolvedEntryId;
				}

				if (virtualEntryId === id) {
					console.debug(`Resolving virtual entry ID for: ${name}`);
					
					return virtualResolvedEntryId;
				}
				
				return null;
			},
			/**
			 * Debugging aid: log when the virtual entry is transformed.
			 */
			transform(_, id) {
				console.debug(`Virtual resolved entry ID:`, id);


				if (id === virtualResolvedEntryId) {
					console.debug(`Transforming virtual entry for: ${name}`);
				}

				return null;
			},

			/**
			 * Loads the contents for our virtual entry.
			 * - For 'lib' mode, exports all files with named exports.
			 * - For app/CSS entries, just imports each file.
			 * - Avoids duplication of CSS-only blocks by tracking generated content.
			 */
			load(id) {
				if (id === virtualResolvedEntryId) {
					console.debug(`Loading virtual entry for: ${name}`);
					
					let libFooter = '';

					// If in 'lib' mode and the lib has a name, add a default export
					if (options.type === 'lib') {
						const lib = this.environment.config.build?.lib;
						const libName = typeof lib === 'string' ? lib : typeof lib === 'object' ? lib.name : undefined;

						if (libName) {
							libFooter = `\nexport default ${libName};`;
						}
					}

					// Header comment
					const header = `// Virtual multi-entry plugin for ${name}\n`;
					let importer = options.files
						.map(file => {
							let entryName = path.basename(file, path.extname(file));
							entryName = entryName.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize
							if (options.type === 'lib') {
								// Re-export as named symbol for libs
								return `export * as ${entryName} from "${file}";`;
							}
							// Just import for other cases (app style entries, etc.)
							return `import "${file}";`;
						})
						.join('\n')
						.concat(libFooter);

					importer = header + importer;

					console.debug(`Importer for: ${name}`, importer);

					// Used to detect duplicated CSS content blocks among entries
					const key = Buffer.from(importer).toString('base64');
					const existingImport = importMap.get(key);
					if (existingImport) {
						duplicatedSources.set(name, existingImport);
					} else {
						importMap.set(key, name);
					}

					console.debug(`Import map:`, importMap);

					return importer;
				}
				return null;
			},

			/**
			 * Emitted after the bundle is complete.
			 * If `enforce` is set and the entry is CSS-only, ensures that all defined CSS entrypoints are output,
			 * even if the file contents are shared/duplicated elsewhere.
			 *
			 * This helps workaround Rollup/Vite's deduplication when multiple entries import the same CSS.
			 */
			generateBundle(_, bundle) {
				if (!pluginOptions?.enforce || !isCssOnly) {
					return;
				}

				// Find all defined entries that didn't get output (due to deduplication)
				const missingEntries = Object.keys(entries)
					.map(entry => {
						const fileName = buildFileName(entry, isCssOnly);

						if (!bundle[fileName]) {
							return {
								entry,
								fileName,
							};
						}
						return null;
					})
					.filter(entry => entry !== null);

				for (const entry of missingEntries) {
					// Find original source of the duplicated content
					const resolvedSource = duplicatedSources.get(entry.entry);

					if (!resolvedSource) {
						continue;
					}

					const fileName = buildFileName(resolvedSource, isCssOnly);
					const original = bundle[fileName];

					if (!original) {
						continue;
					}

					// Emit a copy of the asset with the missing output filename
					this.emitFile({
						type: original.type,
						fileName: entry.fileName,
						name: entry.entry,
						id: entry.entry,
						source: original.type === 'asset' ? original.source : original.code,
					});
				}
			},
		};
	});
}
