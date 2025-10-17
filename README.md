# Virtual Multi-Entry Plugin

A Vite plugin that enables multiple virtual entry points for your build process. This plugin allows you to define multiple entry points, each consisting of one or many files, and creates virtual modules that act as aggregate entry-points for Vite/Rollup's build pipeline.

## Features

- 🎯 **Multiple Entry Points**: Define multiple entry points with different file combinations
- 📦 **Library & App Support**: Works with both library builds and application builds
- 🎨 **CSS-Only Entries**: Support for CSS-only entry points
- 🔄 **Deduplication Control**: Optional enforcement to include CSS entries even when imports are shared
- 🏷️ **Unique Output Names**: Ensures unique output filenames per entry
- 🔧 **TypeScript Support**: Full TypeScript support with type definitions

## Related Plugins

This plugin works great in conjunction with other Vite plugins:

- **[vite-virtual-entry-server-plugin](https://www.npmjs.com/package/vite-virtual-entry-server-plugin)** - A complementary plugin that provides server-side rendering support for virtual entry points. Use it alongside this plugin when you need SSR capabilities for your multi-entry applications.

## Installation

```bash
npm install virtual-multi-entry-plugin
# or
yarn add virtual-multi-entry-plugin
# or
pnpm add virtual-multi-entry-plugin
```

## Usage

### Basic Setup

```typescript
import { defineConfig } from 'vite';
import { virtualMultiEntryPlugin } from 'virtual-multi-entry-plugin';

export default defineConfig({
  plugins: [
    virtualMultiEntryPlugin({
      'main': {
        files: ['./src/main.js', './src/styles.css'],
        type: 'app'
      },
      'admin': {
        files: ['./src/admin.js', './src/admin.css'],
        type: 'app'
      }
    })
  ]
});
```

### Library Mode

```typescript
import { defineConfig } from 'vite';
import { virtualMultiEntryPlugin } from 'virtual-multi-entry-plugin';

export default defineConfig({
  build: {
    lib: {
      entry: 'placeholder:name',
      formats: ['es'],
    },
  },
  plugins: [
    virtualMultiEntryPlugin({
      name: 'my-lib',
      files: ['./src/api.js', './src/styles.css'],
      type: 'lib'
    })
  ]
});
```

### CSS-Only Entries

```typescript
import { defineConfig } from 'vite';
import { virtualMultiEntryPlugin } from 'virtual-multi-entry-plugin';

export default defineConfig({
  plugins: [
    virtualMultiEntryPlugin({
      'styles': {
        files: ['./src/styles.css', './src/utilities.css'],
        type: 'app'
      }
    }, {
      enforce: true // Ensures CSS entries are included even if imports are shared
    })
  ]
});
```

## API Reference

### `virtualMultiEntryPlugin(entries, options?)`

Creates Vite plugins for handling multiple virtual entry points.

#### Parameters

- **`entries`** (`AppEntryOption` | `LibEntryOption`): 
  - For **app mode**: A record mapping entry names to their configuration (each entry must have `type: 'app'`)
  - For **lib mode**: A single library entry configuration with `type: 'lib'`
- **`options`** (`Options?`): Optional plugin configuration

#### `MultiEntryOption`

```typescript
interface MultiEntryOption {
  files: string[];           // Array of file paths to include in the entry
  type?: 'app' | 'lib';      // Entry type: 'app' for application builds, 'lib' for library builds
}
```

#### `AppEntryOption`

```typescript
type AppEntryOption = Record<string, MultiEntryOption & {
  type: 'app';               // Must be 'app' for application builds
}>;
```

#### `LibEntryOption`

```typescript
interface LibEntryOption {
  name: string;              // Name of the library entry
  files: string[];           // Array of file paths to include in the entry
  type: 'lib';               // Must be 'lib' for library builds
}
```

#### `Options`

```typescript
interface Options {
  enforce?: boolean;         // Force inclusion of CSS entries even if imports are shared
}
```

## Entry Types

### App Mode (`type: 'app'`)
- **Usage**: Pass a record of multiple entries, each with `type: 'app'`
- **Behavior**: Creates standard application entry points
- **Files**: Files are imported directly
- **Output**: Output files follow standard Vite naming conventions
- **Example**: `{ 'main': { files: [...], type: 'app' }, 'admin': { files: [...], type: 'app' } }`

### Library Mode (`type: 'lib'`)
- **Usage**: Pass a single entry object with `type: 'lib'` and a `name` property
- **Behavior**: Creates library entry points
- **Files**: Files are re-exported as named exports
- **Output**: Supports default export if library name is configured, output files are named exactly as specified
- **Example**: `{ name: 'my-lib', files: [...], type: 'lib' }`

## CSS-Only Entries

The plugin automatically detects CSS-only entries (when all files in an entry have `.css` extension) and handles them appropriately:

- Output files are named with `.css` extension
- Special handling for CSS asset bundling
- Optional enforcement to prevent deduplication issues

## Examples

### Multiple App Entries

```typescript
virtualMultiEntryPlugin({
  'homepage': {
    files: ['./src/pages/home.js', './src/pages/home.css'],
    type: 'app'
  },
  'dashboard': {
    files: ['./src/pages/dashboard.js', './src/pages/dashboard.css'],
    type: 'app'
  },
  'admin': {
    files: ['./src/pages/admin.js', './src/pages/admin.css'],
    type: 'app'
  }
})
```

### Multiple App Entries with Options

```typescript
virtualMultiEntryPlugin({
  'app': {
    files: ['./src/app.js', './src/app.css'],
    type: 'app'
  },
  'styles-only': {
    files: ['./src/global.css', './src/components.css'],
    type: 'app'
  }
}, {
  enforce: true
})
```

### Library Entry

```typescript
virtualMultiEntryPlugin({
  name: 'my-library',
  files: ['./src/lib.js', './src/lib.css'],
  type: 'lib'
})
```

## Development

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm run test:vitest

# Run tests with coverage
npm run test:vitest:coverage

# Build the project
npm run build

# Preview build
npm run preview
```

### Testing

The project uses Vitest for testing with comprehensive test coverage:

```bash
# Run tests in watch mode
npm run test:vitest

# Run tests with UI
npm run test:vitest:ui

# Run tests once
npm run test:vitest:run

# Run tests with coverage
npm run test:vitest:coverage
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
