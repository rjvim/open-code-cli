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
- Create a `.open-code.
