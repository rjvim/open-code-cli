# open-code-cli

CLI tool for synchronizing and contributing to component-based codebases.

## Overview

open-code-cli allows developers to:

1. Sync components from source repositories
2. Customize components for their specific needs
3. Detect changes between local and source components
4. Contribute changes back to source repositories via GitHub PRs

The tool is designed to be language-agnostic and framework-agnostic, making it suitable for any component-based codebase.

## Installation

```bash
npm install -g open-code-cli
```

Or use it directly with npx:

```bash
npx open-code-cli <command>
```

## Commands

### Initialize a Project

```bash
open-code init [--repo <url>] [--component-dir <dir>]
```

This will:

- Create a `.open-code.json` configuration file
- Create a component directory
- Optionally connect to a source repository

### Sync Components

```bash
open-code sync <source> <destination> [--create]
```

This will:

- Download code from a GitHub repository
- Save it to the specified destination
- Track sync information for future updates

## Configuration

The `.open-code.json` file contains:

```typescript
interface OpenCodeConfig {
  version: string;
  componentDir: string;
  repositories: Array<{
    name: string;
    url: string;
    branch: string;
    filePath?: string;
  }>;
}
```

## Development

### Project Structure

```
open-code-cli/
├── src/
│   ├── commands/     # Command implementations
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   └── index.ts      # Entry point
├── tests/            # Test files
└── package.json
```

### Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request
