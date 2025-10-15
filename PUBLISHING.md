# Publishing Guide

This guide will help you publish the virtual-multi-entry-plugin to npm.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com) if you don't have one
2. **npm CLI**: Make sure you have the latest npm CLI installed
3. **Login**: Run `npm login` to authenticate with your npm account

## Pre-publishing Checklist

Before publishing, make sure to:

1. **Update package.json**:
   - Update the `author` field with your name and email
   - Update the `repository` URLs to point to your actual GitHub repository
   - Update the `homepage` and `bugs` URLs accordingly

2. **Test the build**:
   ```bash
   npm run build
   ```
   This will create the `dist` folder with the compiled files.

3. **Run tests**:
   ```bash
   npm run test:vitest:run
   ```

4. **Check what will be published**:
   ```bash
   npm pack --dry-run
   ```
   This shows what files will be included in the package.

## Publishing Steps

### 1. First Time Publishing

For the first publish, you'll need to:

```bash
# Make sure you're logged in
npm whoami

# Publish the package
npm publish
```

### 2. Updating the Package

For subsequent updates:

1. **Update version** in `package.json`:
   ```bash
   # Patch version (0.0.1 -> 0.0.2)
   npm version patch
   
   # Minor version (0.0.1 -> 0.1.0)
   npm version minor
   
   # Major version (0.0.1 -> 1.0.0)
   npm version major
   ```

2. **Publish the update**:
   ```bash
   npm publish
   ```

### 3. Publishing Beta/RC Versions

For pre-release versions:

```bash
# Create a beta version
npm version prerelease --preid=beta

# Publish beta
npm publish --tag beta

# Users can install with:
# npm install virtual-multi-entry-plugin@beta
```

## Package Contents

The published package will include:

- `dist/` - Compiled JavaScript and TypeScript declaration files
- `README.md` - Documentation
- `LICENSE` - MIT license
- `package.json` - Package metadata

## Verification

After publishing, you can verify the package by:

1. **Installing it**:
   ```bash
   npm install virtual-multi-entry-plugin
   ```

2. **Testing in a new project**:
   ```bash
   mkdir test-plugin
   cd test-plugin
   npm init -y
   npm install virtual-multi-entry-plugin vite
   # Create a test vite.config.js and test the plugin
   ```

## Troubleshooting

### Common Issues

1. **Package name already exists**: Choose a different name or use scoped packages (`@yourusername/virtual-multi-entry-plugin`)

2. **Build fails**: Make sure all dependencies are installed and TypeScript compiles without errors

3. **Publish fails**: Check that you're logged in with `npm whoami` and have the correct permissions

### Useful Commands

```bash
# Check package info
npm info virtual-multi-entry-plugin

# View package contents
npm pack

# Unpublish (only within 24 hours of publishing)
npm unpublish virtual-multi-entry-plugin@version

# Deprecate a version
npm deprecate virtual-multi-entry-plugin@version "Use version X instead"
```

## Maintenance

- Keep dependencies updated
- Monitor for security vulnerabilities with `npm audit`
- Update documentation as needed
- Respond to issues and pull requests promptly
