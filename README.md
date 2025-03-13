# open-code-cli

[![npm version](https://img.shields.io/npm/v/open-code-cli.svg)](https://www.npmjs.com/package/open-code-cli)
[![Tests](https://github.com/rjvim/open-code-cli/workflows/CI/badge.svg)](https://github.com/rjvim/open-code-cli/actions?query=workflow%3ACI)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI tool for synchronizing code from GitHub repositories to your local environment.

## Overview

`open-code-cli` allows developers to pull code from GitHub repositories and track the synced components. It's designed to be language-agnostic, making it suitable for any codebase.

## Usage

The recommended way to use `open-code-cli` is with npx:

```bash
npx open-code-cli pull <source> <destination> [--create]
```

### Options
- `<source>`: GitHub repository URL (supports both repository and specific file URLs)
- `<destination>`: Local destination path
- `--create`: Create the destination directory if it doesn't exist

### Examples

```bash
# Pull an entire repository
npx open-code-cli pull https://github.com/username/repo ./components

# Pull a specific file
npx open-code-cli pull https://github.com/username/repo/blob/main/path/to/file.js ./components

# Pull a specific directory
npx open-code-cli pull https://github.com/username/repo/tree/main/components/button ./my-components
```

## Configuration

The tool creates a `.open-code.json` file in the destination directory to track synced components for future reference.

## License

MIT