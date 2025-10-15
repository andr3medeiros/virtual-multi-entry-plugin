# Virtual Multi-Entry Plugin

A Vite plugin that enables multiple virtual entry points for your build process. This plugin allows you to define multiple entry points, each consisting of one or many files, and creates virtual modules that act as aggregate entry-points for Vite/Rollup's build pipeline.

## Features

- 🎯 **Multiple Entry Points**: Define multiple entry points with different file combinations
- 📦 **Library & App Support**: Works with both library builds and application builds
- 🎨 **CSS-Only Entries**: Support for CSS-only entry points
- 🔄 **Deduplication Control**: Optional enforcement to include CSS entries even when imports are shared
- 🏷️ **Unique Output Names**: Ensures unique output filenames per entry
- 🔧 **TypeScript Support**: Full TypeScript support with type definitions

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
      entries: {
        'main': {
          files: ['./src/main.js', './src/styles.css'],
          type: 'app'
        },
        'admin': {
          files: ['./src/admin.js', './src/admin.css'],
          type: 'app'
        }
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
      entries: {
        'my-lib': {
          files: ['./src/api.js', './src/styles.css'],
          type: 'lib'
        }
      }
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
      entries: {
        'styles': {
          files: ['./src/styles.css', './src/utilities.css'],
          type: 'app'
        }
      },
      enforce: true // Ensures CSS entries are included even if imports are shared
    })
  ]
});
```

## API Reference

### `virtualMultiEntryPlugin(entries, options?)`

Creates Vite plugins for handling multiple virtual entry points.

#### Parameters

- **`entries`** (`Record<string, MultiEntryOption>`): A record mapping entry names to their configuration
- **`options`** (`Options?`): Optional plugin configuration

#### `MultiEntryOption`

```typescript
interface MultiEntryOption {
  files: string[];           // Array of file paths to include in the entry
  type?: 'app' | 'lib';      // Entry type: 'app' for application builds, 'lib' for library builds
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
- Creates standard application entry points
- Files are imported directly
- Output files follow standard Vite naming conventions

### Library Mode (`type: 'lib'`)
- Creates library entry points
- Files are re-exported as named exports
- Supports default export if library name is configured
- Output files are named exactly as specified

## CSS-Only Entries

The plugin automatically detects CSS-only entries (when all files in an entry have `.css` extension) and handles them appropriately:

- Output files are named with `.css` extension
- Special handling for CSS asset bundling
- Optional enforcement to prevent deduplication issues

## Examples

### Multiple App Entries

```typescript
virtualMultiEntryPlugin({
  entries: {
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
  }
})
```

### Mixed Entry Types

```typescript
virtualMultiEntryPlugin({
  entries: {
    'app': {
      files: ['./src/app.js', './src/app.css'],
      type: 'app'
    },
    'library': {
      files: ['./src/lib.js', './src/lib.css'],
      type: 'lib'
    },
    'styles-only': {
      files: ['./src/global.css', './src/components.css'],
      type: 'app'
    }
  },
  enforce: true
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
